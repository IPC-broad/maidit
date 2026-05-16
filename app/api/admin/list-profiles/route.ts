import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error('[list-profiles] Missing env vars — URL:', !!url, 'KEY:', !!key)
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const supabase = createClient(url, key)

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, mobile, role, created_at, email')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[list-profiles] Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log(`[list-profiles] Returned ${data?.length ?? 0} profiles`)
  return NextResponse.json({ profiles: data || [] })
}
