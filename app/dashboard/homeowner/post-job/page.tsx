'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const PAYMONGO_LINK_499 = process.env.NEXT_PUBLIC_PAYMONGO_LINK_499 || ''

export default function PostJobPage() {
  const router = useRouter()

  const [hwId, setHwId] = useState<string | null>(null)
  const [initLoading, setInitLoading] = useState(true)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'review' | 'pay' | 'confirm' | 'done'>('form')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    salary: '',
    start_date: '',
    urgency: 'ASAP',
    custom_date: '',
    setup: 'Stay-in',
    day_off: 'Every Sunday',
    city: 'Quezon City',
    area: '',
    scope: [] as string[],
    household: { adults: 2, kids: 0, seniors: 0 },
    pets: 'No'
  })

  useEffect(() => {
    const init = async () => {
      const { supabase } = await import('../../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      let { data: hw } = await supabase.from('homeowners').select('id').eq('profile_id', user.id).single()
      if (!hw) {
        const { data: created } = await supabase.from('homeowners').insert({ profile_id: user.id }).select('id').single()
        hw = created
      }
      if (hw) setHwId(hw.id)
      setInitLoading(false)
    }
    init()
  }, [])

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const toggleScope = (s: string) => setForm(f => ({
    ...f,
    scope: f.scope.includes(s) ? f.scope.filter(x => x !== s) : [...f.scope, s]
  }))

  const handlePost = async () => {
    if (!hwId) { setError('Could not load your profile. Please refresh and try again.'); return }
    setSubmitting(true)
    setError('')
    const { supabase } = await import('../../../../lib/supabase')

    const { error } = await supabase.from('jobs').insert({
      homeowner_id: hwId,
      salary: parseInt(form.salary),
      start_date: form.start_date,
      urgency: form.urgency,
      custom_date: form.custom_date,
      setup: form.setup,
      day_off: form.day_off,
      city: form.city,
      area: form.area,
      scope: form.scope,
      household: form.household,
      pets: form.pets,
      active: true
    })

    setSubmitting(false)
    if (error) { setError(error.message); return }
    setStep('done')
  }

  const s: any = {
    wrap: { minHeight: '100vh', background: '#faf8f5', fontFamily: 'sans-serif', color: '#1a1a1a' },
    head: { background: '#fff', borderBottom: '1px solid #ede8e0', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' },
    back: { background: 'none', border: 'none', color: '#9ca3af', fontSize: '1.1rem', cursor: 'pointer', padding: 0 },
    body: { padding: '20px 18px 48px', maxWidth: '500px', margin: '0 auto' },
    card: { background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #ede8e0', marginBottom: '14px' },
    lbl: { fontSize: '.63rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#9ca3af', marginBottom: '4px', display: 'block' },
    inp: { width: '100%', padding: '11px 13px', border: '1.5px solid #e5e0d8', borderRadius: '11px', fontSize: '.88rem', marginBottom: '13px', background: '#fff', color: '#1a1a1a', fontFamily: 'sans-serif', outline: 'none' },
    btn: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#1a6b3c', color: '#fff', fontFamily: 'sans-serif', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginBottom: '10px' },
    btnAmber: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#c9943a', color: '#fff', fontFamily: 'sans-serif', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginBottom: '10px' },
    btnBlue: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#2563eb', color: '#fff', fontFamily: 'sans-serif', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginBottom: '10px' },
    btnOutline: { width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #ede8e0', background: 'transparent', color: '#6b7280', fontFamily: 'sans-serif', fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' },
    center: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '28px', textAlign: 'center' as const, fontFamily: 'sans-serif', background: '#faf8f5' },
  }

  const scopeItems = ['🧹 All-around Maid','🍳 Tagaluto','🧺 Tagalaba','👶 Yaya','🐕 Taga-alaga ng Pets','👴 Taga-alaga ng Matanda','🚗 Driver','🛒 Pamimili']

  if (initLoading) return (
    <div style={{ ...s.center, color: '#6b7280' }}>Setting up your profile...</div>
  )

  if (!hwId) return (
    <div style={s.center}>
      <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>⚠️</div>
      <h1 style={{ fontFamily: 'serif', fontSize: '1.2rem', fontWeight: 900, color: '#111827', marginBottom: '8px' }}>Profile Incomplete</h1>
      <p style={{ color: '#6b7280', fontSize: '.84rem', lineHeight: 1.7, marginBottom: '24px' }}>
        We couldn't set up your homeowner profile. Please sign up first.
      </p>
      <button style={{ ...s.btn, maxWidth: '300px' }} onClick={() => router.push('/signup/homeowner')}>
        Complete Profile →
      </button>
    </div>
  )

  // ── DONE ──
  if (step === 'done') return (
    <div style={s.center}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
      <h1 style={{ fontFamily: 'serif', fontSize: '1.5rem', fontWeight: 900, color: '#1a6b3c', marginBottom: '8px' }}>Job Posted!</h1>
      <p style={{ color: '#6b7280', fontSize: '.84rem', lineHeight: 1.7, marginBottom: '24px' }}>
        Your job post and offer credits are now active. Start browsing and sending offers to kasambahay!
      </p>
      <button style={{ ...s.btn, maxWidth: '300px' }} onClick={() => router.push('/dashboard/homeowner')}>
        Back to Dashboard
      </button>
    </div>
  )

  // ── CONFIRM PAYMENT ──
  if (step === 'confirm') return (
    <div style={s.wrap}>
      <div style={s.head}>
        <span style={{ fontFamily: 'serif', fontSize: '1rem', fontWeight: 900, color: '#1a1a1a' }}>Confirm Payment</span>
      </div>
      <div style={s.body}>
        <div style={{ fontFamily: 'serif', fontSize: '1.1rem', fontWeight: 900, marginBottom: '6px' }}>
          Did you complete the payment? 💳
        </div>
        <div style={{ fontSize: '.76rem', color: '#6b7280', marginBottom: '20px', lineHeight: 1.6 }}>
          Once payment is confirmed, your job post and offer credits will be activated automatically.
        </div>
        <div style={{ ...s.card, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '.74rem', color: '#166534', lineHeight: 1.8 }}>
            ✅ PayMongo accepts <strong>QRPh</strong><br/>
            Scan with GCash, BPI, BDO, or any bank app.<br/>
            Make sure the amount shows <strong>₱499.00</strong>.
          </div>
        </div>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '9px', padding: '10px 13px', fontSize: '.78rem', color: '#dc2626', marginBottom: '12px' }}>{error}</div>}
        <button
          style={{ ...s.btn, opacity: submitting ? .6 : 1 }}
          onClick={handlePost}
          disabled={submitting}
        >
          {submitting ? 'Posting your job...' : "✅ Yes, I've paid ₱499"}
        </button>
        <button style={s.btnBlue} onClick={() => window.open(PAYMONGO_LINK_499, '_blank')}>
          ↗ Re-open PayMongo
        </button>
        <button style={s.btnOutline} onClick={() => setStep('pay')}>
          ← Back
        </button>
      </div>
    </div>
  )

  // ── PAY SCREEN ──
  if (step === 'pay') return (
    <div style={s.wrap}>
      <div style={s.head}>
        <button style={s.back} onClick={() => setStep('review')}>←</button>
        <span style={{ fontFamily: 'serif', fontSize: '1rem', fontWeight: 900, color: '#1a1a1a' }}>Activate Job Listing</span>
      </div>
      <div style={s.body}>
        <div style={{ fontFamily: 'serif', fontSize: '1.15rem', fontWeight: 900, marginBottom: '4px' }}>
          One-Time Activation Fee 🎯
        </div>
        <div style={{ fontSize: '.76rem', color: '#6b7280', marginBottom: '20px', lineHeight: 1.6 }}>
          Pay once to post your job and send up to 10 job offers to qualified candidates.
        </div>

        <div style={{ ...s.card, background: '#1a6b3c', border: 'none', textAlign: 'center' as const, padding: '22px' }}>
          <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '1px', color: 'rgba(255,255,255,.5)', marginBottom: '6px' }}>
            Job Listing Fee
          </div>
          <div style={{ fontFamily: 'serif', fontSize: '2.8rem', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>₱499</div>
          <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.6)' }}>
            One-time payment • Includes 1 job post + up to 10 offer credits
          </div>
        </div>

        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '11px', padding: '12px 14px', marginBottom: '14px' }}>
          <div style={{ fontSize: '.74rem', color: '#166534', lineHeight: 1.7 }}>
            💡 <strong>Subscription fee credit:</strong> Your ₱499 will be deducted from the ₱2,500 hiring fee when you hire a kasambahay. You will only pay <strong>₱2,001</strong> at that time.
          </div>
        </div>

        <div style={s.card}>
          <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#9ca3af', marginBottom: '10px' }}>What's included</div>
          {[
            { icon: '📋', text: '1 active job listing visible to all kasambahay' },
            { icon: '👥', text: 'Send up to 10 job offers' },
            { icon: '💬', text: 'Message and send offers directly to candidates' },
            { icon: '🛡️', text: 'Ongoing MaidIt support throughout your hiring process' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', padding: '7px 0', borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1rem', minWidth: '20px' }}>{item.icon}</span>
              <span style={{ fontSize: '.78rem', color: '#374151', lineHeight: 1.5 }}>{item.text}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '11px', padding: '12px 14px', marginBottom: '18px' }}>
          <div style={{ fontSize: '.7rem', fontWeight: 700, color: '#92400e', marginBottom: '6px' }}>How It Works:</div>
          {[
            'Tap "Pay ₱499 via PayMongo" — a new tab opens',
            'Scan the QRPh code with GCash or your bank app',
            'Come back here and tap "I\'ve paid"',
          ].map((txt, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '.68rem', fontWeight: 700, color: '#92400e', minWidth: '14px' }}>{i + 1}.</span>
              <span style={{ fontSize: '.72rem', color: '#78350f', lineHeight: 1.5 }}>{txt}</span>
            </div>
          ))}
        </div>

        <button style={s.btnAmber} onClick={() => { setStep('confirm'); window.open(PAYMONGO_LINK_499, '_blank') }}>
          Pay ₱499 via PayMongo →
        </button>
        <div style={{ fontSize: '.7rem', color: '#6b7280', textAlign: 'center' as const, marginTop: '-4px', marginBottom: '14px', lineHeight: 1.6 }}>
          💡 Your ₱499 subscription is deductible from the ₱2,500 hiring fee. You only pay ₱2,001 when you hire.
        </div>
        <button style={s.btnOutline} onClick={() => router.push('/dashboard/homeowner')}>
          Pay later
        </button>
        <div style={{ fontSize: '.67rem', color: '#9ca3af', textAlign: 'center' as const, marginTop: '14px', lineHeight: 1.6 }}>
          Secured by PayMongo · QRPh accepted<br/>
          Job goes live after payment is verified.
        </div>
      </div>
    </div>
  )

  // ── REVIEW SCREEN ──
  if (step === 'review') return (
    <div style={s.wrap}>
      <div style={s.head}>
        <button style={s.back} onClick={() => setStep('form')}>←</button>
        <span style={{ fontFamily: 'serif', fontSize: '1rem', fontWeight: 900, color: '#1a1a1a' }}>Review Your Job</span>
      </div>
      <div style={s.body}>
        <div style={{ fontFamily: 'serif', fontSize: '1.15rem', fontWeight: 900, marginBottom: '16px' }}>
          Looks good? 👀
        </div>
        <div style={s.card}>
          <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#9ca3af', marginBottom: '12px' }}>Job Summary</div>
          {[
            { label: 'Setup', value: `${form.setup} · ${form.city}${form.area ? ` · ${form.area}` : ''}` },
            { label: 'Scope', value: form.scope.join(', ') || '—' },
            { label: 'Household', value: `${form.household.adults} adults · ${form.household.kids} kids · Pets: ${form.pets}` },
            { label: 'Start', value: form.urgency === 'Custom' ? form.custom_date : form.urgency },
            { label: 'Salary', value: `₱${parseInt(form.salary || '0').toLocaleString()}/month` },
            { label: 'Day off', value: form.day_off },
          ].map((row, i, arr) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none', gap: '12px' }}>
              <span style={{ fontSize: '.78rem', color: '#9ca3af', flexShrink: 0 }}>{row.label}</span>
              <span style={{ fontSize: '.78rem', fontWeight: 600, color: '#1a1a1a', textAlign: 'right' as const }}>{row.value}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#fef3e2', border: '1px solid #fde8c0', borderRadius: '11px', padding: '12px 14px', marginBottom: '10px' }}>
          <div style={{ fontSize: '.74rem', color: '#92400e', lineHeight: 1.6 }}>
            💡 Activating this listing costs <strong>₱499</strong> — paid once via PayMongo. Your job goes live immediately after.
          </div>
        </div>

        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '11px', padding: '12px 14px', marginBottom: '18px' }}>
          <div style={{ fontSize: '.74rem', color: '#166534', lineHeight: 1.6 }}>
            After posting, you can send up to <strong>10 job offers</strong>. Hiring fee is ₱2,500 minus your ₱499 subscription = <strong>₱2,001 net</strong>.
          </div>
        </div>

        <button style={s.btnAmber} onClick={() => setStep('pay')}>
          Continue to Payment →
        </button>
        <button style={s.btnOutline} onClick={() => setStep('form')}>
          ← Edit Job
        </button>
      </div>
    </div>
  )

  // ── FORM SCREEN ──
  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <button style={s.back} onClick={() => router.push('/dashboard/homeowner')}>←</button>
        <span style={{ fontFamily: 'serif', fontSize: '1rem', fontWeight: 900, color: '#1a1a1a' }}>Post a Job</span>
      </div>
      <div style={s.body}>
        <div style={{ fontFamily: 'serif', fontSize: '1.2rem', fontWeight: 900, marginBottom: '4px' }}>
          Find a trusted kasambahay
        </div>
        <div style={{ fontSize: '.78rem', color: '#6b7280', marginBottom: '20px', lineHeight: 1.6 }}>
          Post in 2 minutes · Send offers to kasambahay directly
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '9px', padding: '10px 13px', fontSize: '.78rem', color: '#dc2626', marginBottom: '12px' }}>{error}</div>}

        <label style={s.lbl}>What help do you need? *</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          {scopeItems.map(sc => (
            <button key={sc} onClick={() => toggleScope(sc)} style={{
              padding: '10px', borderRadius: '10px', fontFamily: 'sans-serif', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer',
              border: form.scope.includes(sc) ? '1.5px solid #c9943a' : '1.5px solid #e5e0d8',
              background: form.scope.includes(sc) ? '#fef3e2' : '#fff',
              color: form.scope.includes(sc) ? '#92400e' : '#374151',
            }}>
              {sc}
            </button>
          ))}
        </div>

        <label style={s.lbl}>Setup</label>
        <select style={s.inp} value={form.setup} onChange={e => update('setup', e.target.value)}>
          <option>Stay-in</option>
          <option>Stay-out</option>
          <option>Either</option>
        </select>

        <label style={s.lbl}>City</label>
        <select style={s.inp} value={form.city} onChange={e => update('city', e.target.value)}>
          <option>Quezon City</option>
          <option>Makati</option>
          <option>Pasig</option>
          <option>Taguig</option>
          <option>Mandaluyong</option>
          <option>Marikina</option>
          <option>Paranaque</option>
          <option>Las Pinas</option>
          <option>Muntinlupa</option>
          <option>Caloocan</option>
        </select>

        <label style={s.lbl}>Area / Barangay</label>
        <input style={s.inp} placeholder="e.g. Teachers Village" value={form.area} onChange={e => update('area', e.target.value)} />

        <label style={s.lbl}>Household</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ ...s.lbl, marginBottom: '4px' }}>Adults</label>
            <input style={s.inp} type="number" min="0" value={form.household.adults}
              onChange={e => setForm(f => ({ ...f, household: { ...f.household, adults: parseInt(e.target.value) || 0 } }))} />
          </div>
          <div>
            <label style={{ ...s.lbl, marginBottom: '4px' }}>Kids</label>
            <input style={s.inp} type="number" min="0" value={form.household.kids}
              onChange={e => setForm(f => ({ ...f, household: { ...f.household, kids: parseInt(e.target.value) || 0 } }))} />
          </div>
          <div>
            <label style={{ ...s.lbl, marginBottom: '4px' }}>Seniors</label>
            <input style={s.inp} type="number" min="0" value={form.household.seniors}
              onChange={e => setForm(f => ({ ...f, household: { ...f.household, seniors: parseInt(e.target.value) || 0 } }))} />
          </div>
        </div>

        <label style={s.lbl}>Pets?</label>
        <select style={s.inp} value={form.pets} onChange={e => update('pets', e.target.value)}>
          <option>No</option>
          <option>Dog</option>
          <option>Cat</option>
          <option>Multiple</option>
        </select>

        <label style={s.lbl}>Day Off</label>
        <select style={s.inp} value={form.day_off} onChange={e => update('day_off', e.target.value)}>
          <option>Every Sunday</option>
          <option>Every Saturday</option>
          <option>Every other Sunday</option>
          <option>To be discussed</option>
        </select>

        <label style={s.lbl}>When do you need help?</label>
        <select style={s.inp} value={form.urgency} onChange={e => update('urgency', e.target.value)}>
          <option>ASAP</option>
          <option>Within a few days</option>
          <option>Next week</option>
          <option>Flexible / To be discussed</option>
        </select>

        <label style={s.lbl}>Monthly Salary (₱)</label>
        <input style={s.inp} type="number" placeholder="e.g. 9000" value={form.salary}
          onChange={e => update('salary', e.target.value)} />
        <div style={{ fontSize: '.7rem', color: '#9ca3af', marginBottom: '16px' }}>Typical: ₱8,000 – ₱15,000/month</div>

        <button
          style={s.btnAmber}
          onClick={() => {
            if (!form.salary) return setError('Please enter a salary')
            if (form.scope.length === 0) return setError('Select at least one type of help needed')
            setError('')
            setStep('review')
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  )
}
