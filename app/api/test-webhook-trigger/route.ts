import { NextRequest, NextResponse } from 'next/server'

const CREDIT_AMOUNTS = new Set([200100, 800100])

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const { offer_id } = await req.json()
  if (!offer_id) return NextResponse.json({ error: 'offer_id required' }, { status: 400 })

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: offer, error } = await supabase
    .from('offers')
    .select('id, status, amount, transport_service, homeowner_id, kasambahay_id')
    .eq('id', offer_id)
    .single()

  if (error || !offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 })

  const update: Record<string, any> = { status: 'paid', paid_at: new Date().toISOString() }
  if (offer.transport_service) update.transport_confirmed = true

  await supabase.from('offers').update(update).eq('id', offer_id)

  if (offer.amount && CREDIT_AMOUNTS.has(offer.amount)) {
    await supabase
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
