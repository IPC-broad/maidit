import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const ADMIN_EMAILS = ['ruffa_eugenio@yahoo.com', 'ruffa.erodriguez@gmail.com', 'test@maidit.com', 'admin@maidit.com']

export async function GET() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'SERVICE_ROLE_KEY not configured' }, { status: 500 })
  }

  const cookieStore = await cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)

  const { data: kbList, error: kbError } = await sa
    .from('kasambahay')
    .select('*')
    .order('created_at', { ascending: false })

  if (kbError) console.log('kasambahay error:', kbError)

  const profileIds = (kbList ?? []).map((k: any) => k.profile_id).filter(Boolean)

  const { data: profiles } = profileIds.length > 0
    ? await sa.from('profiles').select('id, full_name, mobile, email, city, created_at').in('id', profileIds)
    : { data: [] }

  const { data: partners } = await sa.from('partners').select('id, referral_code')

  const partnerMap: Record<string, string> = {}
  for (const p of (partners ?? []) as any[]) partnerMap[p.id] = p.referral_code

  const kasambahay = (kbList ?? []).map((k: any) => ({
    ...k,
    profile: (profiles ?? []).find((p: any) => p.id === k.profile_id) ?? null,
    partner_referral_code: k.referred_by ? (partnerMap[k.referred_by] ?? null) : null,
  }))

  return NextResponse.json({ kasambahay })
}
