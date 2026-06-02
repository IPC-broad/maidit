// PARTNER PAGE — All UI text must be in Taglish
// DO NOT translate to English during audits
'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const C = {
  forest: '#27500A', forestDeep: '#1c3b07', forestDark: '#0f2105',
  amber: '#c9943a', amberSoft: '#fef3e2', amberLine: '#fde8c0',
  ink: '#1a1a1a', ink2: '#4a504a', ink3: '#9ca3af',
  paper: '#ffffff', paper2: '#faf9f5', line: '#ede8e0',
}
const serif = "'Instrument Serif', Georgia, serif"
const sans  = "'Geist', ui-sans-serif, sans-serif"

type Province = { code: string; name: string }
type Step = 'landing' | 'step1' | 'reflink' | 'step2' | 'dashboard'

const NETWORK_OPTIONS = [
  'Barangay / Komunidad', 'Simbahan / Parish', 'Pamilya / Kamag-anak',
  'Paaralan / Training', 'Dating kasambahay', 'Iba pa'
]
const POOL_SIZES = ['5–10', '11–25', '26–50', '50+']

function generateCode(name: string) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3)
  return `Imaidit-${initials}${Math.floor(1000 + Math.random() * 9000)}`
}

const STEPS = [
  { title: 'Mag-sign up bilang partner', desc: 'Libre ang pagsali. Walang bayad, walang kontrata.' },
  { title: 'I-refer ang mga kasambahay', desc: 'I-share ang iyong referral code sa mga kakilalang naghahanap ng trabaho.' },
  { title: 'Kumita sa bawat hire', desc: '₱500 payout per successful hire — direct sa iyong GCash.' },
]

export default function PartnerPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('landing')

  // Step 1
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [mobile, setMobile]       = useState('')
  const [provinces, setProvinces] = useState<Province[]>([])
  const [provSearch, setProvSearch] = useState('')
  const [provOpen, setProvOpen]   = useState(false)
  const [selProv, setSelProv]     = useState<Province | null>(null)
  const [selfieData, setSelfieData] = useState<string | null>(null)
  const [s1Error, setS1Error]     = useState('')
  const [submitting1, setSubmitting1] = useState(false)
  const selfieRef = useRef<HTMLInputElement>(null)
  const provRef   = useRef<HTMLDivElement>(null)

  // Referral code
  const [refCode, setRefCode] = useState('')
  const [copied, setCopied]   = useState(false)

  // Step 2
  const [gcash, setGcash]       = useState('')
  const [networks, setNetworks] = useState<string[]>([])
  const [poolSize, setPoolSize] = useState('')
  const [note, setNote]         = useState('')
  const [submitting2, setSubmitting2] = useState(false)

  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600;700&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    return () => { try { document.head.removeChild(link) } catch {} }
  }, [])

  useEffect(() => {
    if (step === 'step1' && provinces.length === 0) {
      fetch('https://psgc.gitlab.io/api/provinces/')
        .then(r => r.json())
        .then(data => {
          const sorted = data.map((p: any) => ({ code: p.code, name: p.name }))
            .sort((a: Province, b: Province) => a.name.localeCompare(b.name))
          setProvinces(sorted)
        }).catch(() => {})
    }
  }, [step])

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

  const handleStep1 = async () => {
    if (!firstName.trim() || !lastName.trim()) { setS1Error('Pakisulat ang iyong pangalan at apelyido.'); return }
    const name = `${firstName.trim()} ${lastName.trim()}`
    if (!mobile || mobile.length !== 11 || !mobile.startsWith('09')) {
      setS1Error('Pakisulat ang tamang 11-digit mobile number na nagsisimula sa 09.'); return
    }
    if (!selProv) { setS1Error('Piliin ang iyong probinsya.'); return }
    setS1Error('')
    setSubmitting1(true)

    const { supabase } = await import('../../lib/supabase')
    const email    = `partner_${mobile}@maidit.app`
    const password = Math.random().toString(36).slice(-10)

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, role: 'partner' } }
    })

    if (signupError || !signupData.user) {
      setS1Error('Hindi ma-create ang account. Baka registered na ang mobile number na ito.')
      setSubmitting1(false); return
    }

    const profileId = signupData.user.id
    await supabase.from('profiles').insert({
      id: profileId, full_name: name, mobile, role: 'partner',
      city: selProv.name, verified: false
    })

    const code = generateCode(name)
    await supabase.from('partners').insert({
      profile_id: profileId,
      barangay: selProv.name,
      province: selProv.name,
      gcash_number: null,
      payout_method: 'gcash',
      approved: false,
      worker_count: 0,
      tier: 'community',
      referral_code: code
    })

    setRefCode(code)
    setSubmitting1(false)
    setStep('reflink')
  }

  const handleStep2 = async () => {
    if (!gcash || gcash.length !== 11 || !gcash.startsWith('09')) {
      alert('Pakisulat ang tamang GCash number.'); return
    }
    setSubmitting2(true)
    const { supabase } = await import('../../lib/supabase')
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('partners').update({
        gcash_number: gcash,
        network_type: networks.join(', '),
        pool_size: poolSize,
        note
      }).eq('profile_id', user.id)
    }
    setSubmitting2(false)
    router.push('/dashboard/partner')
  }

  const copyLink = () => {
    const link = `https://maidit.vercel.app/signup/kasambahay?ref=${refCode}`
    navigator.clipboard.writeText(link).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareSMS = () => {
    const msg = encodeURIComponent(`Mag-apply bilang kasambahay sa MaidIt! Libre at ligtas. Gamitin ang link ko: https://maidit.vercel.app/signup/kasambahay?ref=${refCode}`)
    window.open(`sms:?body=${msg}`, '_blank')
  }

  const shareMessenger = () => {
    const link = encodeURIComponent(`https://maidit.vercel.app/signup/kasambahay?ref=${refCode}`)
    window.open(`fb-messenger://share?link=${link}`, '_blank')
  }

  // ── Shared step styles ──
  const s: any = {
    wrap:       { minHeight: '100vh', background: C.paper2, color: C.ink, fontFamily: sans },
    nav:        { background: C.paper, borderBottom: `1px solid ${C.line}`, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 100 },
    body:       { padding: '22px 18px 56px' },
    lbl:        { display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: C.ink3, marginBottom: '5px' },
    inp:        { width: '100%', padding: '12px 13px', border: `1.5px solid ${C.line}`, borderRadius: '11px', fontSize: '14px', background: C.paper, color: C.ink, outline: 'none', marginBottom: '12px', fontFamily: sans, boxSizing: 'border-box' as const },
    goldBtn:    { width: '100%', padding: '14px', borderRadius: '12px', background: C.amber, border: 'none', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: sans },
    outlineBtn: { width: '100%', padding: '12px', borderRadius: '12px', background: 'transparent', border: `1.5px solid ${C.line}`, color: C.ink3, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: sans, marginTop: '10px' },
    divider:    { height: '1px', background: C.line, margin: '18px 0' },
    chip:       (on: boolean) => ({
      display: 'inline-flex', alignItems: 'center', padding: '8px 14px', borderRadius: '50px',
      cursor: 'pointer', fontSize: '12px', fontWeight: 600, margin: '3px',
      border: on ? 'none' : `1.5px solid ${C.line}`,
      background: on ? 'rgba(201,148,58,.12)' : C.paper,
      color: on ? C.amber : C.ink3,
      boxShadow: on ? `0 0 0 1.5px ${C.amber}` : 'none',
    }),
    err: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '9px', padding: '10px 13px', fontSize: '13px', color: '#dc2626', marginBottom: '12px' },
  }

  const NavBar = ({ back, title, sub }: { back?: () => void; title: string; sub?: string }) => (
    <div style={s.nav}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {back && <button onClick={back} style={{ background: 'none', border: 'none', color: C.ink3, cursor: 'pointer', fontSize: '16px', padding: 0 }}>←</button>}
        <div>
          <div style={{ fontFamily: serif, fontSize: '15px', color: C.ink }}>{title}</div>
          {sub && <div style={{ fontSize: '11px', color: C.ink3, marginTop: '1px' }}>{sub}</div>}
        </div>
      </div>
      {back && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '20px', height: '4px', borderRadius: '2px', background: C.amber }} />
          <div style={{ width: '20px', height: '4px', borderRadius: '2px', background: step === 'step2' ? C.amber : C.line }} />
        </div>
      )}
    </div>
  )

  // ─── LANDING ───
  if (step === 'landing') return (
    <div style={{ minHeight: '100vh', background: C.paper2, fontFamily: sans, color: C.ink }}>

      {/* HERO — photo background */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img
          src="/photos/hero-family.jpg"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(28,59,7,0.35) 0%, rgba(28,59,7,0.88) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Sticky nav inside hero */}
        <div style={{
          position: 'sticky' as const, top: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px',
          background: 'rgba(15,33,5,0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontFamily: serif, fontSize: '26px', color: '#fff', lineHeight: 1 }}>
            Maid<span style={{ color: C.amber }}>It</span>
          </div>
          <button
            onClick={() => router.push('/login')}
            style={{
              padding: '7px 16px', borderRadius: '50px',
              background: 'transparent', border: '1.5px solid rgba(255,255,255,.45)',
              color: '#fff', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', fontFamily: sans,
            }}
          >
            Mag-login
          </button>
        </div>

        {/* Hero content */}
        <div style={{ padding: '28px 20px 0', textAlign: 'center' as const }}>

          {/* Eyebrow badge */}
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '50px',
            padding: '5px 14px',
            fontSize: '11px', fontWeight: 700,
            color: '#fff',
            letterSpacing: '0.04em',
            marginBottom: '18px',
          }}>
            ✨ Kumita habang nakakatulong
          </div>

          {/* Headline */}
          <div style={{
            fontFamily: serif, fontSize: '36px',
            color: '#fff', lineHeight: 1.2, marginBottom: '14px',
          }}>
            Kumita habang<br />
            <em style={{ color: C.amber }}>nakakatulong.</em>
          </div>

          {/* Subtext */}
          <div style={{
            fontSize: '13px', color: 'rgba(255,255,255,.75)',
            lineHeight: 1.65, marginBottom: '28px',
            maxWidth: '320px', margin: '0 auto 28px',
          }}>
            Maraming pamilya ang naghahanap ng mapagkakatiwalaang kasambahay.
            Ikaw ang tulay — at kumikita ka habang nakakatulong sa iyong komunidad.
          </div>

          {/* Earnings box */}
          <div style={{
            background: 'rgba(0,0,0,.22)',
            border: '1px solid rgba(255,255,255,.1)',
            borderRadius: '20px',
            padding: '22px 18px 18px',
            marginTop: '4px',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.1em', color: 'rgba(255,255,255,.5)', marginBottom: '4px' }}>
              KUMITA NG
            </div>
            <div style={{ fontFamily: serif, fontSize: '56px', color: C.amber, lineHeight: 1, marginBottom: '6px' }}>
              ₱500
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.55)', marginBottom: '18px' }}>
              sa bawat matagumpay na hire
            </div>

            {/* Two side-by-side cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {/* Left — Referral */}
              <div style={{
                background: '#f0f5ec',
                border: '1px solid #e2ecdb',
                borderRadius: '14px', padding: '14px 12px',
                textAlign: 'left' as const,
              }}>
                <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.07em', color: '#27500A', marginBottom: '8px' }}>
                  REFERRAL FEE
                </div>
                <div style={{ fontFamily: serif, fontSize: '28px', color: '#1c3b07', lineHeight: 1, marginBottom: '6px' }}>
                  ₱500
                </div>
                <div style={{ fontSize: '11px', color: '#4a4a3a', lineHeight: 1.5 }}>
                  Sa bawat kasambahay na ma-hire — lahat ng lugar
                </div>
              </div>

              {/* Right — Bonus */}
              <div style={{
                background: '#c9943a',
                border: 'none',
                borderRadius: '14px', padding: '14px 12px',
                textAlign: 'left' as const,
                position: 'relative' as const,
              }}>
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'rgba(255,255,255,0.25)', borderRadius: 50,
                  padding: '2px 8px', fontSize: 9, fontWeight: 800,
                  color: '#fff', letterSpacing: '0.06em',
                }}>NEW</div>
                <div style={{
                  display: 'inline-block',
                  background: C.amber, borderRadius: '50px',
                  padding: '2px 8px',
                  fontSize: '8px', fontWeight: 800,
                  color: '#fff', textTransform: 'uppercase' as const,
                  letterSpacing: '.06em', marginBottom: '8px',
                }}>
                  BONUS
                </div>
                <div style={{ fontFamily: serif, fontSize: '28px', color: '#fff', lineHeight: 1, marginBottom: '6px' }}>
                  +₱500
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.88)', lineHeight: 1.5 }}>
                  Transport assistance — Leyte, Samar, at Bicol lang
                </div>
              </div>
            </div>
            <div style={{ fontSize: 10.5, fontStyle: 'italic', color: 'rgba(255,255,255,0.55)', marginTop: 10, textAlign: 'left' as const, lineHeight: 1.5 }}>
              *Transport bonus para lang sa kasambahay na galing Leyte, Samar at Bicol.
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ padding: '32px 18px 28px', background: C.paper2 }}>
        <div style={{
          fontSize: '10px', fontWeight: 700,
          textTransform: 'uppercase' as const, letterSpacing: '.1em',
          color: C.forest, marginBottom: '8px',
        }}>
          Paano gumagana
        </div>
        <div style={{ fontFamily: serif, fontSize: '26px', color: C.forestDeep, marginBottom: '22px', lineHeight: 1.2 }}>
          Tatlong <em style={{ color: C.amber }}>simpleng</em> hakbang.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
          {STEPS.map((st, i) => (
            <div key={i} style={{
              background: C.paper,
              border: `1px solid ${C.line}`,
              borderRadius: '14px',
              padding: '16px 16px',
              display: 'flex', gap: '14px', alignItems: 'flex-start',
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: C.forest, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: serif, fontSize: '15px', fontWeight: 700, flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: C.ink, lineHeight: 1.3, marginBottom: '4px' }}>
                  {st.title}
                </div>
                <div style={{ fontSize: '12.5px', color: C.ink3, lineHeight: 1.5 }}>
                  {st.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA CARD */}
      <div style={{
        margin: '0 18px 40px',
        background: '#1c3b07',
        borderRadius: '20px', padding: '24px 20px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,148,58,0.35) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>Simulan na ngayon —</div>
        <div style={{ fontFamily: serif, fontSize: '22px', color: '#fff', marginBottom: '14px', lineHeight: 1.3 }}>
          Maging Community Partner.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '7px', marginBottom: '20px' }}>
          {['Libre ang pagsali.', 'Marami ka pang matutulungang pamilya.'].map((line, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '13px', color: 'rgba(255,255,255,.75)' }}>
              <span style={{ color: C.amber, fontWeight: 700 }}>✓</span>
              {line}
            </div>
          ))}
        </div>
        <button
          onClick={() => setStep('step1')}
          style={{
            width: '100%', padding: '14px', borderRadius: '13px',
            background: C.amber, border: 'none', color: '#fff',
            fontFamily: sans, fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Maging Community Partner →
        </button>
      </div>
    </div>
  )

  // ─── STEP 1 ───
  if (step === 'step1') return (
    <div style={s.wrap}>
      <NavBar back={() => setStep('landing')} title="Quick Signup" sub="Hakbang 1 ng 2" />
      <div style={s.body}>
        <div style={{ fontFamily: serif, fontSize: '22px', color: C.ink, marginBottom: '6px' }}>Ilang detalye lang 👋</div>
        <div style={{ fontSize: '14px', color: C.ink3, marginBottom: '24px', lineHeight: 1.6 }}>Tapos may referral link ka na agad. Libre at walang bayad.</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={s.lbl}>Pangalan *</label>
            <input style={s.inp} type="text" placeholder="Juan" value={firstName}
              onChange={e => setFirstName(e.target.value.replace(/\b\w/g, c => c.toUpperCase()))} />
          </div>
          <div>
            <label style={s.lbl}>Apelyido *</label>
            <input style={s.inp} type="text" placeholder="Dela Cruz" value={lastName}
              onChange={e => setLastName(e.target.value.replace(/\b\w/g, c => c.toUpperCase()))} />
          </div>
        </div>

        <label style={s.lbl}>Mobile number *</label>
        <input style={s.inp} type="tel" placeholder="09XX XXX XXXX" maxLength={11} value={mobile}
          onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 11))} />

        <label style={s.lbl}>Probinsya *</label>
        <div ref={provRef} style={{ position: 'relative' }}>
          <div onClick={() => setProvOpen(!provOpen)} style={{
            width: '100%', padding: '12px 13px',
            border: `1.5px solid ${selProv ? C.amber : C.line}`,
            borderRadius: '11px', fontSize: '14px', background: C.paper,
            color: selProv ? C.ink : C.ink3,
            marginBottom: provOpen ? '0' : '12px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            cursor: 'pointer', boxSizing: 'border-box' as const,
          }}>
            <span>{selProv ? selProv.name : 'Piliin ang probinsya'}</span>
            <span style={{ fontSize: '11px', opacity: .5 }}>▾</span>
          </div>
          {provOpen && (
            <div style={{ background: C.paper, border: `1.5px solid ${C.line}`, borderRadius: '11px', marginBottom: '12px', overflow: 'hidden', position: 'relative', zIndex: 50 }}>
              <input autoFocus style={{ width: '100%', padding: '10px 12px', border: 'none', borderBottom: `1px solid ${C.line}`, background: C.paper2, color: C.ink, fontSize: '13px', outline: 'none', fontFamily: sans }}
                placeholder="Hanapin ang probinsya..." value={provSearch}
                onChange={e => setProvSearch(e.target.value)} />
              <div style={{ maxHeight: '190px', overflowY: 'auto' }}>
                {filteredProvs.length === 0
                  ? <div style={{ padding: '12px', fontSize: '12px', color: C.ink3 }}>Walang nahanap</div>
                  : filteredProvs.map(p => (
                    <div key={p.code} onClick={() => { setSelProv(p); setProvOpen(false); setProvSearch('') }}
                      style={{ padding: '10px 13px', cursor: 'pointer', fontSize: '13px', color: selProv?.code === p.code ? C.amber : C.ink, background: selProv?.code === p.code ? 'rgba(201,148,58,.08)' : 'transparent', borderBottom: `1px solid ${C.line}` }}>
                      {p.name}
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        <div style={s.divider} />

        <label style={s.lbl}>Selfie mo — para makilala ka namin *</label>
        <div style={{ fontSize: '13px', color: C.ink3, marginBottom: '10px', lineHeight: 1.5 }}>Hindi ito i-po-post — para lang sa verification ng iyong account.</div>

        {selfieData && <img src={selfieData} alt="selfie" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '11px', marginBottom: '12px' }} />}

        <div onClick={() => selfieRef.current?.click()} style={{ background: C.paper2, border: `2px dashed ${selfieData ? C.forest : C.line}`, borderRadius: '13px', padding: '24px 16px', textAlign: 'center', cursor: 'pointer', marginBottom: '12px' }}>
          {selfieData
            ? <><div style={{ fontSize: '20px', marginBottom: '6px' }}>✅</div><div style={{ fontWeight: 700, fontSize: '13px', color: C.forest }}>Selfie saved!</div><div style={{ fontSize: '13px', color: C.ink3, marginTop: '4px' }}>I-tap para palitan</div></>
            : <><div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div><div style={{ fontWeight: 700, fontSize: '14px', color: C.ink, marginBottom: '4px' }}>I-tap para kumuha ng selfie</div><div style={{ fontSize: '13px', color: C.ink3 }}>Malinaw na mukha · Walang filter</div></>
          }
        </div>
        <input ref={selfieRef} type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={handleSelfie} />

        {s1Error && <div style={s.err}>⚠️ {s1Error}</div>}

        <button style={{ ...s.goldBtn, opacity: submitting1 ? .6 : 1 }} onClick={handleStep1} disabled={submitting1}>
          {submitting1 ? 'Naglo-load...' : 'Maging Community Partner →'}
        </button>
        <div style={{ fontSize: '12px', color: C.ink3, textAlign: 'center', marginTop: '10px', lineHeight: 1.6 }}>
          Libre at secure ang info mo.
        </div>
      </div>
    </div>
  )

  // ─── REFERRAL LINK ───
  if (step === 'reflink') return (
    <div style={s.wrap}>
      <nav style={s.nav}>
        <span style={{ fontFamily: serif, fontSize: '18px', color: C.ink }}>Maid<span style={{ color: C.amber }}>It</span></span>
      </nav>
      <div style={{ padding: '36px 18px 48px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
        <h1 style={{ fontFamily: serif, fontSize: '24px', color: C.forestDeep, marginBottom: '8px' }}>Eto na ang referral code mo!</h1>
        <p style={{ fontSize: '14px', color: C.ink3, lineHeight: 1.7, marginBottom: '24px' }}>
          Simulan nang kumita — mag-refer ng kakilalang naghahanap ng trabaho, may <strong style={{ color: C.ink }}>₱500</strong> ka sa bawat successful hire!
        </p>

        <div style={{ background: C.paper, border: `1px solid ${C.amberLine}`, borderRadius: '13px', padding: '16px', marginBottom: '14px', textAlign: 'left' }}>
          <div style={{ fontSize: '10px', color: C.ink3, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px' }}>Referral Code</div>
          <div style={{ fontFamily: serif, fontSize: '22px', color: C.amber, letterSpacing: '1px', marginBottom: '4px' }}>{refCode}</div>
          <div style={{ fontSize: '12px', color: C.ink3, marginBottom: '12px' }}>maidit.vercel.app/signup/kasambahay?ref={refCode}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button onClick={copyLink} style={{ padding: '10px', borderRadius: '9px', background: copied ? '#f0fdf4' : C.amberSoft, border: `1px solid ${copied ? '#bbf7d0' : C.amberLine}`, color: copied ? '#16a34a' : C.amber, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: sans }}>
              {copied ? '✅ Copied!' : '📋 Copy Link'}
            </button>
            <button onClick={shareSMS} style={{ padding: '10px', borderRadius: '9px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: sans }}>📲 Share</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          <button onClick={shareSMS} style={{ padding: '11px', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: sans }}>💬 Text Message</button>
          <button onClick={shareMessenger} style={{ padding: '11px', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: sans }}>💙 Messenger</button>
        </div>

        <div style={{ background: C.amberSoft, border: `1px solid ${C.amberLine}`, borderRadius: '12px', padding: '14px', marginBottom: '20px', textAlign: 'left' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: C.ink3, marginBottom: '10px' }}>Susunod na hakbang</div>
          {[
            'I-share ang referral link sa mga kasambahay na kakilala mo',
            'Kumpletuhin ang iyong profile para makatanggap ng payout',
            'I-upload ang mga kasambahay sa iyong dashboard',
          ].map((txt, i) => (
            <div key={i} style={{ display: 'flex', gap: '9px', marginBottom: i < 2 ? '9px' : 0, alignItems: 'flex-start' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: C.amberLine, color: C.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
              <span style={{ fontSize: '13px', color: C.ink3, lineHeight: 1.5 }}>{txt}</span>
            </div>
          ))}
        </div>

        <button style={{ ...s.goldBtn, marginBottom: '10px' }} onClick={() => setStep('step2')}>Kumpletuhin ang Profile Ko →</button>
        <button style={s.outlineBtn} onClick={() => router.push('/dashboard/partner')}>Pumunta sa Dashboard</button>
      </div>
    </div>
  )

  // ─── STEP 2 ───
  if (step === 'step2') return (
    <div style={s.wrap}>
      <NavBar back={() => setStep('reflink')} title="Kumpletuhin ang Profile" sub="Hakbang 2 ng 2 · Para sa payout" />
      <div style={s.body}>
        <div style={{ fontFamily: serif, fontSize: '20px', color: C.ink, marginBottom: '6px' }}>Halos tapos na! 🙌</div>
        <div style={{ fontSize: '14px', color: C.ink3, marginBottom: '22px', lineHeight: 1.6 }}>Kailangan namin ng ilang detalye para mapadala ang iyong kita.</div>

        <label style={s.lbl}>GCash / Maya number (para sa payout) *</label>
        <input style={s.inp} type="tel" placeholder="09XX XXX XXXX" maxLength={11} value={gcash}
          onChange={e => setGcash(e.target.value.replace(/\D/g, '').slice(0, 11))} />

        <div style={s.divider} />
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px', color: C.ink3, marginBottom: '13px' }}>Saan ka kadalasang nakakakilala ng workers?</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px' }}>
          {NETWORK_OPTIONS.map(opt => (
            <div key={opt} style={s.chip(networks.includes(opt))}
              onClick={() => setNetworks(n => n.includes(opt) ? n.filter(x => x !== opt) : [...n, opt])}>
              {opt}
            </div>
          ))}
        </div>

        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px', color: C.ink3, marginBottom: '13px' }}>Ilan ang kakilala mong naghahanap ng trabaho ngayon?</div>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {POOL_SIZES.map(p => (
            <div key={p} style={s.chip(poolSize === p)} onClick={() => setPoolSize(p)}>{p}</div>
          ))}
        </div>

        <label style={s.lbl}>Maikling kwento (optional)</label>
        <textarea style={{ ...s.inp, resize: 'none', lineHeight: 1.55 }} rows={3}
          placeholder="Sabihin mo sa amin kung paano mo nakilala ang mga kasambahay sa iyong komunidad..."
          value={note} onChange={e => setNote(e.target.value)} />

        <div style={{ background: C.amberSoft, border: `1px solid ${C.amberLine}`, borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#78350f', lineHeight: 1.65 }}>
          Sa pag-submit, sumasang-ayon ka na ang lahat ng transaksyon ay dumaan sa MaidIt platform. Bawal ang hiwalay na placement fee.<br /><br />
          Kung ang kasambahay ay aalis sa loob ng 30 araw, ang ₱500 na recruitment fee ay ibabawas sa iyong susunod na kita.
        </div>

        <button style={{ ...s.goldBtn, opacity: submitting2 ? .6 : 1 }} onClick={handleStep2} disabled={submitting2}>
          {submitting2 ? 'Nagse-save...' : 'I-save ang Profile →'}
        </button>
      </div>
    </div>
  )

  return null
}
