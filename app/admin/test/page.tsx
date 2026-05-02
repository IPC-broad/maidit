'use client'
import { useEffect, useState } from 'react'

const STATUSES = ['pending', 'reviewed', 'agreed', 'payment_pending', 'paid', 'active', 'hired', 'declined', 'countered', 'fare_pending']
const PAY_STATUSES = ['agreed', 'payment_pending', 'paid']

const statusColors: Record<string, string> = {
  pending: '#c9943a',
  reviewed: '#2563eb',
  agreed: '#1a6b3c',
  payment_pending: '#92400e',
  paid: '#1a6b3c',
  active: '#1a6b3c',
  hired: '#1a6b3c',
  declined: '#dc2626',
  countered: '#c9943a',
  fare_pending: '#92400e',
}

export default function AdminTestPanel() {
  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  const load = async () => {
    setLoading(true)
    const { supabase } = await import('../../../lib/supabase')
    const { data } = await supabase
      .from('offers')
      .select('*, kasambahay:kasambahay_id(*, profiles(full_name)), homeowner:homeowner_id(*, profiles(full_name))')
      .order('created_at', { ascending: false })
      .limit(20)
    setOffers(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (offerId: string, status: string) => {
    setUpdating(offerId + status)
    const { supabase } = await import('../../../lib/supabase')
    await supabase.from('offers').update({ status }).eq('id', offerId)
    setMsg('Updated to ' + status)
    setTimeout(() => setMsg(''), 2000)
    await load()
    setUpdating(null)
  }

  const giveCredits = async () => {
    const { supabase } = await import('../../../lib/supabase')
    await supabase.from('profiles').update({ is_paid: true, job_offer_credits: 10 }).eq('id', 'bdf1ed22-ebe7-43e4-a718-d396e09878fc')
    setMsg('Credits reset to 10!')
    setTimeout(() => setMsg(''), 2000)
  }

  const s: any = {
    wrap: { minHeight: '100vh', background: '#faf8f5', fontFamily: 'sans-serif', padding: '20px 16px' },
    card: { background: '#fff', borderRadius: '12px', border: '1px solid #ede8e0', padding: '14px', marginBottom: '12px' },
    badge: (status: string) => ({ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '50px', background: statusColors[status] + '20', color: statusColors[status], border: '1px solid ' + statusColors[status] + '40' }),
    btn: (active: boolean, color: string) => ({ padding: '5px 10px', borderRadius: '6px', border: '1.5px solid ' + color + '40', background: active ? color : '#fff', color: active ? '#fff' : color, fontFamily: 'sans-serif', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }),
  }

  return (
    <div style={s.wrap}>
      <div style={{ fontFamily: 'serif', fontSize: '22px', fontWeight: 900, marginBottom: '4px' }}>Admin Test Panel</div>
      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px' }}>For testing only — not for production use</div>

      {msg && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '9px', padding: '10px 14px', fontSize: '13px', color: '#1a6b3c', fontWeight: 600, marginBottom: '12px' }}>{msg}</div>}

      <div style={s.card}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '10px' }}>Quick Actions</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={giveCredits} style={{ padding: '8px 14px', borderRadius: '8px', background: '#1a6b3c', color: '#fff', border: 'none', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
            Reset Test Homeowner Credits (10)
          </button>
          <button onClick={load} style={{ padding: '8px 14px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
            Refresh
          </button>
        </div>
      </div>

      <div style={{ fontFamily: 'serif', fontSize: '16px', fontWeight: 900, marginBottom: '10px' }}>Recent Offers ({offers.length})</div>

      {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading...</div>}

      {offers.map(offer => {
        const kbName = offer.kasambahay?.profiles?.full_name || 'Unknown'
        const hwName = offer.homeowner?.profiles?.full_name || 'Unknown'
        return (
          <div key={offer.id} style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{kbName}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>by {hwName} · ₱{offer.salary?.toLocaleString()}/mo · {offer.city}</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{offer.id}</div>
              </div>
              <span style={s.badge(offer.status)}>{offer.status}</span>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>Change status:</div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {STATUSES.map(st => (
                <button
                  key={st}
                  onClick={() => updateStatus(offer.id, st)}
                  disabled={updating === offer.id + st || offer.status === st}
                  style={s.btn(offer.status === st, statusColors[st] || '#6b7280')}
                >
                  {updating === offer.id + st ? '...' : st}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
