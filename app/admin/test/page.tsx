'use client'
import { useEffect, useState } from 'react'

const STATUSES = ['pending', 'reviewed', 'agreed', 'payment_pending', 'paid', 'active', 'hired', 'declined', 'countered', 'counter_declined', 'fare_pending', 'fare_countered']

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
  counter_declined: '#dc2626',
  fare_pending: '#92400e',
  fare_countered: '#92400e',
}

const workerStatusColors: Record<string, string> = {
  pending_confirmation: '#c9943a',
  pending: '#c9943a',
  draft: '#6b7280',
  available: '#2563eb',
  hired: '#1a6b3c',
}

export default function AdminTestPanel() {
  const [offers, setOffers] = useState<any[]>([])
  const [referredWorkers, setReferredWorkers] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  const load = async () => {
    setLoading(true)
    const { supabase } = await import('../../../lib/supabase')
    const [{ data: offersData }, { data: workersData }, { data: partnersData }] = await Promise.all([
      supabase
        .from('offers')
        .select('*, kasambahay:kasambahay_id(*, profiles(full_name)), homeowner:homeowner_id(*, profiles(full_name))')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('kasambahay')
        .select('*, profiles(*), partner:referred_by(*, profiles(*))')
        .not('referred_by', 'is', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('partners')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false }),
    ])
    setOffers(offersData || [])
    setReferredWorkers(workersData || [])
    setPartners(partnersData || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (offerId: string, status: string) => {
    setUpdating(offerId + status)
    const { supabase } = await import('../../../lib/supabase')
    await supabase.from('offers').update({ status }).eq('id', offerId)
    setMsg('Updated offer to ' + status)
    setTimeout(() => setMsg(''), 2000)
    await load()
    setUpdating(null)
  }

  const updateWorkerStatus = async (workerId: string, status: string) => {
    setUpdating(workerId + status)
    const { supabase } = await import('../../../lib/supabase')
    const extra = status === 'available' ? { confirmed_at: new Date().toISOString() } : {}
    await supabase.from('kasambahay').update({ status, ...extra }).eq('id', workerId)
    setMsg('Worker updated to ' + status)
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
    badge: (color: string) => ({ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '50px', background: color + '20', color, border: '1px solid ' + color + '40' }),
    btn: (active: boolean, color: string) => ({ padding: '5px 10px', borderRadius: '6px', border: '1.5px solid ' + color + '40', background: active ? color : '#fff', color: active ? '#fff' : color, fontFamily: 'sans-serif', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }),
    secTitle: { fontFamily: 'serif', fontSize: '16px', fontWeight: 900, marginBottom: '10px', marginTop: '4px' },
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

      {/* ── OFFERS ── */}
      <div style={s.secTitle}>Recent Offers ({offers.length})</div>

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
              <span style={s.badge(statusColors[offer.status] || '#6b7280')}>{offer.status}</span>
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

      {/* ── REFERRED KASAMBAHAY ── */}
      <div style={{ ...s.secTitle, marginTop: '24px' }}>👥 Referred Kasambahay ({referredWorkers.length})</div>

      {!loading && referredWorkers.length === 0 && (
        <div style={{ ...s.card, color: '#9ca3af', fontSize: '13px', textAlign: 'center' }}>Walang referred kasambahay pa.</div>
      )}

      {referredWorkers.map(w => {
        const wName = w.profiles?.full_name || 'Unknown'
        const wMobile = w.profiles?.mobile || '—'
        const partnerName = w.partner?.profiles?.full_name || '—'
        const wColor = workerStatusColors[w.status] || '#6b7280'
        const confirmed = w.status !== 'pending_confirmation' && w.status !== 'pending' && w.status !== 'draft'
        return (
          <div key={w.id} style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{wName}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>{wMobile} · {w.province}</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '3px' }}>
                  Referred by: <strong>{partnerName}</strong>
                </div>
                <div style={{ fontSize: '11px', marginTop: '3px' }}>
                  Confirmed: <span style={{ fontWeight: 700, color: confirmed ? '#1a6b3c' : '#dc2626' }}>{confirmed ? 'Yes' : 'No'}</span>
                </div>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{w.id}</div>
              </div>
              <span style={s.badge(wColor)}>{w.status}</span>
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {[
                { label: 'Set Available', status: 'available', color: '#2563eb' },
                { label: 'Set Hired', status: 'hired', color: '#1a6b3c' },
                { label: 'Set Pending', status: 'pending_confirmation', color: '#c9943a' },
              ].map(({ label, status, color }) => (
                <button
                  key={status}
                  onClick={() => updateWorkerStatus(w.id, status)}
                  disabled={updating === w.id + status || w.status === status}
                  style={s.btn(w.status === status, color)}
                >
                  {updating === w.id + status ? '...' : label}
                </button>
              ))}
            </div>
          </div>
        )
      })}

      {/* ── PARTNERS ── */}
      <div style={{ ...s.secTitle, marginTop: '24px' }}>🤝 Partners ({partners.length})</div>

      {!loading && partners.length === 0 && (
        <div style={{ ...s.card, color: '#9ca3af', fontSize: '13px', textAlign: 'center' }}>Walang partners pa.</div>
      )}

      {partners.map(p => {
        const pName = p.profiles?.full_name || 'Unknown'
        const pMobile = p.profiles?.mobile || '—'
        const totalReferred = referredWorkers.filter(w => w.referred_by === p.id).length
        const totalHired = referredWorkers.filter(w => w.referred_by === p.id && w.status === 'hired').length
        const isGold = p.tier === 'gold'
        return (
          <div key={p.id} style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{pName}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>{pMobile}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                  Code: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#c9943a' }}>{p.referral_code || '—'}</span>
                </div>
              </div>
              <span style={s.badge(isGold ? '#c9943a' : '#6b7280')}>{isGold ? '⭐ VIP' : 'Standard'}</span>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#374151' }}>
              <div><span style={{ color: '#9ca3af' }}>Referred:</span> <strong>{totalReferred}</strong></div>
              <div><span style={{ color: '#9ca3af' }}>Hired:</span> <strong style={{ color: '#1a6b3c' }}>{totalHired}</strong></div>
              <div><span style={{ color: '#9ca3af' }}>Barangay:</span> <strong>{p.barangay || '—'}</strong></div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
