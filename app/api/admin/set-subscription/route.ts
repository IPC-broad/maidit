import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error('[set-subscription] Missing env vars — URL:', !!url, 'KEY:', !!key)
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const body = await req.json()
  const { homeowner_id, subscribed, credit_used } = body

  if (!homeowner_id || typeof subscribed !== 'boolean') {
    return NextResponse.json({ error: 'homeowner_id and subscribed (boolean) are required' }, { status: 400 })
  }

  const supabase = createClient(url, key)

  const updates: Record<string, unknown> = {}

  if (typeof credit_used === 'boolean') {
    updates.subscription_credit_used = credit_used
  } else if (subscribed) {
    const expires = new Date()
    expires.setDate(expires.getDate() + 30)
    updates.subscription_expires_at = expires.toISOString()
    updates.subscription_credit_used = false
  } else {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    updates.subscription_expires_at = yesterday.toISOString()
  }

  const { error } = await supabase
    .from('homeowners')
    .update(updates)
    .eq('id', homeowner_id)

  if (error) {
    console.error('[set-subscription] Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
