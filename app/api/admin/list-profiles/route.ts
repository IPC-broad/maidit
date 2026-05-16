import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, mobile, role, created_at, email')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profiles: data || [] })
}
