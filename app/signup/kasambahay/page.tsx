'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const C = {
  forest: '#1a6b3c', forestDeep: '#27500A', forestDark: '#1c3b07',
  amber: '#c9943a', amberSoft: '#fef3e2', amberLine: '#fde8c0',
  ink: '#111827', ink2: '#6b7280', ink3: '#9ca3af',
  paper: '#ffffff', paper2: '#faf8f5', line: '#e5e7eb',
}
const serif = "'Instrument Serif', Georgia, serif"
const sans  = "ui-sans-serif, system-ui, sans-serif"

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
  const toggleSkill = (sk: string) =>
    setSkills(prev => prev.includes(sk) ? prev.filter(x => x !== sk) : [...prev, sk])

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

  // Show/hide password
  const [showPassword, setShowPassword] = useState(false)

  // Facebook OAuth detection
  const [isFacebook, setIsFacebook] = useState(false)
  const [fbUserId, setFbUserId] = useState('')
  const [fbProviderId, setFbProviderId] = useState('')

  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600;700&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    return () => { try { document.head.removeChild(link) } catch {} }
  }, [])

  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref) { localStorage.setItem('maidit_ref', ref); setRefParam(ref) }
  }, [])

  useEffect(() => {
    const detectFacebook = async () => {
      const { supabase } = await import('../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.app_metadata?.provider === 'facebook') {
        setIsFacebook(true)
        setFbUserId(user.id)
        setFbProviderId(user.user_metadata?.provider_id || '')
        const fullName = (user.user_metadata?.full_name || '').trim()
        const parts = fullName.split(' ')
        setForm(f => ({
          ...f,
          first_name: parts[0] || f.first_name,
          last_name: parts.slice(1).join(' ') || f.last_name,
        }))
      }
    }
    detectFacebook()
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
    if (!form.first_name || !form.last_name || !form.mobile) {
      setError('Punan ang lahat ng fields')
      return
    }
    if (!isFacebook && !form.password) {
      setError('Punan ang lahat ng fields')
      return
    }
    if (form.mobile.length < 11) {
      setError('Ilagay ang tamang mobile number (11 digits)')
      return
    }
    if (!isFacebook && form.password.length < 8) {
      setError('Ang password ay dapat ay hindi bababa sa 8 characters')
      return
    }
    if (!form.age) {
      setError('Ilagay ang iyong edad')
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

    let userId: string

    if (isFacebook && fbUserId) {
      userId = fbUserId
    } else {
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
      userId = data.user?.id!
    }

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
      ...(fbProviderId ? { facebook_url: `https://facebook.com/${fbProviderId}` } : {}),
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

    // Auto-revoke proxy if another profile with same mobile was partner-managed
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('mobile', form.mobile)
      .neq('id', userId)
    const existingIds = (existingProfiles || []).map((p: any) => p.id)
    if (existingIds.length > 0) {
      await supabase.from('kasambahay')
        .update({ proxy_mode: false, proxy_partner_id: null })
        .in('profile_id', existingIds)
        .eq('proxy_mode', true)
    }

    setLoading(false)
    setSuccess(true)
  }

  // num_children stepper helpers
  const numChildrenDisplay = (v: string) => v
  const decrementChildren = () => {
    const cur = form.num_children === '10+' ? 10 : parseInt(form.num_children)
    if (cur <= 0) return
    update('num_children', String(cur - 1))
  }
  const incrementChildren = () => {
    const cur = form.num_children === '10+' ? 10 : parseInt(form.num_children)
    if (cur >= 10) { update('num_children', '10+'); return }
    update('num_children', String(cur + 1))
  }

  const s: any = {
    wrap: { minHeight:'100vh', background:C.paper2, padding:'24px 20px', fontFamily:sans, color:C.ink },
    toprow: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' },
    back: { background:'none', border:'none', fontSize:'1rem', color:C.ink2, cursor:'pointer', padding:0, fontFamily:sans },
    stepnum: { fontSize:'13px', color:C.ink3, fontFamily:sans },
    bar: { display:'flex', gap:'4px', marginBottom:'22px' },
    seg: (active: boolean) => ({ flex:1, height:'4px', borderRadius:'2px', background: active ? C.forest : C.line }),
    title: { fontFamily:serif, fontWeight:900, fontSize:'22px', marginBottom:'5px', color:C.forest },
    sub: { fontSize:'14px', color:C.ink2, marginBottom:'20px', lineHeight:1.5, fontFamily:sans },
    lbl: { display:'block', fontSize:'11px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'.07em', color:C.ink3, marginBottom:'5px', fontFamily:sans },
    hint: { fontSize:'13px', color:C.ink3, marginBottom:'8px', lineHeight:1.4, fontFamily:sans },
    input: { width:'100%', padding:'11px 13px', border:`1.5px solid ${C.line}`, borderRadius:'11px', fontFamily:sans, fontSize:'15px', outline:'none', marginBottom:'13px', background:C.paper, color:C.ink },
    btn: { width:'100%', padding:'13px', borderRadius:'12px', border:'none', background:C.forest, color:'#fff', fontFamily:sans, fontSize:'16px', fontWeight:700, cursor:'pointer' },
    err: { background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'9px', padding:'10px 13px', fontSize:'14px', color:'#dc2626', marginBottom:'13px', fontFamily:sans },
    note: { background:C.amberSoft, border:`1px solid ${C.amberLine}`, borderRadius:'10px', padding:'11px 13px', marginBottom:'16px', fontSize:'14px', color:'#92400e', lineHeight:1.6, fontFamily:sans },
    pill: (selected: boolean, variant: 'forest' | 'amber' = 'forest') => ({
      padding: '9px 16px',
      borderRadius: '999px',
      border: `1.5px solid ${selected ? (variant === 'amber' ? C.amber : C.forest) : C.line}`,
      background: selected ? (variant === 'amber' ? C.amberSoft : C.forest) : C.paper,
      color: selected ? (variant === 'amber' ? C.amber : '#fff') : C.ink2,
      fontFamily: sans,
      fontSize: '14px',
      fontWeight: selected ? 700 : 400,
      cursor: 'pointer',
      whiteSpace: 'nowrap' as const,
    }),
    sectionBox: { background:C.paper, border:`1.5px solid #e5e0d8`, borderRadius:'12px', padding:'14px', marginBottom:'14px' },
    sectionTitle: { fontSize:'11px', fontWeight:700, color:C.ink3, textTransform:'uppercase' as const, letterSpacing:'.07em', marginBottom:'12px', fontFamily:sans },
  }

  if (success) return (
    <div style={{ minHeight:'100vh', background:C.paper2, padding:'40px 20px', fontFamily:sans, display:'flex', flexDirection:'column' as const, alignItems:'center', justifyContent:'center', textAlign:'center' as const }}>
      <div style={{ fontSize:'52px', marginBottom:'20px' }}>🎉</div>
      <h1 style={{ fontFamily:serif, fontSize:'30px', fontWeight:400, color:C.forestDeep, marginBottom:'10px', lineHeight:1.2 }}>
        Na-sign up ka na!
      </h1>
      <p style={{ fontSize:'15px', color:C.ink2, lineHeight:1.6, marginBottom:'28px', maxWidth:'300px', fontFamily:sans }}>
        Maaari ka nang makatanggap ng mga job offer.
      </p>
      <button
        style={{ padding:'14px 28px', borderRadius:'13px', border:'none', background:C.forest, color:'#fff', fontFamily:sans, fontSize:'16px', fontWeight:700, cursor:'pointer' }}
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
          <div style={{ background:`linear-gradient(160deg, ${C.forestDark} 0%, ${C.forestDeep} 100%)`, borderRadius:'16px', padding:'22px 18px', marginBottom:'24px' }}>
            <h1 style={{ fontFamily:serif, fontSize:'28px', fontWeight:400, color:'#fff', marginBottom:'6px', lineHeight:1.2 }}>
              Mag-sign up bilang Kasambahay
            </h1>
            <p style={{ fontSize:'14px', color:'rgba(255,255,255,.78)', lineHeight:1.5, margin:0, fontFamily:sans }}>
              Libre. Ligtas. Trabahong para sa iyo.
            </p>
            {refParam && (
              <div style={{ marginTop:'12px', background:'rgba(255,255,255,.15)', borderRadius:'8px', padding:'7px 11px', fontSize:'12px', color:'#fff', fontWeight:700, display:'inline-flex', alignItems:'center', gap:'6px', fontFamily:sans }}>
                ✓ May referral code: {refParam}
              </div>
            )}
          </div>

          <h2 style={{ fontFamily:serif, fontSize:'26px', fontWeight:400, color:C.forest, marginBottom:'6px', lineHeight:1.2 }}>
            Simulan natin.
          </h2>
          <p style={{ fontFamily:sans, fontSize:'14px', color:C.ink2, marginBottom:'20px', lineHeight:1.5 }}>
            Punan ang iyong mga detalye para makapagsimula.
          </p>

          {/* 1. Pangalan + Apelyido — side by side */}
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

          {/* 2. Cellphone */}
          <label style={s.lbl}>Cellphone</label>
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

          {/* Facebook notice */}
          {isFacebook && (
            <div style={s.note}>
              🔗 Naka-connect ang iyong Facebook account.
            </div>
          )}

          {/* 3. Password — hidden for Facebook users */}
          {!isFacebook && (
            <>
              <label style={s.lbl}>Password</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', fontSize:'14px', lineHeight:1, pointerEvents:'none' }}>🔒</span>
                <input
                  style={{ ...s.input, paddingLeft:'38px', paddingRight:'44px' }}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{ position:'absolute', right:'13px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'14px', color:C.ink3, padding:0, lineHeight:1, marginBottom:'13px' }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </>
          )}

          {/* 4. Edad + Probinsya — side by side 2-column */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'13px' }}>
            {/* Left: Edad */}
            <div>
              <label style={s.lbl}>Edad</label>
              <input
                style={{ ...s.input, marginBottom:0 }}
                type="number"
                placeholder="25"
                min={18}
                max={65}
                value={form.age}
                onChange={e => update('age', e.target.value)}
                inputMode="numeric"
              />
            </div>
            {/* Right: Probinsya */}
            <div ref={provRef} style={{ position:'relative' }}>
              <label style={s.lbl}>Probinsya</label>
              <div
                onClick={() => setProvOpen(!provOpen)}
                style={{ width:'100%', padding:'11px 13px', border:`1.5px solid ${selProv ? C.amber : C.line}`, borderRadius:'11px', fontSize:'15px', background:C.paper, color: selProv ? C.ink : C.ink3, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', boxSizing:'border-box' as const, height:'45px' }}
              >
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const, fontSize:'14px' }}>
                  {selProv ? selProv.name : 'Piliin...'}
                </span>
                <span style={{ fontSize:'11px', opacity:.5, flexShrink:0, marginLeft:'4px' }}>▾</span>
              </div>
              {provOpen && (
                <div style={{ position:'absolute', top:'100%', left:0, right:0, background:C.paper, border:`1.5px solid ${C.line}`, borderRadius:'11px', zIndex:100, overflow:'hidden', marginTop:'4px' }}>
                  <input
                    autoFocus
                    style={{ width:'100%', padding:'10px 12px', border:'none', borderBottom:`1px solid ${C.line}`, background:C.paper2, color:C.ink, fontSize:'14px', outline:'none', fontFamily:sans, boxSizing:'border-box' as const }}
                    placeholder="Hanapin..."
                    value={provSearch}
                    onChange={e => setProvSearch(e.target.value)}
                  />
                  <div style={{ maxHeight:'190px', overflowY:'auto' as const }}>
                    {filteredProvs.length === 0
                      ? <div style={{ padding:'12px', fontSize:'14px', color:C.ink3 }}>Walang nahanap</div>
                      : filteredProvs.map(p => (
                        <div
                          key={p.code}
                          onClick={() => { setSelProv(p); setProvOpen(false); setProvSearch('') }}
                          style={{ padding:'10px 13px', cursor:'pointer', fontSize:'14px', color: selProv?.code === p.code ? C.amber : C.ink, background: selProv?.code === p.code ? C.amberSoft : 'transparent', borderBottom:`1px solid ${C.line}` }}
                        >
                          {p.name}
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5. Setup — 3 pills */}
          <label style={s.lbl}>Setup</label>
          <div style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap' as const }}>
            {[
              { label: 'Stay-in', value: 'Stay-in' },
              { label: 'Stay-out', value: 'Stay-out' },
              { label: 'Pareho okay', value: 'Kahit alin' },
            ].map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => update('setup', value)}
                style={s.pill(form.setup === value, 'forest')}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            style={{ ...s.btn, background:C.amber, opacity: loading ? .6 : 1 }}
            onClick={checkMobile}
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Susunod →'}
          </button>

          <div style={{ textAlign:'center' as const, marginTop:'12px', fontSize:'14px', color:C.ink3, display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}>
            🔒 Hindi namin ibinibigay ang iyong number sa iba.
          </div>
        </>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <>
          <h2 style={{ fontFamily:serif, fontSize:'26px', fontWeight:400, color:C.forest, marginBottom:'20px', lineHeight:1.2 }}>
            Ano ang magagawa mo?
          </h2>

          {/* 1. Skills — 2-column grid */}
          <div style={s.sectionBox}>
            <div style={s.sectionTitle}>Kasanayan (Skills)</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              {[
                'Pagluluto','Paglalaba','Paglilinis','Pag-aalaga ng Bata',
                'Pag-aalaga ng Matanda','Pag-aalaga ng Alagang Hayop','Pamimili','Pagmamaneho'
              ].map(skill => (
                <div
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  style={{
                    padding: '9px 11px',
                    borderRadius: '10px',
                    border: `1.5px solid ${skills.includes(skill) ? C.amber : C.line}`,
                    background: skills.includes(skill) ? C.amberSoft : C.paper,
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: skills.includes(skill) ? C.amber : C.ink2,
                    fontWeight: skills.includes(skill) ? 700 : 400,
                    fontFamily: sans,
                    textAlign: 'center' as const,
                    lineHeight: 1.3,
                  }}
                >
                  {skill}
                </div>
              ))}
            </div>
          </div>

          {/* 2. Civil Status — pills */}
          <div style={s.sectionBox}>
            <div style={s.sectionTitle}>Civil Status</div>
            <div style={{ display:'flex', flexWrap:'wrap' as const, gap:'8px' }}>
              {['Single', 'Kasal', 'Hiwalay', 'Biyuda/Biyudo'].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => update('civil_status', val)}
                  style={s.pill(form.civil_status === val, 'forest')}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Bilang ng Anak — stepper */}
          <div style={s.sectionBox}>
            <div style={s.sectionTitle}>Bilang ng Anak</div>
            <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
              <button
                type="button"
                onClick={decrementChildren}
                style={{ width:'40px', height:'40px', borderRadius:'50%', border:`2px solid ${C.amber}`, background:C.paper, color:C.amber, fontSize:'20px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
              >
                −
              </button>
              <span style={{ fontFamily:serif, fontSize:'24px', color:C.ink, minWidth:'40px', textAlign:'center' as const }}>
                {numChildrenDisplay(form.num_children)}
              </span>
              <button
                type="button"
                onClick={incrementChildren}
                style={{ width:'40px', height:'40px', borderRadius:'50%', border:`2px solid ${C.amber}`, background:C.amber, color:'#fff', fontSize:'20px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
              >
                +
              </button>
            </div>
          </div>

          {/* 4. Kelan pwede magsimula — pills */}
          <div style={s.sectionBox}>
            <div style={s.sectionTitle}>Kelan pwede magsimula</div>
            <div style={{ display:'flex', flexWrap:'wrap' as const, gap:'8px' }}>
              {[
                { label: 'Pwede na agad', value: 'Immediate' },
                { label: '1 linggo', value: 'Within 1 week' },
                { label: '1 buwan', value: 'Within 1 month' },
                { label: 'Flexible', value: 'Flexible' },
              ].map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update('availability', value)}
                  style={s.pill(form.availability === value, 'forest')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Hinihingi na Sahod */}
          <label style={s.lbl}>Hinihingi na Sahod (₱/buwan)</label>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', color:C.ink2, fontFamily:serif, fontWeight:700, fontSize:'16px' }}>₱</span>
            <input
              style={{ ...s.input, paddingLeft:'28px' }}
              type="number"
              placeholder="9000"
              value={form.salary}
              onChange={e => update('salary', e.target.value)}
            />
          </div>

          {/* 6. Documents section */}
          <div style={s.sectionBox}>
            <div style={s.sectionTitle}>Mga Dokumento</div>

            {/* Wala pa */}
            <div style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', marginBottom:'14px' }} onClick={() => { setWalaPaDocs(!walaPaDocs); setIdFile(null); setPoliceFile(null) }}>
              <div style={{ width:'22px', height:'22px', borderRadius:'5px', border:'2px solid', borderColor: walaPaDocs ? C.amber : '#d1d5db', background: walaPaDocs ? C.amber : C.paper, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {walaPaDocs && <span style={{ color:'#fff', fontSize:'13px', fontWeight:900 }}>✓</span>}
              </div>
              <span style={{ fontSize:'15px', color:C.ink, fontFamily:sans, fontWeight: walaPaDocs ? 700 : 400 }}>Wala pa akong dokumento</span>
            </div>

            {!walaPaDocs && (
              <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px' }}>
                {/* Government ID upload */}
                <div>
                  <div style={{ fontSize:'13px', fontWeight:600, color:C.ink, marginBottom:'7px', fontFamily:sans }}>Government ID</div>
                  <div
                    onClick={() => idRef.current?.click()}
                    style={{ border:`2px dashed ${idFile ? C.forest : '#d1d5db'}`, borderRadius:'10px', padding:'12px 14px', cursor:'pointer', background: idFile ? '#f0fdf4' : '#fafafa', display:'flex', alignItems:'center', gap:'10px' }}
                  >
                    <span style={{ fontSize:'20px' }}>{idFile ? '✅' : '📎'}</span>
                    <span style={{ fontSize:'14px', color: idFile ? C.forest : C.ink2, fontWeight: idFile ? 700 : 400, fontFamily:sans }}>
                      {idFile ? 'Na-upload ang ID' : 'I-upload ang Government ID'}
                    </span>
                  </div>
                  <input ref={idRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleIdFile} />
                </div>

                {/* Police Clearance upload */}
                <div>
                  <div style={{ fontSize:'13px', fontWeight:600, color:C.ink, marginBottom:'7px', fontFamily:sans }}>Police Clearance</div>
                  <div
                    onClick={() => policeRef.current?.click()}
                    style={{ border:`2px dashed ${policeFile ? C.forest : '#d1d5db'}`, borderRadius:'10px', padding:'12px 14px', cursor:'pointer', background: policeFile ? '#f0fdf4' : '#fafafa', display:'flex', alignItems:'center', gap:'10px' }}
                  >
                    <span style={{ fontSize:'20px' }}>{policeFile ? '✅' : '📎'}</span>
                    <span style={{ fontSize:'14px', color: policeFile ? C.forest : C.ink2, fontWeight: policeFile ? 700 : 400, fontFamily:sans }}>
                      {policeFile ? 'Na-upload ang Police Clearance' : 'I-upload ang Police Clearance'}
                    </span>
                  </div>
                  <input ref={policeRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePoliceFile} />
                </div>

                {/* NBI checkbox */}
                <div style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' }} onClick={() => setHasNbi(!hasNbi)}>
                  <div style={{ width:'22px', height:'22px', borderRadius:'5px', border:'2px solid', borderColor: hasNbi ? C.forest : '#d1d5db', background: hasNbi ? C.forest : C.paper, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {hasNbi && <span style={{ color:'#fff', fontSize:'13px', fontWeight:900 }}>✓</span>}
                  </div>
                  <span style={{ fontSize:'15px', color:C.ink, fontFamily:sans }}>Mayroon akong NBI Clearance</span>
                </div>
              </div>
            )}

            {/* Amber tip */}
            <div style={{ background:C.amberSoft, border:`1px solid ${C.amberLine}`, borderRadius:'10px', padding:'10px 13px', marginTop:'14px', fontSize:'13px', color:'#92400e', lineHeight:1.6, fontFamily:sans }}>
              💡 Mas madaling ma-hire ang mga may dokumento. Mas maraming employer ang pipili sa iyo.
            </div>
          </div>

          {/* 7. Selfie section */}
          <div style={s.sectionBox}>
            <div style={s.sectionTitle}>
              Selfie <span style={{ color: '#dc2626', fontWeight:700 }}>(required)</span>
            </div>
            <p style={{ fontSize:'13px', color:C.ink3, lineHeight:1.5, marginBottom:'12px', fontFamily:sans }}>
              Kinakailangan para ma-verify ang iyong identity.
            </p>
            <div style={{ display:'flex', flexDirection:'column' as const, alignItems:'center', gap:'12px' }}>
              {/* Circular preview */}
              <div style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                border: selfieData ? `3px solid ${C.forest}` : `2px dashed ${C.forest}`,
                overflow: 'hidden',
                background: selfieData ? 'transparent' : C.paper2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {selfieData
                  ? <img src={selfieData} alt="selfie" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <span style={{ fontSize:'28px' }}>🤳</span>
                }
              </div>
              <button
                type="button"
                onClick={() => selfieRef.current?.click()}
                style={{ padding:'10px 20px', borderRadius:'999px', border:`1.5px solid ${C.forest}`, background:C.paper, color:C.forest, fontFamily:sans, fontSize:'14px', fontWeight:700, cursor:'pointer' }}
              >
                📷 Kumuha ng Selfie
              </button>
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
            style={{ ...s.btn, background:C.forest, opacity: loading ? .6 : 1 }}
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
