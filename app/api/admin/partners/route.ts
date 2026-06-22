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

  const [partnersRes, kbRes, offersRes] = await Promise.all([
    sa.from('partners').select(`
      id, profile_id, referral_code, tier, balance, province, city, barangay,
      approved, flagged, flag_reason, created_at, estimated_referrals,
      profile:profiles!profile_id(id, full_name, mobile, email, created_at, selfie_url)
    `).order('created_at', { ascending: false }),
    sa.from('kasambahay').select('id, referred_by').not('referred_by', 'is', null),
    sa.from('offers').select('kasambahay_id, status'),
  ])

  const partners = partnersRes.data ?? []
  const kbReferrals = kbRes.data ?? []
  const allOffers = offersRes.data ?? []

  // Map kasambahay.id → partner.id
  const kbToPartner: Record<string, string> = {}
  for (const kb of kbReferrals as any[]) {
    if (kb.referred_by) kbToPartner[kb.id] = kb.referred_by
  }

  // Count referrals per partner
  const referralCounts: Record<string, number> = {}
  for (const kb of kbReferrals as any[]) {
    if (kb.referred_by) referralCounts[kb.referred_by] = (referralCounts[kb.referred_by] ?? 0) + 1
  }

  // Count successful hires per partner
  const hireCounts: Record<string, number> = {}
  for (const offer of allOffers as any[]) {
    if (['paid', 'arrived'].includes(offer.status)) {
      const partnerId = kbToPartner[offer.kasambahay_id]
      if (partnerId) hireCounts[partnerId] = (hireCounts[partnerId] ?? 0) + 1
    }
  }

  const enriched = partners.map((p: any) => ({
    ...p,
    referral_count: referralCounts[p.id] ?? 0,
    hire_count: hireCounts[p.id] ?? 0,
    earnings: (hireCounts[p.id] ?? 0) * 500,
  }))

  return NextResponse.json({ partners: enriched })
}
