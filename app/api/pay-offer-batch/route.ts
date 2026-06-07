import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Skip handler for test accounts — increments daily_offers_used by 2 same as real payment webhook
export async function PATCH(req: NextRequest) {
  const { homeowner_id } = await req.json()
  if (!homeowner_id) return NextResponse.json({ error: 'missing homeowner_id' }, { status: 400 })
  const today = new Date().toISOString().split('T')[0]
  const { data: hw } = await supabaseAdmin.from('homeowners').select('daily_offers_used, daily_offers_date').eq('id', homeowner_id).single()
  const currentUsed = hw?.daily_offers_date === today ? (hw?.daily_offers_used || 0) : 0
  await supabaseAdmin.from('homeowners').update({
    daily_offers_used: currentUsed + 2,
    daily_offers_date: today,
  }).eq('id', homeowner_id)
  return NextResponse.json({ ok: true })
}

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
