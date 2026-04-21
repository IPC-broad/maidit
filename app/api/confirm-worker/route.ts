import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { kasambahayId } = await req.json()

    if (!kasambahayId) {
      return NextResponse.json({ error: 'Missing kasambahayId' }, { status: 400 })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from('kasambahay')
      .update({ status: 'available', confirmed_at: new Date().toISOString() })
      .eq('id', kasambahayId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('confirm-worker error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
