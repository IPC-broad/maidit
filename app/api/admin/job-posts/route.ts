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
    sa.from('job_posts').select(`
      id, homeowner_id, title, setup, salary_min, salary_max, city, status,
      urgency, scope, created_at, paid_at,
      homeowner:homeowner_id(profile:profiles!profile_id(full_name, mobile))
    `).order('created_at', { ascending: false }),
    sa.from('applications').select('job_id'),
  ])

  const jobs = jobsRes.data ?? []
  const apps = appsRes.data ?? []

  const appCounts: Record<string, number> = {}
  for (const a of apps as any[]) {
    appCounts[a.job_id] = (appCounts[a.job_id] ?? 0) + 1
  }

  const enriched = jobs.map((j: any) => ({
    ...j,
    applicant_count: appCounts[j.id] ?? 0,
  }))

  return NextResponse.json({ jobPosts: enriched })
}
