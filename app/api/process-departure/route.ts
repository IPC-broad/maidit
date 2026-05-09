import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { offerId } = await req.json()
  if (!offerId) return NextResponse.json({ error: 'offerId required' }, { status: 400 })

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get offer + referring partner of the kasambahay
  const { data: offer } = await supabase
    .from('offers')
    .select('*, kasambahay:kasambahay_id(referred_by)')
    .eq('id', offerId)
    .single()

  if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 })

  const now = new Date().toISOString()

  // Mark offer as departed with rematch available
  await supabase.from('offers').update({
    status: 'departed',
    rematch_available: true,
    departed_at: now,
  }).eq('id', offerId)

  const partnerId = offer.kasambahay?.referred_by
  if (!partnerId) return NextResponse.json({ ok: true })

  // Cancel any scheduled day-30 payout for this offer (legacy cleanup)
  await supabase.from('payouts')
    .update({ status: 'cancelled' })
    .eq('partner_id', partnerId)
    .eq('offer_id', offerId)
    .eq('type', 'day30')
    .eq('status', 'scheduled')

  // Record the clawback
  await supabase.from('payouts').insert({
    partner_id: partnerId,
    offer_id: offerId,
    amount: -500,
    type: 'clawback',
    status: 'applied',
    due_at: now,
  })

  // Check if partner has any pending payouts to absorb the ₱500 clawback
  const { data: pendingPayouts } = await supabase
    .from('payouts')
    .select('id, amount')
    .eq('partner_id', partnerId)
    .eq('status', 'pending')
    .order('due_at', { ascending: true })

  const nextPayout = pendingPayouts?.[0]

  if (nextPayout) {
    if (nextPayout.amount > 500) {
      // Reduce next payout by ₱500
      await supabase.from('payouts')
        .update({ amount: nextPayout.amount - 500 })
        .eq('id', nextPayout.id)
    } else if (nextPayout.amount === 500) {
      // Exactly ₱500 — cancel it
      await supabase.from('payouts')
        .update({ status: 'cancelled' })
        .eq('id', nextPayout.id)
    } else {
      // Next payout is less than ₱500 — cancel it and carry remainder to balance
      const remainder = 500 - nextPayout.amount
      await supabase.from('payouts')
        .update({ status: 'cancelled' })
        .eq('id', nextPayout.id)
      const { data: partnerRecord } = await supabase
        .from('partners').select('balance').eq('id', partnerId).single()
      const currentBalance = partnerRecord?.balance ?? 0
      await supabase.from('partners').update({
        balance: currentBalance - remainder,
        flagged: true,
        flag_reason: `Early departure clawback on ${new Date().toLocaleDateString('en-PH')}. Pending payout insufficient; ₱${remainder} carried to balance.`,
      }).eq('id', partnerId)
    }
  } else {
    // No pending payouts — debit partner balance and flag account
    const { data: partnerRecord } = await supabase
      .from('partners').select('balance').eq('id', partnerId).single()
    const currentBalance = partnerRecord?.balance ?? 0
    await supabase.from('partners').update({
      balance: currentBalance - 500,
      flagged: true,
      flag_reason: `Early departure clawback on ${new Date().toLocaleDateString('en-PH')}. No pending payouts to offset; balance set to ₱${currentBalance - 500}.`,
    }).eq('id', partnerId)
  }

  return NextResponse.json({ ok: true })
}
