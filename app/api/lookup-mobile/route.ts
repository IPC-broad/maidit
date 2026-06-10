import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { mobile } = await req.json()
  if (!mobile) return NextResponse.json({ error: 'Missing mobile' }, { status: 400 })

  console.log('[lookup-mobile] looking up mobile:', mobile)

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('mobile', mobile)
    .single()

  console.log('[lookup-mobile] result:', { data, error })

  if (!data?.email) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ email: data.email })
}
