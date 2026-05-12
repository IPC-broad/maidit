import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { offer_id } = await req.json()
  if (!offer_id) return NextResponse.json({ error: 'Missing offer_id' }, { status: 400 })

  const token = (req.headers.get('authorization') ?? '').replace('Bearer ', '')

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: hw } = await supabase
    .from('homeowners')
    .select('id')
    .eq('profile_id', user.id)
    .single()
  if (!hw) return NextResponse.json({ error: 'Not a homeowner' }, { status: 403 })

  const { data: offer } = await supabase
    .from('offers')
    .select('id, status, homeowner_id')
    .eq('id', offer_id)
    .eq('homeowner_id', hw.id)
    .single()

  if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
  if (offer.status !== 'pending') {
    return NextResponse.json({ error: 'Only pending offers can be cancelled' }, { status: 400 })
  }

  await supabase.from('offers').update({ status: 'cancelled' }).eq('id', offer_id)

  return NextResponse.json({ success: true })
}
