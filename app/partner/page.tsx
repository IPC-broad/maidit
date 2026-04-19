'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PartnerSignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ full_name: '', mobile: '', barangay: '', gcash_number: '' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.full_name || !form.mobile || !form.barangay || !form.gcash_number) {
      setError('Please fill in all fields.')
      return
    }
    setSubmitting(true)
    setError('')
    const { supabase } = await import('../../lib/supabase')
    const { data: { user } } = await supabase.auth.getUser()
    let profileId = user?.id

    if (!profileId) {
      const email = `partner_${form.mobile}@maidit.app`
      const password = Math.random().toString(36).slice(-10)
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: form.full_name, role: 'partner' } }
      })
      if (signupError || !signupData.user) {
        setError('Could not create account. Try again.')
        setSubmitting(false)
        return
      }
      profileId = signupData.user.id
      await supabase.from('profiles').insert({
        id: profileId, full_name: form.full_name, mobile: form.mobile, role: 'partner', verified: false
      })
    }

    const { error: partnerError } = await supabase.from('partners').insert({
      profile_id: profileId, barangay: form.barangay, gcash_number: form.gcash_number,
      payout_method: 'gcash', approved: false, worker_count: 0
    })

    if (partnerError) {
      setError('You may already be registered as a partner.')
      setSubmitting(false)
      return
    }
    setSubmitting(false)
    setDone(true)
  }

  const s: any = {
    wrap: { minHeight: '100vh', background: '#0d1117', fontFamily: 'sans-serif', color: '#fff' },
    body: { padding: '32px 20px 48px', maxWidth: '440px', margin: '0 auto' },
    input: { width: '100%', padding: '12px 14px', border: '1.5px solid rgba(255,255,255,.1)', borderRadius: '11px', fontFamily: 'sans-serif', fontSize: '.88rem', outline: 'none', marginBottom: '12px', background: 'rgba(255,255,255,.05)', color: '#fff', boxSizing: 'border-box' as const },
    lbl: { display: 'block', fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: 'rgba(255,255,255,.4)', marginBottom: '5px' },
    btn: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#1a6b3c', color: '#fff', fontFamily: 'sans-serif', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' },
    err: { background: 'rgba(220,38,38,.1)', border: '1px solid rgba(220,38,38,.3)', borderRadius: '9px', padding: '10px 13px', fontSize: '.78rem', color: '#f87171', marginBottom: '13px' },
  }

  if (done) return (
    <div style={{ ...s.wrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' as const, padding: '32px 24px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🤝</div>
        <h1 style={{ fontFamily: 'serif', fontSize: '1.5rem', fontWeight: 900, marginBottom: '10px' }}>Application Submitted!</h1>
        <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.84rem', lineHeight: 1.8, marginBottom: '28px' }}>
          Thanks for applying as a MaidIt partner.<br />
          We'll contact you on {form.mobile} within 1–2 days.
        </p>
        <button style={s.btn} onClick={() => router.push('/')}>Back to MaidIt</button>
      </div>
    </div>
  )

  return (
    <div style={s.wrap}>
      <div style={{ background: 'rgba(255,255,255,.03)', borderBottom: '1px solid rgba(255,255,255,.07)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', fontSize: '1rem', cursor: 'pointer', padding: 0 }}>←</button>
        <span style={{ fontFamily: 'serif', fontSize: '1rem', fontWeight: 900 }}>Become a Partner</span>
      </div>
      <div style={s.body}>
        <h1 style={{ fontFamily: 'serif', fontSize: '1.6rem', fontWeight: 900, marginBottom: '8px', lineHeight: 1.2 }}>
          Earn by connecting<br />workers to families
        </h1>
        <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.82rem', lineHeight: 1.7, marginBottom: '24px' }}>
          Know kasambahay workers in your community? Help them find jobs and earn ₱1,000 per successful hire.
        </p>

        <div style={{ background: 'rgba(26,107,60,.15)', border: '1px solid rgba(26,107,60,.3)', borderRadius: '12px', padding: '14px', marginBottom: '24px' }}>
          <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: 'rgba(255,255,255,.4)', marginBottom: '10px' }}>Earnings per hire</div>
          {[
            { amount: '₱600', desc: "When worker arrives at homeowner's home" },
            { amount: '₱400', desc: 'After 30-day successful trial' },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', padding: '8px 0', borderBottom: i === 0 ? '1px solid rgba(255,255,255,.07)' : 'none' }}>
              <div style={{ fontFamily: 'serif', fontSize: '1.1rem', fontWeight: 900, color: '#4ade80', minWidth: '50px' }}>{row.amount}</div>
              <div style={{ fontSize: '.74rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.5, paddingTop: '2px' }}>{row.desc}</div>
            </div>
          ))}
        </div>

        {error && <div style={s.err}>⚠️ {error}</div>}

        <label style={s.lbl}>Full name *</label>
        <input style={s.input} placeholder="e.g. Nena Reyes" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
        <label style={s.lbl}>Mobile number *</label>
        <input style={s.input} placeholder="09XXXXXXXXX" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} />
        <label style={s.lbl}>Barangay / Area *</label>
        <input style={s.input} placeholder="e.g. Brgy. San Isidro, Pasig" value={form.barangay} onChange={e => setForm(f => ({ ...f, barangay: e.target.value }))} />
        <label style={s.lbl}>GCash number (for payouts) *</label>
        <input style={s.input} placeholder="09XXXXXXXXX" value={form.gcash_number} onChange={e => setForm(f => ({ ...f, gcash_number: e.target.value }))} />

        <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.3)', lineHeight: 1.6, marginBottom: '16px' }}>
          Your application will be reviewed before activation.
        </div>
        <button style={{ ...s.btn, opacity: submitting ? .6 : 1 }} onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Apply as Partner →'}
        </button>
      </div>
    </div>
  )
}