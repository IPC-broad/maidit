'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Province = { code: string; name: string }

export default function KasambahaySignup() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sentOtp, setSentOtp] = useState('')
  const [cooldown, setCooldown] = useState(0)

  const [hasNbi, setHasNbi] = useState(false)
  const [govtIdTypes, setGovtIdTypes] = useState<string[]>([])
  const toggleGovtId = (id: string) => {
    if (id === 'Wala') {
      setGovtIdTypes(prev => prev.includes('Wala') ? [] : ['Wala'])
    } else {
      setGovtIdTypes(prev => {
        const without = prev.filter(x => x !== 'Wala')
        return without.includes(id) ? without.filter(x => x !== id) : [...without, id]
      })
    }
  }

  // Province dropdown
  const [provinces, setProvinces] = useState<Province[]>([])
  const [provSearch, setProvSearch] = useState('')
  const [provOpen, setProvOpen] = useState(false)
  const [selProv, setSelProv] = useState<Province | null>(null)
  const provRef = useRef<HTMLDivElement>(null)

  // Selfie
  const [selfieData, setSelfieData] = useState<string | null>(null)
  const selfieRef = useRef<HTMLInputElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref) localStorage.setItem('maidit_ref', ref)
  }, [])

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    mobile: '',
    otp: '',
    age: '',
    salary: '',
    setup: 'Stay-in',
    experience: 'Baguhan',
    availability: 'Immediate',
    facebook_url: ''
  })

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    fetch('https://psgc.gitlab.io/api/provinces/')
      .then(r => r.json())
      .then(data => {
        const sorted = data.map((p: any) => ({ code: p.code, name: p.name }))
          .sort((a: Province, b: Province) => a.name.localeCompare(b.name))
        setProvinces(sorted)
      }).catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (provRef.current && !provRef.current.contains(e.target as Node)) setProvOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredProvs = provinces.filter(p =>
    p.name.toLowerCase().includes(provSearch.toLowerCase())
  ).slice(0, 80)

  const handleSelfie = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setSelfieData(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const startCooldown = () => {
    setCooldown(60)
    const interval = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const checkMobile = async () => {
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
      body: JSON.stringify({ mobile: form.mobile, checkOnly: true })
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'May error. Subukan ulit.')
      setLoading(false)
      return
    }

    setLoading(false)
    setStep(2)
  }

  const sendOtpAndProceed = async () => {
    if (!selProv || !form.salary) {
      setError('Punan ang lahat ng fields')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: form.mobile })
      })
      const data = await res.json()
      if (res.ok && data.otp) {
        setSentOtp(data.otp)
        startCooldown()
      }
    } catch {
      // SMS failure — proceed to Step 3 anyway (dev bypass available)
    }

    setLoading(false)
    setStep(3)
  }

  const resendOtp = async () => {
    if (cooldown > 0 || loading) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: form.mobile })
    })
    const data = await res.json()

    if (res.ok) {
      setSentOtp(data.otp)
      startCooldown()
    }
    setLoading(false)
  }

  const createAccount = async () => {
    setError('')
    setLoading(true)

    const { supabase } = await import('../../../lib/supabase')

    const autoEmail = `kb_${form.mobile}@maidit.app`
    const autoPassword = Math.random().toString(36).slice(-12)

    const { data, error } = await supabase.auth.signUp({
      email: autoEmail,
      password: autoPassword
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const userId = data.user?.id

    await supabase.from('profiles').insert({
      id: userId,
      role: 'kasambahay',
      full_name: `${form.first_name} ${form.last_name}`,
      mobile: form.mobile,
      city: selProv!.name,
      verified: true,
      verified_via: 'mobile'
    })

    const refCode = localStorage.getItem('maidit_ref')
    let referredBy: string | null = null
    if (refCode) {
      const { data: partnerMatch } = await supabase.from('partners').select('id').eq('referral_code', refCode).single()
      if (partnerMatch?.id) referredBy = partnerMatch.id
      localStorage.removeItem('maidit_ref')
    }

    await supabase.from('kasambahay').insert({
      profile_id: userId,
      asking_salary: parseInt(form.salary),
      setup: form.setup,
      has_nbi: hasNbi,
      govt_id_types: govtIdTypes,
      experience: form.experience,
      province: selProv!.name,
      age: form.age ? parseInt(form.age) : null,
      availability: form.availability || 'Immediate',
      ...(referredBy ? { referred_by: referredBy } : {}),
      ...(form.facebook_url.trim() ? { facebook_url: form.facebook_url.trim() } : {})
    })

    if (selfieData && userId) {
      try {
        console.log('[signup] Uploading inline selfie for user:', userId)
        const blob = await fetch(selfieData).then(r => r.blob())
        const { error: uploadError } = await supabase.storage
          .from('Selfies')
          .upload(`${userId}/selfie.png`, blob, { upsert: true, contentType: 'image/png' })
        console.log('[signup] Upload result:', uploadError ?? 'success')
        const { data: { publicUrl } } = supabase.storage.from('Selfies').getPublicUrl(`${userId}/selfie.png`)
        console.log('[signup] Public URL:', publicUrl)
        const { error: updateError } = await supabase.from('profiles').update({ selfie_url: publicUrl }).eq('id', userId)
        console.log('[signup] Profile update result:', updateError ?? 'success')
      } catch (err) {
        console.error('[signup] Selfie upload error:', err)
      }
    }

    setLoading(false)
    router.push(selfieData ? '/signup/kasambahay/success' : '/signup/kasambahay/selfie')
  }

  const verifyAndCreate = async () => {
    if (!form.otp || form.otp.length < 6) {
      setError('Ilagay ang 6-digit code')
      return
    }
    if (form.otp !== sentOtp) {
      setError('Maling code. Subukan ulit.')
      return
    }
    await createAccount()
  }

  const s: any = {
    wrap: { minHeight:'100vh', background:'#faf8f5', padding:'24px 20px', fontFamily:'sans-serif', color:'#111827' },
    toprow: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' },
    back: { background:'none', border:'none', fontSize:'1rem', color:'#6b7280', cursor:'pointer', padding:0 },
    stepnum: { fontSize:'.72rem', color:'#9ca3af' },
    bar: { display:'flex', gap:'4px', marginBottom:'22px' },
    seg: (active: boolean) => ({ flex:1, height:'4px', borderRadius:'2px', background: active ? '#1a6b3c' : '#e5e7eb' }),
    title: { fontWeight:900, fontSize:'1.25rem', marginBottom:'5px', color:'#c9943a' },
    sub: { fontSize:'.78rem', color:'#6b7280', marginBottom:'20px', lineHeight:1.5 },
    lbl: { display:'block', fontSize:'.63rem', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'.5px', color:'#6b7280', marginBottom:'4px' },
    hint: { fontSize:'.65rem', color:'#9ca3af', marginBottom:'8px', lineHeight:1.4 },
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

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <>
          {/* Hero card */}
          <div style={{ background:'#faf8f5', borderRadius:'16px', border:'1.5px solid #e8e2d9', overflow:'hidden', marginBottom:'20px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr' }}>
              {/* Left: copy */}
              <div style={{ padding:'18px 12px 18px 16px', display:'flex', flexDirection:'column' as const, justifyContent:'center' }}>
                <h1 style={{ fontFamily:'serif', fontSize:'1.25rem', fontWeight:900, color:'#c9943a', marginBottom:'5px', lineHeight:1.2 }}>Mag-sign up</h1>
                <p style={{ fontSize:'.7rem', color:'#6b7280', marginBottom:'13px', lineHeight:1.5 }}>Ilagay ang iyong detalye para makapagsimula.</p>
                <div style={{ display:'flex', flexDirection:'column' as const, gap:'9px' }}>
                  <div style={{ display:'flex', gap:'8px', alignItems:'flex-start' }}>
                    <div style={{ width:'22px', height:'22px', borderRadius:'6px', background:'#f0fdf4', border:'1px solid #bbf7d0', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'12px' }}>🛡️</div>
                    <div>
                      <div style={{ fontSize:'.7rem', fontWeight:700, color:'#1a6b3c', lineHeight:1.3 }}>Ligtas at madali lang!</div>
                      <div style={{ fontSize:'.62rem', color:'#9ca3af', lineHeight:1.4 }}>Protektado ang iyong impormasyon.</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'8px', alignItems:'flex-start' }}>
                    <div style={{ width:'22px', height:'22px', borderRadius:'6px', background:'#fef3e2', border:'1px solid #fde8c0', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'12px' }}>👥</div>
                    <div>
                      <div style={{ fontSize:'.7rem', fontWeight:700, color:'#c9943a', lineHeight:1.3 }}>Trabaho na angkop sa iyo. Sweldo na tama.</div>
                      <div style={{ fontSize:'.62rem', color:'#9ca3af', lineHeight:1.4 }}>Libreng mag-sign up. Walang bayad.</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Right: photo */}
              <div style={{ overflow:'hidden' }}>
                <img
                  src="https://xlagwtsrjbylhxfozoem.supabase.co/storage/v1/object/public/assets/preview.webp"
                  alt="Kasambahay"
                  style={{ width:'100%', height:'100%', minHeight:'200px', objectFit:'cover', display:'block' }}
                />
              </div>
            </div>
          </div>

          {/* Pangalan */}
          <label style={s.lbl}>Pangalan</label>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', fontSize:'14px', lineHeight:1, pointerEvents:'none' }}>👤</span>
            <input style={{ ...s.input, paddingLeft:'38px' }} placeholder="Ana" value={form.first_name} onChange={e => update('first_name', e.target.value)} />
          </div>

          {/* Apelyido */}
          <label style={s.lbl}>Apelyido</label>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', fontSize:'14px', lineHeight:1, pointerEvents:'none' }}>👤</span>
            <input style={{ ...s.input, paddingLeft:'38px' }} placeholder="Santos" value={form.last_name} onChange={e => update('last_name', e.target.value)} />
          </div>

          {/* Mobile Number */}
          <label style={s.lbl}>Mobile Number</label>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', fontSize:'14px', lineHeight:1, pointerEvents:'none' }}>📱</span>
            <input
              style={{ ...s.input, paddingLeft:'38px' }}
              placeholder="09XXXXXXXXX"
              value={form.mobile}
              onChange={e => update('mobile', e.target.value.replace(/\D/g,'').slice(0,11))}
              inputMode="numeric"
              maxLength={11}
            />
          </div>

          {/* Selfie */}
          <div style={{ marginBottom:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'5px' }}>
              <span style={{ fontSize:'.63rem', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'.5px', color:'#1a6b3c' }}>SELFIE</span>
              <span style={{ fontSize:'.63rem', fontWeight:700, color:'#1a6b3c' }}>(required)</span>
            </div>
            <p style={{ fontSize:'.67rem', color:'#6b7280', lineHeight:1.55, marginBottom:'10px' }}>
              Makakatulong ito para makita ka ng employers at mas mapili ka agad. Ipapakita lang ito sa verified employers. Hindi ipo-post publicly.
            </p>

            {selfieData && (
              <img src={selfieData} alt="selfie" style={{ width:'100%', maxHeight:'200px', objectFit:'cover', borderRadius:'11px', marginBottom:'10px' }} />
            )}

            <div
              onClick={() => selfieRef.current?.click()}
              style={{ background: selfieData ? '#f0fdf4' : '#fff', border:`2px dashed #1a6b3c`, borderRadius:'13px', padding:'20px 16px', textAlign:'center' as const, cursor:'pointer' }}
            >
              {selfieData ? (
                <>
                  <div style={{ fontSize:'20px', marginBottom:'5px' }}>✅</div>
                  <div style={{ fontWeight:700, fontSize:'13px', color:'#1a6b3c' }}>Selfie saved!</div>
                  <div style={{ fontSize:'11px', color:'#6b7280', marginTop:'3px' }}>I-tap para palitan</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize:'28px', marginBottom:'7px' }}>📷</div>
                  <div style={{ fontWeight:700, fontSize:'13px', color:'#1a6b3c', marginBottom:'3px' }}>I-tap para kumuha ng selfie</div>
                  <div style={{ fontSize:'11px', color:'#9ca3af' }}>Malinaw na mukha · Walang filter · Good lighting</div>
                </>
              )}
            </div>
            <input
              ref={selfieRef}
              type="file"
              accept="image/*"
              capture={isMobile ? 'user' : undefined}
              style={{ display:'none' }}
              onChange={handleSelfie}
            />
          </div>

          <button
            style={{ ...s.btn, opacity: loading ? .6 : 1 }}
            onClick={checkMobile}
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Magpatuloy →'}
          </button>

          <div style={{ textAlign:'center' as const, marginTop:'12px', fontSize:'.7rem', color:'#9ca3af', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}>
            🔒 Hindi namin ibinibigay ang iyong number sa iba.
          </div>
        </>
      )}

      {/* ── STEP 2: Profile Details ── */}
      {step === 2 && (
        <>
          <div style={s.title}>Karagdagang Impormasyon</div>
          <div style={s.sub}>Kumpleto ang iyong profile para makita ng mga homeowner</div>

          <label style={s.lbl}>Probinsya *</label>
          <div ref={provRef} style={{ position:'relative', marginBottom:'0' }}>
            <div
              onClick={() => setProvOpen(!provOpen)}
              style={{ width:'100%', padding:'11px 13px', border:`1.5px solid ${selProv ? '#c9943a' : '#e5e7eb'}`, borderRadius:'11px', fontSize:'.88rem', background:'#fff', color: selProv ? '#111827' : '#9ca3af', marginBottom: provOpen ? '0' : '13px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', boxSizing:'border-box' as const }}
            >
              <span>{selProv ? selProv.name : 'Piliin ang probinsya'}</span>
              <span style={{ fontSize:'11px', opacity:.5 }}>▾</span>
            </div>
            {provOpen && (
              <div style={{ background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:'11px', marginBottom:'13px', overflow:'hidden', position:'relative', zIndex:50 }}>
                <input
                  autoFocus
                  style={{ width:'100%', padding:'10px 12px', border:'none', borderBottom:'1px solid #f3f4f6', background:'#faf8f5', color:'#111827', fontSize:'13px', outline:'none', fontFamily:'sans-serif' }}
                  placeholder="Hanapin ang probinsya..."
                  value={provSearch}
                  onChange={e => setProvSearch(e.target.value)}
                />
                <div style={{ maxHeight:'190px', overflowY:'auto' }}>
                  {filteredProvs.length === 0
                    ? <div style={{ padding:'12px', fontSize:'12px', color:'#9ca3af' }}>Walang nahanap</div>
                    : filteredProvs.map(p => (
                      <div
                        key={p.code}
                        onClick={() => { setSelProv(p); setProvOpen(false); setProvSearch('') }}
                        style={{ padding:'10px 13px', cursor:'pointer', fontSize:'13px', color: selProv?.code === p.code ? '#c9943a' : '#111827', background: selProv?.code === p.code ? 'rgba(201,148,58,.08)' : 'transparent', borderBottom:'1px solid #f3f4f6' }}
                      >
                        {p.name}
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>

          <label style={s.lbl}>Edad</label>
          <div style={s.hint}>Para malaman ng homeowner ang iyong edad</div>
          <input
            style={s.input}
            type="number"
            placeholder="25"
            min={18}
            max={65}
            value={form.age}
            onChange={e => update('age', e.target.value)}
            inputMode="numeric"
          />

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

          <label style={s.lbl}>Availability</label>
          <select style={s.input} value={form.availability} onChange={e => update('availability', e.target.value)}>
            <option>Immediate</option>
            <option>Within 1 week</option>
            <option>Within 2 weeks</option>
            <option>Within 1 month</option>
          </select>

          <div style={{ background:'#fdf3e3', border:'1px solid rgba(201,148,58,.2)', borderRadius:'12px', padding:'13px 15px', marginBottom:'16px' }}>
            <div style={{ fontSize:'.7rem', fontWeight:800, color:'#c9943a', textTransform:'uppercase' as const, letterSpacing:'.5px', marginBottom:'9px' }}>Bakit MaidIt?</div>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'7px' }}>
              <div style={{ display:'flex', gap:'8px', fontSize:'.8rem', color:'#111827' }}><span>💼</span><span>May trabahong naghihintay sa iyo</span></div>
              <div style={{ display:'flex', gap:'8px', fontSize:'.8rem', color:'#111827' }}><span>⚖️</span><span>Wastong sweldo na naaayon sa batas</span></div>
              <div style={{ display:'flex', gap:'8px', fontSize:'.8rem', color:'#111827' }}><span>🆓</span><span>Libre — walang babayaran para mag-apply</span></div>
            </div>
          </div>

          <div style={{ background:'#fff', border:'1.5px solid #e5e0d8', borderRadius:'12px', padding:'14px', marginBottom:'14px' }}>
            <div style={{ fontSize:'11px', fontWeight:700, color:'#9ca3af', marginBottom:'10px' }}>MGA DOKUMENTO (i-tick kung mayroon)</div>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px' }}>
              {['Wala','PhilHealth ID','SSS ID','Postal ID','Passport','UMID','National ID'].map((label) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' }} onClick={() => toggleGovtId(label)}>
                  <div style={{ width:'20px', height:'20px', borderRadius:'5px', border:'2px solid', borderColor: govtIdTypes.includes(label) ? '#c9943a' : '#d1d5db', background: govtIdTypes.includes(label) ? '#c9943a' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {govtIdTypes.includes(label) && <span style={{ color:'#fff', fontSize:'11px', fontWeight:900 }}>✓</span>}
                  </div>
                  <span style={{ fontSize:'13px', color:'#374151' }}>{label}</span>
                </div>
              ))}
              <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:'10px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' }} onClick={() => setHasNbi(!hasNbi)}>
                  <div style={{ width:'20px', height:'20px', borderRadius:'5px', border:'2px solid', borderColor: hasNbi ? '#1a6b3c' : '#d1d5db', background: hasNbi ? '#1a6b3c' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {hasNbi && <span style={{ color:'#fff', fontSize:'11px', fontWeight:900 }}>✓</span>}
                  </div>
                  <span style={{ fontSize:'13px', color:'#374151' }}>NBI Clearance</span>
                </div>
              </div>
            </div>
          </div>

          <label style={s.lbl}>Facebook Profile Link <span style={{ fontWeight:400, textTransform:'none' as const, letterSpacing:0 }}>(kung meron)</span></label>
          <div style={s.hint}>Para makontak ka ng homeowner sa Facebook</div>
          <input
            style={s.input}
            placeholder="https://facebook.com/iyong-pangalan"
            value={form.facebook_url}
            onChange={e => update('facebook_url', e.target.value)}
            inputMode="url"
          />

          <div style={s.note}>
            📱 Magpapadala kami ng 6-digit verification code sa <strong>{form.mobile}</strong> sa susunod na hakbang.
          </div>

          <button
            style={{ ...s.btn, opacity: loading ? .6 : 1 }}
            onClick={sendOtpAndProceed}
            disabled={loading}
          >
            {loading ? 'Sending code...' : 'Susunod — I-verify ang Number →'}
          </button>
        </>
      )}

      {/* ── STEP 3: OTP Verification ── */}
      {step === 3 && (
        <>
          <div style={s.title}>I-verify ang number mo</div>
          <div style={s.sub}>
            Nagpadala kami ng 6-digit code sa <strong style={{ color:'#111827' }}>{form.mobile}</strong>. Kung hindi natanggap, normal lang — ang SMS sender name ay nasa approval pa ng Semaphore. Gamitin ang Dev Mode bypass sa itaas.
          </div>

          {process.env.NEXT_PUBLIC_DEV_MODE === 'true' && (
            <div style={{ background:'#fffbeb', border:'2px solid #f59e0b', borderRadius:'10px', padding:'12px 13px', marginBottom:'13px' }}>
              <div style={{ fontSize:'.74rem', color:'#92400e', lineHeight:1.6, marginBottom:'10px' }}>
                🔧 <strong>Dev Mode:</strong> Ang SMS verification ay hindi pa available dahil ang Semaphore sender name ay nasa approval pa. I-skip ang OTP para sa testing.
              </div>
              {sentOtp && (
                <div style={{ fontFamily:'monospace', fontSize:'1.1rem', fontWeight:900, color:'#92400e', letterSpacing:'6px', marginBottom:'10px' }}>{sentOtp}</div>
              )}
              <button
                style={{ width:'100%', padding:'10px', borderRadius:'9px', background:'#f59e0b', border:'none', color:'#fff', fontFamily:'sans-serif', fontSize:'.82rem', fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .6 : 1 }}
                onClick={createAccount}
                disabled={loading}
              >
                {loading ? 'Ginagawa...' : 'I-skip ang OTP (Semaphore Pending Approval) →'}
              </button>
            </div>
          )}

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
            onClick={verifyAndCreate}
            disabled={loading || form.otp.length < 6}
          >
            {loading ? 'Ginagawa...' : 'I-verify at Gumawa ng Account →'}
          </button>

          <button
            style={{ width:'100%', padding:'11px', marginTop:'10px', background:'transparent', border:'1.5px solid #e5e7eb', borderRadius:'12px', fontFamily:'sans-serif', fontSize:'.82rem', color:'#6b7280', cursor: cooldown > 0 ? 'not-allowed' : 'pointer' }}
            onClick={resendOtp}
            disabled={cooldown > 0 || loading}
          >
            {cooldown > 0 ? `I-resend sa ${cooldown}s` : 'I-resend ang code'}
          </button>
        </>
      )}
    </div>
  )
}
