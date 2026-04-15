'use client'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function HomeownerSignup() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '', mobile: '', email: '',
    password: '', city: 'Quezon City',
    setup: 'Stay-in', scope: [] as string[]
  })

  const update = (k: string, v: string) => setForm(f => ({...f, [k]: v}))
  const toggleScope = (s: string) => setForm(f => ({
    ...f, scope: f.scope.includes(s) ? f.scope.filter(x => x !== s) : [...f.scope, s]
  }))

  const handleSignup = async () => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({
      email: form.email, password: form.password
    })
    if (error) { setError(error.message); setLoading(false); return }

    await supabase.from('profiles').insert({
      id: data.user?.id,
      role: 'homeowner',
      full_name: form.full_name,
      mobile: form.mobile,
      city: form.city
    })

    await supabase.from('homeowners').insert({
      profile_id: data.user?.id,
      preferred_setup: form.setup,
      scope: form.scope
    })

    setLoading(false)
    router.push('/signup/homeowner/success')
  }

  const s: any = {
    wrap: { minHeight:'100vh', background:'#f9fafb', padding:'24px 20px', fontFamily:'sans-serif', color:'#111827' },
    toprow: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' },
    back: { background:'none', border:'none', color:'#6b7280', fontSize:'1.1rem', cursor:'pointer', padding:'4px 8px' },
    title: { fontWeight:900, fontSize:'1.3rem', marginBottom:'4px', color:'#111827' },
    sub: { fontSize:'.76rem', color:'#6b7280', marginBottom:'20px' },
    label: { display:'block', fontSize:'.63rem', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'.5px', color:'#6b7280', marginBottom:'4px' },
    input: { width:'100%', padding:'11px 13px', border:'1.5px solid #e5e7eb', borderRadius:'11px', background:'rgba(255,255,255,.05)', color:'#111827', fontFamily:'sans-serif', fontSize:'.88rem', outline:'none', marginBottom:'13px' },
    btn: { width:'100%', padding:'13px', borderRadius:'12px', border:'none', background:'#1a6b3c', color:'#111827', fontFamily:'sans-serif', fontSize:'.92rem', fontWeight:700, cursor:'pointer', marginTop:'6px' },
    bar: { display:'flex', gap:'4px', marginBottom:'20px' },
    err: { background:'rgba(220,38,38,.1)', border:'1px solid rgba(220,38,38,.3)', borderRadius:'9px', padding:'10px 13px', fontSize:'.78rem', color:'#fca5a5', marginBottom:'12px' },
    chipWrap: { display:'flex', gap:'8px', flexWrap:'wrap' as const, marginBottom:'13px' },
    scopeGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'13px' }
  }

  const chip = (label: string, key: string, val: string) => ({
    padding:'8px 14px', borderRadius:'50px', cursor:'pointer', fontFamily:'sans-serif',
    fontSize:'.78rem', fontWeight:600, border:'1.5px solid',
    borderColor: form[key as keyof typeof form] === val ? '#1a6b3c' : 'rgba(255,255,255,.15)',
    background: form[key as keyof typeof form] === val ? 'rgba(26,107,60,.2)' : 'transparent',
    color: form[key as keyof typeof form] === val ? '#6ee7b7' : 'rgba(255,255,255,.5)'
  })

  const scopeBtn = (label: string) => ({
    padding:'10px', borderRadius:'10px', cursor:'pointer', fontFamily:'sans-serif',
    fontSize:'.78rem', fontWeight:600, border:'1.5px solid', textAlign:'left' as const,
    borderColor: form.scope.includes(label) ? '#1a6b3c' : 'rgba(255,255,255,.15)',
    background: form.scope.includes(label) ? 'rgba(26,107,60,.15)' : 'transparent',
    color: form.scope.includes(label) ? '#6ee7b7' : 'rgba(255,255,255,.5)'
  })

  return (
    <div style={s.wrap}>
      <div style={s.toprow}>
        <button style={s.back} onClick={() => step > 1 ? setStep(step - 1) : router.push('/')}>← Back</button>
        <span style={{ fontSize:'.72rem', color:'rgba(255,255,255,.35)' }}>Step {step} of 3</span>
      </div>

      <div style={s.bar}>
        {[1,2,3].map(i => (
          <div key={i} style={{ flex:1, height:'4px', borderRadius:'2px',
            background: i <= step ? '#1a6b3c' : 'rgba(255,255,255,.1)' }}/>
        ))}
      </div>

      {error && <div style={s.err}>⚠️ {error}</div>}

      {step === 1 && <>
        <div style={s.title}>Your details</div>
        <div style={s.sub}>Step 1 of 3 · Browse kasambahay for free</div>
        <label style={s.label}>Full Name</label>
        <input style={s.input} placeholder="Maria Santos" value={form.full_name} onChange={e => update('full_name', e.target.value)}/>
        <label style={s.label}>Mobile Number</label>
        <input style={s.input} placeholder="09XX XXX XXXX" value={form.mobile} onChange={e => update('mobile', e.target.value)}/>
        <label style={s.label}>Email</label>
        <input style={s.input} type="email" placeholder="maria@gmail.com" value={form.email} onChange={e => update('email', e.target.value)}/>
        <label style={s.label}>City</label>
        <select style={s.input} value={form.city} onChange={e => update('city', e.target.value)}>
          <option>Quezon City</option><option>Makati</option><option>Pasig</option>
          <option>Taguig / BGC</option><option>Manila</option><option>Mandaluyong</option>
        </select>
        <button style={s.btn} onClick={() => {
          if (!form.full_name || !form.email) { setError('Please fill in all fields'); return }
          setError(''); setStep(2)
        }}>Next →</button>
      </>}

      {step === 2 && <>
        <div style={s.title}>Your household</div>
        <div style={s.sub}>Step 2 of 3 · Helps us find the best match</div>
        <label style={s.label}>Preferred Setup</label>
        <div style={s.chipWrap}>
          {['Stay-in','Stay-out','Either'].map(v => (
            <button key={v} style={chip(v,'setup',v)} onClick={() => update('setup', v)}>{v}</button>
          ))}
        </div>
        <label style={s.label}>Help Needed</label>
        <div style={s.scopeGrid}>
          {['🧹 Housekeeping','👶 Yaya','🍳 Cooking','🧺 Laundry','🚗 Driver','👴 Elder Care'].map(v => (
            <button key={v} style={scopeBtn(v)} onClick={() => toggleScope(v)}>{v}</button>
          ))}
        </div>
        <button style={s.btn} onClick={() => setStep(3)}>Next →</button>
      </>}

      {step === 3 && <>
        <div style={s.title}>Set your password</div>
        <div style={s.sub}>Step 3 of 3 · Browse all profiles free</div>
        <label style={s.label}>Password</label>
        <input style={s.input} type="password" placeholder="Min. 8 characters" value={form.password} onChange={e => update('password', e.target.value)}/>
        <div style={{ background:'rgba(26,107,60,.1)', border:'1px solid rgba(26,107,60,.2)', borderRadius:'12px', padding:'13px', marginBottom:'14px', fontSize:'.76rem', lineHeight:1.7, color:'rgba(255,255,255,.7)' }}>
          ✅ Browse profiles — free<br/>
          ✅ Message candidates anytime (₱499/month)<br/>
          ✅ Pay hiring fee only when you successfully hire
        </div>
        <button style={{...s.btn, opacity: loading ? .6 : 1}} onClick={handleSignup} disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account →'}
        </button>
      </>}
    </div>
  )
}
