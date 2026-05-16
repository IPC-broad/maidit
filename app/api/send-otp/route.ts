import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { mobile, checkOnly } = await req.json()

  if (!mobile) return NextResponse.json({ error: 'Mobile required' }, { status: 400 })

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('mobile', mobile)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'Nairehistro na ang number na ito. Mag-login na lang.' },
      { status: 409 }
    )
  }

  if (checkOnly) return NextResponse.json({ success: true })

  if (!process.env.SEMAPHORE_API_KEY) {
    const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString()
    const fallbackExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    await supabase.from('otp_codes').insert({ mobile, code: fallbackCode, expires_at: fallbackExpiry })
    console.log(`[send-otp] No API key — OTP for ${mobile}: ${fallbackCode}`)
    return NextResponse.json({ success: true })
  }

  const params = new URLSearchParams({
    apikey: process.env.SEMAPHORE_API_KEY,
    number: mobile,
    message: `Hi! Ang iyong MaidIt verification code ay: {otp}\n\nHuwag ibahagi ang code na ito sa kahit sino.\nMag-e-expire ito sa loob ng 10 minuto.\n\n- MaidIt Team`,
  })

  const res = await fetch('https://api.semaphore.co/api/v4/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })

  const responseText = await res.text()
  console.log('[send-otp] Semaphore status:', res.status)
  console.log('[send-otp] Semaphore response:', responseText)

  if (res.status !== 200) {
    return NextResponse.json({
      error: 'Hindi napadala ang SMS',
      semaphore_status: res.status,
      semaphore_response: responseText
    }, { status: 500 })
  }

  let code: string
  try {
    const json = JSON.parse(responseText)
    code = json[0]?.code
    if (!code) throw new Error('No code in response')
  } catch {
    console.error('[send-otp] Failed to parse OTP code from response:', responseText)
    return NextResponse.json({ error: 'Hindi nakuha ang OTP code.' }, { status: 500 })
  }

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  await supabase.from('otp_codes').insert({ mobile, code, expires_at: expiresAt })

  return NextResponse.json({ success: true })
}
