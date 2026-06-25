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

  const [jobsRes, appsRes] = await Promise.all([
    sa.from('job_posts')
      .select('id, homeowner_id, title, setup, salary_min, salary_max, city, status, urgency, scope, created_at, paid_at')
      .order('created_at', { ascending: false }),
    sa.from('applications').select('job_id'),
  ])

  if (jobsRes.error) console.log('job_posts query error:', jobsRes.error)

  const jobs = jobsRes.data ?? []
  const apps = appsRes.data ?? []

  const hwIds = [...new Set(jobs.map((j: any) => j.homeowner_id).filter(Boolean))]

  const { data: hwData } = hwIds.length > 0
    ? await sa.from('homeowners').select('id, profile_id').in('id', hwIds)
    : { data: [] }

  const profileIds = (hwData ?? []).map((h: any) => h.profile_id).filter(Boolean)

  const { data: profiles } = profileIds.length > 0
    ? await sa.from('profiles').select('id, full_name, mobile').in('id', profileIds)
    : { data: [] }

  const profileMap: Record<string, any> = {}
  for (const p of (profiles ?? []) as any[]) profileMap[p.id] = p

  const hwMap: Record<string, string> = {}
  for (const hw of (hwData ?? []) as any[]) hwMap[hw.id] = hw.profile_id

  const appCounts: Record<string, number> = {}
  for (const a of apps as any[]) {
    appCounts[a.job_id] = (appCounts[a.job_id] ?? 0) + 1
  }

  const enriched = jobs.map((j: any) => ({
    ...j,
    homeowner_name: profileMap[hwMap[j.homeowner_id]]?.full_name ?? null,
    applicant_count: appCounts[j.id] ?? 0,
  }))

  return NextResponse.json({ jobPosts: enriched })
}
