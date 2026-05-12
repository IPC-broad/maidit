import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

// PayMongo signs webhooks with HMAC-SHA256.
// Header format: "t=<unix_ts>,te=<test_sig>,li=<live_sig>"
// Signed payload: "<unix_ts>.<raw_body>"
function verifySignature(rawBody: string, header: string, secret: string): boolean {
  const parts: Record<string, string> = {}
  for (const chunk of header.split(',')) {
    const [k, v] = chunk.split('=')
    if (k && v) parts[k] = v
  }
  const timestamp = parts['t']
  const signature = parts['li'] ?? parts['te'] // live first, fall back to test
  if (!timestamp || !signature) return false

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

async function sendSMS(mobile: string, message: string) {
  if (!process.env.SEMAPHORE_API_KEY) {
    console.log('[SMS webhook] To ' + mobile + ': ' + message)
    return
  }
  const params = new URLSearchParams({
    apikey: process.env.SEMAPHORE_API_KEY,
    number: mobile,
    message,
    sendername: 'MaidIt',
  })
  await fetch('https://api.semaphore.co/api/v4/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[paymongo-webhook] PAYMONGO_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const sigHeader = req.headers.get('paymongo-signature') ?? ''
  if (!verifySignature(rawBody, sigHeader, webhookSecret)) {
    console.warn('[paymongo-webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType: string = payload?.data?.attributes?.type ?? payload?.type ?? ''
  // For link.payment.paid: payload.data.attributes.data.attributes has the link attributes
  // For payment.paid:       payload.data.attributes has the payment attributes directly
  const eventAttrs = payload?.data?.attributes?.data?.attributes ?? payload?.data?.attributes ?? {}
  const amountCentavos: number = eventAttrs?.amount ?? 0

  // ── link.payment.paid (dynamic links with metadata) ──────────────────────────
  if (eventType === 'link.payment.paid') {
    const offerId: string | undefined = eventAttrs?.metadata?.offer_id
    if (!offerId) {
      console.log('[paymongo-webhook] link.payment.paid — no offer_id in metadata, amount:', amountCentavos)
      return NextResponse.json({ received: true })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: offer } = await supabase
      .from('offers')
      .select('id, homeowner_id, kasambahay_id, transport_service, status')
      .eq('id', offerId)
      .single()

    if (!offer) {
      console.log(`[paymongo-webhook] link.payment.paid — offer ${offerId} not found`)
      return NextResponse.json({ received: true })
    }

    if (['paid', 'active', 'hired'].includes(offer.status)) {
      console.log(`[paymongo-webhook] link.payment.paid — offer ${offerId} already processed`)
      return NextResponse.json({ received: true })
    }

    const now = new Date().toISOString()
    const offerUpdates: any = { status: 'paid', paid_at: now }
    if (offer.transport_service === true) offerUpdates.transport_confirmed = true
    await supabase.from('offers').update(offerUpdates).eq('id', offerId)

    // Mark subscription credit used when a credit-discounted amount was charged (₱2,001 or ₱8,001)
    const CREDIT_AMOUNTS = new Set([200100, 800100])
    const { data: hw } = await supabase
      .from('homeowners')
      .select('id, profile_id, subscription_credit_used, subscription_expires_at')
      .eq('id', offer.homeowner_id)
      .single()

    if (hw && !hw.subscription_credit_used && CREDIT_AMOUNTS.has(amountCentavos)) {
      const hwUpdates: any = { subscription_credit_used: true }
      if (!hw.subscription_expires_at) {
        const exp = new Date()
        exp.setDate(exp.getDate() + 30)
        hwUpdates.subscription_expires_at = exp.toISOString()
      }
      await supabase.from('homeowners').update(hwUpdates).eq('id', hw.id)
    }

    // Fetch profiles for SMS
    const [hwProfRes, kbRes] = await Promise.all([
      hw?.profile_id
        ? supabase.from('profiles').select('full_name, mobile').eq('id', hw.profile_id).single()
        : Promise.resolve({ data: null }),
      supabase.from('kasambahay').select('profile_id').eq('id', offer.kasambahay_id).single(),
    ])
    const kbProfileId = kbRes.data?.profile_id
    const kbProfRes = kbProfileId
      ? await supabase.from('profiles').select('full_name, mobile').eq('id', kbProfileId).single()
      : { data: null }

    const hwName = hwProfRes.data?.full_name?.split(' ')[0] || 'Homeowner'
    const kbName = kbProfRes.data?.full_name?.split(' ')[0] || 'Kasambahay'
    const hwMobile = hwProfRes.data?.mobile
    const kbMobile = kbProfRes.data?.mobile
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'maidit.vercel.app').replace(/\/$/, '')

    await Promise.allSettled([
      hwMobile && sendSMS(hwMobile,
        `Hi ${hwName}! Payment confirmed. Confirm ${kbName}'s arrival once they reach your home: ${baseUrl}/arrival/${offerId}`),
      kbMobile && sendSMS(kbMobile,
        `Hi ${kbName}! ${hwName} has paid the hire fee. Your employment is confirmed. Safe travels!`),
    ])

    console.log(`[paymongo-webhook] link.payment.paid — offer ${offerId} → paid (₱${amountCentavos / 100})`)
    return NextResponse.json({ received: true, offerId, action: 'offer_paid' })
  }

  // ── payment.paid (legacy static-link fallback) ───────────────────────────────
  if (eventType === 'payment.paid') {
    const HIRE_FEE    = 200100 // ₱2,001
    const LISTING_FEE = 49900  // ₱499

    if (amountCentavos === HIRE_FEE) {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: pendingOffer } = await supabase
        .from('offers')
        .select('id, homeowner_id, kasambahay_id')
        .eq('status', 'payment_pending')
        .order('updated_at', { ascending: true })
        .limit(1)
        .single()

      if (!pendingOffer) {
        console.log('[paymongo-webhook] payment.paid ₱2,001 — no payment_pending offer found')
        return NextResponse.json({ received: true })
      }

      await supabase.from('offers').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', pendingOffer.id)

      const { data: hw } = await supabase.from('homeowners').select('profile_id').eq('id', pendingOffer.homeowner_id).single()
      const { data: kb } = await supabase.from('kasambahay').select('profile_id').eq('id', pendingOffer.kasambahay_id).single()

      const [hwProfResult, kbProfResult] = await Promise.all([
        hw?.profile_id
          ? supabase.from('profiles').select('full_name, mobile').eq('id', hw.profile_id).single()
          : Promise.resolve({ data: null }),
        kb?.profile_id
          ? supabase.from('profiles').select('full_name, mobile').eq('id', kb.profile_id).single()
          : Promise.resolve({ data: null }),
      ])

      const hwName = hwProfResult.data?.full_name?.split(' ')[0] || 'Homeowner'
      const kbName = kbProfResult.data?.full_name?.split(' ')[0] || 'Kasambahay'
      const hwMobile = hwProfResult.data?.mobile
      const kbMobile = kbProfResult.data?.mobile
      const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'maidit.vercel.app').replace(/\/$/, '')

      await Promise.allSettled([
        hwMobile && sendSMS(hwMobile,
          `Hi ${hwName}! Payment confirmed. Confirm ${kbName}'s arrival once they reach your home: ${baseUrl}/arrival/${pendingOffer.id}`),
        kbMobile && sendSMS(kbMobile,
          `Hi ${kbName}! ${hwName} has paid the hire fee. Your employment is confirmed. Safe travels!`),
      ])

      console.log(`[paymongo-webhook] payment.paid ₱2,001 — offer ${pendingOffer.id} → paid`)
      return NextResponse.json({ received: true, offerId: pendingOffer.id, action: 'offer_paid' })
    }

    if (amountCentavos === LISTING_FEE) {
      console.log('[paymongo-webhook] payment.paid ₱499 listing fee — acknowledged')
      return NextResponse.json({ received: true, action: 'listing_fee_noted' })
    }

    console.log(`[paymongo-webhook] payment.paid — unrecognised amount ${amountCentavos} centavos`)
    return NextResponse.json({ received: true })
  }

  // Acknowledge all other event types
  return NextResponse.json({ received: true })
}
