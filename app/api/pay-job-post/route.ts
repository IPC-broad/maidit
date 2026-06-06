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
          amount: 49900,
          description: 'MaidIt — Job Post Listing Fee',
          remarks: `job_post:${homeowner_id}`,
        },
      },
    }),
  })
  const json = await res.json()
  const checkout_url = json?.data?.attributes?.checkout_url
  if (!checkout_url) return NextResponse.json({ error: 'PayMongo error' }, { status: 500 })
  return NextResponse.json({ checkout_url })
}
