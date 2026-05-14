import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function sendSMS(mobile: string, message: string) {
  if (!process.env.SEMAPHORE_API_KEY) {
    console.log('[arrival-reminders SMS] To ' + mobile + ': ' + message)
    return
  }
  const params = new URLSearchParams({ apikey: process.env.SEMAPHORE_API_KEY, number: mobile, message })
  await fetch('https://api.semaphore.co/api/v4/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })
}

const toIntl = (mobile: string) => {
  const m = mobile.replace(/\D/g, '')
  return m.startsWith('0') ? '63' + m.slice(1) : m.startsWith('63') ? m : '63' + m
}

export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'maidit.vercel.app').replace(/\/$/, '')
  const now = new Date()

  const { data: paidOffers, error } = await supabase
    .from('offers')
    .select(`
      id, created_at, reminder_sent_at,
      homeowner:homeowner_id(profile_id),
      kasambahay:kasambahay_id(profile_id)
    `)
    .eq('status', 'paid')
    .is('arrived_at', null)

  if (error) {
    console.error('[arrival-reminders] query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let reminders_sent = 0
  let flagged = 0

  for (const offer of paidOffers || []) {
    const paidAt = new Date(offer.created_at)
    const daysSince = (now.getTime() - paidAt.getTime()) / (1000 * 60 * 60 * 24)
    const arrivalUrl = `${baseUrl}/arrival/${offer.id}`

    if (daysSince >= 7) {
      // Flag for admin review
      const { error: flagError } = await supabase.from('offers').update({
        admin_flag: true,
        admin_flag_reason: 'Arrival not confirmed after 7 days'
      }).eq('id', offer.id)
      if (!flagError) flagged++
      continue
    }

    if (daysSince >= 5 && !offer.reminder_sent_at) {
      // Fetch homeowner mobile
      const hwProfileId = (offer.homeowner as any)?.profile_id
      const kbProfileId = (offer.kasambahay as any)?.profile_id

      const [hwRes, kbRes] = await Promise.all([
        hwProfileId ? supabase.from('profiles').select('mobile').eq('id', hwProfileId).single() : Promise.resolve({ data: null }),
        kbProfileId ? supabase.from('profiles').select('mobile').eq('id', kbProfileId).single() : Promise.resolve({ data: null }),
      ])

      const hwMobile = hwRes.data?.mobile
      const kbMobile = kbRes.data?.mobile
      const smsSent: Promise<void>[] = []

      if (hwMobile) {
        smsSent.push(sendSMS(toIntl(hwMobile),
          `Hi! Just checking in — has your kasambahay arrived? Please confirm arrival at ${arrivalUrl} - MaidIt`
        ).catch(() => {}))
      }

      if (kbMobile) {
        smsSent.push(sendSMS(toIntl(kbMobile),
          `Kumusta! Nakarating ka na ba sa iyong employer? Kumpirmahin ang iyong pagdating dito: ${arrivalUrl} - MaidIt`
        ).catch(() => {}))
      }

      await Promise.all(smsSent)

      // Mark reminder sent so we don't re-send
      await supabase.from('offers').update({ reminder_sent_at: now.toISOString() }).eq('id', offer.id)
      if (hwMobile || kbMobile) reminders_sent++
    }
  }

  const processed = (paidOffers || []).length
  console.log(`[arrival-reminders] processed=${processed} reminders_sent=${reminders_sent} flagged=${flagged}`)
  return NextResponse.json({ processed, reminders_sent, flagged })
}
