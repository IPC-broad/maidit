import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const { profile_id } = await req.json()
  if (!profile_id) return NextResponse.json({ error: 'profile_id required' }, { status: 400 })

  // 1. Delete offers referencing this profile's homeowner or kasambahay records
  const { data: kbRow } = await supabase.from('kasambahay').select('id').eq('profile_id', profile_id).maybeSingle()
  const { data: hwRow } = await supabase.from('homeowners').select('id').eq('profile_id', profile_id).maybeSingle()

  if (kbRow?.id) {
    await supabase.from('offers').delete().eq('kasambahay_id', kbRow.id)
  }
  if (hwRow?.id) {
    await supabase.from('offers').delete().eq('homeowner_id', hwRow.id)
  }

  // 2. Delete kasambahay
  await supabase.from('kasambahay').delete().eq('profile_id', profile_id)

  // 3. Delete homeowners
  await supabase.from('homeowners').delete().eq('profile_id', profile_id)

  // 4. Delete partners
  await supabase.from('partners').delete().eq('profile_id', profile_id)

  // 5. Delete profile
  await supabase.from('profiles').delete().eq('id', profile_id)

  // 6. Delete auth user
  await supabase.auth.admin.deleteUser(profile_id)

  return NextResponse.json({ success: true, deleted_profile_id: profile_id })
}
