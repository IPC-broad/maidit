'use client'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function KasambahaySignup() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '', mobile: '', email: '',
    password: '', city: '', salary: '',
    setup: 'Stay-in', experience: 'Baguhan'
  })

  const update = (k: string, v: string) => setForm(f => ({...f, [k]: v}))

  const handleSignup = async () => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password
    })
    if (error) { setError(error.message); setLoading(false); return }

    await supabase.from('profiles').insert({
      id: data.user?.id,
      role: 'kasambahay',
      full_name: form.full_name,
      mobile: form.mobile,
      city: form.city
    })

    await supabase.from('kasambahay').insert({
      profile_id: data.user?.id,
      asking_salary: parseInt(form.salary),
      setup: form.setup,
      experience: form.experience,
      province: form.city
    })

    setLoading(false)
    router.push('/signup/kasambahay/success')
  }

  const s: any = {
    wrap: { minHeight:'100vh', background:'#f9fafb', padding:'24px 20px', fontFamily:'sans-serif', color:'#111827' },
    toprow: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' },
    back: { background:'none', border:'none', color:'#6b7280', fontSize:'1.1rem', cursor:'pointer', padding:'4px 8px' },
    title: { fontWeight:900, fontSize:'1.3rem', marginBottom:'4px', color:'#f0c97a' },
    sub: { fontSize:'.76rem', color:'#6b7280', marginBottom:'20px' },
    label: { display:'block', fontSize:'.63rem', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'.5px', color:'#6b7280', marginBottom:'4px' },
    input: { width:'100%', padding:'11px 13px', border:'1.5px solid #e5e7eb', borderRadius:'11px', background:'#ffffff', color:'#111827', fontFamily:'sans-serif', fontSize:'.88rem', outline:'none', marginBottom:'13px' },
    btn: { width:'100%', padding:'13px', borderRadius:'12px', border:'none', background:'#c9943a', color:'#111827', fontFamily:'sans-serif', fontSize:'.92rem', fontWeight:700, cursor:'pointer', marginTop:'6px' },
    bar: { display:'flex', gap:'4px', marginBottom:'20px' },
    err: { background:'rgba(220,38,38,.1)', border:'1px solid rgba(220,38,38,.3)', borderRadius:'9px', padding:'10px 13px', fontSize:'.78rem', color:'#fca5a5', marginBottom:'12px' }
  }

  return (
    <div style={s.wrap}>
      <div style={s.toprow}>
        <button style={s.back} onClick={() => step > 1 ? setStep(step - 1) : router.push('/')}>← Back</button>
        <span style={{ fontSize:'.72rem', color:'rgba(255,255,255,.35)' }}>Hakbang {step} ng 4</span>
      </div>

      <div style={s.bar}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex:1, height:'4px', borderRadius:'2px', background: i <= step ? '#c9943a' : 'rgba(255,255,255,.1)' }}/>
        ))}
      </div>

      {error && <div style={s.err}>⚠️ {error}</div>}

      {step === 1 && <>
        <div style={s.title}>Personal na Impormasyon</div>
        <div style={s.sub}>Hakbang 1 ng 4 · Libre ang pag-sign up</div>
        <label style={s.label}>Buong Pangalan</label>
        <input style={s.input} placeholder="Ana Santos" value={form.full_name} onChange={e => update('full_name', e.target.value)}/>
        <label style={s.label}>Mobile Number</label>
        <input style={s.input} placeholder="09XX XXX XXXX" value={form.mobile} onChange={e => update('mobile', e.target.value)}/>
        <label style={s.label}>Email</label>
        <input style={s.input} type="email" placeholder="ana@gmail.com" value={form.email} onChange={e => update('email', e.target.value)}/>
        <button style={s.btn} onClick={() => {
          if (!form.full_name || !form.mobile || !form.email) { setError('Punan ang lahat ng fields'); return }
          setError(''); setStep(2)
        }}>Susunod →</button>
      </>}

      {step === 2 && <>
        <div style={s.title}>Impormasyon sa Trabaho</div>
        <div style={s.sub}>Hakbang 2 ng 4</div>
        <label style={s.label}>Setup</label>
        <select style={s.input} value={form.setup} onChange={e => update('setup', e.target.value)}>
          <option>Stay-in</option><option>Stay-out</option><option>Kahit alin</option>
        </select>
        <label style={s.label}>Karanasan</label>
        <select style={s.input} value={form.experience} onChange={e => update('experience', e.target.value)}>
          <option>Baguhan</option><option>1–2 taon</option><option>3–5 taon</option><option>6–10 taon</option><option>10+ taon</option>
        </select>
        <button style={s.btn} onClick={() => setStep(3)}>Susunod →</button>
      </>}

      {step === 3 && <>
        <div style={s.title}>Lokasyon at Sahod</div>
        <div style={s.sub}>Hakbang 3 ng 4</div>
        <label style={s.label}>Lokasyon / Probinsya</label>
        <input style={s.input} placeholder="Batangas City" value={form.city} onChange={e => update('city', e.target.value)}/>
        <label style={s.label}>Hinihingi na Sahod (₱)</label>
        <input style={s.input} type="number" placeholder="9000" value={form.salary} onChange={e => update('salary', e.target.value)}/>
        <button style={s.btn} onClick={() => {
          if (!form.city || !form.salary) { setError('Punan ang lahat ng fields'); return }
          setError(''); setStep(4)
        }}>Susunod →</button>
      </>}

      {step === 4 && <>
        <div style={s.title}>I-set ang Password</div>
        <div style={s.sub}>Hakbang 4 ng 4 · Magiging live na ang iyong profile</div>
        <label style={s.label}>Password</label>
        <input style={s.input} type="password" placeholder="Min. 8 characters" value={form.password} onChange={e => update('password', e.target.value)}/>
        <div style={{ background:'rgba(201,148,58,.1)', border:'1px solid rgba(201,148,58,.2)', borderRadius:'12px', padding:'13px', marginBottom:'14px', fontSize:'.76rem', lineHeight:1.7, color:'rgba(255,255,255,.7)' }}>
          💼 May trabahong naghihintay sa iyo<br/>
          ⚖️ Wastong sweldo na naaayon sa batas<br/>
          🆓 Libre — walang babayaran para mag-apply
        </div>
        <button style={{...s.btn, opacity: loading ? .6 : 1}} onClick={handleSignup} disabled={loading}>
          {loading ? 'Ginagawa...' : 'I-create ang Account →'}
        </button>
      </>}
    </div>
  )
}
