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
  // Read raw body — must happen before any parsing so the signature covers the exact bytes
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
  const paymentAttrs = payload?.data?.attributes?.data?.attributes ?? payload?.data?.attributes ?? {}
  const amountCentavos: number = paymentAttrs?.amount ?? 0
  // PayMongo stores amounts in centavos
  const HIRE_FEE = 200100   // ₱2,001
  const LISTING_FEE = 49900 // ₱499

  if (eventType !== 'payment.paid') {
    // Acknowledge non-payment events immediately
    return NextResponse.json({ received: true })
  }

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── ₱2,001 hire fee ──────────────────────────────────────────────────────────
  if (amountCentavos === HIRE_FEE) {
    // Find the oldest payment_pending offer (user tapped "I've paid" first)
    const { data: pendingOffer } = await supabase
      .from('offers')
      .select('id, homeowner_id, kasambahay_id, salary, city')
      .eq('status', 'payment_pending')
      .order('updated_at', { ascending: true })
      .limit(1)
      .single()

    if (!pendingOffer) {
      console.log('[paymongo-webhook] payment.paid ₱2,001 — no payment_pending offer found')
      return NextResponse.json({ received: true })
    }

    await supabase.from('offers').update({ status: 'paid' }).eq('id', pendingOffer.id)

    // Look up homeowner and kasambahay mobiles for SMS
    const { data: hw } = await supabase
      .from('homeowners').select('profile_id').eq('id', pendingOffer.homeowner_id).single()
    const { data: kb } = await supabase
      .from('kasambahay').select('profile_id').eq('id', pendingOffer.kasambahay_id).single()

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

    console.log(`[paymongo-webhook] ₱2,001 hire fee confirmed — offer ${pendingOffer.id} → paid`)
    return NextResponse.json({ received: true, offerId: pendingOffer.id, action: 'offer_paid' })
  }

  // ── ₱499 job listing fee ─────────────────────────────────────────────────────
  if (amountCentavos === LISTING_FEE) {
    // Cannot reliably match to a homeowner without per-offer payment links.
    // The post-job page already posts the job after manual confirmation, so
    // this event just logs for now and is safe to acknowledge.
    console.log('[paymongo-webhook] payment.paid ₱499 listing fee — acknowledged')
    return NextResponse.json({ received: true, action: 'listing_fee_noted' })
  }

  console.log(`[paymongo-webhook] payment.paid — unrecognised amount ${amountCentavos} centavos`)
  return NextResponse.json({ received: true })
}
