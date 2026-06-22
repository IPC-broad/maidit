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

  const [hwRes, offersRes] = await Promise.all([
    sa.from('homeowners').select(`
      id, profile_id, preferred_setup, subscription_expires_at, created_at,
      profile:profiles!profile_id(id, full_name, mobile, email, city, created_at)
    `).order('created_at', { ascending: false }),
    sa.from('offers').select('homeowner_id, status, created_at'),
  ])

  const homeowners = hwRes.data ?? []
  const offers = offersRes.data ?? []

  // Count offers per homeowner
  const offerCounts: Record<string, number> = {}
  const hireCounts: Record<string, number> = {}
  const lastOfferDate: Record<string, string> = {}

  for (const o of offers as any[]) {
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
    offer_count: offerCounts[hw.id] ?? 0,
    hire_count: hireCounts[hw.id] ?? 0,
    last_active: lastOfferDate[hw.id] ?? null,
  }))

  return NextResponse.json({ homeowners: enriched })
}
