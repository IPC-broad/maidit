'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { provinces } from '../../../lib/ph-locations'

const provinceList = Object.keys(provinces)

const C = {
  forest: '#27500A',
  forestDeep: '#1c3b07',
  forestSoft: '#f0f5ec',
  forestLine: '#e2ecdb',
  amber: '#c9943a',
  amberSoft: '#fbf3e2',
  amberDeep: '#8a6418',
  ink: '#1a1d18',
  ink2: '#4a504a',
  ink3: '#8a8f88',
  paper2: '#faf9f5',
  line: '#ebe9e2',
}

const serif = "'Instrument Serif', Georgia, serif"
const sans  = "'Geist', ui-sans-serif, sans-serif"

const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
)
const ArrowRight = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
)
const Check = ({ size = 10 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
)
const Sparkle = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M12 2l1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8L12 2zM19 14l.8 2.5L22 17l-2.2.5L19 20l-.8-2.5L16 17l2.2-.5L19 14zM5 14l.8 2.5L8 17l-2.2.5L5 20l-.8-2.5L2 17l2.2-.5L5 14z" />
  </svg>
)
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-9z" />
  </svg>
)
const BriefcaseIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" />
  </svg>
)
const SwapIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 3l4 4-4 4M4 7h16M8 21l-4-4 4-4M20 17H4" />
  </svg>
)
const BroomIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 3l-9 9 5 5 9-9" /><path d="M10 17l-5 4 4-5" /><path d="M13 6l5 5" />
  </svg>
)
const BabyIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M5 21c1-5 4-7 7-7s6 2 7 7" />
  </svg>
)
const PotIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 9h16v6a4 4 0 01-4 4H8a4 4 0 01-4-4V9z" /><path d="M2 9h20" />
  </svg>
)
const ShirtIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7l4-3 4 2 4-2 4 3-2 3-2-1v11H8V9L6 10 4 7z" />
  </svg>
)
const CarIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5v5h-3v-2H6v2H3v-5z" />
    <circle cx="7" cy="16" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="17" cy="16" r="1.3" fill="currentColor" stroke="none" />
  </svg>
)
const HeartIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s-7-4.5-9.5-9C0.5 8 3 4 6.5 4c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3C21 4 23.5 8 21.5 12 19 16.5 12 21 12 21z" />
  </svg>
)
const StarIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l2.6 5.4 5.9 0.8-4.3 4.2 1 5.9L12 16.7 6.8 19.3l1-5.9L3.5 9.2l5.9-0.8L12 3z" />
  </svg>
)
const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" />
  </svg>
)

const SETUPS = [
  { value: 'Stay-in',  label: 'Stay-in',  desc: 'Lives with your family', icon: <HomeIcon /> },
  { value: 'Stay-out', label: 'Stay-out', desc: 'Comes during the day',   icon: <BriefcaseIcon /> },
  { value: 'Either',   label: 'Either',   desc: 'Open to both',           icon: <SwapIcon /> },
]

const HELP_ITEMS = [
  { value: '🏠 All-Around Maid', label: 'All-Around',   icon: <StarIcon /> },
  { value: '🧹 Housekeeping',    label: 'Housekeeping', icon: <BroomIcon /> },
  { value: '👶 Yaya',            label: 'Yaya',         icon: <BabyIcon /> },
  { value: '🍳 Cooking',         label: 'Cooking',      icon: <PotIcon /> },
  { value: '🧺 Laundry',         label: 'Laundry',      icon: <ShirtIcon /> },
  { value: '🚗 Driver',          label: 'Driver',       icon: <CarIcon /> },
  { value: '👴 Elder Care',      label: 'Elder Care',   icon: <HeartIcon /> },
]

const primaryBtn = (disabled = false): React.CSSProperties => ({
  width: '100%', height: 54, borderRadius: 16,
  background: disabled ? '#cdd2c7' : C.forest,
  color: '#fff', border: 'none',
  fontSize: 16, fontWeight: 600,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  boxShadow: disabled ? 'none' : '0 1px 0 rgba(0,0,0,0.04), 0 10px 24px -12px rgba(39,80,10,0.55)',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: sans,
})

const inputBase: React.CSSProperties = {
  width: '100%', height: 52, borderRadius: 14,
  border: `1px solid ${C.line}`, background: '#fff',
  padding: '0 16px', fontSize: 15.5, color: C.ink,
  outline: 'none', boxSizing: 'border-box', fontFamily: sans,
}

export default function HomeownerSignup() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({
    full_name: '', mobile: '', email: '',
    password: '', province: '', city: '',
    setup: 'Stay-in', scope: [] as string[],
  })

  const update = (k: string, v: string) => setForm(f => ({...f, [k]: v}))
  const toggleScope = (s: string) => setForm(f => ({
    ...f, scope: f.scope.includes(s) ? f.scope.filter(x => x !== s) : [...f.scope, s],
  }))

  const handleProvinceChange = (prov: string) => {
    const cities = (provinces as Record<string, string[]>)[prov] || []
    setForm(f => ({ ...f, province: prov, city: cities[0] || '' }))
  }

  const citiesForProvince: string[] = form.province
    ? ((provinces as Record<string, string[]>)[form.province] || [])
    : []

  const pwStrength = (pw: string) => {
    if (!pw || pw.length < 8) return null
    const score = [/[a-z]/.test(pw), /[A-Z]/.test(pw), /\d/.test(pw), /[^a-zA-Z0-9]/.test(pw)].filter(Boolean).length
    if (score <= 2) return { label: 'Weak', color: '#ef4444', bar: '#ef4444', width: '33%' }
    if (score === 3) return { label: 'Good', color: '#f59e0b', bar: '#f59e0b', width: '66%' }
    return { label: 'Strong', color: '#22c55e', bar: '#22c55e', width: '100%' }
  }
  const strength = pwStrength(form.password)

  const handleSignup = async () => {
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')
    const { supabase } = await import('../../../lib/supabase')
    const { data, error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
    })
    if (error) { setError(error.message); setLoading(false); return }

    await supabase.from('profiles').insert({
      id: data.user?.id,
      role: 'homeowner',
      full_name: form.full_name,
      mobile: form.mobile,
      city: form.city,
    })

    await supabase.from('homeowners').insert({
      profile_id: data.user?.id,
      preferred_setup: form.setup,
      scope: form.scope,
    })

    const intent = localStorage.getItem('maidit_intent')
    if (intent === 'post_job') {
      localStorage.removeItem('maidit_intent')
      setLoading(false)
      router.push('/dashboard/homeowner/post-job')
      return
    }

    setLoading(false)
    setSuccess(true)
    setTimeout(() => router.push('/browse'), 2200)
  }

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap'
    document.head.appendChild(link)
  }, [])

  const pct = Math.round((step / 3) * 100)

  if (success) return (
    <div style={{ minHeight: '100vh', background: C.paper2, padding: 22, fontFamily: sans }}>
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(165deg, #f0f5ec 0%, #fbf3e2 100%)', border: `1px solid ${C.forestLine}`, borderRadius: 26, padding: '32px 22px 28px', textAlign: 'center', marginTop: 40 }}>
        <div style={{ position: 'absolute', top: 22, left: 26, color: C.amber, opacity: 0.55 }}><Sparkle size={16} /></div>
        <div style={{ position: 'absolute', top: 60, right: 28, color: C.amber, opacity: 0.7 }}><Sparkle size={11} /></div>
        <div style={{ position: 'absolute', bottom: 30, right: 40, color: C.forest, opacity: 0.3 }}><Sparkle size={13} /></div>
        <div style={{ position: 'absolute', bottom: 60, left: 30, color: C.forest, opacity: 0.25 }}><Sparkle size={10} /></div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          <div style={{ width: 116, height: 116, borderRadius: '50%', background: 'rgba(39,80,10,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(39,80,10,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', background: C.forest, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px -8px rgba(39,80,10,0.55), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
                <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <h1 style={{ margin: 0, fontSize: 38, lineHeight: 1.16, color: C.forestDeep, letterSpacing: '-0.02em', fontFamily: serif, fontWeight: 400 }}>
          You're <span style={{ fontStyle: 'italic', color: C.amber }}>all set</span>!
        </h1>
        <p style={{ margin: '12px auto 0', maxWidth: 280, fontSize: 15, lineHeight: 1.5, color: C.ink2 }}>
          We've matched you with kasambahay who fit what you're looking for.
        </p>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: C.ink3, textTransform: 'uppercase', marginBottom: 10 }}>Matching you for</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {[
            form.setup,
            ...form.scope.map(s => s.replace(/^[^\s]+ /, '')),
            form.city || form.province,
          ].filter(Boolean).map((label, i) => (
            <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, background: '#fff', border: `1px solid ${C.line}`, fontSize: 12.5, color: C.ink2 }}>
              {label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <button onClick={() => router.push('/browse')} style={primaryBtn()}>
          <span>Start Browsing</span>
          <ArrowRight />
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.paper2, fontFamily: sans, color: C.ink }}>

      {/* StepHeader */}
      <div style={{ padding: '14px 22px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button
            onClick={() => step > 1 ? setStep(step - 1) : router.push('/')}
            style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${C.line}`, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: C.ink, cursor: 'pointer' }}
          >
            <ChevronLeft />
          </button>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: C.ink3, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            Step <span style={{ color: C.forest }}>{step}</span> of 3
          </div>
          <div style={{ width: 38 }} />
        </div>
        <div style={{ height: 4, borderRadius: 999, background: '#e3e0d6', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${C.forest} 0%, #3d7a14 100%)`, borderRadius: 999, transition: 'width .4s ease' }} />
        </div>
      </div>

      {error && (
        <div style={{ margin: '0 22px 16px', background: 'rgba(220,38,38,.1)', border: '1px solid rgba(220,38,38,.3)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── STEP 1 ── */}
      {step === 1 && <>
        <div style={{ padding: '0 22px 22px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px 5px 9px', background: C.amberSoft, color: C.amberDeep, borderRadius: 999, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 14, textTransform: 'uppercase' }}>
            <Sparkle size={12} />
            Welcome to MaidIt
          </div>
          <h1 style={{ margin: 0, fontSize: 38, lineHeight: 1.16, color: C.forestDeep, letterSpacing: '-0.02em', fontFamily: serif, fontWeight: 400 }}>
            Let's get to <span style={{ fontStyle: 'italic', color: C.amber }}>know you</span>.
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: 15.5, lineHeight: 1.5, color: C.ink2 }}>
            A few quick details so we can match you with the right kasambahay.
          </p>
        </div>

        <div style={{ padding: '0 22px', display: 'grid', gap: 16 }}>
          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.ink, marginBottom: 7, letterSpacing: '-0.005em' }}>Full name</div>
            <input style={inputBase} placeholder="Maria Santos" value={form.full_name} onChange={e => update('full_name', e.target.value)} />
          </label>

          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.ink, marginBottom: 7, letterSpacing: '-0.005em' }}>Email address</div>
            <input style={inputBase} type="email" placeholder="maria@gmail.com" value={form.email} onChange={e => update('email', e.target.value)} />
          </label>

          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.ink, marginBottom: 7, letterSpacing: '-0.005em' }}>Mobile number</div>
            <div style={{ display: 'flex', alignItems: 'stretch', height: 52, borderRadius: 14, border: `1px solid ${C.line}`, background: '#fff', overflow: 'hidden' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 14px', borderRight: `1px solid ${C.line}`, background: C.paper2, fontSize: 15.5, fontWeight: 500, color: C.ink, whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 17 }}>🇵🇭</span>
                <span>+63</span>
              </div>
              <input
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '0 14px', fontSize: 15.5, fontFamily: sans, color: C.ink }}
                placeholder="917 123 4567"
                value={form.mobile}
                onChange={e => update('mobile', e.target.value)}
              />
            </div>
            <div style={{ fontSize: 11.5, color: C.ink3, marginTop: 7, paddingLeft: 2 }}>We'll text you a verification code.</div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.ink, marginBottom: 7, letterSpacing: '-0.005em' }}>Create a password</div>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...inputBase, paddingRight: 60 }}
                type={showPass ? 'text' : 'password'}
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.ink3, padding: 0, fontFamily: sans }}
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
            {form.password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ height: 3, borderRadius: 2, background: C.line, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: strength?.width ?? '0%', background: strength?.bar ?? C.line, borderRadius: 2, transition: 'width .2s, background .2s' }} />
                </div>
                {strength && (
                  <div style={{ fontSize: 11, color: strength.color, fontWeight: 600, marginTop: 4 }}>{strength.label}</div>
                )}
                {!strength && form.password.length > 0 && (
                  <div style={{ fontSize: 11, color: C.ink3, marginTop: 4 }}>At least 8 characters needed</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '28px 22px 14px' }}>
          <button
            onClick={() => {
              if (!form.full_name || !form.email) { setError('Please fill in all fields'); return }
              if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
              setError(''); setStep(2)
            }}
            style={primaryBtn()}
          >
            <span>Continue</span>
            <ArrowRight />
          </button>
        </div>

        <div style={{ padding: '0 22px 28px', textAlign: 'center', fontSize: 13, color: C.ink3 }}>
          Already have an account?{' '}
          <span style={{ color: C.forest, fontWeight: 600, cursor: 'pointer' }} onClick={() => router.push('/login')}>Sign in</span>
        </div>
      </>}

      {/* ── STEP 2 ── */}
      {step === 2 && <>
        <div style={{ padding: '0 22px 22px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px 5px 9px', background: C.amberSoft, color: C.amberDeep, borderRadius: 999, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 14, textTransform: 'uppercase' }}>
            <Sparkle size={12} />
            Tell us what you need
          </div>
          <h1 style={{ margin: 0, fontSize: 38, lineHeight: 1.16, color: C.forestDeep, letterSpacing: '-0.02em', fontFamily: serif, fontWeight: 400 }}>
            Find your <span style={{ fontStyle: 'italic', color: C.amber }}>perfect</span> match.
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: 15.5, lineHeight: 1.5, color: C.ink2 }}>
            A few details so we can show kasambahay who fit your home.
          </p>
        </div>

        {/* Setup cards */}
        <div style={{ padding: '0 22px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: C.ink3, textTransform: 'uppercase', marginBottom: 10 }}>Preferred setup</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {SETUPS.map(s => {
              const on = form.setup === s.value
              return (
                <div key={s.value} onClick={() => update('setup', s.value)} style={{ padding: '12px 10px 14px', borderRadius: 14, background: on ? C.forestSoft : '#fff', border: on ? `1.5px solid ${C.forest}` : `1px solid ${C.line}`, position: 'relative', textAlign: 'left', cursor: 'pointer', boxShadow: on ? '0 4px 14px -8px rgba(39,80,10,0.4)' : 'none' }}>
                  <div style={{ color: on ? C.forest : C.ink2, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: C.ink3, marginTop: 2, lineHeight: 1.3 }}>{s.desc}</div>
                  {on && (
                    <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: '50%', background: C.forest, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={10} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ height: 22 }} />

        {/* Help pills */}
        <div style={{ padding: '0 22px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: C.ink3, textTransform: 'uppercase' }}>Help needed</div>
            <div style={{ fontSize: 11, color: C.ink3 }}>Select all that apply</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {HELP_ITEMS.map(h => {
              const on = form.scope.includes(h.value)
              return (
                <div key={h.value} onClick={() => toggleScope(h.value)} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '10px 14px 10px 12px', borderRadius: 999, background: on ? C.forest : '#fff', border: on ? `1px solid ${C.forest}` : `1px solid ${C.line}`, color: on ? '#fff' : C.ink, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', boxShadow: on ? '0 4px 12px -6px rgba(39,80,10,0.4)' : 'none' }}>
                  <span style={{ display: 'inline-flex', color: on ? 'rgba(255,255,255,0.95)' : C.forest }}>{h.icon}</span>
                  {h.label}
                  {on && (
                    <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: -2 }}>
                      <Check size={10} />
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ padding: '24px 22px 28px' }}>
          <button onClick={() => setStep(3)} style={primaryBtn()}>
            <span>Continue</span>
            <ArrowRight />
          </button>
        </div>
      </>}

      {/* ── STEP 3 ── */}
      {step === 3 && <>
        <div style={{ padding: '0 22px 22px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px 5px 9px', background: C.forestSoft, color: C.forest, borderRadius: 999, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 14, textTransform: 'uppercase' }}>
            <Sparkle size={12} />
            Almost done
          </div>
          <h1 style={{ margin: 0, fontSize: 38, lineHeight: 1.16, color: C.forestDeep, letterSpacing: '-0.02em', fontFamily: serif, fontWeight: 400 }}>
            Where do you <span style={{ fontStyle: 'italic', color: C.amber }}>live</span>?
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: 15.5, lineHeight: 1.5, color: C.ink2 }}>
            Last step — so we can show you the best matches near you.
          </p>
        </div>

        <div style={{ padding: '0 22px', display: 'grid', gap: 18 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.ink, marginBottom: 7, letterSpacing: '-0.005em' }}>Province</div>
            <select
              style={{ ...inputBase, color: form.province ? C.ink : C.ink3, appearance: 'none', cursor: 'pointer' }}
              value={form.province}
              onChange={e => handleProvinceChange(e.target.value)}
            >
              <option value="">Select province</option>
              {provinceList.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.ink, marginBottom: 7, letterSpacing: '-0.005em' }}>City / Municipality</div>
            <select
              style={{ ...inputBase, border: form.province ? `1.5px solid ${C.forest}` : `1px solid ${C.line}`, boxShadow: form.province ? '0 0 0 3px rgba(39,80,10,0.08)' : 'none', color: form.city ? C.ink : C.ink3, appearance: 'none', cursor: citiesForProvince.length === 0 ? 'not-allowed' : 'pointer' }}
              value={form.city}
              disabled={citiesForProvince.length === 0}
              onChange={e => update('city', e.target.value)}
            >
              {citiesForProvince.length === 0
                ? <option value="">Select province first</option>
                : citiesForProvince.map(c => <option key={c} value={c}>{c}</option>)
              }
            </select>
          </div>
        </div>

        <div style={{ padding: '18px 22px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: C.paper2, border: `1px solid ${C.line}`, borderRadius: 14, fontSize: 12.5, color: C.ink2, lineHeight: 1.45 }}>
            <span style={{ color: C.forest, marginTop: 1 }}><MapPinIcon /></span>
            <span>Your address stays private — only your city is shown on profiles until you confirm a hire.</span>
          </div>
        </div>

        <div style={{ padding: '18px 22px 0' }}>
          <div style={{ fontSize: 11.5, color: C.ink3, paddingLeft: 2 }}>
            ✅ Browse all profiles free &nbsp;·&nbsp; ✅ Send offers with ₱499/month subscription
          </div>
        </div>

        <div style={{ padding: '22px 22px 28px' }}>
          <button onClick={handleSignup} disabled={loading} style={primaryBtn(loading)}>
            <span>{loading ? 'Setting up your account…' : 'See my matches'}</span>
            {!loading && <ArrowRight />}
          </button>
        </div>
      </>}

    </div>
  )
}
