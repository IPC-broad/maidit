'use client'
import { useEffect, useState } from 'react'

const STATUSES = ['pending', 'reviewed', 'agreed', 'payment_pending', 'paid', 'active', 'hired', 'declined', 'cancelled', 'countered', 'counter_declined', 'fare_pending', 'fare_countered']

const statusColors: Record<string, string> = {
  pending: '#c9943a',
  reviewed: '#2563eb',
  agreed: '#1a6b3c',
  payment_pending: '#92400e',
  paid: '#1a6b3c',
  active: '#1a6b3c',
  hired: '#1a6b3c',
  declined: '#dc2626',
  cancelled: '#dc2626',
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
  const [agreedOffers, setAgreedOffers] = useState<any[]>([])
  const [referredWorkers, setReferredWorkers] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [balanceInputs, setBalanceInputs] = useState<Record<string, string>>({})

  type TestResult = { pass: boolean; ms: number; detail?: string } | null
  const [paymentTests, setPaymentTests] = useState<Record<string, TestResult>>({})
  const [runningTest, setRunningTest] = useState<string | null>(null)

  const [selectedSimOffer, setSelectedSimOffer] = useState('')
  const [simulating, setSimulating] = useState(false)
  const [simResult, setSimResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const [reminderRunning, setReminderRunning] = useState(false)
  const [reminderResult, setReminderResult] = useState<{ processed: number; reminders_sent: number; flagged: number } | null>(null)

  const [profiles, setProfiles] = useState<any[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingAll, setDeletingAll] = useState(false)

  const [homeowners, setHomeowners] = useState<any[]>([])
  const [subUpdating, setSubUpdating] = useState<string | null>(null)

  const PROTECTED_EMAILS = ['test@maidit.com', 'test.kasambahay@maidit.app', 'partner@maidit.com']

  const loadProfiles = async () => {
    const res = await fetch('/api/admin/list-profiles')
    const data = await res.json()
    setProfiles(data.profiles || [])
  }

  const loadHomeowners = async () => {
    const res = await fetch('/api/admin/list-homeowners')
    const data = await res.json()
    setHomeowners(data.homeowners || [])
  }

  const setSubscription = async (homeownerId: string, subscribed: boolean) => {
    setSubUpdating(homeownerId + (subscribed ? 'sub' : 'unsub'))
    const res = await fetch('/api/admin/set-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homeowner_id: homeownerId, subscribed }),
    })
    const data = await res.json()
    if (data.success) {
      setMsg(subscribed ? '✅ Subscription activated (30 days)' : '✅ Subscription expired')
    } else {
      setMsg(`❌ ${data.error || 'Failed'}`)
    }
    setTimeout(() => setMsg(''), 3000)
    await loadHomeowners()
    setSubUpdating(null)
  }

  const toggleCreditUsed = async (homeownerId: string, currentValue: boolean) => {
    setSubUpdating(homeownerId + 'credit')
    const res = await fetch('/api/admin/set-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homeowner_id: homeownerId, subscribed: true, credit_used: !currentValue }),
    })
    const data = await res.json()
    if (data.success) {
      setMsg(`✅ Credit ${!currentValue ? 'marked used' : 'restored'}`)
    } else {
      setMsg(`❌ ${data.error || 'Failed'}`)
    }
    setTimeout(() => setMsg(''), 3000)
    await loadHomeowners()
    setSubUpdating(null)
  }

  const deleteAccount = async (profileId: string) => {
    const confirmed = window.confirm('Sigurado ka bang i-delete ang account na ito?')
    if (!confirmed) return
    setDeletingId(profileId)
    await fetch('/api/admin/delete-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: profileId }),
    })
    setProfiles(prev => prev.filter(p => p.id !== profileId))
    setDeletingId(null)
  }

  const deleteAllTestAccounts = async () => {
    const toDelete = profiles.filter(p => !PROTECTED_EMAILS.includes(p.email || ''))
    if (toDelete.length === 0) { setMsg('No test accounts to delete.'); return }
    const confirmed = window.confirm(`Delete ${toDelete.length} test account(s)? Protected accounts (test@maidit.com etc.) will be kept.`)
    if (!confirmed) return
    setDeletingAll(true)
    for (const p of toDelete) {
      await fetch('/api/admin/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: p.id }),
      })
    }
    setMsg(`Deleted ${toDelete.length} test account(s).`)
    setTimeout(() => setMsg(''), 3000)
    await loadProfiles()
    setDeletingAll(false)
  }

  const PAYMENT_TESTS = [
    {
      id: 'A', expect: '₱2,001',
      label: 'Subscribed, credit not yet used, no transport',
      run: async () => {
        const r = await fetch('/api/create-payment-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 200100, description: 'Test A - ₱2,001' }) })
        const d = await r.json()
        return { pass: !!d.checkout_url, detail: d.checkout_url || d.error }
      },
    },
    {
      id: 'B', expect: '₱2,500',
      label: 'Subscribed, credit already used, no transport',
      run: async () => {
        const r = await fetch('/api/create-payment-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 250000, description: 'Test B - ₱2,500' }) })
        const d = await r.json()
        return { pass: !!d.checkout_url, detail: d.checkout_url || d.error }
      },
    },
    {
      id: 'C', expect: '₱8,001',
      label: 'Subscribed, credit not yet used, with MaidIt transport',
      run: async () => {
        const r = await fetch('/api/create-payment-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 800100, description: 'Test C - ₱8,001' }) })
        const d = await r.json()
        return { pass: !!d.checkout_url, detail: d.checkout_url || d.error }
      },
    },
    {
      id: 'D', expect: '₱8,500',
      label: 'Subscribed, credit already used, with MaidIt transport',
      run: async () => {
        const r = await fetch('/api/create-payment-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 850000, description: 'Test D - ₱8,500' }) })
        const d = await r.json()
        return { pass: !!d.checkout_url, detail: d.checkout_url || d.error }
      },
    },
    {
      id: 'E', expect: '₱499',
      label: 'Subscription payment',
      run: async () => {
        const r = await fetch('/api/create-payment-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 49900, description: 'Test E - ₱499 subscription' }) })
        const d = await r.json()
        return { pass: !!d.checkout_url, detail: d.checkout_url || d.error }
      },
    },
    {
      id: 'F', expect: 'status 401',
      label: 'Webhook rejects invalid signature',
      run: async () => {
        try {
          const r = await fetch('/api/webhook/paymongo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'paymongo-signature': 'fake_invalid_signature_for_testing' },
            body: JSON.stringify({ fake: true }),
          })
          console.log('[Test F] response status:', r.status)
          return { pass: r.status === 401, detail: r.status === 401 ? '✅ Pass (webhook correctly rejected bad signature)' : `❌ Fail (accepted bad signature) — received HTTP ${r.status}` }
        } catch (err: any) {
          console.log('[Test F] fetch error:', err)
          const msg = String(err?.message || err)
          const pass = msg.includes('401')
          return { pass, detail: pass ? '✅ Pass (webhook correctly rejected bad signature)' : `❌ Fail — fetch threw: ${msg}` }
        }
      },
    },
  ]

  const runPaymentTest = async (testId: string) => {
    const test = PAYMENT_TESTS.find(t => t.id === testId)
    if (!test) return
    setRunningTest(testId)
    const start = Date.now()
    try {
      const result = await test.run()
      setPaymentTests(prev => ({ ...prev, [testId]: { ...result, ms: Date.now() - start } }))
    } catch (e: any) {
      setPaymentTests(prev => ({ ...prev, [testId]: { pass: false, ms: Date.now() - start, detail: String(e?.message) } }))
    }
    setRunningTest(null)
  }

  const runAllPaymentTests = async () => {
    for (const test of PAYMENT_TESTS) {
      setRunningTest(test.id)
      const start = Date.now()
      try {
        const result = await test.run()
        setPaymentTests(prev => ({ ...prev, [test.id]: { ...result, ms: Date.now() - start } }))
      } catch (e: any) {
        setPaymentTests(prev => ({ ...prev, [test.id]: { pass: false, ms: Date.now() - start, detail: String(e?.message) } }))
      }
      setRunningTest(null)
    }
  }

  const load = async () => {
    setLoading(true)
    const { supabase } = await import('../../../lib/supabase')
    const [offersRes, workersRes, partnersRes, agreedRes] = await Promise.all([
      supabase
        .from('offers')
        .select('*, kasambahay:kasambahay_id(*, profiles(full_name)), homeowner:homeowner_id(*, profiles(full_name))')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('kasambahay')
        .select('id, profile_id, province, status, asking_salary, profile:profiles!profile_id(full_name, mobile)')
        .order('id', { ascending: false }),
      supabase
        .from('partners')
        .select('*, profiles(*)'),
      fetch('/api/test-webhook-trigger').then(r => r.json()).catch(e => { console.error('[load] agreed offers fetch error:', e); return { offers: [] } }),
    ])
    if (offersRes.error) console.error('[load] offers query error:', offersRes.error)
    if (workersRes.error) console.error('[load] workers query error:', workersRes.error)
    if (partnersRes.error) console.error('[load] partners query error:', partnersRes.error)
    setOffers(offersRes.data || [])
    setReferredWorkers(workersRes.data || [])
    setPartners(partnersRes.data || [])
    setAgreedOffers(agreedRes.offers || [])
    setLoading(false)
  }

  useEffect(() => { load(); loadProfiles(); loadHomeowners() }, [])

  const loadAgreedOffers = async () => {
    const res = await fetch('/api/test-webhook-trigger')
      .then(r => r.json())
      .catch(e => { console.error('[loadAgreedOffers] error:', e); return { offers: [] } })
    setAgreedOffers(res.offers || [])
  }

  const updateStatus = async (offerId: string, status: string) => {
    setUpdating(offerId + status)
    const res = await fetch('/api/test-webhook-trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_status', offer_id: offerId, status }),
    })
    const data = await res.json()
    if (!data.success) {
      console.error('[updateStatus] failed:', data)
      setMsg(`❌ Status update failed: ${data.error || 'unknown'}`)
    } else {
      setMsg('Updated offer to ' + status)
      // Update local offers state immediately so the list reflects the change
      setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status } : o))
      // Refresh agreed offers dropdown without a full reload
      await loadAgreedOffers()
    }
    setTimeout(() => setMsg(''), 3000)
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

  const clearFlag = async (partnerId: string) => {
    setUpdating(partnerId + 'flag')
    const { supabase } = await import('../../../lib/supabase')
    await supabase.from('partners').update({ flagged: false, flag_reason: null }).eq('id', partnerId)
    setMsg('Flag cleared.')
    setTimeout(() => setMsg(''), 2000)
    await load()
    setUpdating(null)
  }

  const adjustBalance = async (partnerId: string) => {
    const raw = balanceInputs[partnerId]
    const amount = parseInt(raw)
    if (isNaN(amount)) { setMsg('Enter a valid integer (e.g. 500 or -500)'); return }
    setUpdating(partnerId + 'balance')
    const { supabase } = await import('../../../lib/supabase')
    await supabase.from('partners').update({ balance: amount }).eq('id', partnerId)
    setMsg(`Balance set to ₱${amount}.`)
    setTimeout(() => setMsg(''), 2000)
    await load()
    setUpdating(null)
  }

  const simulatePayment = async () => {
    if (!selectedSimOffer) return
    setSimulating(true)
    setSimResult(null)
    try {
      const res = await fetch('/api/test-webhook-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer_id: selectedSimOffer }),
      })
      const data = await res.json()
      if (data.success) {
        setSimResult({ ok: true, msg: `✅ Payment simulated — offer is now paid` })
        setSelectedSimOffer('')
        // Remove the paid offer from the agreed dropdown immediately
        setAgreedOffers(prev => prev.filter(o => o.id !== selectedSimOffer))
        // Refresh the full offers list in the background
        load()
      } else {
        setSimResult({ ok: false, msg: `❌ ${data.error || 'Unknown error'}` })
      }
    } catch (e: any) {
      setSimResult({ ok: false, msg: `❌ ${e?.message || 'Fetch failed'}` })
    }
    setSimulating(false)
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

      {/* ── KASAMBAHAY ── */}
      <div style={{ ...s.secTitle, marginTop: '24px' }}>👥 Kasambahay ({referredWorkers.length})</div>

      {!loading && referredWorkers.length === 0 && (
        <div style={{ ...s.card, color: '#9ca3af', fontSize: '13px', textAlign: 'center' }}>No kasambahay yet.</div>
      )}

      {referredWorkers.map(w => {
        const wName = (w.profile as any)?.full_name || 'Unknown'
        const wMobile = (w.profile as any)?.mobile || '—'
        const wColor = workerStatusColors[w.status] || '#6b7280'
        const confirmed = w.status !== 'pending_confirmation' && w.status !== 'pending' && w.status !== 'draft'
        return (
          <div key={w.id} style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{wName}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>{wMobile} · {w.province}</div>
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

      {/* ── PAYMENT FLOW TESTS ── */}
      <div style={{ ...s.secTitle, marginTop: '32px' }}>💳 Payment Flow Tests</div>
      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>Results persist until page refresh.</div>
          <button
            onClick={runAllPaymentTests}
            disabled={runningTest !== null}
            style={{ padding: '7px 14px', borderRadius: '8px', background: runningTest ? '#e5e7eb' : '#1a6b3c', color: runningTest ? '#9ca3af' : '#fff', border: 'none', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 700, cursor: runningTest ? 'default' : 'pointer' }}
          >
            {runningTest ? `Running ${runningTest}…` : 'Run All Tests'}
          </button>
        </div>
        {PAYMENT_TESTS.map(test => {
          const result = paymentTests[test.id]
          const isRunning = runningTest === test.id
          return (
            <div key={test.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 0', borderBottom: test.id !== 'F' ? '1px solid #f3f4f6' : 'none' }}>
              <div style={{ minWidth: '20px', fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: '#6b7280', paddingTop: '2px' }}>{test.id}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>{test.label}</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: result ? '6px' : 0 }}>expect: {test.expect}</div>
                {result && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: result.pass ? '#1a6b3c' : '#dc2626' }}>
                      {result.pass ? '✅ Pass' : '❌ Fail'}
                    </span>
                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>{result.ms}ms</span>
                    {result.detail && result.detail.startsWith('http') ? (
                      <a href={result.detail} target="_blank" rel="noreferrer" style={{ fontSize: '10px', color: '#2563eb', wordBreak: 'break-all' as const, maxWidth: '240px', display: 'block' }}>{result.detail}</a>
                    ) : result.detail ? (
                      <span style={{ fontSize: '10px', color: '#6b7280' }}>{result.detail}</span>
                    ) : null}
                  </div>
                )}
              </div>
              <button
                onClick={() => runPaymentTest(test.id)}
                disabled={runningTest !== null}
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: 700, cursor: runningTest ? 'default' : 'pointer', flexShrink: 0 }}
              >
                {isRunning ? '…' : 'Run'}
              </button>
            </div>
          )
        })}
      </div>

      {/* ── SIMULATE PAYMENT ── */}
      <div style={{ ...s.secTitle, marginTop: '32px' }}>🧪 Simulate Payment</div>
      <div style={s.card}>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
          Instantly marks an <strong style={{ color: '#c9943a' }}>agreed</strong> offer as paid — no real PayMongo transaction.
        </div>
        {(() => {
          if (agreedOffers.length === 0) {
            return <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '12px 0' }}>No offers in <strong>agreed</strong> status right now.</div>
          }
          const selected = agreedOffers.find(o => o.id === selectedSimOffer)
          return (
            <>
              <select
                value={selectedSimOffer}
                onChange={e => { setSelectedSimOffer(e.target.value); setSimResult(null) }}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e0d8', borderRadius: '10px', fontFamily: 'sans-serif', fontSize: '13px', color: '#1a1a1a', background: '#fff', outline: 'none', marginBottom: '10px' }}
              >
                <option value=''>Select offer to simulate…</option>
                {agreedOffers.map(o => {
                  const kbName = o.kasambahay?.profile?.full_name || 'Unknown'
                  const amt = o.amount ? `₱${(o.amount / 100).toLocaleString()}` : `₱${o.salary?.toLocaleString()}/mo`
                  const transport = o.transport_service ? ' · 🚌 transport' : ''
                  return <option key={o.id} value={o.id}>{kbName} · {amt}{transport}</option>
                })}
              </select>
              {selected && (
                <div style={{ background: '#faf8f5', border: '1px solid #ede8e0', borderRadius: '9px', padding: '10px 12px', marginBottom: '10px', fontSize: '12px', color: '#374151', lineHeight: 1.7 }}>
                  <div><strong>Kasambahay:</strong> {selected.kasambahay?.profile?.full_name || '—'}</div>
                  <div><strong>Amount:</strong> {selected.amount ? `₱${(selected.amount / 100).toLocaleString()}` : '—'}</div>
                  <div><strong>Transport:</strong> {selected.transport_service ? 'Yes' : 'No'}</div>
                  <div><strong>Offer ID:</strong> <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>{selected.id}</span></div>
                </div>
              )}
              <button
                onClick={simulatePayment}
                disabled={!selectedSimOffer || simulating}
                style={{ width: '100%', padding: '11px', borderRadius: '10px', background: (!selectedSimOffer || simulating) ? '#e5e7eb' : '#1a6b3c', color: (!selectedSimOffer || simulating) ? '#9ca3af' : '#fff', border: 'none', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 700, cursor: (!selectedSimOffer || simulating) ? 'default' : 'pointer' }}
              >
                {simulating ? 'Simulating…' : selected ? `Simulate Payment ${selected.amount ? `₱${(selected.amount / 100).toLocaleString()}` : ''}` : 'Simulate Payment'}
              </button>
            </>
          )
        })()}
        {simResult && (
          <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '9px', fontSize: '13px', fontWeight: 600, background: simResult.ok ? '#f0fdf4' : '#fef2f2', color: simResult.ok ? '#1a6b3c' : '#dc2626', border: `1px solid ${simResult.ok ? '#bbf7d0' : '#fecaca'}` }}>
            {simResult.msg}
          </div>
        )}
      </div>

      {/* ── ARRIVAL REMINDERS ── */}
      <div style={{ ...s.secTitle, marginTop: '32px' }}>⏰ Arrival Reminders</div>
      <div style={s.card}>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
          Sends Day 5 reminder SMS to homeowner + kasambahay for paid offers with no arrival confirmed. Flags offers at Day 7.
        </div>
        <button
          onClick={async () => {
            setReminderRunning(true)
            setReminderResult(null)
            try {
              const res = await fetch('/api/arrival-reminders')
              const data = await res.json()
              setReminderResult(data)
            } catch (e: any) {
              setReminderResult({ processed: 0, reminders_sent: 0, flagged: 0 })
            }
            setReminderRunning(false)
          }}
          disabled={reminderRunning}
          style={{ width: '100%', padding: '11px', borderRadius: '10px', background: reminderRunning ? '#e5e7eb' : '#92400e', color: reminderRunning ? '#9ca3af' : '#fff', border: 'none', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 700, cursor: reminderRunning ? 'default' : 'pointer' }}
        >
          {reminderRunning ? 'Running…' : 'Test Arrival Reminders'}
        </button>
        {reminderResult && (
          <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '9px', background: '#faf8f5', border: '1px solid #ede8e0', fontSize: '13px', color: '#374151', lineHeight: 1.8 }}>
            <div><strong>Processed:</strong> {reminderResult.processed} paid offers with no arrival</div>
            <div><strong>Reminders sent:</strong> {reminderResult.reminders_sent}</div>
            <div><strong>Flagged for admin:</strong> {reminderResult.flagged}</div>
          </div>
        )}
      </div>

      {/* ── MANAGE ACCOUNTS ── */}
      <div style={{ ...s.secTitle, marginTop: '32px' }}>🗑️ Manage Accounts ({profiles.length})</div>
      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' as const, gap: '8px' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Protected: test@maidit.com, test.kasambahay@maidit.app, partner@maidit.com</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={loadProfiles}
              style={{ padding: '6px 12px', borderRadius: '7px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              Refresh
            </button>
            <button
              onClick={deleteAllTestAccounts}
              disabled={deletingAll}
              style={{ padding: '6px 12px', borderRadius: '7px', background: deletingAll ? '#e5e7eb' : '#fef2f2', color: deletingAll ? '#9ca3af' : '#dc2626', border: '1px solid #fecaca', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: 700, cursor: deletingAll ? 'default' : 'pointer' }}
            >
              {deletingAll ? 'Deleting…' : 'Delete All Test Accounts'}
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' as const }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#faf8f5' }}>
                {['Mobile', 'Full Name', 'Role', ''].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left' as const, fontWeight: 700, color: '#9ca3af', fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '.5px', borderBottom: '1px solid #ede8e0', whiteSpace: 'nowrap' as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map((p, i) => {
                const isProtected = PROTECTED_EMAILS.includes(p.email || '')
                return (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff' : '#faf8f5' }}>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6', fontFamily: 'monospace', color: '#374151' }}>{p.mobile || '—'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6', fontWeight: 600, color: '#111827' }}>{p.full_name || '—'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '50px', background: p.role === 'kasambahay' ? '#fef3e2' : p.role === 'homeowner' ? '#eff6ff' : '#f0fdf4', color: p.role === 'kasambahay' ? '#92400e' : p.role === 'homeowner' ? '#1d4ed8' : '#166534' }}>
                        {p.role || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>
                      {isProtected ? (
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '50px', background: '#f3f4f6', color: '#9ca3af', border: '1px solid #e5e7eb' }}>Protected</span>
                      ) : (
                        <button
                          onClick={() => deleteAccount(p.id)}
                          disabled={deletingId === p.id}
                          style={{ padding: '4px 10px', borderRadius: '6px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: 700, cursor: deletingId === p.id ? 'default' : 'pointer', opacity: deletingId === p.id ? .5 : 1 }}
                        >
                          {deletingId === p.id ? '…' : '✕ Delete'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {profiles.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center' as const, color: '#9ca3af' }}>No profiles found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── HOMEOWNER SUBSCRIPTIONS ── */}
      <div style={{ ...s.secTitle, marginTop: '32px' }}>💳 Homeowner Subscriptions ({homeowners.length})</div>

      {homeowners.length === 0 && !loading && (
        <div style={{ ...s.card, color: '#9ca3af', fontSize: '13px', textAlign: 'center' }}>No homeowners found.</div>
      )}

      {homeowners.map(hw => {
        const name = (hw.profile as any)?.full_name || 'Unknown'
        const mobile = (hw.profile as any)?.mobile || '—'
        const expires = hw.subscription_expires_at ? new Date(hw.subscription_expires_at) : null
        const isSubscribed = expires && expires > new Date()
        const creditUsed = hw.subscription_credit_used === true
        const expiresLabel = expires
          ? expires.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
          : '—'
        const isBusy = (k: string) => subUpdating === hw.id + k
        return (
          <div key={hw.id} style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{name}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>{mobile}</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px', fontFamily: 'monospace' }}>{hw.id}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                {isSubscribed ? (
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '50px', background: '#f0fdf4', color: '#1a6b3c', border: '1px solid #bbf7d0' }}>
                    Subscribed · exp {expiresLabel}
                  </span>
                ) : (
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '50px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                    Unsubscribed
                  </span>
                )}
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '50px', background: creditUsed ? '#fef3e2' : '#f3f4f6', color: creditUsed ? '#92400e' : '#9ca3af', border: `1px solid ${creditUsed ? '#fde68a' : '#e5e7eb'}` }}>
                  Credit: {creditUsed ? 'Used' : 'Available'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
              <button
                onClick={() => setSubscription(hw.id, true)}
                disabled={!!subUpdating}
                style={{ padding: '5px 11px', borderRadius: '6px', border: '1.5px solid #1a6b3c40', background: isSubscribed ? '#1a6b3c' : '#f0fdf4', color: isSubscribed ? '#fff' : '#1a6b3c', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: 700, cursor: subUpdating ? 'default' : 'pointer', opacity: subUpdating ? .6 : 1 }}
              >
                {isBusy('sub') ? '…' : 'Set Subscribed'}
              </button>
              <button
                onClick={() => setSubscription(hw.id, false)}
                disabled={!!subUpdating}
                style={{ padding: '5px 11px', borderRadius: '6px', border: '1.5px solid #dc262640', background: !isSubscribed ? '#dc2626' : '#fef2f2', color: !isSubscribed ? '#fff' : '#dc2626', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: 700, cursor: subUpdating ? 'default' : 'pointer', opacity: subUpdating ? .6 : 1 }}
              >
                {isBusy('unsub') ? '…' : 'Set Unsubscribed'}
              </button>
              <button
                onClick={() => toggleCreditUsed(hw.id, creditUsed)}
                disabled={!!subUpdating}
                style={{ padding: '5px 11px', borderRadius: '6px', border: '1.5px solid #c9943a40', background: '#fef3e2', color: '#92400e', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: 700, cursor: subUpdating ? 'default' : 'pointer', opacity: subUpdating ? .6 : 1 }}
              >
                {isBusy('credit') ? '…' : creditUsed ? 'Restore Credit' : 'Mark Credit Used'}
              </button>
            </div>
          </div>
        )
      })}

      {/* ── PARTNERS ── */}
      <div style={{ ...s.secTitle, marginTop: '24px' }}>🤝 Partners ({partners.length})</div>

      {!loading && partners.length === 0 && (
        <div style={{ ...s.card, color: '#9ca3af', fontSize: '13px', textAlign: 'center' }}>No partners yet.</div>
      )}

      {partners.map(p => {
        const pName = p.profiles?.full_name || 'Unknown'
        const pMobile = p.profiles?.mobile || '—'
        const totalReferred = referredWorkers.filter(w => w.referred_by === p.id).length
        const totalHired = referredWorkers.filter(w => w.referred_by === p.id && w.status === 'hired').length
        const isGold = p.tier === 'gold'
        const balance = p.balance ?? 0
        const isFlagged = p.flagged === true
        return (
          <div key={p.id} style={{ ...s.card, border: isFlagged ? '1.5px solid #fecaca' : '1px solid #ede8e0', background: isFlagged ? '#fffafa' : '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '1px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>{pName}</span>
                  {isFlagged && <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 7px', borderRadius: '50px', background: '#dc2626', color: '#fff' }}>FLAGGED</span>}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>{pMobile}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                  Code: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#c9943a' }}>{p.referral_code || '—'}</span>
                </div>
                {isFlagged && p.flag_reason && (
                  <div style={{ fontSize: '10px', color: '#dc2626', marginTop: '4px', lineHeight: 1.4, maxWidth: '220px' }}>{p.flag_reason}</div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span style={s.badge(isGold ? '#c9943a' : '#6b7280')}>{isGold ? '⭐ VIP' : 'Standard'}</span>
                <span style={s.badge(balance < 0 ? '#dc2626' : '#1a6b3c')}>
                  Balance: {balance < 0 ? `−₱${Math.abs(balance)}` : `₱${balance}`}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#374151', marginBottom: '10px' }}>
              <div><span style={{ color: '#9ca3af' }}>Referred:</span> <strong>{totalReferred}</strong></div>
              <div><span style={{ color: '#9ca3af' }}>Hired:</span> <strong style={{ color: '#1a6b3c' }}>{totalHired}</strong></div>
              <div><span style={{ color: '#9ca3af' }}>Barangay:</span> <strong>{p.barangay || '—'}</strong></div>
            </div>
            {/* Admin controls */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const, alignItems: 'center' }}>
              {isFlagged && (
                <button
                  onClick={() => clearFlag(p.id)}
                  disabled={updating === p.id + 'flag'}
                  style={{ padding: '5px 11px', borderRadius: '6px', border: '1.5px solid #dc262640', background: '#fef2f2', color: '#dc2626', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {updating === p.id + 'flag' ? '...' : '✓ Clear Flag'}
                </button>
              )}
              <input
                type="number"
                placeholder="Set balance"
                value={balanceInputs[p.id] ?? ''}
                onChange={e => setBalanceInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                style={{ padding: '5px 8px', borderRadius: '6px', border: '1.5px solid #e5e0d8', fontFamily: 'sans-serif', fontSize: '11px', width: '100px', outline: 'none' }}
              />
              <button
                onClick={() => adjustBalance(p.id)}
                disabled={updating === p.id + 'balance'}
                style={{ padding: '5px 11px', borderRadius: '6px', border: '1.5px solid #2563eb40', background: '#eff6ff', color: '#2563eb', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
              >
                {updating === p.id + 'balance' ? '...' : 'Set Balance'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
