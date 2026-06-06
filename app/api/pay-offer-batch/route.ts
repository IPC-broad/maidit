import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { homeowner_id } = await req.json()
  if (!homeowner_id) return NextResponse.json({ error: 'missing homeowner_id' }, { status: 400 })

  const res = await fetch('https://api.paymongo.com/v1/links', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: 10000,
          description: 'MaidIt — 2 additional offer slots',
          remarks: `homeowner:${homeowner_id}`,
        },
      },
    }),
  })
  const json = await res.json()
  const url = json?.data?.attributes?.checkout_url
  if (!url) return NextResponse.json({ error: 'PayMongo error' }, { status: 500 })
  return NextResponse.json({ url })
}
