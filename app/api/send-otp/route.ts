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

  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    await supabase.from('otp_codes').insert({ mobile, code, expires_at: expiresAt })
    console.log(`[send-otp] No Twilio credentials — OTP for ${mobile}: ${code}`)
    return NextResponse.json({ success: true })
  }

  const to = `+63${mobile.replace(/^0/, '')}`
  const body = `Ang iyong MaidIt verification code ay: ${code}. Huwag ibahagi.`

  const params = new URLSearchParams({
    To:   to,
    From: process.env.TWILIO_PHONE_NUMBER,
    Body: body,
  })

  const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`
  const credentials = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: params.toString(),
  })

  const responseText = await res.text()
  console.log('[send-otp] Twilio status:', res.status)
  console.log('[send-otp] Twilio response:', responseText)

  if (res.status < 200 || res.status >= 300) {
    return NextResponse.json({
      error: 'Hindi napadala ang SMS',
      twilio_status: res.status,
      twilio_response: responseText,
    }, { status: 500 })
  }

  await supabase.from('otp_codes').insert({ mobile, code, expires_at: expiresAt })

  return NextResponse.json({ success: true })
}
