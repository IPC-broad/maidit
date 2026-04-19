import { NextRequest, NextResponse } from 'next/server'

async function sendSMS(mobile: string, message: string) {
  if (!process.env.SEMAPHORE_API_KEY) {
    console.log(`[SMS] To ${mobile}: ${message}`)
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
    const { event, offerId } = await req.json()

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: offer, error } = await supabase
      .from('offers')
      .select(`
        *,
        homeowner_profile:profiles!offers_homeowner_id_fkey(full_name, mobile),
        kasambahay_profile:profiles!offers_kasambahay_id_fkey(full_name, mobile)
      `)
      .eq('id', offerId)
      .single()

    if (error || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    const hwName = offer.homeowner_profile?.full_name?.split(' ')[0] || 'Homeowner'
    const hwMobile = offer.homeowner_profile?.mobile
    const kbName = offer.kasambahay_profile?.full_name?.split(' ')[0] || 'Kasambahay'
    const kbMobile = offer.kasambahay_profile?.mobile

    const messages: Record<string, { mobile: string; msg: string }[]> = {
      offer_sent: [
        {
          mobile: kbMobile,
          msg: `Hi ${kbName}! ${hwName} sent you a job offer on MaidIt. Salary: ₱${offer.salary?.toLocaleString()}/mo. Review it now: maidit.vercel.app/offer/review/${offerId}`
        }
      ],
      offer_reviewed: [
        {
          mobile: hwMobile,
          msg: `Hi ${hwName}! ${kbName} reviewed your offer on MaidIt. Final step — confirm and pay: maidit.vercel.app/offer/confirm/${offerId}`
        }
      ],
      offer_agreed: [
        {
          mobile: hwMobile,
          msg: `Hi ${hwName}! ${kbName} agreed to your offer. Please pay the ₱2,001 hire fee: maidit.vercel.app/pay/${offerId}`
        },
        {
          mobile: kbMobile,
          msg: `Hi ${kbName}! ${hwName} confirmed your offer on MaidIt. Waiting for their payment to finalize. We'll notify you once done!`
        }
      ],
      payment_confirmed: [
        {
          mobile: hwMobile,
          msg: `Hi ${hwName}! Payment received. Confirm ${kbName}'s arrival once they reach your home: maidit.vercel.app/arrival/${offerId}`
        },
        {
          mobile: kbMobile,
          msg: `Hi ${kbName}! ${hwName} has paid the hire fee. Your employment is confirmed. Safe travels!`
        }
      ],
      arrival_confirmed: [
        {
          mobile: kbMobile,
          msg: `Hi ${kbName}! ${hwName} confirmed your arrival. Your 30-day trial has started. Good luck on your first day!`
        }
      ]
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