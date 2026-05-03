'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

export default function PartnerPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('landing')

  // Step 1
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [provinces, setProvinces] = useState<Province[]>([])
  const [provSearch, setProvSearch] = useState('')
  const [provOpen, setProvOpen] = useState(false)
  const [selProv, setSelProv] = useState<Province | null>(null)
  const [selfieData, setSelfieData] = useState<string | null>(null)
  const [s1Error, setS1Error] = useState('')
  const [submitting1, setSubmitting1] = useState(false)
  const selfieRef = useRef<HTMLInputElement>(null)
  const provRef = useRef<HTMLDivElement>(null)

  // Referral code
  const [refCode, setRefCode] = useState('')
  const [copied, setCopied] = useState(false)

  // Step 2
  const [gcash, setGcash] = useState('')
  const [networks, setNetworks] = useState<string[]>([])
  const [poolSize, setPoolSize] = useState('')
  const [note, setNote] = useState('')
  const [submitting2, setSubmitting2] = useState(false)

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
    if (!name.trim()) { setS1Error('Pakisulat ang iyong pangalan.'); return }
    if (!mobile || mobile.length !== 11 || !mobile.startsWith('09')) {
      setS1Error('Pakisulat ang tamang 11-digit mobile number na nagsisimula sa 09.'); return
    }
    if (!selProv) { setS1Error('Piliin ang iyong probinsya.'); return }
    setS1Error('')
    setSubmitting1(true)

    const { supabase } = await import('../../lib/supabase')
    const email = `partner_${mobile}@maidit.app`
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

  const s: any = {
    wrap: { minHeight: '100vh', background: '#faf8f5', color: '#1a1a1a', fontFamily: 'sans-serif' },
    nav: { background: '#fff', borderBottom: '1px solid #ede8e0', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 100 },
    body: { padding: '22px 18px 56px' },
    lbl: { display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#6b7280', marginBottom: '5px' },
    inp: { width: '100%', padding: '12px 13px', border: '1.5px solid #e5e0d8', borderRadius: '11px', fontSize: '14px', background: '#fff', color: '#1a1a1a', outline: 'none', marginBottom: '12px', fontFamily: 'sans-serif', boxSizing: 'border-box' as const },
    sel: { width: '100%', padding: '12px 13px', border: '1.5px solid #e5e0d8', borderRadius: '11px', fontSize: '14px', background: '#fff', color: '#1a1a1a', outline: 'none', marginBottom: '12px', fontFamily: 'sans-serif', boxSizing: 'border-box' as const },
    goldBtn: { width: '100%', padding: '14px', borderRadius: '12px', background: '#c9943a', border: 'none', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' },
    outlineBtn: { width: '100%', padding: '12px', borderRadius: '12px', background: 'transparent', border: '1.5px solid #e5e0d8', color: '#6b7280', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif', marginTop: '10px' },
    card: { background: '#fff', borderRadius: '13px', padding: '14px', marginBottom: '12px', border: '1px solid #ede8e0' },
    divider: { height: '1px', background: '#ede8e0', margin: '18px 0' },
    chip: (on: boolean) => ({
      display: 'inline-flex', alignItems: 'center', padding: '8px 14px', borderRadius: '50px',
      cursor: 'pointer', fontSize: '12px', fontWeight: 600, margin: '3px',
      border: on ? 'none' : '1.5px solid #e5e0d8',
      background: on ? 'rgba(201,148,58,.12)' : '#fff',
      color: on ? '#c9943a' : '#6b7280',
      boxShadow: on ? '0 0 0 1.5px #c9943a' : 'none'
    }),
    err: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '9px', padding: '10px 13px', fontSize: '13px', color: '#dc2626', marginBottom: '12px' },
  }

  const NavBar = ({ back, title, sub }: { back?: () => void; title: string; sub?: string }) => (
    <div style={s.nav}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {back && <button onClick={back} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '16px', padding: 0 }}>←</button>}
        <div>
          <div style={{ fontFamily: 'serif', fontSize: '15px', fontWeight: 900, color: '#1a1a1a' }}>{title}</div>
          {sub && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{sub}</div>}
        </div>
      </div>
      {back && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '20px', height: '4px', borderRadius: '2px', background: '#c9943a' }} />
          <div style={{ width: '20px', height: '4px', borderRadius: '2px', background: step === 'step2' ? '#c9943a' : '#e5e7eb' }} />
        </div>
      )}
    </div>
  )

  // ─── LANDING ───
  if (step === 'landing') return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', fontFamily: 'sans-serif', color: '#1a1a1a' }}>
      {/* HEADER */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #ede8e0', padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>👥</div>
          <span style={{ fontFamily: 'serif', fontSize: '14px', fontWeight: 900, color: '#1a1a1a' }}>Community Partners Program</span>
        </div>
        <div style={{ display: 'flex', gap: '7px' }}>
          <button onClick={() => router.push('/login')} style={{ padding: '5px 12px', borderRadius: '7px', background: 'transparent', border: '1.5px solid #e5e0d8', color: '#6b7280', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif' }}>Login</button>
          <button onClick={() => setStep('step1')} style={{ padding: '6px 14px', borderRadius: '8px', background: '#c9943a', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>Maging Partner</button>
        </div>
      </nav>

      {/* HERO CARD — contained, rounded, two-column */}
      <div style={{ margin: '14px 14px 0', background: '#faf8f5', borderRadius: '20px', border: '1.5px solid #e8e2d9', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '230px' }}>
          {/* Left — photo */}
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <img
              src="https://xlagwtsrjbylhxfozoem.supabase.co/storage/v1/object/public/assets/ChatGPT%20Image%20May%203,%202026%20at%2008_38_45%20PM.png"
              alt="Filipino family"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: '280px', borderRadius: '12px 0 0 12px' }}
            />
          </div>
          {/* Right — text */}
          <div style={{ padding: '20px 16px 20px 14px', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', background: '#1a6b3c', borderRadius: '50px', padding: '4px 10px', fontSize: '8px', fontWeight: 700, color: '#fff', textTransform: 'uppercase' as const, letterSpacing: '.5px', marginBottom: '11px', alignSelf: 'flex-start' as const }}>Community Partner</div>
            <h1 style={{ fontFamily: 'serif', fontSize: '20px', fontWeight: 900, lineHeight: 1.2, marginBottom: '9px', color: '#1a1a1a' }}>
              Kumita habang<br />
              <em style={{ color: '#1a6b3c', fontStyle: 'italic' }}>tumutulong sa iyong komunidad 🍃</em>
            </h1>
            <p style={{ fontSize: '10px', color: '#6b7280', lineHeight: 1.65, marginBottom: '13px' }}>
              Mag-refer ng mga naghahanap ng trabaho sa iyong komunidad — kumita ng <strong style={{ color: '#1a1a1a' }}>₱1,000</strong> sa bawat successful hire.
            </p>
            <button style={{ padding: '10px 14px', borderRadius: '9px', background: '#c9943a', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif', alignSelf: 'flex-start' as const }} onClick={() => setStep('step1')}>
              Maging Community Partner →
            </button>
          </div>
        </div>
      </div>

      {/* EARNINGS — two cards side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '12px 14px 0' }}>
        {/* Kita per hire */}
        <div style={{ background: '#1a6b3c', borderRadius: '14px', padding: '15px 14px' }}>
          <div style={{ fontSize: '8px', color: 'rgba(255,255,255,.55)', textTransform: 'uppercase' as const, letterSpacing: '.6px', marginBottom: '8px' }}>KITA MO PER HIRE</div>
          <div style={{ fontFamily: 'serif', fontSize: '30px', fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: '5px' }}>₱1,000</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.75)', marginBottom: '8px' }}>bawat kasambahay na ma-hire</div>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,.42)', lineHeight: 1.5 }}>Walang limit — mas marami, mas malaki ang kita.</div>
        </div>
        {/* Halimbawa */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '15px 14px', border: '1px solid #ede8e0' }}>
          <div style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '.6px', marginBottom: '10px' }}>HALIMBAWA</div>
          <div style={{ paddingBottom: '9px', borderBottom: '1px solid #f3f4f6', marginBottom: '9px' }}>
            <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>5 hires / buwan</div>
            <div style={{ fontFamily: 'serif', fontSize: '22px', fontWeight: 900, color: '#1a6b3c' }}>₱5,000</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>20 hires / buwan</div>
            <div style={{ fontFamily: 'serif', fontSize: '22px', fontWeight: 900, color: '#1a6b3c' }}>₱20,000</div>
          </div>
        </div>
      </div>

      {/* 3 FEATURE CARDS — horizontal row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '12px 14px 20px' }}>
        {[
          { icon: '📋', title: 'Madali lang', sub: 'I-share lang ang link mo sa mga naghahanap ng trabaho sa iyong komunidad.' },
          { icon: '📩', title: 'May Job Offer', sub: 'Kapag may na-hire, makatanggap ka ng ₱1,000.' },
          { icon: '♾️', title: 'Kumita Palagi', sub: 'Walang limit ang pwede mong kitain. Tuloy-tuloy ang earnings mo!' },
        ].map((card, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '13px 11px', border: '1px solid #ede8e0', display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#fef3e2', border: '1px solid #fde8c0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>{card.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '11px', color: '#1a1a1a', lineHeight: 1.3 }}>{card.title}</div>
            <div style={{ fontSize: '10px', color: '#6b7280', lineHeight: 1.5 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* FOOTER BANNER */}
      <div style={{ background: '#fef3e2', borderTop: '1px solid #fde8c0', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '22px', flexShrink: 0 }}>⭐</span>
        <div style={{ flex: 1, fontSize: '13px', fontWeight: 700, color: '#c9943a', lineHeight: 1.5 }}>
          Mas maraming referrals, mas maraming kita!
        </div>
        <button style={{ padding: '9px 14px', borderRadius: '9px', background: '#c9943a', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif', flexShrink: 0, whiteSpace: 'nowrap' as const }} onClick={() => setStep('step1')}>
          Sumali →
        </button>
      </div>
    </div>
  )

  // ─── STEP 1 ───
  if (step === 'step1') return (
    <div style={s.wrap}>
      <NavBar back={() => setStep('landing')} title="Quick Signup" sub="Hakbang 1 ng 2" />
      <div style={s.body}>
        <div style={{ fontFamily: 'serif', fontSize: '22px', fontWeight: 900, marginBottom: '6px' }}>Ilang detalye lang 👋</div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px', lineHeight: 1.6 }}>Tapos may referral link ka na agad. Libre at walang bayad.</div>

        <label style={s.lbl}>Buong pangalan *</label>
        <input style={s.inp} type="text" placeholder="Juan Dela Cruz" value={name}
          onChange={e => setName(e.target.value.replace(/\b\w/g, c => c.toUpperCase()))} />

        <label style={s.lbl}>Mobile number *</label>
        <input style={s.inp} type="tel" placeholder="09XX XXX XXXX" maxLength={11} value={mobile}
          onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 11))} />

        <label style={s.lbl}>Probinsya *</label>
        <div ref={provRef} style={{ position: 'relative' }}>
          <div onClick={() => setProvOpen(!provOpen)} style={{ width: '100%', padding: '12px 13px', border: `1.5px solid ${selProv ? '#c9943a' : '#e5e0d8'}`, borderRadius: '11px', fontSize: '14px', background: '#fff', color: selProv ? '#1a1a1a' : '#9ca3af', marginBottom: provOpen ? '0' : '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxSizing: 'border-box' as const }}>
            <span>{selProv ? selProv.name : 'Piliin ang probinsya'}</span>
            <span style={{ fontSize: '11px', opacity: .5 }}>▾</span>
          </div>
          {provOpen && (
            <div style={{ background: '#fff', border: '1.5px solid #e5e0d8', borderRadius: '11px', marginBottom: '12px', overflow: 'hidden', position: 'relative', zIndex: 50 }}>
              <input autoFocus style={{ width: '100%', padding: '10px 12px', border: 'none', borderBottom: '1px solid #ede8e0', background: '#faf8f5', color: '#1a1a1a', fontSize: '13px', outline: 'none', fontFamily: 'sans-serif' }}
                placeholder="Hanapin ang probinsya..." value={provSearch}
                onChange={e => setProvSearch(e.target.value)} />
              <div style={{ maxHeight: '190px', overflowY: 'auto' }}>
                {filteredProvs.length === 0
                  ? <div style={{ padding: '12px', fontSize: '12px', color: '#9ca3af' }}>Walang nahanap</div>
                  : filteredProvs.map(p => (
                    <div key={p.code} onClick={() => { setSelProv(p); setProvOpen(false); setProvSearch('') }}
                      style={{ padding: '10px 13px', cursor: 'pointer', fontSize: '13px', color: selProv?.code === p.code ? '#c9943a' : '#1a1a1a', background: selProv?.code === p.code ? 'rgba(201,148,58,.08)' : 'transparent', borderBottom: '1px solid #f3f4f6' }}>
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
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', lineHeight: 1.5 }}>Hindi ito i-po-post — para lang sa verification ng iyong account.</div>

        {selfieData && <img src={selfieData} alt="selfie" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '11px', marginBottom: '12px' }} />}

        <div onClick={() => selfieRef.current?.click()} style={{ background: '#f9fafb', border: `2px dashed ${selfieData ? '#1a6b3c' : '#d1d5db'}`, borderRadius: '13px', padding: '24px 16px', textAlign: 'center', cursor: 'pointer', marginBottom: '12px' }}>
          {selfieData
            ? <><div style={{ fontSize: '20px', marginBottom: '6px' }}>✅</div><div style={{ fontWeight: 700, fontSize: '13px', color: '#1a6b3c' }}>Selfie saved!</div><div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>I-tap para palitan</div></>
            : <><div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div><div style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a1a', marginBottom: '4px' }}>I-tap para kumuha ng selfie</div><div style={{ fontSize: '12px', color: '#6b7280' }}>Malinaw na mukha · Walang filter</div></>
          }
        </div>
        <input ref={selfieRef} type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={handleSelfie} />

        {s1Error && <div style={s.err}>⚠️ {s1Error}</div>}

        <button style={{ ...s.goldBtn, opacity: submitting1 ? .6 : 1 }} onClick={handleStep1} disabled={submitting1}>
          {submitting1 ? 'Naglo-load...' : 'Maging Community Partner →'}
        </button>
        <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', marginTop: '10px', lineHeight: 1.6 }}>
          Quick approval — we'll text you once ready. Libre at secure ang info mo.
        </div>
      </div>
    </div>
  )

  // ─── REFERRAL LINK ───
  if (step === 'reflink') return (
    <div style={s.wrap}>
      <nav style={s.nav}>
        <span style={{ fontFamily: 'serif', fontSize: '18px', fontWeight: 900, color: '#1a1a1a' }}>Maid<span style={{ color: '#c9943a' }}>It</span></span>
      </nav>
      <div style={{ padding: '36px 18px 48px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
        <h1 style={{ fontFamily: 'serif', fontSize: '24px', fontWeight: 900, color: '#1a6b3c', marginBottom: '8px' }}>Eto na ang referral code mo!</h1>
        <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.7, marginBottom: '24px' }}>
          Simulan nang kumita — mag-refer ng kakilalang naghahanap ng trabaho, may <strong style={{ color: '#1a1a1a' }}>₱1,000</strong> ka sa bawat successful hire!
        </p>

        <div style={{ background: '#fff', border: '1px solid #fde8c0', borderRadius: '13px', padding: '16px', marginBottom: '14px', textAlign: 'left' }}>
          <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px' }}>Referral Code</div>
          <div style={{ fontFamily: 'serif', fontSize: '22px', fontWeight: 900, color: '#c9943a', letterSpacing: '1px', marginBottom: '4px' }}>{refCode}</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>maidit.vercel.app/signup/kasambahay?ref={refCode}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button onClick={copyLink} style={{ padding: '10px', borderRadius: '9px', background: copied ? '#f0fdf4' : '#fef3e2', border: `1px solid ${copied ? '#bbf7d0' : '#fde8c0'}`, color: copied ? '#16a34a' : '#c9943a', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>
              {copied ? '✅ Copied!' : '📋 Copy Link'}
            </button>
            <button onClick={shareSMS} style={{ padding: '10px', borderRadius: '9px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>📲 Share</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          <button onClick={shareSMS} style={{ padding: '11px', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>💬 Text Message</button>
          <button onClick={shareMessenger} style={{ padding: '11px', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>💙 Messenger</button>
        </div>

        <div style={{ background: '#fef3e2', border: '1px solid #fde8c0', borderRadius: '12px', padding: '14px', marginBottom: '20px', textAlign: 'left' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: '#9ca3af', marginBottom: '10px' }}>Susunod na hakbang</div>
          {[
            'I-share ang referral link sa mga kasambahay na kakilala mo',
            'Kumpletuhin ang iyong profile para makatanggap ng payout',
            'I-upload ang mga kasambahay sa iyong dashboard',
          ].map((txt, i) => (
            <div key={i} style={{ display: 'flex', gap: '9px', marginBottom: i < 2 ? '9px' : 0, alignItems: 'flex-start' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fde8c0', color: '#c9943a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
              <span style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>{txt}</span>
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
        <div style={{ fontFamily: 'serif', fontSize: '20px', fontWeight: 900, marginBottom: '6px' }}>Halos tapos na! 🙌</div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '22px', lineHeight: 1.6 }}>Kailangan namin ng ilang detalye para mapadala ang iyong kita.</div>

        <label style={s.lbl}>GCash / Maya number (para sa payout) *</label>
        <input style={s.inp} type="tel" placeholder="09XX XXX XXXX" maxLength={11} value={gcash}
          onChange={e => setGcash(e.target.value.replace(/\D/g, '').slice(0, 11))} />

        <div style={s.divider} />
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px', color: '#6b7280', marginBottom: '13px' }}>Saan ka kadalasang nakakakilala ng workers?</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px' }}>
          {NETWORK_OPTIONS.map(opt => (
            <div key={opt} style={s.chip(networks.includes(opt))}
              onClick={() => setNetworks(n => n.includes(opt) ? n.filter(x => x !== opt) : [...n, opt])}>
              {opt}
            </div>
          ))}
        </div>

        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px', color: '#6b7280', marginBottom: '13px' }}>Ilan ang kakilala mong naghahanap ng trabaho ngayon?</div>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {POOL_SIZES.map(p => (
            <div key={p} style={s.chip(poolSize === p)} onClick={() => setPoolSize(p)}>{p}</div>
          ))}
        </div>

        <label style={s.lbl}>Maikling kwento (optional)</label>
        <textarea style={{ ...s.inp, resize: 'none', lineHeight: 1.55 }} rows={3}
          placeholder="Sabihin mo sa amin kung paano mo nakilala ang mga kasambahay sa iyong komunidad..."
          value={note} onChange={e => setNote(e.target.value)} />

        <div style={{ background: '#fef3e2', border: '1px solid #fde8c0', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '12px', color: '#78350f', lineHeight: 1.65 }}>
          Sa pag-submit, sumasang-ayon ka na ang lahat ng transaksyon ay dumaan sa MaidIt platform. Bawal ang hiwalay na placement fee.
        </div>

        <button style={{ ...s.goldBtn, opacity: submitting2 ? .6 : 1 }} onClick={handleStep2} disabled={submitting2}>
          {submitting2 ? 'Nagse-save...' : 'I-save ang Profile →'}
        </button>
      </div>
    </div>
  )

  return null
}
