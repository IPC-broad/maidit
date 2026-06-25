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

  const { data: offersData, error: offersError } = await sa
    .from('offers')
    .select('id, kasambahay_id, homeowner_id, status, salary, city, transport_service, created_at, paid_at, admin_flag, admin_flag_reason')
    .order('created_at', { ascending: false })

  if (offersError) console.log('offers query error:', offersError)

  const offers = offersData ?? []

  const kbIds = [...new Set(offers.map((o: any) => o.kasambahay_id).filter(Boolean))]
  const hwIds = [...new Set(offers.map((o: any) => o.homeowner_id).filter(Boolean))]

  const [kbRes, hwRes] = await Promise.all([
    kbIds.length > 0 ? sa.from('kasambahay').select('id, profile_id').in('id', kbIds) : Promise.resolve({ data: [] }),
    hwIds.length > 0 ? sa.from('homeowners').select('id, profile_id').in('id', hwIds) : Promise.resolve({ data: [] }),
  ])

  const kbProfileIds = (kbRes.data ?? []).map((k: any) => k.profile_id).filter(Boolean)
  const hwProfileIds = (hwRes.data ?? []).map((h: any) => h.profile_id).filter(Boolean)
  const allProfileIds = [...new Set([...kbProfileIds, ...hwProfileIds])]

  const { data: profiles } = allProfileIds.length > 0
    ? await sa.from('profiles').select('id, full_name, mobile').in('id', allProfileIds)
    : { data: [] }

  const profileMap: Record<string, any> = {}
  for (const p of (profiles ?? []) as any[]) profileMap[p.id] = p

  const kbMap: Record<string, string> = {}
  for (const kb of (kbRes.data ?? []) as any[]) kbMap[kb.id] = kb.profile_id

  const hwMap: Record<string, string> = {}
  for (const hw of (hwRes.data ?? []) as any[]) hwMap[hw.id] = hw.profile_id

  const enriched = offers.map((o: any) => ({
    ...o,
    kasambahay_name: profileMap[kbMap[o.kasambahay_id]]?.full_name ?? null,
    homeowner_name: profileMap[hwMap[o.homeowner_id]]?.full_name ?? null,
  }))

  return NextResponse.json({ offers: enriched })
}
