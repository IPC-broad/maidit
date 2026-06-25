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

  const sa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: partnersData, error: partnersError } = await sa
    .from('partners')
    .select('id, profile_id, referral_code, tier, balance, province, city, barangay, approved, flagged, flag_reason, created_at, estimated_referrals')
    .order('created_at', { ascending: false })

  if (partnersError) console.log('partners query error:', partnersError)

  const partnersRaw = partnersData ?? []

  const profileIds = partnersRaw.map((p: any) => p.profile_id).filter(Boolean)

  const [profilesRes, kbRes, offersRes] = await Promise.all([
    profileIds.length > 0
      ? sa.from('profiles').select('id, full_name, mobile, email, created_at, selfie_url').in('id', profileIds)
      : Promise.resolve({ data: [] }),
    sa.from('kasambahay').select('id, referred_by').not('referred_by', 'is', null),
    sa.from('offers').select('kasambahay_id, status'),
  ])

  const profileMap: Record<string, any> = {}
  for (const p of (profilesRes.data ?? []) as any[]) {
    profileMap[p.id] = p
  }

  const kbToPartner: Record<string, string> = {}
  for (const kb of (kbRes.data ?? []) as any[]) {
    if (kb.referred_by) kbToPartner[kb.id] = kb.referred_by
  }

  const referralCounts: Record<string, number> = {}
  for (const kb of (kbRes.data ?? []) as any[]) {
    if (kb.referred_by) referralCounts[kb.referred_by] = (referralCounts[kb.referred_by] ?? 0) + 1
  }

  const hireCounts: Record<string, number> = {}
  for (const offer of (offersRes.data ?? []) as any[]) {
    if (['paid', 'arrived'].includes(offer.status)) {
      const partnerId = kbToPartner[offer.kasambahay_id]
      if (partnerId) hireCounts[partnerId] = (hireCounts[partnerId] ?? 0) + 1
    }
  }

  const enriched = partnersRaw.map((p: any) => ({
    ...p,
    profile: profileMap[p.profile_id] ?? null,
    referral_count: referralCounts[p.id] ?? 0,
    hire_count: hireCounts[p.id] ?? 0,
    earnings: (hireCounts[p.id] ?? 0) * 500,
  }))

  return NextResponse.json({ partners: enriched })
}
