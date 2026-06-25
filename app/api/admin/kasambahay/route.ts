import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const ADMIN_EMAILS = ['ruffa_eugenio@yahoo.com', 'ruffa.erodriguez@gmail.com', 'test@maidit.com', 'admin@maidit.com']

export async function GET() {
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

  console.log('SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  console.log('SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length)

  const sa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: kbList, error: kbListError } = await sa
    .from('kasambahay')
    .select('id, profile_id')
    .limit(5)
  console.log('kasambahay raw:', kbList, kbListError)

  const { count } = await sa
    .from('kasambahay')
    .select('*', { count: 'exact', head: true })
  console.log('kasambahay count:', count)

  const { data: kbData, error: kbError } = await sa
    .from('kasambahay')
    .select('id, profile_id, province, setup, asking_salary, status, has_govt_id, has_nbi, is_verified, referred_by, created_at, skills, availability, age, civil_status')
    .order('created_at', { ascending: false })

  if (kbError) console.log('kasambahay query error:', kbError)

  const kasambahay = kbData ?? []

  const profileIds = kasambahay.map((kb: any) => kb.profile_id).filter(Boolean)

  const [profilesRes, partnersRes] = await Promise.all([
    profileIds.length > 0
      ? sa.from('profiles').select('id, full_name, mobile, email, city, created_at, selfie_url').in('id', profileIds)
      : Promise.resolve({ data: [] }),
    sa.from('partners').select('id, referral_code'),
  ])

  const profileMap: Record<string, any> = {}
  for (const p of (profilesRes.data ?? []) as any[]) {
    profileMap[p.id] = p
  }

  const partnerMap: Record<string, string> = {}
  for (const p of (partnersRes.data ?? []) as any[]) {
    partnerMap[p.id] = p.referral_code
  }

  const enriched = kasambahay.map((kb: any) => ({
    ...kb,
    profile: profileMap[kb.profile_id] ?? null,
    partner_referral_code: kb.referred_by ? (partnerMap[kb.referred_by] ?? null) : null,
  }))

  return NextResponse.json({ kasambahay: enriched })
}
