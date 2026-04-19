import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { mobile } = await req.json()
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  console.log(`OTP for ${mobile}: ${otp}`)

  if (!process.env.SEMAPHORE_API_KEY) {
    return NextResponse.json({ success: true, otp })
  }

  try {
    const params = new URLSearchParams({
      apikey: process.env.SEMAPHORE_API_KEY,
      number: mobile,
      message: `Your MaidIt verification code is: ${otp}. Valid for 10 minutes. Do not share this with anyone.`,
      sendername: 'MaidIt'
    })

    const res = await fetch('https://api.semaphore.co/api/v4/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    })

    if (!res.ok) throw new Error('SMS failed')
  } catch {
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ success: true, otp })
    }
    return NextResponse.json({ error: 'SMS failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, otp })
}