'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SendOfferPage({ params }: any) {
  const router = useRouter()
  const kasambahayId = params.id
  const [kb, setKb] = useState<any>(null)
  const [form, setForm] = useState({ salary: '', urgency: 'Kailangan na (ASAP)', scope: [] as string[], setup: 'Stay-in', city: 'Quezon City' })
  const [submitting, setSubmitting] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)

  useEffect(() => {
    const init = async () => {
      const { supabase } = await import('../../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: kbData } = await supabase.from('kasambahay').select('*, profiles(full_name, mobile, city)').eq('id', kasambahayId).single()
      setKb(kbData)
      const { data: profile } = await supabase.from('profiles').select('is_paid, job_offer_credits').eq('id', user.id).single()
      if (!profile?.is_paid || (profile.job_offer_credits ?? 0) <= 0) setShowPaywall(true)
      setCredits(profile?.job_offer_credits ?? 0)
    }
    init()
  }, [kasambahayId])

  const handlePay = async () => {
    setPaying(true)
    try {
      const res = await fetch('/api/pay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kasambahayId }) })
      const data = await res.json()
      if (data.checkout_url) { window.location.href = data.checkout_url }
      else { window.location.href = 'https://pm.link/org-9FQv6XBpoCxdDMaMPY8gze3N/3H88IVz'; setPaying(false) }
    } catch { window.location.href = 'https://pm.link/org-9FQv6XBpoCxdDMaMPY8gze3N/3H88IVz'; setPaying(false) }
  }

  const handleSendOffer = async () => {
    if (!form.salary || form.scope.length === 0) { setError('Pakipunan ang salary at scope'); return }
    setSubmitting(true)
    setError('')
    const { supabase } = await import('../../../../lib/supabase')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: hw } = await supabase.from('homeowners').select('id').eq('profile_id', user.id).single()
    const { error: offerError } = await supabase.from('offers').insert({ homeowner_id: hw?.id, kasambahay_id: kb?.profile_id, salary: parseInt(form.salary), urgency: form.urgency, scope: form.scope, setup: form.setup, city: form.city, status: 'pending' })
    if (offerError) { setSubmitting(false); setError(offerError.message); return }
    const { data: profile } = await supabase.from('profiles').select('job_offer_credits').eq('id', user.id).single()
    await supabase.from('profiles').update({ job_offer_credits: (profile?.job_offer_credits ?? 1) - 1 }).eq('id', user.id)
    setSubmitting(false)
    setSuccess(true)
  }

  const scopeItems = ['All-around Maid','Tagaluto','Tagalaba','Yaya','Taga-alaga ng Pets','Taga-alaga ng Matanda','Driver','Pamimili']
  const toggleScope = (sc: string) => setForm(f => ({ ...f, scope: f.scope.includes(sc) ? f.scope.filter((x: string) => x !== sc) : [...f.scope, sc] }))

  const s: any = {
    wrap: { minHeight: '100vh', background: '#faf8f5', fontFamily: 'sans-serif', color: '#1a1a1a' },
    head: { background: '#fff', borderBottom: '1px solid #ede8e0', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' },
    body: { padding: '20px 18px 48px' },
    lbl: { display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#9ca3af', marginBottom: '4px' },
    inp: { width: '100%', padding: '11px 13px', border: '1.5px solid #e5e0d8', borderRadius: '11px', fontSize: '14px', background: '#fff', color: '#1a1a1a', fontFamily: 'sans-serif', outline: 'none', marginBottom: '12px' },
    sel: { width: '100%', padding: '11px 13px', border: '1.5px solid #e5e0d8', borderRadius: '11px', fontSize: '14px', background: '#fff', color: '#1a1a1a', fontFamily: 'sans-serif', outline: 'none', marginBottom: '12px' },
    btn: { width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: '#1a6b3c', color: '#fff', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '10px' },
    btnAmber: { width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: '#c9943a', color: '#fff', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '10px' },
    btnOutline: { width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #ede8e0', background: 'transparent', color: '#6b7280', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },
  }

  if (success) return (
    <div style={{ ...s.wrap, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
      <h1 style={{ fontFamily: 'serif', fontSize: '1.4rem', fontWeight: 900, color: '#1a6b3c', marginBottom: '8px' }}>Offer Sent!</h1>
      <p style={{ color: '#6b7280', fontSize: '13px', lineHeight: 1.7, marginBottom: '8px' }}>Irereview ng kasambahay ang iyong offer.</p>
      {credits !== null && <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '24px' }}>{Math.max(0, credits - 1)} credits natitira</p>}
      <button style={{ ...s.btn, maxWidth: '320px' }} onClick={() => router.push('/dashboard/homeowner')}>Back to Dashboard</button>
    </div>
  )

  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '18px', cursor: 'pointer', padding: 0 }}>←</button>
        <div>
          <div style={{ fontFamily: 'serif', fontSize: '15px', fontWeight: 900 }}>Send Job Offer</div>
          {credits !== null && !showPaywall && <div style={{ fontSize: '11px', color: '#9ca3af' }}>{credits} credits natitira</div>}
        </div>
      </div>
      <div style={s.body}>
        {kb && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '14px', border: '1px solid #ede8e0', marginBottom: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#fef3e2', border: '2px solid #fde8c0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>👩</div>
            <div><div style={{ fontWeight: 700, fontSize: '14px' }}>{kb.profiles?.full_name}</div><div style={{ fontSize: '12px', color: '#9ca3af' }}>{kb.province} · {kb.setup}</div></div>
          </div>
        )}
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '9px', padding: '10px 13px', fontSize: '13px', color: '#dc2626', marginBottom: '12px' }}>{error}</div>}
        <label style={s.lbl}>Monthly Salary (₱) *</label>
        <input style={s.inp} type="number" placeholder="e.g. 9000" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} />
        <label style={s.lbl}>Kailan kailangan?</label>
        <select style={s.sel} value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}>
          <option>Kailangan na (ASAP)</option><option>Sa loob ng ilang araw</option><option>Sa susunod na linggo</option><option>Pwede pag-usapan</option>
        </select>
        <label style={s.lbl}>Setup</label>
        <select style={s.sel} value={form.setup} onChange={e => setForm(f => ({ ...f, setup: e.target.value }))}>
          <option>Stay-in</option><option>Stay-out</option><option>Either</option>
        </select>
        <label style={s.lbl}>City</label>
        <select style={s.sel} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}>
          <option>Quezon City</option><option>Makati</option><option>Pasig</option><option>Taguig</option><option>Mandaluyong</option><option>Marikina</option><option>Paranaque</option><option>Las Pinas</option>
        </select>
        <label style={s.lbl}>Scope of work *</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '16px' }}>
          {scopeItems.map(sc => (
            <button key={sc} onClick={() => toggleScope(sc)} style={{ padding: '9px 10px', borderRadius: '9px', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textAlign: 'center' as const, border: form.scope.includes(sc) ? '1.5px solid #c9943a' : '1.5px solid #e5e0d8', background: form.scope.includes(sc) ? '#fef3e2' : '#fff', color: form.scope.includes(sc) ? '#92400e' : '#6b7280' }}>{sc}</button>
          ))}
        </div>
        <button style={{ ...s.btn, opacity: submitting ? .6 : 1 }} onClick={handleSendOffer} disabled={submitting}>{submitting ? 'Sending...' : 'Send Offer →'}</button>
      </div>
      {showPaywall && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '340px', width: '100%' }}>
            <div style={{ fontFamily: 'serif', fontSize: '1.2rem', fontWeight: 900, marginBottom: '6px', color: '#1a1a1a' }}>I-activate ang account mo 🎯</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', lineHeight: 1.6 }}>Bayaran ang one-time fee para makapag-send ng job offers.</div>
            <div style={{ background: '#1a6b3c', borderRadius: '12px', padding: '16px', textAlign: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.6)', textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '4px' }}>Activation Fee</div>
              <div style={{ fontFamily: 'serif', fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>₱499</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.7)' }}>One-time · 30 days</div>
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', color: '#166534', lineHeight: 1.8 }}>✅ 10 job offer credits<br/>✅ Send offers directly to kasambahay<br/>✅ ₱499 deducted from final hire fee<br/>✅ Priority visibility</div>
            </div>
            <button style={{ ...s.btnAmber, opacity: paying ? .6 : 1 }} onClick={handlePay} disabled={paying}>{paying ? 'Redirecting...' : 'Pay ₱499 and Continue →'}</button>
            <button style={s.btnOutline} onClick={() => router.push('/dashboard/homeowner')}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
