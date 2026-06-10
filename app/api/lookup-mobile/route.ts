import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { mobile } = await req.json()
  if (!mobile) return NextResponse.json({ error: 'Missing mobile' }, { status: 400 })

  // Normalize — ensure leading 0
  const normalized = mobile.startsWith('+63') ? '0' + mobile.slice(3) : mobile

  console.log('[lookup-mobile] looking up:', normalized)

  const { data: profile, error: lookupError } = await supabaseAdmin
    .from('profiles')
    .select('email, role, mobile')
    .eq('mobile', normalized)
    .maybeSingle()

  console.log('[lookup-mobile] profile:', { profile, lookupError })

  if (!profile) {
    return NextResponse.json({ error: 'Mobile number not found' }, { status: 404 })
  }

  // If email is stored, use it directly
  if (profile.email) {
    return NextResponse.json({ email: profile.email })
  }

  // Fallback: construct email from role + mobile for older accounts
  if (profile.role === 'kasambahay') {
    const constructed = `kb_${normalized}@maidit.app`
    console.log('[lookup-mobile] using constructed email:', constructed)
    return NextResponse.json({ email: constructed })
  }

  if (profile.role === 'partner') {
    const constructed = `partner_${normalized}@maidit.app`
    console.log('[lookup-mobile] using constructed email:', constructed)
    return NextResponse.json({ email: constructed })
  }

  // Homeowner with no stored email — cannot resolve
  return NextResponse.json({ error: 'Could not resolve email for this mobile number' }, { status: 404 })
}
