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

  const { data: hwList, error: hwError } = await sa
    .from('homeowners')
    .select('*')
    .order('created_at', { ascending: false })

  if (hwError) console.log('homeowners error:', hwError)

  const profileIds = (hwList ?? []).map((h: any) => h.profile_id).filter(Boolean)

  const [profilesRes, offersRes] = await Promise.all([
    profileIds.length > 0
      ? sa.from('profiles').select('id, full_name, mobile, email, city, created_at').in('id', profileIds)
      : Promise.resolve({ data: [] }),
    sa.from('offers').select('homeowner_id, status, created_at'),
  ])

  const offerCounts: Record<string, number> = {}
  const hireCounts: Record<string, number> = {}
  const lastOfferDate: Record<string, string> = {}

  for (const o of (offersRes.data ?? []) as any[]) {
    offerCounts[o.homeowner_id] = (offerCounts[o.homeowner_id] ?? 0) + 1
    if (['paid', 'arrived'].includes(o.status)) {
      hireCounts[o.homeowner_id] = (hireCounts[o.homeowner_id] ?? 0) + 1
    }
    if (!lastOfferDate[o.homeowner_id] || o.created_at > lastOfferDate[o.homeowner_id]) {
      lastOfferDate[o.homeowner_id] = o.created_at
    }
  }

  const homeowners = (hwList ?? []).map((h: any) => ({
    ...h,
    profile: (profilesRes.data ?? []).find((p: any) => p.id === h.profile_id) ?? null,
    offer_count: offerCounts[h.id] ?? 0,
    hire_count: hireCounts[h.id] ?? 0,
    last_active: lastOfferDate[h.id] ?? null,
  }))

  return NextResponse.json({ homeowners })
}
