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

  const { data: offers } = await sa
    .from('offers')
    .select(`
      id, status, salary, city, transport_service, created_at, paid_at,
      admin_flag, admin_flag_reason,
      kasambahay:kasambahay_id(id, profile:profiles!profile_id(full_name, mobile)),
      homeowner:homeowner_id(id, profile:profiles!profile_id(full_name, mobile))
    `)
    .order('created_at', { ascending: false })

  return NextResponse.json({ offers: offers ?? [] })
}
