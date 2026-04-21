import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { kasambahayId, name, mobile, partnerName } = await req.json()

    if (!mobile || !kasambahayId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const firstName = name?.split(' ')[0] || 'po'
    const confirmUrl = `https://maidit.vercel.app/confirm/${kasambahayId}`
    const message = `Hi ${firstName}! Si ${partnerName || 'isang community partner'} ay nag-refer sa inyo sa MaidIt para makahanap ng trabaho bilang kasambahay. Libre po ito. I-confirm lang ang inyong profile: ${confirmUrl}`

    if (!process.env.SEMAPHORE_API_KEY) {
      console.log(`[SMS - notify-worker] To ${mobile}: ${message}`)
      return NextResponse.json({ success: true, dev: true })
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
    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('notify-worker error:', err)
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 })
  }
}
