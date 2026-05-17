import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CREDIT_AMOUNTS = new Set([200100, 800100])

export async function GET() {
  if (process.env.NODE_ENV === 'production' && process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }
  const { data, error } = await supabaseAdmin
    .from('offers')
    .select(`
      id,
      salary,
      transport_service,
      kasambahay:kasambahay_id (
        profile:profile_id (
          full_name
        )
      )
    `)
    .eq('status', 'agreed')
    .order('created_at', { ascending: false })
  if (error) console.log('[test-webhook-trigger GET] error:', error)
  console.log('[test-webhook-trigger GET] agreed offers found:', data?.length ?? 0)
  return NextResponse.json({ offers: data || [], error: error?.message })
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const body = await req.json()
  console.log('[test-webhook-trigger] body:', body)
  console.log('[test-webhook-trigger] supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

  // Action: update offer status only (no payment simulation)
  if (body.action === 'update_status') {
    const { offer_id, status } = body
    if (!offer_id || !status) return NextResponse.json({ error: 'offer_id and status required' }, { status: 400 })
    console.log('[update_status] offer_id:', offer_id, 'status:', status)
    const { error } = await supabaseAdmin.from('offers').update({ status }).eq('id', offer_id)
    if (error) {
      console.log('[update_status] error:', error)
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }
    return NextResponse.json({ success: true, offer_id, status })
  }

  const { offer_id } = body
  if (!offer_id) return NextResponse.json({ error: 'offer_id required' }, { status: 400 })
  console.log('[test-webhook-trigger] offer_id received:', offer_id)

  const { data: offer, error } = await supabaseAdmin
    .from('offers')
    .select('id, status, salary, transport_service, homeowner_id, kasambahay_id')
    .eq('id', offer_id)
    .single()

  console.log('[test-webhook-trigger] offer lookup:', { data: offer, error, offer_id })
  if (error || !offer) {
    return NextResponse.json({
      error: 'Offer not found',
      supabase_error: error,
      offer_id,
    }, { status: 404 })
  }

  const update: Record<string, any> = { status: 'paid' }
  if (offer.transport_service) update.transport_confirmed = true

  await supabaseAdmin.from('offers').update(update).eq('id', offer_id)

  if (offer.salary && CREDIT_AMOUNTS.has(offer.salary)) {
    await supabaseAdmin
      .from('homeowners')
      .update({ subscription_credit_used: true })
      .eq('id', offer.homeowner_id)
  }

  // Fire SMS notifications — best-effort, don't fail the response
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  fetch(`${baseUrl}/api/send-sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'payment_confirmed', offerId: offer_id }),
  }).catch(() => {})

  return NextResponse.json({ success: true, offer_id, status: 'paid' })
}
