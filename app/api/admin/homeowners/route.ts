import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAILS = ['ruffa_eugenio@yahoo.com', 'ruffa.erodriguez@gmail.com', 'test@maidit.com', 'admin@maidit.com']

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: { user } } = await sa.auth.getUser(token)
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: hwData, error: hwError } = await sa
    .from('homeowners')
    .select('id, profile_id, preferred_setup, subscription_expires_at, created_at')
    .order('created_at', { ascending: false })

  if (hwError) console.log('homeowners query error:', hwError)

  const homeowners = hwData ?? []

  const profileIds = homeowners.map((hw: any) => hw.profile_id).filter(Boolean)

  const [profilesRes, offersRes] = await Promise.all([
    profileIds.length > 0
      ? sa.from('profiles').select('id, full_name, mobile, email, city, created_at').in('id', profileIds)
      : Promise.resolve({ data: [] }),
    sa.from('offers').select('homeowner_id, status, created_at'),
  ])

  const profileMap: Record<string, any> = {}
  for (const p of (profilesRes.data ?? []) as any[]) {
    profileMap[p.id] = p
  }

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

  const enriched = homeowners.map((hw: any) => ({
    ...hw,
    profile: profileMap[hw.profile_id] ?? null,
    offer_count: offerCounts[hw.id] ?? 0,
    hire_count: hireCounts[hw.id] ?? 0,
    last_active: lastOfferDate[hw.id] ?? null,
  }))

  return NextResponse.json({ homeowners: enriched })
}
