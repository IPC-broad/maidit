import { NextRequest, NextResponse } from 'next/server'

const VALID_AMOUNTS = new Set([49900, 200100, 250000, 750000, 800100, 850000])

export async function POST(req: NextRequest) {
  try {
    const { offer_id, homeowner_id, type, amount, description } = await req.json()

    if (!VALID_AMOUNTS.has(amount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const secretKey = process.env.PAYMONGO_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ error: 'PayMongo not configured' }, { status: 500 })
    }

    const encoded = Buffer.from(`${secretKey}:`).toString('base64')

    const metadata: Record<string, string> = {}
    if (offer_id) metadata.offer_id = offer_id
    if (homeowner_id) metadata.homeowner_id = homeowner_id
    if (type) metadata.type = type

    const siteUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://maidit.vercel.app'
    const redirect = offer_id && type === 'hire'
      ? { redirect: { success: `${siteUrl}/arrival/${offer_id}`, failed: `${siteUrl}/pay/${offer_id}` } }
      : {}

    const body: any = {
      data: {
        attributes: {
          amount,
          description: description || 'MaidIt Hire Fee',
          ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
          ...redirect,
        },
      },
    }

    const response = await fetch('https://api.paymongo.com/v1/links', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encoded}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}))
      console.error('[create-payment-link] PayMongo error:', errBody)
      return NextResponse.json({ error: 'Payment link creation failed' }, { status: 502 })
    }

    const data = await response.json()
    const checkoutUrl: string | undefined = data?.data?.attributes?.checkout_url

    if (!checkoutUrl) {
      console.error('[create-payment-link] No checkout_url in response:', data)
      return NextResponse.json({ error: 'No checkout URL returned' }, { status: 502 })
    }

    return NextResponse.json({ checkout_url: checkoutUrl })
  } catch (err) {
    console.error('[create-payment-link] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
