import { NextRequest, NextResponse } from 'next/server'

async function sendSMS(mobile: string, message: string) {
  if (!process.env.SEMAPHORE_API_KEY) {
    console.log('[SMS] To ' + mobile + ': ' + message)
    return { success: true }
  }
  const params = new URLSearchParams({
    apikey: process.env.SEMAPHORE_API_KEY,
    number: mobile,
    message,
    sendername: 'MaidIt'
  })
  const res = await fetch('https://api.semaphore.co/api/v4/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })
  if (!res.ok) throw new Error('SMS failed')
  return { success: true }
}

export async function POST(req: NextRequest) {
  try {
    const { event, offerId, partnerId, kasambahayId } = await req.json()
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    if (event === 'referral_confirmed') {
      if (!kasambahayId) return NextResponse.json({ error: 'Missing kasambahayId' }, { status: 400 })
      const { data: kb } = await supabase.from('kasambahay').select('*, profiles(full_name)').eq('id', kasambahayId).single()
      if (!kb?.referred_by) return NextResponse.json({ success: true, sent: 0 })
      const { data: partnerRow } = await supabase.from('partners').select('profile_id').eq('id', kb.referred_by).single()
      if (!partnerRow?.profile_id) return NextResponse.json({ success: true, sent: 0 })
      const { data: partnerProfile } = await supabase.from('profiles').select('mobile').eq('id', partnerRow.profile_id).single()
      if (!partnerProfile?.mobile) return NextResponse.json({ success: true, sent: 0 })
      const kbFirstName = kb.profiles?.full_name?.split(' ')[0] || 'Kasambahay'
      const msg = `🎉 Magandang balita! Si ${kbFirstName} na iyong referral ay nagconfirm na ng kanyang profile sa MaidIt. Makikita na siya ng mga homeowner. Abangan ang iyong kita kapag na-hire siya! - MaidIt`
      await sendSMS(partnerProfile.mobile, msg).catch(() => {})
      return NextResponse.json({ success: true, sent: 1, failed: 0 })
    }

    const { data: offer, error } = await supabase
      .from('offers')
      .select('*, homeowner_id, kasambahay_id')
      .eq('id', offerId)
      .single()

    if (error || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    const { data: hw } = await supabase.from('homeowners').select('profile_id').eq('id', offer.homeowner_id).single()
    const hwLookup = hw?.profile_id ? await supabase.from('profiles').select('full_name, mobile').eq('id', hw.profile_id).single() : { data: null }
    const hwProfile = hwLookup.data

    const { data: kb } = await supabase.from('kasambahay').select('profile_id').eq('id', offer.kasambahay_id).single()
    const kbLookup = kb?.profile_id ? await supabase.from('profiles').select('full_name, mobile').eq('id', kb.profile_id).single() : { data: null }
    const kbProfile = kbLookup.data

    const hwName = hwProfile?.full_name?.split(' ')[0] || 'Homeowner'
    const hwMobile = hwProfile?.mobile || ''
    const kbName = kbProfile?.full_name?.split(' ')[0] || 'Kasambahay'
    const kbMobile = kbProfile?.mobile || ''
    const salary = offer.salary?.toLocaleString()
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'maidit.vercel.app').replace(/\/$/, '')
    const reviewUrl = baseUrl + '/offer/review/' + offerId
    const payUrl = baseUrl + '/pay/' + offerId
    const arrivalUrl = baseUrl + '/arrival/' + offerId

    const messages: Record<string, { mobile: string; msg: string }[]> = {
      offer_sent: [
        { mobile: kbMobile, msg: 'Hi ' + kbName + '! ' + hwName + ' sent you a job offer on MaidIt. Salary: P' + salary + '/mo. Review it now: ' + reviewUrl }
      ],
      offer_reviewed: [
        { mobile: hwMobile, msg: 'Hi ' + hwName + '! ' + kbName + ' reviewed your offer on MaidIt. Check it here: maidit.vercel.app/offer/confirm/' + offerId }
      ],
      offer_agreed: [
        { mobile: hwMobile, msg: 'Hi ' + hwName + '! ' + kbName + ' agreed to your offer. Please pay the P2,001 hire fee: ' + payUrl },
        { mobile: kbMobile, msg: 'Hi ' + kbName + '! ' + hwName + ' confirmed your offer on MaidIt. Waiting for their payment. We will notify you once done!' }
      ],
      payment_confirmed: [
        { mobile: hwMobile, msg: 'Hi ' + hwName + '! Payment received. Confirm ' + kbName + ' arrival once they reach your home: ' + arrivalUrl },
        { mobile: kbMobile, msg: 'Hi ' + kbName + '! ' + hwName + ' has paid the hire fee. Your employment is confirmed. Safe travels!' }
      ],
      arrival_confirmed: [
        { mobile: kbMobile, msg: 'Hi ' + kbName + '! ' + hwName + ' confirmed your arrival. Your 30-day trial has started. Good luck on your first day!' }
      ]
    }

    if (event === 'referral_offer_received') {
      if (!partnerId) return NextResponse.json({ error: 'Missing partnerId' }, { status: 400 })
      const { data: partnerRow } = await supabase.from('partners').select('profile_id').eq('id', partnerId).single()
      if (!partnerRow?.profile_id) return NextResponse.json({ success: true, sent: 0 })
      const { data: partnerProfile } = await supabase.from('profiles').select('mobile').eq('id', partnerRow.profile_id).single()
      if (!partnerProfile?.mobile) return NextResponse.json({ success: true, sent: 0 })
      const msg = `Magandang balita! Si ${kbName} na iyong referral ay nakatanggap ng job offer sa MaidIt. Tulungan mo siyang sagutin ito para makuha mo ang iyong kita! - MaidIt`
      await sendSMS(partnerProfile.mobile, msg).catch(() => {})
      return NextResponse.json({ success: true, sent: 1, failed: 0 })
    }

    const toSend = messages[event]
    if (!toSend) {
      return NextResponse.json({ error: 'Unknown event' }, { status: 400 })
    }

    const results = await Promise.allSettled(
      toSend
        .filter(m => m.mobile)
        .map(m => sendSMS(m.mobile, m.msg))
    )

    const failed = results.filter(r => r.status === 'rejected').length
    return NextResponse.json({ success: true, sent: toSend.length - failed, failed })
  } catch (err) {
    console.error('send-sms error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
