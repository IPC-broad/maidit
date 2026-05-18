'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Province = { code: string; name: string }

export default function KasambahaySignup() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [hasNbi, setHasNbi] = useState(false)
  const [hasPoliceClearance, setHasPoliceClearance] = useState(false)
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
  const hasGovtId = govtIdTypes.length > 0 && !govtIdTypes.includes('Wala')

  const [skills, setSkills] = useState<string[]>([])
  const toggleSkill = (s: string) =>
    setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  // Province dropdown
  const [provinces, setProvinces] = useState<Province[]>([])
  const [provSearch, setProvSearch] = useState('')
  const [provOpen, setProvOpen] = useState(false)
  const [selProv, setSelProv] = useState<Province | null>(null)
  const provRef = useRef<HTMLDivElement>(null)

  // Selfie
  const [selfieData, setSelfieData] = useState<string | null>(null)
  const selfieRef = useRef<HTMLInputElement>(null)
  const idRef = useRef<HTMLInputElement>(null)
  const policeRef = useRef<HTMLInputElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [refParam, setRefParam] = useState('')
  const [walaPaDocs, setWalaPaDocs] = useState(false)
  const [idFile, setIdFile] = useState<string | null>(null)
  const [policeFile, setPoliceFile] = useState<string | null>(null)

  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref) { localStorage.setItem('maidit_ref', ref); setRefParam(ref) }
  }, [])

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    mobile: '',
    password: '',
    age: '',
    salary: '',
    setup: 'Stay-in',
    experience: 'Baguhan',
    availability: 'Immediate',
    facebook_url: '',
    civil_status: 'Single',
    num_children: '0'
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

  const handleIdFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setIdFile(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handlePoliceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPoliceFile(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSelfie = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setSelfieData(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const checkMobile = () => {
    if (!form.first_name || !form.last_name || !form.mobile || !form.password) {
      setError('Punan ang lahat ng fields')
      return
    }
    if (form.mobile.length < 11) {
      setError('Ilagay ang tamang mobile number (11 digits)')
      return
    }
    if (form.password.length < 8) {
      setError('Ang password ay dapat ay hindi bababa sa 8 characters')
      return
    }
    setError('')
    setStep(2)
  }

  const handleStep2 = () => {
    if (!selProv || !form.salary) {
      setError('Punan ang lahat ng fields')
      return
    }
    setError('')
    createAccount()
  }

  const createAccount = async () => {
    setError('')
    setLoading(true)

    const { supabase } = await import('../../../lib/supabase')

    const autoEmail = `kb_${form.mobile}@maidit.app`

    const { data, error } = await supabase.auth.signUp({
      email: autoEmail,
      password: form.password
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

    const finalGovtIdTypes = walaPaDocs ? ['Wala'] : idFile ? [...govtIdTypes.filter(x => x !== 'Wala'), 'ID Uploaded'] : govtIdTypes
    const finalHasGovtId = !walaPaDocs && (idFile ? true : hasGovtId)

    await supabase.from('kasambahay').insert({
      profile_id: userId,
      asking_salary: parseInt(form.salary),
      setup: form.setup,
      has_nbi: hasNbi,
      has_police_clearance: policeFile ? true : hasPoliceClearance,
      govt_id_types: finalGovtIdTypes,
      has_govt_id: finalHasGovtId,
      experience: form.experience,
      province: selProv!.name,
      age: form.age ? parseInt(form.age) : null,
      availability: form.availability || 'Immediate',
      skills: skills,
      civil_status: form.civil_status,
      num_children: form.num_children,
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

    if (idFile && userId) {
      try {
        const blob = await fetch(idFile).then(r => r.blob())
        await supabase.storage.from('Selfies').upload(`${userId}/govt_id.png`, blob, { upsert: true, contentType: 'image/png' })
      } catch {}
    }

    if (policeFile && userId) {
      try {
        const blob = await fetch(policeFile).then(r => r.blob())
        await supabase.storage.from('Selfies').upload(`${userId}/police_clearance.png`, blob, { upsert: true, contentType: 'image/png' })
      } catch {}
    }

    setLoading(false)
    setSuccess(true)
  }

  const s: any = {
    wrap: { minHeight:'100vh', background:'#faf8f5', padding:'24px 20px', fontFamily:'sans-serif', color:'#111827' },
    toprow: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' },
    back: { background:'none', border:'none', fontSize:'1rem', color:'#6b7280', cursor:'pointer', padding:0 },
    stepnum: { fontSize:'13px', color:'#9ca3af' },
    bar: { display:'flex', gap:'4px', marginBottom:'22px' },
    seg: (active: boolean) => ({ flex:1, height:'4px', borderRadius:'2px', background: active ? '#1a6b3c' : '#e5e7eb' }),
    title: { fontWeight:900, fontSize:'22px', marginBottom:'5px', color:'#c9943a' },
    sub: { fontSize:'14px', color:'#6b7280', marginBottom:'20px', lineHeight:1.5 },
    lbl: { display:'block', fontSize:'15px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'.5px', color:'#6b7280', marginBottom:'4px' },
    hint: { fontSize:'14px', color:'#9ca3af', marginBottom:'8px', lineHeight:1.4 },
    input: { width:'100%', padding:'11px 13px', border:'1.5px solid #e5e7eb', borderRadius:'11px', fontFamily:'sans-serif', fontSize:'16px', outline:'none', marginBottom:'13px', background:'#fff', color:'#111827' },
    btn: { width:'100%', padding:'13px', borderRadius:'12px', border:'none', background:'#c9943a', color:'#fff', fontFamily:'sans-serif', fontSize:'16px', fontWeight:700, cursor:'pointer' },
    err: { background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'9px', padding:'10px 13px', fontSize:'14px', color:'#dc2626', marginBottom:'13px' },
    note: { background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'10px', padding:'11px 13px', marginBottom:'16px', fontSize:'14px', color:'#92400e', lineHeight:1.6 }
  }

  if (success) return (
    <div style={{ minHeight:'100vh', background:'#faf8f5', padding:'40px 20px', fontFamily:'sans-serif', display:'flex', flexDirection:'column' as const, alignItems:'center', justifyContent:'center', textAlign:'center' as const }}>
      <div style={{ fontSize:'52px', marginBottom:'20px' }}>🎉</div>
      <h1 style={{ fontFamily:'serif', fontSize:'28px', fontWeight:900, color:'#1a6b3c', marginBottom:'10px', lineHeight:1.2 }}>
        Na-sign up ka na!
      </h1>
      <p style={{ fontSize:'16px', color:'#6b7280', lineHeight:1.6, marginBottom:'28px', maxWidth:'300px' }}>
        Maaari ka nang makatanggap ng mga job offer.
      </p>
      <button
        style={{ padding:'14px 28px', borderRadius:'13px', border:'none', background:'#1a6b3c', color:'#fff', fontFamily:'sans-serif', fontSize:'16px', fontWeight:700, cursor:'pointer' }}
        onClick={() => router.push('/dashboard/kasambahay')}
      >
        Pumunta sa Dashboard →
      </button>
    </div>
  )

  return (
    <div style={s.wrap}>
      <div style={s.toprow}>
        <button style={s.back} onClick={() => step > 1 ? setStep(step - 1) : router.push('/')}>← Back</button>
        <span style={s.stepnum}>Hakbang {step} ng 2</span>
      </div>

      <div style={s.bar}>
        {[1,2].map(i => <div key={i} style={s.seg(i <= step)} />)}
      </div>

      {error && <div style={s.err}>⚠️ {error}</div>}

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <>
          {/* Forest green header */}
          <div style={{ background:'#1a6b3c', borderRadius:'16px', padding:'22px 18px', marginBottom:'20px' }}>
            <h1 style={{ fontFamily:'serif', fontSize:'26px', fontWeight:900, color:'#fff', marginBottom:'6px', lineHeight:1.2 }}>
              Mag-sign up bilang Kasambahay
            </h1>
            <p style={{ fontSize:'14px', color:'rgba(255,255,255,.8)', lineHeight:1.5, margin:0 }}>
              Libre. Ligtas. Trabahong para sa iyo.
            </p>
            {refParam && (
              <div style={{ marginTop:'12px', background:'rgba(255,255,255,.15)', borderRadius:'8px', padding:'7px 11px', fontSize:'12px', color:'#fff', fontWeight:700, display:'inline-flex', alignItems:'center', gap:'6px' }}>
                ✓ May referral code: {refParam}
              </div>
            )}
          </div>

          {/* Pangalan + Apelyido — side by side */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'0' }}>
            <div>
              <label style={s.lbl}>Pangalan</label>
              <input style={s.input} placeholder="Ana" value={form.first_name} onChange={e => update('first_name', e.target.value)} />
            </div>
            <div>
              <label style={s.lbl}>Apelyido</label>
              <input style={s.input} placeholder="Santos" value={form.last_name} onChange={e => update('last_name', e.target.value)} />
            </div>
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

          {/* Password */}
          <label style={s.lbl}>Lumikha ng Password</label>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', fontSize:'14px', lineHeight:1, pointerEvents:'none' }}>🔒</span>
            <input
              style={{ ...s.input, paddingLeft:'38px' }}
              type="password"
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={e => update('password', e.target.value)}
            />
          </div>

          {/* Selfie */}
          <div style={{ marginBottom:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'5px' }}>
              <span style={{ fontSize:'15px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'.5px', color:'#1a6b3c' }}>SELFIE</span>
              <span style={{ fontSize:'15px', fontWeight:700, color:'#1a6b3c' }}>(required)</span>
            </div>
            <p style={{ fontSize:'14px', color:'#6b7280', lineHeight:1.55, marginBottom:'10px' }}>
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
                  <div style={{ fontWeight:700, fontSize:'15px', color:'#1a6b3c' }}>Selfie saved!</div>
                  <div style={{ fontSize:'14px', color:'#6b7280', marginTop:'3px' }}>I-tap para palitan</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize:'28px', marginBottom:'7px' }}>📷</div>
                  <div style={{ fontWeight:700, fontSize:'15px', color:'#1a6b3c', marginBottom:'3px' }}>I-tap para kumuha ng selfie</div>
                  <div style={{ fontSize:'14px', color:'#9ca3af' }}>Malinaw na mukha · Walang filter · Good lighting</div>
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

          <div style={{ textAlign:'center' as const, marginTop:'12px', fontSize:'14px', color:'#9ca3af', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}>
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
                  style={{ width:'100%', padding:'10px 12px', border:'none', borderBottom:'1px solid #f3f4f6', background:'#faf8f5', color:'#111827', fontSize:'16px', outline:'none', fontFamily:'sans-serif' }}
                  placeholder="Hanapin ang probinsya..."
                  value={provSearch}
                  onChange={e => setProvSearch(e.target.value)}
                />
                <div style={{ maxHeight:'190px', overflowY:'auto' }}>
                  {filteredProvs.length === 0
                    ? <div style={{ padding:'12px', fontSize:'15px', color:'#9ca3af' }}>Walang nahanap</div>
                    : filteredProvs.map(p => (
                      <div
                        key={p.code}
                        onClick={() => { setSelProv(p); setProvOpen(false); setProvSearch('') }}
                        style={{ padding:'10px 13px', cursor:'pointer', fontSize:'15px', color: selProv?.code === p.code ? '#c9943a' : '#111827', background: selProv?.code === p.code ? 'rgba(201,148,58,.08)' : 'transparent', borderBottom:'1px solid #f3f4f6' }}
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

          <label style={s.lbl}>Kelan ka pwede magsimula ng trabaho?</label>
          <select style={s.input} value={form.availability} onChange={e => update('availability', e.target.value)}>
            <option value="Immediate">Pwede na agad</option>
            <option value="Within 1 week">Sa loob ng 1 linggo</option>
            <option value="Within 2 weeks">Sa loob ng 2 linggo</option>
            <option value="Within 1 month">Sa loob ng 1 buwan</option>
            <option value="Flexible">Flexible</option>
          </select>

          <div style={{ background:'#fdf3e3', border:'1px solid rgba(201,148,58,.2)', borderRadius:'12px', padding:'13px 15px', marginBottom:'16px' }}>
            <div style={{ fontSize:'14px', fontWeight:800, color:'#c9943a', textTransform:'uppercase' as const, letterSpacing:'.5px', marginBottom:'9px' }}>Bakit MaidIt?</div>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'7px' }}>
              <div style={{ display:'flex', gap:'8px', fontSize:'15px', color:'#111827' }}><span>💼</span><span>May trabahong naghihintay sa iyo</span></div>
              <div style={{ display:'flex', gap:'8px', fontSize:'15px', color:'#111827' }}><span>⚖️</span><span>Wastong sweldo na naaayon sa batas</span></div>
              <div style={{ display:'flex', gap:'8px', fontSize:'15px', color:'#111827' }}><span>🆓</span><span>Libre — walang babayaran para mag-apply</span></div>
            </div>
          </div>

          <div style={{ background:'#fff', border:'1.5px solid #e5e0d8', borderRadius:'12px', padding:'14px', marginBottom:'14px' }}>
            <div style={{ fontSize:'13px', fontWeight:700, color:'#9ca3af', marginBottom:'10px' }}>KASANAYAN (Skills)</div>
            <div style={{ display:'flex', flexWrap:'wrap' as const, gap:'8px' }}>
              {['All-Around Maid (Lahat ng gawaing bahay)','Pagluluto','Paglalaba','Paglilinis','Pag-aalaga ng Bata','Pag-aalaga ng Matanda','Pag-aalaga ng Alagang Hayop','Pamimili','Pagmamaneho'].map(skill => (
                <div
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 11px', borderRadius:'20px', border:`1.5px solid ${skills.includes(skill) ? '#c9943a' : '#e5e7eb'}`, background: skills.includes(skill) ? 'rgba(201,148,58,.1)' : '#fff', cursor:'pointer', fontSize:'15px', color: skills.includes(skill) ? '#c9943a' : '#374151', fontWeight: skills.includes(skill) ? 700 : 400 }}
                >
                  {skills.includes(skill) && <span style={{ fontSize:'10px' }}>✓ </span>}
                  {skill}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:'#fff', border:'1.5px solid #e5e0d8', borderRadius:'12px', padding:'14px', marginBottom:'14px' }}>
            <div style={{ fontSize:'13px', fontWeight:700, color:'#9ca3af', marginBottom:'10px' }}>KATAYUAN SA PAMILYA</div>

            <label style={s.lbl}>Civil Status</label>
            <div style={{ display:'flex', flexWrap:'wrap' as const, gap:'8px', marginBottom:'14px' }}>
              {[['Single','Single'],['Kasal','Married'],['Hiwalay','Separated'],['Biyuda/Biyudo','Widowed']].map(([val, eng]) => (
                <div
                  key={val}
                  onClick={() => update('civil_status', val)}
                  style={{ display:'flex', alignItems:'center', gap:'7px', padding:'8px 12px', borderRadius:'20px', border:`1.5px solid ${form.civil_status === val ? '#1a6b3c' : '#e5e7eb'}`, background: form.civil_status === val ? 'rgba(26,107,60,.08)' : '#fff', cursor:'pointer', fontSize:'15px', color: form.civil_status === val ? '#1a6b3c' : '#374151', fontWeight: form.civil_status === val ? 700 : 400 }}
                >
                  {form.civil_status === val && <span style={{ fontSize:'10px' }}>✓ </span>}
                  {val} <span style={{ color:'#9ca3af', fontWeight:400 }}>({eng})</span>
                </div>
              ))}
            </div>

            <label style={s.lbl}>Bilang ng Anak</label>
            <select style={s.input} value={form.num_children} onChange={e => update('num_children', e.target.value)}>
              {['0','1','2','3','4','5','6','7','8','9','10+'].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div style={{ background:'#fff', border:'1.5px solid #e5e0d8', borderRadius:'12px', padding:'14px', marginBottom:'14px' }}>
            <div style={{ fontSize:'13px', fontWeight:700, color:'#9ca3af', marginBottom:'12px' }}>MGA DOKUMENTO</div>

            {/* Wala pa */}
            <div style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', marginBottom:'14px' }} onClick={() => { setWalaPaDocs(!walaPaDocs); setIdFile(null); setPoliceFile(null) }}>
              <div style={{ width:'22px', height:'22px', borderRadius:'5px', border:'2px solid', borderColor: walaPaDocs ? '#c9943a' : '#d1d5db', background: walaPaDocs ? '#c9943a' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {walaPaDocs && <span style={{ color:'#fff', fontSize:'13px', fontWeight:900 }}>✓</span>}
              </div>
              <span style={{ fontSize:'15px', color:'#374151', fontWeight: walaPaDocs ? 700 : 400 }}>Wala pa akong dokumento</span>
            </div>

            {!walaPaDocs && (
              <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px' }}>
                {/* Government ID upload */}
                <div>
                  <div style={{ fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'7px' }}>Government ID</div>
                  <div
                    onClick={() => idRef.current?.click()}
                    style={{ border:`2px dashed ${idFile ? '#1a6b3c' : '#d1d5db'}`, borderRadius:'10px', padding:'12px 14px', cursor:'pointer', background: idFile ? '#f0fdf4' : '#fafafa', display:'flex', alignItems:'center', gap:'10px' }}
                  >
                    <span style={{ fontSize:'20px' }}>{idFile ? '✅' : '📎'}</span>
                    <span style={{ fontSize:'14px', color: idFile ? '#1a6b3c' : '#6b7280', fontWeight: idFile ? 700 : 400 }}>
                      {idFile ? 'Na-upload ang ID' : 'I-upload ang Government ID'}
                    </span>
                  </div>
                  <input ref={idRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleIdFile} />
                </div>

                {/* Police Clearance upload */}
                <div>
                  <div style={{ fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'7px' }}>Police Clearance</div>
                  <div
                    onClick={() => policeRef.current?.click()}
                    style={{ border:`2px dashed ${policeFile ? '#1a6b3c' : '#d1d5db'}`, borderRadius:'10px', padding:'12px 14px', cursor:'pointer', background: policeFile ? '#f0fdf4' : '#fafafa', display:'flex', alignItems:'center', gap:'10px' }}
                  >
                    <span style={{ fontSize:'20px' }}>{policeFile ? '✅' : '📎'}</span>
                    <span style={{ fontSize:'14px', color: policeFile ? '#1a6b3c' : '#6b7280', fontWeight: policeFile ? 700 : 400 }}>
                      {policeFile ? 'Na-upload ang Police Clearance' : 'I-upload ang Police Clearance'}
                    </span>
                  </div>
                  <input ref={policeRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePoliceFile} />
                </div>

                {/* NBI checkbox */}
                <div style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' }} onClick={() => setHasNbi(!hasNbi)}>
                  <div style={{ width:'22px', height:'22px', borderRadius:'5px', border:'2px solid', borderColor: hasNbi ? '#1a6b3c' : '#d1d5db', background: hasNbi ? '#1a6b3c' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {hasNbi && <span style={{ color:'#fff', fontSize:'13px', fontWeight:900 }}>✓</span>}
                  </div>
                  <span style={{ fontSize:'15px', color:'#374151' }}>Mayroon akong NBI Clearance</span>
                </div>
              </div>
            )}

            {/* Amber tip */}
            <div style={{ background:'#fef3e2', border:'1px solid #fde8c0', borderRadius:'10px', padding:'10px 13px', marginTop:'14px', fontSize:'13px', color:'#92400e', lineHeight:1.6 }}>
              💡 <strong>Malaki ang tyansa mong mapili</strong> kung may dokumento ka. Pwede ito i-upload mamaya sa iyong profile.
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

          <button
            style={{ ...s.btn, opacity: loading ? .6 : 1 }}
            onClick={handleStep2}
            disabled={loading}
          >
            {loading ? 'Ginagawa ang account...' : 'Gumawa ng Account →'}
          </button>
        </>
      )}
    </div>
  )
}
