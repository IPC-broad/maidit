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

  const { data: profile, error: lookupError } = await supabaseAdmin
    .from('profiles')
    .select('email, mobile')
    .eq('mobile', mobile)
    .maybeSingle()

  console.log('[lookup-mobile] result:', { profile, lookupError, mobile })

  if (!profile?.email) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ email: profile.email })
}
