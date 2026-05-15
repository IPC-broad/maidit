import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { mobile, code } = await req.json()

  if (!mobile || !code) {
    return NextResponse.json({ error: 'Mobile and code required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('otp_codes')
    .select('id, expires_at, used')
    .eq('mobile', mobile)
    .eq('code', code)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Mali ang code. Subukan ulit.' }, { status: 400 })
  }

  if (data.used) {
    return NextResponse.json({ error: 'Nagamit na ang code na ito.' }, { status: 400 })
  }

  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Nag-expire na ang code. Humingi ng bago.' }, { status: 400 })
  }

  // Mark as used
  await supabase.from('otp_codes').update({ used: true }).eq('id', data.id)

  return NextResponse.json({ success: true })
}
