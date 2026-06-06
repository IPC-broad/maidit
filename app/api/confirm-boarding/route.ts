import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { offer_id } = await req.json()
  if (!offer_id) return NextResponse.json({ error: 'missing offer_id' }, { status: 400 })

  const departed_at = new Date().toISOString()

  const { error } = await supabase
    .from('offers')
    .update({ departed_at })
    .eq('id', offer_id)
    .in('status', ['paid', 'active'])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, departed_at })
}
