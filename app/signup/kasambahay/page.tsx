'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function KasambahaySignup() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sentOtp, setSentOtp] = useState('')
  const [cooldown, setCooldown] = useState(0)

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    mobile: '',
    otp: '',
    email: '',
    password: '',
    city: '',
    salary: '',
    setup: 'Stay-in',
    experience: 'Baguhan'
  })

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const startCooldown = () => {
    setCooldown(60)
    const interval = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const sendOtp = async () => {
    if (!form.first_name || !form.last_name || !form.mobile) {
      setError('Punan ang lahat ng fields')
      return
    }
    if (form.mobile.length < 11) {
      setError('Ilagay ang tamang mobile number (11 digits)')
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: form.mobile })
    })
    const data = await res.json()

    if (!res.ok) {
      setError('Hindi mapadala ang SMS. Subukan ulit.')
      setLoading(false)
      return
    }

    setSentOtp(data.otp)
    setLoading(false)
    setStep(2)
    startCooldown()
  }

  const verifyOtp = () => {
    if (!form.otp || form.otp.length < 6) {
      setError('Ilagay ang 6-digit code')
      return
    }
    if (form.otp !== sentOtp) {
      setError('Maling code. Subukan ulit.')
      return
    }
    setError('')
    setStep(3)
  }

  const handleSignup = async () => {
    if (!form.email || !form.password || !form.city || !form.salary) {
      setError('Punan ang lahat ng fields')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    setError('')

    const { supabase } = await import('../../../lib/supabase')

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    await supabase.from('profiles').insert({
      id: data.user?.id,
      role: 'kasambahay',
      full_name: `${form.first_name} ${form.last_name}`,
      mobile: form.mobile,
      city: form.city,
      verified: true,
      verified_via: 'mobile'
    })

    await supabase.from('kasambahay').insert({
      profile_id: data.user?.id,
      asking_salary: parseInt(form.salary),
      setup: form.setup,
      experience: form.experience,
      province: form.city
    })

    setLoading(false)
    router.push('/dashboard/kasambahay')
  }

  const s: any = {
    wrap: { minHeight:'100vh', background:'#faf8f5', padding:'24px 20px', fontFamily:'sans-serif', color:'#111827' },
    toprow: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' },
    back: { background:'none', border:'none', fontSize:'1rem', color:'#6b7280', cursor:'pointer', padding:0 },
    stepnum: { fontSize:'.72rem', color:'#9ca3af' },
    bar: { display:'flex', gap:'4px', marginBottom:'22px' },
    seg: (active: boolean) => ({ flex:1, height:'4px', borderRadius:'2px', background: active ? '#c9943a' : '#e5e7eb' }),
    title: { fontWeight:900, fontSize:'1.25rem', marginBottom:'5px', color:'#c9943a' },
    sub: { fontSize:'.78rem', color:'#6b7280', marginBottom:'20px', lineHeight:1.5 },
    lbl: { display:'block', fontSize:'.63rem', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'.5px', color:'#6b7280', marginBottom:'4px' },
    input: { width:'100%', padding:'11px 13px', border:'1.5px solid #e5e7eb', borderRadius:'11px', fontFamily:'sans-serif', fontSize:'.88rem', outline:'none', marginBottom:'13px', background:'#fff', color:'#111827' },
    btn: { width:'100%', padding:'13px', borderRadius:'12px', border:'none', background:'#c9943a', color:'#fff', fontFamily:'sans-serif', fontSize:'.92rem', fontWeight:700, cursor:'pointer' },
    err: { background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'9px', padding:'10px 13px', fontSize:'.78rem', color:'#dc2626', marginBottom:'13px' },
    note: { background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'10px', padding:'11px 13px', marginBottom:'16px', fontSize:'.74rem', color:'#92400e', lineHeight:1.6 }
  }

  return (
    <div style={s.wrap}>
      <div style={s.toprow}>
        <button style={s.back} onClick={() => step > 1 ? setStep(step - 1) : router.push('/')}>← Back</button>
        <span style={s.stepnum}>Hakbang {step} ng 3</span>
      </div>

      <div style={s.bar}>
        {[1,2,3].map(i => <div key={i} style={s.seg(i <= step)} />)}
      </div>

      {error && <div style={s.err}>⚠️ {error}</div>}

      {step === 1 && (
        <>
          <div style={s.title}>Mag-sign up</div>
          <div style={s.sub}>I-verify ang iyong mobile number para makapagsimula</div>

          <label style={s.lbl}>Pangalan</label>
          <input style={s.input} placeholder="Ana" value={form.first_name} onChange={e => update('first_name', e.target.value)} />

          <label style={s.lbl}>Apelyido</label>
          <input style={s.input} placeholder="Santos" value={form.last_name} onChange={e => update('last_name', e.target.value)} />

          <label style={s.lbl}>Mobile Number</label>
          <input
            style={s.input}
            placeholder="09XXXXXXXXX"
            value={form.mobile}
            onChange={e => update('mobile', e.target.value.replace(/\D/g,'').slice(0,11))}
            inputMode="numeric"
            maxLength={11}
          />

          <div style={s.note}>
            📱 Magpapadala kami ng 6-digit verification code sa iyong number via SMS.
          </div>

          <button
            style={{ ...s.btn, opacity: (loading || cooldown > 0) ? .6 : 1 }}
            onClick={sendOtp}
            disabled={loading || cooldown > 0}
          >
            {loading ? 'Sending...' : cooldown > 0 ? `Maghintay ${cooldown}s` : 'I-send ang Code →'}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div style={s.title}>I-verify ang number mo</div>
          <div style={s.sub}>
            Nagpadala kami ng 6-digit code sa{' '}
            <strong style={{ color:'#111827' }}>{form.mobile}</strong>
          </div>

          <label style={s.lbl}>Verification Code</label>
          <input
            style={{ ...s.input, fontSize:'1.3rem', fontWeight:700, textAlign:'center', letterSpacing:'8px' }}
            placeholder="000000"
            value={form.otp}
            onChange={e => update('otp', e.target.value.replace(/\D/g,'').slice(0,6))}
            maxLength={6}
            inputMode="numeric"
          />

          <button
            style={{ ...s.btn, opacity: (loading || form.otp.length < 6) ? .6 : 1 }}
            onClick={verifyOtp}
            disabled={loading || form.otp.length < 6}
          >
            {loading ? 'Verifying...' : 'I-verify →'}
          </button>

          <button
            style={{ width:'100%', padding:'11px', marginTop:'10px', background:'transparent', border:'1.5px solid #e5e7eb', borderRadius:'12px', fontFamily:'sans-serif', fontSize:'.82rem', color:'#6b7280', cursor: cooldown > 0 ? 'not-allowed' : 'pointer' }}
            onClick={sendOtp}
            disabled={cooldown > 0 || loading}
          >
            {cooldown > 0 ? `I-resend sa ${cooldown}s` : 'I-resend ang code'}
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <div style={s.title}>Karagdagang Impormasyon</div>
          <div style={s.sub}>Na-verify na ang iyong number ✅</div>

          <label style={s.lbl}>Email</label>
          <input style={s.input} type="email" placeholder="ana@gmail.com" value={form.email} onChange={e => update('email', e.target.value)} />

          <label style={s.lbl}>Password</label>
          <input style={s.input} type="password" placeholder="Min. 8 characters" value={form.password} onChange={e => update('password', e.target.value)} />

          <label style={s.lbl}>Lokasyon / Probinsya</label>
          <input style={s.input} placeholder="Batangas City" value={form.city} onChange={e => update('city', e.target.value)} />

          <label style={s.lbl}>Hinihingi na Sahod (₱)</label>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', color:'#6b7280', fontWeight:700 }}>₱</span>
            <input
              style={{ ...s.input, paddingLeft:'28px' }}
              type="number"
              placeholder="9000"
              value={form.salary}
              onChange={e => update('salary', e.target.value)}
            />
          </div>

          <label style={s.lbl}>Setup</label>
          <select style={s.input} value={form.setup} onChange={e => update('setup', e.target.value)}>
            <option>Stay-in</option>
            <option>Stay-out</option>
            <option>Kahit alin</option>
          </select>

          <label style={s.lbl}>Karanasan</label>
          <select style={s.input} value={form.experience} onChange={e => update('experience', e.target.value)}>
            <option>Baguhan</option>
            <option>1-2 taon</option>
            <option>3-5 taon</option>
            <option>6-10 taon</option>
            <option>10+ taon</option>
          </select>

          <div style={{ background:'#fdf3e3', border:'1px solid rgba(201,148,58,.2)', borderRadius:'12px', padding:'13px 15px', marginBottom:'16px' }}>
            <div style={{ fontSize:'.7rem', fontWeight:800, color:'#c9943a', textTransform:'uppercase' as const, letterSpacing:'.5px', marginBottom:'9px' }}>Bakit MaidIt?</div>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'7px' }}>
              <div style={{ display:'flex', gap:'8px', fontSize:'.8rem', color:'#111827' }}><span>💼</span><span>May trabahong naghihintay sa iyo</span></div>
              <div style={{ display:'flex', gap:'8px', fontSize:'.8rem', color:'#111827' }}><span>⚖️</span><span>Wastong sweldo na naaayon sa batas</span></div>
              <div style={{ display:'flex', gap:'8px', fontSize:'.8rem', color:'#111827' }}><span>🆓</span><span>Libre — walang babayaran para mag-apply</span></div>
            </div>
          </div>

          <button
            style={{ ...s.btn, opacity: loading ? .6 : 1 }}
            onClick={handleSignup}
            disabled={loading}
          >
            {loading ? 'Ginagawa...' : 'I-create ang Account →'}
          </button>
        </>
      )}
    </div>
  )
}
