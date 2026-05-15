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

  await supabase.from('otp_codes').insert({ mobile, code, expires_at: expiresAt })

  if (!process.env.SEMAPHORE_API_KEY) {
    console.log(`[send-otp] No API key — OTP for ${mobile}: ${code}`)
    return NextResponse.json({ success: true })
  }

  const params = new URLSearchParams({
    apikey: process.env.SEMAPHORE_API_KEY,
    number: mobile,
    message: `Hi! Ang iyong MaidIt verification code ay: ${code}\n\nPara sa iyong seguridad, huwag ibahagi ang code na ito sa kahit sino.\nMag-e-expire ito sa loob ng 10 minuto.\n\n- MaidIt Team`,
  })

  const res = await fetch('https://api.semaphore.co/api/v4/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })

  if (!res.ok) {
    console.error('[send-otp] Semaphore error:', res.status)
    return NextResponse.json({ error: 'Hindi napadala ang SMS. Subukan ulit.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
