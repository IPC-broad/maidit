import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const ADMIN_EMAILS = ['ruffa_eugenio@yahoo.com', 'ruffa.erodriguez@gmail.com', 'test@maidit.com', 'admin@maidit.com']

function weekOf(dateStr: string): string {
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  return d.toISOString().slice(0, 10)
}

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

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const eightWeeksAgo = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000).toISOString()

  const [
    hwCount, kbCount, partnerCount,
    kbActive, partnersPending, jobPostsActive,
    signupsToday, signupsThisWeek, signupsLastWeek,
    hwToday, kbToday, partnerToday,
    kbViaPartners, kbDirect,
    offers, recentProfiles, kbProvinces,
  ] = await Promise.all([
    sa.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'homeowner').then(r => r.count ?? 0),
    sa.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'kasambahay').then(r => r.count ?? 0),
    sa.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'partner').then(r => r.count ?? 0),
    sa.from('kasambahay').select('*', { count: 'exact', head: true }).neq('status', 'hired').then(r => r.count ?? 0),
    sa.from('partners').select('*', { count: 'exact', head: true }).eq('approved', false).then(r => r.count ?? 0),
    sa.from('job_posts').select('*', { count: 'exact', head: true }).eq('status', 'active').then(r => r.count ?? 0),
    sa.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayStart).then(r => r.count ?? 0),
    sa.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekStart).then(r => r.count ?? 0),
    sa.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', lastWeekStart).lt('created_at', weekStart).then(r => r.count ?? 0),
    sa.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'homeowner').gte('created_at', todayStart).then(r => r.count ?? 0),
    sa.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'kasambahay').gte('created_at', todayStart).then(r => r.count ?? 0),
    sa.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'partner').gte('created_at', todayStart).then(r => r.count ?? 0),
    sa.from('kasambahay').select('*', { count: 'exact', head: true }).not('referred_by', 'is', null).then(r => r.count ?? 0),
    sa.from('kasambahay').select('*', { count: 'exact', head: true }).is('referred_by', null).then(r => r.count ?? 0),
    sa.from('offers').select('id, status, created_at').then(r => r.data ?? []),
    sa.from('profiles').select('created_at, role').gte('created_at', eightWeeksAgo).then(r => r.data ?? []),
    sa.from('kasambahay').select('province').not('province', 'is', null).then(r => r.data ?? []),
  ])

  const paidOffers = offers.filter((o: any) => ['paid', 'arrived'].includes(o.status))
  const successfulHires = paidOffers.length
  const revenueThisMonth = offers.filter((o: any) =>
    ['paid', 'arrived'].includes(o.status) && o.created_at >= monthStart
  ).length * 2500

  const weeklySignups: Record<string, number> = {}
  for (const p of recentProfiles as any[]) {
    const wk = weekOf(p.created_at)
    weeklySignups[wk] = (weeklySignups[wk] ?? 0) + 1
  }

  const weeklyHires: Record<string, number> = {}
  for (const o of offers as any[]) {
    if (['paid', 'arrived'].includes(o.status) && o.created_at >= eightWeeksAgo) {
      const wk = weekOf(o.created_at)
      weeklyHires[wk] = (weeklyHires[wk] ?? 0) + 1
    }
  }

  const provinceCounts: Record<string, number> = {}
  for (const kb of kbProvinces as any[]) {
    if (kb.province) provinceCounts[kb.province] = (provinceCounts[kb.province] ?? 0) + 1
  }
  const topProvinces = Object.entries(provinceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([label, value]) => ({ label, value }))

  const offerFunnel = {
    sent: offers.length,
    agreed: offers.filter((o: any) => ['agreed', 'paid', 'arrived'].includes(o.status)).length,
    paid: offers.filter((o: any) => ['paid', 'arrived'].includes(o.status)).length,
    arrived: offers.filter((o: any) => o.status === 'arrived').length,
    cancelled: offers.filter((o: any) => o.status === 'cancelled').length,
  }

  return NextResponse.json({
    totalUsers: hwCount + kbCount + partnerCount,
    totalHO: hwCount,
    totalKB: kbCount,
    totalPartners: partnerCount,
    kbActive,
    partnersPending,
    successfulHires,
    jobPostsActive,
    revenueThisMonth,
    signupsToday,
    signupsThisWeek,
    signupsLastWeek,
    hwToday,
    kbToday,
    partnerToday,
    kbViaPartners,
    kbDirect,
    offersByStatus: {
      pending: offers.filter((o: any) => o.status === 'pending').length,
      agreed: offers.filter((o: any) => o.status === 'agreed').length,
      paid: offers.filter((o: any) => o.status === 'paid').length,
      arrived: offers.filter((o: any) => o.status === 'arrived').length,
      cancelled: offers.filter((o: any) => o.status === 'cancelled').length,
    },
    weeklySignups,
    weeklyHires,
    topProvinces,
    offerFunnel,
  })
}
