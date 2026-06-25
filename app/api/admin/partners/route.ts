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

  const { data: partnerList, error: partnerError } = await sa
    .from('partners')
    .select('*')
    .order('created_at', { ascending: false })

  if (partnerError) console.log('partners error:', partnerError)

  const profileIds = (partnerList ?? []).map((p: any) => p.profile_id).filter(Boolean)

  const [profilesRes, kbRes, offersRes] = await Promise.all([
    profileIds.length > 0
      ? sa.from('profiles').select('id, full_name, mobile, email, created_at').in('id', profileIds)
      : Promise.resolve({ data: [] }),
    sa.from('kasambahay').select('id, referred_by').not('referred_by', 'is', null),
    sa.from('offers').select('kasambahay_id, status'),
  ])

  const kbToPartner: Record<string, string> = {}
  const referralCounts: Record<string, number> = {}
  for (const kb of (kbRes.data ?? []) as any[]) {
    if (kb.referred_by) {
      kbToPartner[kb.id] = kb.referred_by
      referralCounts[kb.referred_by] = (referralCounts[kb.referred_by] ?? 0) + 1
    }
  }

  const hireCounts: Record<string, number> = {}
  for (const offer of (offersRes.data ?? []) as any[]) {
    if (['paid', 'arrived'].includes(offer.status)) {
      const partnerId = kbToPartner[offer.kasambahay_id]
      if (partnerId) hireCounts[partnerId] = (hireCounts[partnerId] ?? 0) + 1
    }
  }

  const partners = (partnerList ?? []).map((p: any) => ({
    ...p,
    profile: (profilesRes.data ?? []).find((pr: any) => pr.id === p.profile_id) ?? null,
    referral_count: referralCounts[p.id] ?? 0,
    hire_count: hireCounts[p.id] ?? 0,
    earnings: (hireCounts[p.id] ?? 0) * 500,
  }))

  return NextResponse.json({ partners })
}
