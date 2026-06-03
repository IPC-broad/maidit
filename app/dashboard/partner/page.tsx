// PARTNER PAGE — All UI text must be in Taglish
// DO NOT translate to English during audits
'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const C = {
  forest: '#1a6b3c', forestDeep: '#27500A', forestDark: '#1c3b07', forestDarkest: '#0f2105',
  amber: '#c9943a', amberSoft: '#fef3e2', amberLine: '#fde8c0',
  ink: '#1a1a1a', ink2: '#4a504a', ink3: '#9ca3af',
  paper: '#ffffff', paper2: '#faf8f5', line: '#ede8e0',
}
const serif = "'Instrument Serif', Georgia, serif"
const sans  = "'Geist', ui-sans-serif, sans-serif"

const SKILLS = [
  'Pagluluto',
  'Paglalaba',
  'Paglilinis',
  'Pag-aalaga ng Bata',
  'Pag-aalaga ng Matanda',
  'Pag-aalaga ng Alagang Hayop',
  'Pamimili',
  'Pagmamaneho',
]
const SETUPS = ['Stay-in', 'Stay-out', 'Kahit alin']
const CIVIL_STATUS = ['Single', 'May asawa', 'Balo/Biyuda']
const AVAILABILITY = ['1-6 araw', '1 linggo', '2 linggo', '1 buwan', 'Iba pa (custom)']
const PROVINCES = ['Abra','Agusan del Norte','Agusan del Sur','Aklan','Albay','Antique','Apayao','Aurora','Basilan','Bataan','Batanes','Batangas','Benguet','Biliran','Bohol','Bukidnon','Bulacan','Cagayan','Camarines Norte','Camarines Sur','Camiguin','Capiz','Catanduanes','Cavite','Cebu','Cotabato','Davao de Oro','Davao del Norte','Davao del Sur','Davao Occidental','Davao Oriental','Dinagat Islands','Eastern Samar','Guimaras','Ifugao','Ilocos Norte','Ilocos Sur','Iloilo','Isabela','Kalinga','La Union','Laguna','Lanao del Norte','Lanao del Sur','Leyte','Maguindanao del Norte','Maguindanao del Sur','Marinduque','Masbate','Metro Manila','Misamis Occidental','Misamis Oriental','Mountain Province','Negros Occidental','Negros Oriental','Northern Samar','Nueva Ecija','Nueva Vizcaya','Occidental Mindoro','Oriental Mindoro','Palawan','Pampanga','Pangasinan','Quezon','Quirino','Rizal','Romblon','Samar','Sarangani','Siquijor','Sorsogon','South Cotabato','Southern Leyte','Sultan Kudarat','Sulu','Surigao del Norte','Surigao del Sur','Tarlac','Tawi-Tawi','Zambales','Zamboanga del Norte','Zamboanga del Sur','Zamboanga Sibugay']

type Payout = {
  id: string; amount: number; type: string; status: string; due_at: string
  offer: { kasambahay_profile: { full_name: string }; homeowner_profile: { full_name: string } }
}
type Worker = {
  id: string; province: string; skills: string[]; status?: string; confirmed_at?: string
  profile_id?: string; asking_salary?: number; setup?: string; selfie_url?: string
  availability?: string; edad?: number; referred_by?: string; proxy_mode?: boolean; proxy_partner_id?: string
  profiles?: { full_name: string; mobile: string }
}

export default function PartnerDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<'workers' | 'payouts' | 'add'>('workers')
  const [referMode, setReferMode] = useState<'choose' | 'share' | 'manual' | null>(null)
  const [manualStep, setManualStep] = useState<1 | 2 | 3>(1)
  const [partner, setPartner] = useState<any>(null)
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [workerOffers, setWorkerOffers] = useState<any[]>([])
  const [proxyOffers, setProxyOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [savedName, setSavedName] = useState('')
  const [counterSheet, setCounterSheet] = useState<string | null>(null)
  const [counterSalaryInput, setCounterSalaryInput] = useState('')
  const [counterDateInput, setCounterDateInput] = useState('')
  const [proxyActioning, setProxyActioning] = useState<string | null>(null)
  const [isFacebook, setIsFacebook] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)

  const [workerForm, setWorkerForm] = useState({
    apelyido: '', pangalan: '', mobile: '', province: '',
    skills: [] as string[], setup: 'Kahit alin', civil_status: '',
    num_children: '0', availability: '', availability_custom: '',
    photo: null as string | null, has_nbi: false, govt_id_types: [] as string[],
  })
  const [workerConfirmed, setWorkerConfirmed] = useState(false)
  const [workerAge, setWorkerAge] = useState('')
  const [workerHowReferred, setWorkerHowReferred] = useState('')
  const [workerSalary, setWorkerSalary] = useState('')
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({})
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({})
  const [profileNames, setProfileNames] = useState<Record<string, string>>({})

  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600;700&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    return () => { try { document.head.removeChild(link) } catch {} }
  }, [])


  useEffect(() => {
    const init = async () => {
      const { supabase } = await import('../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      if (user.app_metadata?.provider === 'facebook') setIsFacebook(true)
      const { data: partnerData } = await supabase
        .from('partners').select('*, profiles(*)').eq('profile_id', user.id).single()
      if (!partnerData) { router.push('/'); return }
      if (partnerData.approved === false) { router.push('/partner/pending'); return }
      setPartner(partnerData)
      const { data: payoutsData } = await supabase.from('payouts')
        .select('*, offer:offers(kasambahay_profile:profiles!offers_kasambahay_id_fkey(full_name), homeowner_profile:profiles!offers_homeowner_id_fkey(full_name))')
        .eq('partner_id', partnerData.id).order('due_at', { ascending: false })
      setPayouts(payoutsData || [])
      const { data: workersData } = await supabase.from('kasambahay')
        .select('id, profile_id, asking_salary, setup, skills, province, selfie_url, availability, edad, referred_by, proxy_mode, proxy_partner_id')
        .eq('referred_by', partnerData.referral_code)
      const wProfileIds = (workersData || []).map((w: any) => w.profile_id).filter(Boolean)
      if (wProfileIds.length > 0) {
        const { data: wProfileData } = await supabase.from('profiles').select('id, full_name').in('id', wProfileIds)
        const wProfileMap: Record<string, string> = {}
        ;(wProfileData || []).forEach((p: any) => {
          if (p.full_name) {
            const parts = p.full_name.trim().split(' ')
            const first = parts[0]
            const lastInitial = parts.length > 1 ? parts[parts.length - 1][0] + '.' : ''
            wProfileMap[p.id] = lastInitial ? `${first} ${lastInitial}` : first
          }
        })
        console.log('[profileNames]', wProfileMap)
        setProfileNames(wProfileMap)
      }
      setWorkers(workersData || [])
      const workerIds = (workersData || []).map((w: any) => w.id)
      if (workerIds.length > 0) {
        const { data: offersData } = await supabase
          .from('offers').select('id, kasambahay_id, status, salary, setup, city, start_date, scope, urgency')
          .in('kasambahay_id', workerIds)
          .in('status', ['pending', 'countered', 'agreed'])
        setWorkerOffers(offersData || [])
      }

      // Proxy offers — two-step fetch
      const { data: proxies } = await supabase
        .from('kasambahay')
        .select('id, profile_id')
        .eq('proxy_mode', true)
        .eq('proxy_partner_id', partnerData.profile_id)
      const proxyKbIds = (proxies || []).map((k: any) => k.id)
      console.log('[proxy-offers] proxies:', proxies)
      console.log('[proxy-offers] proxyKbIds:', proxyKbIds)
      if (proxyKbIds.length > 0) {
        const { data: proxyOffersData } = await supabase
          .from('offers')
          .select('id, kasambahay_id, status, salary, setup, city, start_date, scope, urgency')
          .in('kasambahay_id', proxyKbIds)
          .in('status', ['pending', 'countered'])
        console.log('[proxy-offers] offers:', proxyOffersData)
        setProxyOffers(proxyOffersData || [])
      }
      setLoading(false)
    }
    init()
  }, [])

  const referralCode = partner?.referral_code ||
    (partner ? `Imaidit-${(partner.profiles?.full_name || 'P').split(' ').map((w: string) => w[0]).join('').toUpperCase()}${new Date(partner.created_at || Date.now()).getFullYear()}` : '')

  const copyCode = () => {
    const link = `https://maidit.vercel.app/signup/kasambahay?ref=${referralCode}`
    navigator.clipboard.writeText(link).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareSMS = () => {
    const msg = encodeURIComponent(`Mag-apply bilang kasambahay sa MaidIt! Libre at ligtas. Gamitin ang link ko: https://maidit.vercel.app/signup/kasambahay?ref=${referralCode}`)
    window.open(`sms:?body=${msg}`, '_blank')
  }

  const toggleSkill = (skill: string) => {
    setWorkerForm(f => ({ ...f, skills: f.skills.includes(skill) ? f.skills.filter(s => s !== skill) : [...f.skills, skill] }))
  }

  const toggleGovtId = (id: string) => {
    if (id === 'Wala') {
      setWorkerForm(f => ({ ...f, govt_id_types: f.govt_id_types.includes('Wala') ? [] : ['Wala'] }))
    } else {
      setWorkerForm(f => {
        const without = f.govt_id_types.filter((x: string) => x !== 'Wala')
        return { ...f, govt_id_types: without.includes(id) ? without.filter((x: string) => x !== id) : [...without, id] }
      })
    }
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setWorkerForm(f => ({ ...f, photo: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const handleAddWorker = async () => {
    const { apelyido, pangalan, mobile, province } = workerForm
    if (!apelyido || !pangalan || !mobile || !province) {
      setSaveMsg('Pakisulat ang lahat ng required fields.'); return
    }
    if (mobile.length !== 11 || !mobile.startsWith('09')) {
      setSaveMsg('Pakisulat ang tamang 11-digit mobile number.'); return
    }
    if (workerForm.skills.length === 0) {
      setSaveMsg('Pumili ng kahit isang kasanayan.'); return
    }
    if (!workerSalary) { setSaveMsg('Ilagay ang hinahangad na sahod.'); return }
    if (!workerHowReferred) { setSaveMsg('Piliin kung paano kayo nagkakilala.'); return }
    if (!workerConfirmed) { setSaveMsg('Kailangan mong i-confirm ang checkbox sa ibaba.'); return }
    setSaving(true)
    setSaveMsg('')
    const { supabase } = await import('../../../lib/supabase')
    const { data: existing } = await supabase.from('profiles').select('id').eq('mobile', mobile).single()
    if (existing) {
      setSaveMsg('ERROR: Ang mobile number na ito ay rehistrado na.')
      setSaving(false); return
    }
    const full_name = `${pangalan} ${apelyido}`
    console.log('[manual-add] step 1 — inserting profile', { full_name, mobile, province })
    const { data: profile, error: profileError } = await supabase.from('profiles').insert({
      full_name, mobile, role: 'kasambahay'
    }).select().single()
    console.log('[manual-add] profile result:', { profile, profileError })
    if (profileError || !profile) {
      console.error('[partner-add] profiles insert error:', profileError)
      setSaveMsg('Hindi ma-save. Subukan ulit.')
      setSaving(false); return
    }
    let photoUrl: string | null = null
    if (workerForm.photo && profile.id) {
      try {
        const blob = await fetch(workerForm.photo).then(r => r.blob())
        const { data: uploadData } = await supabase.storage
          .from('kasambahay-photos')
          .upload(`${profile.id}/photo.png`, blob, { upsert: true, contentType: 'image/png' })
        if (uploadData) {
          const { data: { publicUrl } } = supabase.storage.from('kasambahay-photos').getPublicUrl(`${profile.id}/photo.png`)
          photoUrl = publicUrl
        }
      } catch {}
    }
    const kasambahayRow: any = {
      profile_id: profile.id,
      referred_by: partner.referral_code,
      proxy_mode: true,
      proxy_partner_id: partner.profile_id,
      skills: workerForm.skills,
      setup: workerForm.setup,
      availability: workerForm.availability,
      province: workerForm.province,
      partner_photo_url: photoUrl || null,
      is_verified: false,
    }
    if (workerAge) kasambahayRow.edad = parseInt(workerAge)
    if (workerSalary) kasambahayRow.asking_salary = parseInt(workerSalary)
    if (workerHowReferred) kasambahayRow.how_referred = workerHowReferred
    console.log('[proxy-insert] proxy_partner_id:', partner.profile_id)
    console.log('[proxy-insert] referred_by:', partner.referral_code)
    console.log('[proxy-insert] full kasambahayRow:', JSON.stringify(kasambahayRow))
    const { error: kasambahayError } = await supabase.from('kasambahay').insert(kasambahayRow)
    console.log('[manual-add] kasambahay result:', { kasambahayError })
    if (kasambahayError) {
      console.error('[partner-add] kasambahay insert error:', kasambahayError)
      setSaveMsg(`ERROR sa pag-save ng kasambahay: ${kasambahayError.message}`)
      setSaving(false); return
    }
    setSavedName(pangalan)
    setShowSuccess(true)
    setSaving(false)
    setWorkerForm({ apelyido: '', pangalan: '', mobile: '', province: '', skills: [], setup: 'Stay-in', civil_status: '', num_children: '0', availability: '', availability_custom: '', photo: null, has_nbi: false, govt_id_types: [] })
    setWorkerAge('')
    setWorkerSalary('')
    setWorkerHowReferred('')
    setWorkerConfirmed(false)
  }

  const totalEarned = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const totalPending = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
  const isGold = partner?.tier === 'gold'
  const hiredCount = workers.filter(w => w.status === 'hired').length
  const workersWithPendingOffer = workers.filter(w => workerOffers.some(o => o.kasambahay_id === w.id))

  const newlyConfirmed = workers.filter(w => {
    if (w.status !== 'available') return false
    if (!w.confirmed_at) return false
    const days = (Date.now() - new Date(w.confirmed_at).getTime()) / (1000 * 60 * 60 * 24)
    return days <= 7
  }).length

  const statusLabel: Record<string, { label: string; bg: string; color: string }> = {
    hired: { label: 'Na-hire', bg: '#f0fdf4', color: '#1a6b3c' },
    available: { label: 'Available', bg: '#eff6ff', color: '#2563eb' },
    pending_confirmation: { label: 'Hindi pa nagcoconfirm', bg: '#fef3e2', color: '#c9943a' },
    pending: { label: 'Hindi pa nagcoconfirm', bg: '#fef3e2', color: '#c9943a' },
    draft: { label: 'Hindi pa nagcoconfirm', bg: '#fef3e2', color: '#c9943a' },
  }

  const s: any = {
    wrap: { minHeight: '100vh', background: C.paper2, fontFamily: sans, color: C.ink, paddingBottom: '40px' },
    lbl: { display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.07em', color: C.ink3, marginBottom: '5px', fontFamily: sans },
    inp: { width: '100%', padding: '11px 12px', border: `1.5px solid ${C.line}`, borderRadius: '10px', fontFamily: sans, fontSize: '14px', outline: 'none', background: C.paper, color: C.ink, boxSizing: 'border-box' as const, marginBottom: '10px' },
    sel: { width: '100%', padding: '11px 12px', border: `1.5px solid ${C.line}`, borderRadius: '10px', fontFamily: sans, fontSize: '14px', outline: 'none', background: C.paper, color: C.ink, boxSizing: 'border-box' as const, marginBottom: '10px' },
    submitBtn: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: C.forest, color: '#fff', fontFamily: sans, fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '8px', minHeight: 52, WebkitAppearance: 'none' },
    skillChip: (on: boolean) => ({ display: 'block', padding: '9px 10px', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, textAlign: 'center' as const, border: on ? `1.5px solid ${C.amber}` : `1.5px solid ${C.line}`, background: on ? C.amberSoft : C.paper, color: on ? '#92400e' : C.ink3 }),
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sans, color: C.ink3 }}>Loading...</div>
  )

  return (
    <div style={s.wrap}>
      {/* HEADER — forest green gradient */}
      <div style={{ background: `linear-gradient(160deg, ${C.forestDarkest} 0%, ${C.forestDark} 50%, ${C.forestDeep} 100%)`, padding: '18px 16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 400, color: '#fff', lineHeight: 1.2 }}>
              {partner?.profiles?.full_name?.split(' ')[0]}
            </div>
            <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' as const }}>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '50px', background: isGold ? 'rgba(240,201,122,.25)' : 'rgba(255,255,255,.15)', color: isGold ? '#f0c97a' : 'rgba(255,255,255,.85)', border: isGold ? '1px solid rgba(240,201,122,.4)' : '1px solid rgba(255,255,255,.25)', fontFamily: sans }}>
                {isGold ? '⭐ VIP Partner' : 'Community Partner'}
              </span>
              {isFacebook && (
                <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 9px', borderRadius: '50px', background: 'rgba(24,119,242,.15)', color: '#a8c8ff', border: '1px solid rgba(24,119,242,.3)', fontFamily: sans }}>
                  🔗 Connected via Facebook
                </span>
              )}
              {partner?.flagged && (
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '50px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontFamily: sans }}>
                  ⚠️ Flagged
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => { setTab('add'); setReferMode('choose') }}
              style={{ padding: '7px 12px', borderRadius: '50px', background: C.amber, border: 'none', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: sans, whiteSpace: 'nowrap' as const }}
            >
              + Mag-refer
            </button>
            <button
              onClick={async () => { const { supabase } = await import('../../../lib/supabase'); await supabase.auth.signOut(); router.push('/login') }}
              style={{ padding: '7px 12px', borderRadius: '50px', background: 'transparent', border: '1.5px solid rgba(255,255,255,.35)', color: 'rgba(255,255,255,.85)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: sans }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        {/* Negative balance warning */}
        {(partner?.balance ?? 0) < 0 && (
          <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '12px', padding: '12px 14px', marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626', marginBottom: '2px' }}>
                Your account has a negative balance of ₱{Math.abs(partner.balance).toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#b91c1c', lineHeight: 1.5 }}>
                This will be deducted from your next payout. Future payouts are held until this balance is cleared.
              </div>
            </div>
          </div>
        )}
        {newlyConfirmed > 0 && (
          <div style={{ background: "#c9943a", border: "1px solid #c9943a", borderRadius: "12px", padding: "12px 14px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => setTab("workers")}>
            <span style={{ fontSize: "20px" }}>🎉</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{newlyConfirmed} bagong referral na nagconfirm!</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,.85)", marginTop: "1px" }}>Makikita na sila ng mga homeowner. Tap para tingnan.</div>
            </div>
          </div>
        )}
        {workersWithPendingOffer.length > 0 && (
          <div style={{ background: "#fef3e2", border: "1px solid #fde8c0", borderRadius: "12px", padding: "12px 14px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => setTab("workers")}>
            <span style={{ fontSize: "20px" }}>📨</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#92400e" }}>{workersWithPendingOffer.length} referral mo may natanggap na job offer!</div>
              <div style={{ fontSize: "11px", color: "#b45309", marginTop: "1px" }}>Tulungan silang sagutin ito para makuha mo ang iyong kita.</div>
            </div>
          </div>
        )}
        {/* EARNINGS HERO */}
        <div style={{ background: '#1a6b3c', borderRadius: '16px', padding: '20px 18px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.6)', marginBottom: '4px', fontFamily: sans }}>Total Kinita</div>
              <div style={{ fontFamily: serif, fontSize: '36px', fontWeight: 400, color: '#fff', lineHeight: 1 }}>₱{totalEarned.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.6)', marginTop: '4px', fontFamily: sans }}>Kita mo mula sa mga successful hires</div>
            </div>
            {isGold && (
              <div style={{ background: 'rgba(255,255,255,.15)', borderRadius: '12px', padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', marginBottom: '2px' }}>⭐</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#f0c97a' }}>VIP Partner</div>
              </div>
            )}
          </div>
          <div style={{ background: 'rgba(255,255,255,.1)', borderRadius: '4px', height: '6px', marginBottom: '6px' }}>
            <div style={{ background: '#f0c97a', borderRadius: '4px', height: '6px', width: `${Math.min(hiredCount * 20, 100)}%`, transition: 'width .3s' }} />
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.5)' }}>{hiredCount} / 5 successful hire · ₱500 per successful hire</div>
        </div>

        {/* REFERRAL CODE */}
        <div style={{ background: C.paper, borderRadius: '14px', padding: '14px 16px', marginBottom: '12px', border: `1px solid ${C.line}` }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🔗</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', color: C.ink3, marginBottom: '2px', fontFamily: sans }}>Referral code mo</div>
              <div style={{ fontFamily: serif, fontSize: '18px', fontWeight: 400, color: C.forest, letterSpacing: '.5px' }}>{referralCode.toUpperCase()}</div>
              <div style={{ fontSize: '11px', color: C.ink3, marginTop: '2px', fontFamily: sans }}>I-share ang link na ito sa mga naghahanap ng trabaho bilang kasambahay.</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button onClick={copyCode} style={{ flex: 1, padding: '9px', borderRadius: '9px', background: copied ? C.forest : '#f0fdf4', border: `1px solid ${copied ? C.forest : '#bbf7d0'}`, color: copied ? '#fff' : C.forest, fontFamily: sans, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              {copied ? '✓ Copied!' : '📋 Copy Code'}
            </button>
            <button onClick={shareSMS} style={{ flex: 1, padding: '9px', borderRadius: '9px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', fontFamily: sans, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              💬 Share via SMS
            </button>
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          {[
            { icon: '💰', num: `₱${totalEarned.toLocaleString()}`, lbl: 'Kinita', sub: 'Total earnings mo', color: C.forest },
            { icon: '👤', num: hiredCount, lbl: 'Na-hire', sub: 'Successful hires', color: C.amber },
            { icon: '👥', num: workers.length, lbl: 'Narecruit', sub: 'Total referrals', color: '#2563eb' },
          ].map((stat, i) => (
            <div key={i} style={{ background: C.paper, borderRadius: '12px', padding: '12px 10px', border: `1px solid ${C.line}`, textAlign: 'center' as const }}>
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>{stat.icon}</div>
              <div style={{ fontFamily: serif, fontSize: '20px', fontWeight: 400, color: stat.color }}>{stat.num}</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: C.ink, marginTop: '1px', fontFamily: sans }}>{stat.lbl}</div>
              <div style={{ fontSize: '10px', color: C.ink3, fontFamily: sans }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* VIP BENEFIT */}
        {isGold && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', padding: '14px 16px', marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ fontSize: '28px' }}>⭐</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400e', marginBottom: '2px', fontFamily: sans }}>VIP Partner Benefit</div>
              <div style={{ fontSize: '13px', color: '#92400e', fontWeight: 600, fontFamily: sans }}>₱500 Referral Fee sa bawat matagumpay na hire.</div>
              <div style={{ fontSize: '12px', color: '#b45309', marginTop: '2px', fontFamily: sans }}>Makatanggap ng pera agad kapag dumating ang worker.</div>
            </div>
          </div>
        )}
        {!isGold && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '14px 16px', marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ fontSize: '28px' }}>💰</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: C.forest, marginBottom: '2px', fontFamily: sans }}>Partner Benefit</div>
              <div style={{ fontSize: '13px', color: C.forest, fontWeight: 600, fontFamily: sans }}>₱500 Referral Fee sa bawat matagumpay na hire</div>
              <div style={{ fontSize: '12px', color: '#166534', marginTop: '2px', fontFamily: sans }}>+₱500 BONUS for transport (Leyte/Samar/Bicol only)</div>
            </div>
          </div>
        )}

        {/* TABS */}
        <div style={{ display: 'flex', background: C.paper, borderRadius: '12px', border: `1px solid ${C.line}`, marginBottom: '14px', overflow: 'hidden' }}>
          {([
            { id: 'workers', icon: '👥', label: 'Workers', badge: newlyConfirmed },
            { id: 'payouts', icon: '💳', label: 'Payouts', badge: 0 },
          ] as const).map((t, i) => (
            <button key={t.id} onClick={() => { setTab(t.id); setReferMode(null); setManualStep(1) }} style={{ flex: 1, padding: '11px 4px', border: 'none', borderLeft: i > 0 ? `1px solid ${C.line}` : 'none', background: tab === t.id ? C.forest : 'transparent', cursor: 'pointer', fontFamily: sans, fontSize: '11px', fontWeight: 700, color: tab === t.id ? '#fff' : C.ink3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', position: 'relative' }}>
              <span style={{ fontSize: '16px' }}>{t.icon}</span>
              <span>{t.label}</span>
              {(t as any).badge > 0 && tab !== t.id && <span style={{ position: 'absolute', top: '4px', right: 'calc(50% - 18px)', background: '#dc2626', color: '#fff', borderRadius: '50%', width: '15px', height: '15px', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{(t as any).badge}</span>}
            </button>
          ))}
        </div>

        {/* WORKERS TAB */}
        {tab === 'workers' && (
          <>
            {workers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: '14px', border: '1px solid #ede8e0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>👥</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Wala pang workers sa pool mo.</div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>Mag-tap ng "Mag-refer" para magsimula.</div>
              </div>
            ) : workers.map((w: any) => {
              const isProxy = w.proxy_mode && w.proxy_partner_id === partner.profile_id
              const pendingOffer = isProxy ? proxyOffers.find((o: any) => o.kasambahay_id === w.id && o.status === 'pending') : undefined
              console.log('[worker-match] w.id:', w.id, 'w.profile_id:', w.profile_id, 'found offer:', pendingOffer)
              const workerOffer = workerOffers.find((o: any) => o.kasambahay_id === w.id)
              const st = workerOffer && ['pending','agreed'].includes(workerOffer.status)
                ? { label: 'May aktibong offer', bg: '#eff6ff', color: '#2563eb' }
                : workerOffer && ['hired','completed'].includes(workerOffer.status)
                ? { label: 'Na-hire na 🎉', bg: '#f0fdf4', color: '#166534' }
                : { label: 'Aktibo sa platform', bg: '#f0fdf4', color: '#1a6b3c' }
              return (
                <div key={w.id} style={{ background: '#fff', borderRadius: '14px', padding: '14px 16px', marginBottom: '10px', border: '1px solid #ede8e0' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#27500A', border: '2px solid #fde8c0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: '#fff', flexShrink: 0, fontFamily: sans }}>
                      {(() => { const n = profileNames[w.profile_id] || w.full_name || ''; const parts = n.trim().split(' '); return parts.length >= 2 ? parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase() : n[0]?.toUpperCase() || '?' })()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>{profileNames[w.profile_id] || w.full_name || 'Kasambahay'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>{w.province}</span>
                        {isProxy && <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: C.amberSoft, color: '#92400e', border: `1px solid ${C.amberLine}` }}>Proxy</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '50px', background: st.bg, color: st.color, whiteSpace: 'nowrap' as const, border: `1px solid ${st.color}30` }}>{st.label}</span>
                  </div>
                  {isProxy && pendingOffer && (
                    <div style={{ marginTop: '12px', borderTop: `1px solid ${C.line}`, paddingTop: '12px' }}>
                      <div style={{ background: C.amberSoft, border: `1px solid ${C.amberLine}`, borderRadius: '10px', padding: '8px 12px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>🤝</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#92400e', fontFamily: sans }}>May offer para sa kanya — ikaw ang kumakatawan</span>
                      </div>
                      <div style={{ background: C.paper2, borderRadius: '10px', padding: '10px 12px', marginBottom: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <div style={{ fontSize: '10px', color: C.ink3, marginBottom: '2px', fontFamily: sans }}>Salary</div>
                            <div style={{ fontFamily: serif, fontSize: '16px', fontWeight: 400, color: C.forest }}>₱{pendingOffer.salary?.toLocaleString()}<span style={{ fontSize: '10px', color: C.ink3 }}>/buwan</span></div>
                          </div>
                          <div>
                            <div style={{ fontSize: '10px', color: C.ink3, marginBottom: '2px', fontFamily: sans }}>Lokasyon</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: sans }}>{pendingOffer.city || '—'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '10px', color: C.ink3, marginBottom: '2px', fontFamily: sans }}>Setup</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: sans }}>{pendingOffer.setup || '—'}</div>
                          </div>
                          {pendingOffer.start_date && (
                            <div>
                              <div style={{ fontSize: '10px', color: C.ink3, marginBottom: '2px', fontFamily: sans }}>Simula</div>
                              <div style={{ fontSize: '12px', fontWeight: 600, fontFamily: sans }}>{pendingOffer.start_date}</div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                        <button
                          disabled={!!proxyActioning}
                          onClick={async () => {
                            setProxyActioning(pendingOffer.id)
                            const { supabase } = await import('../../../lib/supabase')
                            await supabase.from('offers').update({ status: 'agreed', negotiated_by: 'partner' }).eq('id', pendingOffer.id)
                            setProxyOffers(prev => prev.filter((o: any) => o.id !== pendingOffer.id))
                            setProxyActioning(null)
                          }}
                          style={{ flex: 1, padding: '10px 6px', borderRadius: '10px', border: 'none', background: C.forest, color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: sans, opacity: proxyActioning ? 0.6 : 1 }}
                        >Tanggapin ✓</button>
                        <button
                          disabled={!!proxyActioning}
                          onClick={() => {
                            setCounterSalaryInput(w.asking_salary ? String(w.asking_salary) : '')
                            setCounterDateInput('')
                            setCounterSheet(pendingOffer.id)
                          }}
                          style={{ flex: 1, padding: '10px 6px', borderRadius: '10px', border: `1.5px solid ${C.forest}`, background: 'transparent', color: C.forest, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: sans }}
                        >I-counter</button>
                        <button
                          disabled={!!proxyActioning}
                          onClick={async () => {
                            setProxyActioning(pendingOffer.id)
                            const { supabase } = await import('../../../lib/supabase')
                            await supabase.from('offers').update({ status: 'declined', negotiated_by: 'partner' }).eq('id', pendingOffer.id)
                            setProxyOffers(prev => prev.filter((o: any) => o.id !== pendingOffer.id))
                            setProxyActioning(null)
                          }}
                          style={{ flex: 1, padding: '10px 6px', borderRadius: '10px', border: `1.5px solid ${C.line}`, background: 'transparent', color: C.ink3, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: sans }}
                        >Tanggihan</button>
                      </div>
                      <div style={{ background: C.amberSoft, border: `1px solid ${C.amberLine}`, borderRadius: '10px', padding: '9px 12px', fontSize: '11px', color: '#92400e', lineHeight: 1.5, fontFamily: sans }}>
                        Ikaw ang kumakatawan sa kanya. Siguraduhing nakausap mo na siya bago mag-accept o mag-counter.
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {/* Inline refer cards */}
            <div style={{ marginTop: '8px', background: '#f0f5ec', border: '1px solid #c8e0b0', borderRadius: '16px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ fontFamily: sans, fontSize: '10px', fontWeight: 700, color: C.forest, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: '10px' }}>Mag-refer ng Kasambahay</div>

              {/* Card A — Manual Form */}
              <div style={{ background: C.paper, borderRadius: '14px', border: `1.5px solid ${C.amberLine}`, padding: '16px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '22px' }}>📝</span>
                  <div style={{ fontFamily: sans, fontSize: '14px', fontWeight: 700, color: C.ink }}>Idagdag nang Manu-mano</div>
                </div>
                <div style={{ fontSize: '12px', color: C.ink3, lineHeight: 1.5, marginBottom: '12px' }}>Ikaw ang mag-fill ng form para sa kasambahay.</div>
                <button
                  onClick={() => { setTab('add'); setReferMode('manual'); setManualStep(1) }}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', border: 'none', background: C.amber, color: '#fff', fontFamily: sans, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Mag-refer ng Kasambahay →
                </button>
              </div>

              {/* Card B — Share Link */}
              <div style={{ background: C.paper, borderRadius: '14px', border: `1.5px solid #e2ecdb`, padding: '16px', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '22px' }}>🔗</span>
                  <div style={{ fontFamily: sans, fontSize: '14px', fontWeight: 700, color: C.ink }}>I-share ang Link</div>
                </div>
                <div style={{ fontSize: '12px', color: C.ink3, lineHeight: 1.5, marginBottom: '12px' }}>I-kopya o i-share ang iyong referral link sa kasambahay.</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={shareSMS}
                    style={{ flex: 1, padding: '10px 6px', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: sans, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '3px' }}>
                    <span style={{ fontSize: '18px' }}>💬</span>
                    <span>SMS</span>
                  </button>
                  <button onClick={() => { const l = encodeURIComponent(`https://maidit.vercel.app/signup/kasambahay?ref=${referralCode}`); window.open(`fb-messenger://share?link=${l}`, '_blank') }}
                    style={{ flex: 1, padding: '10px 6px', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1877f2', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: sans, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '3px' }}>
                    <span style={{ fontSize: '18px' }}>💬</span>
                    <span>Messenger</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* PAYOUTS TAB */}
        {tab === 'payouts' && (
          <>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', border: '1px solid #ede8e0' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Total kinita</div>
              <div style={{ fontFamily: 'serif', fontSize: '28px', fontWeight: 900, color: '#1a6b3c' }}>₱{totalEarned.toLocaleString()}</div>
              {totalPending > 0 && <div style={{ fontSize: '12px', color: '#c9943a', marginTop: '4px', fontWeight: 600 }}>₱{totalPending.toLocaleString()} pending</div>}
              {(partner?.balance ?? 0) < 0 && (
                <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px', fontWeight: 700 }}>
                  Balance: −₱{Math.abs(partner.balance).toLocaleString()} (will be deducted from next payout)
                </div>
              )}
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>GCash: <strong>{partner?.gcash_number || '—'}</strong></div>
            </div>
            {payouts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', background: '#fff', borderRadius: '14px', border: '1px solid #ede8e0', color: '#9ca3af', fontSize: '13px' }}>
                Wala pang payouts. Lalabas ito kapag na-hire na ang iyong workers.
              </div>
            ) : payouts.map(p => {
              const isDebit = p.amount < 0
              const isHeld = p.status === 'held'
              const typeLabel: Record<string, string> = {
                arrival: 'Arrival payout',
                transport: 'Transport assistance payout',
                day30: 'Day-30 payout',
                clawback: 'Clawback — early departure',
                balance_clear: 'Balance cleared',
                arrival_absorbed: 'Arrival (absorbed to balance)',
              }
              const borderColor = isDebit ? '#fecaca' : isHeld ? '#e5e7eb' : p.status === 'pending' ? '#fde8c0' : '#ede8e0'
              const bgColor = isDebit ? '#fef2f2' : p.status === 'paid' ? '#f0fdf4' : '#fef3e2'
              const icon = isDebit ? '↩️' : isHeld ? '🔒' : p.status === 'paid' ? '✅' : '⏳'
              const amountColor = isDebit ? '#dc2626' : isHeld ? '#6b7280' : p.status === 'paid' ? '#1a6b3c' : '#c9943a'
              const amountDisplay = isDebit ? `−₱${Math.abs(p.amount).toLocaleString()}` : `₱${p.amount.toLocaleString()}`
              return (
                <div key={p.id} style={{ background: isDebit ? '#fef2f2' : '#fff', borderRadius: '12px', padding: '13px 14px', marginBottom: '8px', border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bgColor, flexShrink: 0, fontSize: '16px' }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: isDebit ? '#dc2626' : '#111827' }}>{p.offer?.kasambahay_profile?.full_name}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                      {typeLabel[p.type] || p.type} · {new Date(p.due_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                    </div>
                    {isHeld && <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>Held — clear negative balance first</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'serif', fontSize: '15px', fontWeight: 900, color: amountColor }}>{amountDisplay}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '1px' }}>{p.status}</div>
                  </div>
                </div>
              )
            })}
            <div style={{ background: '#fef3e2', border: '1px solid #fde8c0', borderRadius: '12px', padding: '12px 14px', marginTop: '8px', fontSize: '12px', color: '#92400e', lineHeight: 1.6, fontFamily: sans }}>
              ⚠️ Kapag hindi nagtagal ang kasambahay sa loob ng 30 araw, ang ₱500 na recruitment fee ay ibabawas sa iyong kita.
            </div>
          </>
        )}

        {/* ADD WORKER TAB */}
        {tab === 'add' && (
          <div style={{ position: 'relative', paddingBottom: 120, WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
            {/* === CHOOSE MODE === */}
            {referMode === 'choose' && (
              <div>
                <div style={{ fontFamily: serif, fontSize: '22px', color: C.forestDeep, marginBottom: '6px', letterSpacing: '-0.3px' }}>
                  Paano mo gustong mag-refer?
                </div>
                <div style={{ fontSize: '13px', color: C.ink3, marginBottom: '20px', lineHeight: 1.5 }}>
                  Pumili ng paraan na pinaka-komportable sa iyo.
                </div>

                {/* Card A — Share Link */}
                <div style={{ background: C.paper, borderRadius: '16px', border: `1.5px solid #e2ecdb`, padding: '18px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ fontSize: '28px' }}>🔗</div>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '50px', background: '#f0fdf4', color: C.forest, border: `1px solid #bbf7d0` }}>Pinakamadali</span>
                  </div>
                  <div style={{ fontFamily: sans, fontSize: '16px', fontWeight: 700, color: C.ink, marginBottom: '4px' }}>I-share ang Link</div>
                  <div style={{ fontSize: '13px', color: C.ink3, lineHeight: 1.5, marginBottom: '14px' }}>
                    I-kopya o i-share ang iyong referral link sa kasambahay. Mag-sign up sila mismo.
                  </div>
                  <button
                    onClick={() => setReferMode('share')}
                    style={{ width: '100%', padding: '12px', borderRadius: '11px', border: 'none', background: C.forest, color: '#fff', fontFamily: sans, fontSize: '14px', fontWeight: 700, cursor: 'pointer', minHeight: 52, WebkitAppearance: 'none' } as React.CSSProperties}
                  >
                    I-share ang Link →
                  </button>
                </div>

                {/* Card B — Manual Form */}
                <div style={{ background: C.paper, borderRadius: '16px', border: `1.5px solid ${C.amberLine}`, padding: '18px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ fontSize: '28px' }}>📝</div>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '50px', background: C.amberSoft, color: '#92400e', border: `1px solid ${C.amberLine}` }}>Mas kumpleto</span>
                  </div>
                  <div style={{ fontFamily: sans, fontSize: '16px', fontWeight: 700, color: C.ink, marginBottom: '4px' }}>Idagdag nang Manu-mano</div>
                  <div style={{ fontSize: '13px', color: C.ink3, lineHeight: 1.5, marginBottom: '14px' }}>
                    I-fill out ang profile ng kasambahay para sa kanya. Para sa mga hindi marunong mag-sign up online.
                  </div>
                  <button
                    onClick={() => { setReferMode('manual'); setManualStep(1) }}
                    style={{ width: '100%', padding: '12px', borderRadius: '11px', border: 'none', background: C.amber, color: '#fff', fontFamily: sans, fontSize: '14px', fontWeight: 700, cursor: 'pointer', minHeight: 52, WebkitAppearance: 'none' } as React.CSSProperties}
                  >
                    Simulan ang Form →
                  </button>
                </div>
              </div>
            )}

            {/* === SHARE LINK MODE === */}
            {referMode === 'share' && (
              <div>
                <button onClick={() => setReferMode('choose')} style={{ background: 'none', border: 'none', color: C.ink3, fontSize: '13px', cursor: 'pointer', padding: '0 0 12px', fontFamily: sans }}>← Bumalik</button>
                <div style={{ fontFamily: serif, fontSize: '22px', color: C.forestDeep, marginBottom: '6px' }}>I-share ang iyong referral link</div>
                <div style={{ fontSize: '13px', color: C.ink3, marginBottom: '16px', lineHeight: 1.5 }}>
                  Ipakita o ipadala ang link na ito sa kasambahay na gusto mong i-refer.
                </div>

                <div style={{ background: C.paper2, border: `1px solid ${C.line}`, borderRadius: '12px', padding: '12px 14px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: C.ink3, marginBottom: '4px', fontFamily: sans }}>Ang iyong referral link</div>
                  <div style={{ fontSize: '13px', color: C.ink, wordBreak: 'break-all' as const, fontWeight: 600, fontFamily: sans }}>
                    maidit.vercel.app/signup/kasambahay?ref={referralCode}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                  <button onClick={() => { navigator.clipboard.writeText(`https://maidit.vercel.app/signup/kasambahay?ref=${referralCode}`).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                    style={{ padding: '12px 8px', borderRadius: '12px', background: copied ? '#f0fdf4' : '#f3f4f6', border: `1px solid ${copied ? '#bbf7d0' : C.line}`, color: copied ? C.forest : C.ink, fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: sans, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '20px' }}>{copied ? '✅' : '📋'}</span>
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                  <button onClick={shareSMS}
                    style={{ padding: '12px 8px', borderRadius: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: sans, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '20px' }}>💬</span>
                    <span>SMS</span>
                  </button>
                  <button onClick={() => { const link = encodeURIComponent(`https://maidit.vercel.app/signup/kasambahay?ref=${referralCode}`); window.open(`fb-messenger://share?link=${link}`, '_blank') }}
                    style={{ padding: '12px 8px', borderRadius: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1877f2', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: sans, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '20px' }}>💬</span>
                    <span>Messenger</span>
                  </button>
                  <button onClick={() => { const link = encodeURIComponent(`https://maidit.vercel.app/signup/kasambahay?ref=${referralCode}`); window.open(`https://wa.me/?text=${link}`, '_blank') }}
                    style={{ padding: '12px 8px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: sans, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '20px' }}>🟢</span>
                    <span>WhatsApp</span>
                  </button>
                </div>

                <div style={{ background: C.amberSoft, border: `1px solid ${C.amberLine}`, borderRadius: '10px', padding: '10px 13px', marginBottom: '16px', fontSize: '12px', color: '#92400e', lineHeight: 1.65 }}>
                  📌 Sabihin sa kasambahay: "Mag-sign up sa MaidIt gamit ang link ko — libre at ligtas. May trabahong naghihintay sa iyo."
                </div>

                <button onClick={() => { setTab('workers') }} style={{ width: '100%', padding: '13px', borderRadius: '12px', background: '#f3f4f6', border: 'none', color: C.ink, fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: sans }}>
                  Tapos na, bumalik sa Dashboard
                </button>
              </div>
            )}

            {/* === MANUAL FORM MODE === */}
            {referMode === 'manual' && (
              <div>
                {/* Progress header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <button onClick={() => { if (manualStep === 1) setReferMode('choose'); else setManualStep((manualStep - 1) as 1 | 2 | 3) }}
                    style={{ background: 'none', border: 'none', color: C.ink3, fontSize: '13px', cursor: 'pointer', padding: 0, fontFamily: sans }}>← Bumalik</button>
                  <div style={{ flex: 1 }} />
                  {[1, 2, 3].map(n => (
                    <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, fontFamily: sans, background: manualStep === n ? C.forest : manualStep > n ? '#bbf7d0' : C.line, color: manualStep === n ? '#fff' : manualStep > n ? C.forest : C.ink3 }}>{n}</div>
                      {n < 3 && <div style={{ width: '20px', height: '2px', background: manualStep > n ? C.forest : C.line }} />}
                    </div>
                  ))}
                  <div style={{ flex: 1 }} />
                  <div style={{ fontSize: '11px', color: C.ink3, fontFamily: sans }}>{manualStep}/3</div>
                </div>

                {saveMsg && (
                  <div style={{ background: saveMsg.includes('ERROR') ? '#fef2f2' : '#f0fdf4', border: `1px solid ${saveMsg.includes('ERROR') ? '#fecaca' : '#bbf7d0'}`, borderRadius: '9px', padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: saveMsg.includes('ERROR') ? '#dc2626' : '#166534', marginBottom: '12px', lineHeight: 1.5, fontFamily: sans }}>
                    {saveMsg}
                  </div>
                )}

                {/* STEP 1 — Basic Info */}
                {manualStep === 1 && (
                  <div style={{ background: C.paper, borderRadius: '13px', padding: '16px', border: `1px solid ${C.line}` }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.07em', color: C.amber, marginBottom: '14px', fontFamily: sans }}>Hakbang 1 — Basic Info</div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={s.lbl}>Pangalan *</label>
                        <input style={{ ...s.inp, borderColor: step1Errors.pangalan ? '#dc2626' : undefined }} placeholder="Maria" value={workerForm.pangalan}
                          onChange={e => setWorkerForm(f => ({ ...f, pangalan: e.target.value.replace(/\b\w/g, (c: string) => c.toUpperCase()) }))} />
                        {step1Errors.pangalan && <span style={{ color: '#dc2626', fontSize: '11px' }}>{step1Errors.pangalan}</span>}
                      </div>
                      <div>
                        <label style={s.lbl}>Apelyido *</label>
                        <input style={{ ...s.inp, borderColor: step1Errors.apelyido ? '#dc2626' : undefined }} placeholder="Santos" value={workerForm.apelyido}
                          onChange={e => setWorkerForm(f => ({ ...f, apelyido: e.target.value.replace(/\b\w/g, (c: string) => c.toUpperCase()) }))} />
                        {step1Errors.apelyido && <span style={{ color: '#dc2626', fontSize: '11px' }}>{step1Errors.apelyido}</span>}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={s.lbl}>Cellphone *</label>
                        <input style={{ ...s.inp, borderColor: step1Errors.mobile ? '#dc2626' : undefined }} type="tel" placeholder="09XXXXXXXXX" maxLength={11} value={workerForm.mobile}
                          onChange={e => setWorkerForm(f => ({ ...f, mobile: e.target.value.replace(/\D/g, '').slice(0, 11) }))} />
                        {step1Errors.mobile && <span style={{ color: '#dc2626', fontSize: '11px' }}>{step1Errors.mobile}</span>}
                      </div>
                      <div>
                        <label style={s.lbl}>Edad *</label>
                        <input style={{ ...s.inp, borderColor: step1Errors.edad ? '#dc2626' : undefined }} type="number" placeholder="25" min={18} max={65} value={workerAge}
                          onChange={e => setWorkerAge(e.target.value)} inputMode="numeric" />
                        {step1Errors.edad && <span style={{ color: '#dc2626', fontSize: '11px' }}>{step1Errors.edad}</span>}
                      </div>
                    </div>

                    <label style={s.lbl}>Probinsya *</label>
                    <select style={{ ...s.sel, borderColor: step1Errors.province ? '#dc2626' : undefined }} value={workerForm.province} onChange={e => setWorkerForm(f => ({ ...f, province: e.target.value }))}>
                      <option value="">Piliin ang probinsya...</option>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {step1Errors.province && <span style={{ color: '#dc2626', fontSize: '11px', display: 'block', marginTop: '-8px', marginBottom: '8px' }}>{step1Errors.province}</span>}

                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.07em', color: C.ink3, marginBottom: '8px', fontFamily: sans }}>Paano kayo nagkakilala *</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const, marginBottom: '4px' }}>
                      {['Kababayan', 'Kaibigan', 'Kapamilya', 'Estudyante', 'Iba pa'].map(opt => (
                        <div key={opt} onClick={() => setWorkerHowReferred(opt)}
                          style={{ padding: '8px 13px', borderRadius: '10px', border: `1.5px solid ${workerHowReferred === opt ? C.amber : C.line}`, background: workerHowReferred === opt ? C.amberSoft : C.paper, color: workerHowReferred === opt ? '#92400e' : C.ink3, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: sans }}>
                          {opt}
                        </div>
                      ))}
                    </div>
                    {step1Errors.howReferred && <span style={{ color: '#dc2626', fontSize: '11px', display: 'block', marginBottom: '8px' }}>{step1Errors.howReferred}</span>}

                    <button
                      onClick={() => {
                        const { pangalan, apelyido, mobile, province } = workerForm
                        const age = parseInt(workerAge)
                        const errs: Record<string, string> = {}
                        if (!pangalan) errs.pangalan = 'Kailangan ang pangalan'
                        if (!apelyido) errs.apelyido = 'Kailangan ang apelyido'
                        if (!mobile || mobile.length !== 11 || !mobile.startsWith('09')) errs.mobile = 'Ilagay ang tamang 11-digit na numero'
                        if (!workerAge || isNaN(age) || age < 18 || age > 65) errs.edad = 'Edad dapat 18–65'
                        if (!province) errs.province = 'Piliin ang probinsya'
                        if (!workerHowReferred) errs.howReferred = 'Piliin kung paano nagkakilala'
                        if (Object.keys(errs).length > 0) { setStep1Errors(errs); return }
                        setStep1Errors({})
                        setManualStep(2)
                      }}
                      style={{ ...s.submitBtn, marginTop: '16px', background: C.forest }}
                    >
                      Susunod — Mga Kasanayan →
                    </button>
                  </div>
                )}

                {/* STEP 2 — Skills */}
                {manualStep === 2 && (
                  <div style={{ background: C.paper, borderRadius: '13px', padding: '16px', border: `1px solid ${C.line}` }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.07em', color: C.amber, marginBottom: '14px', fontFamily: sans }}>Hakbang 2 — Mga Kasanayan</div>

                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.07em', color: C.ink3, marginBottom: '8px', fontFamily: sans }}>Kasanayan * (pumili ng isa man)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '4px' }}>
                      {SKILLS.map(skill => (
                        <div key={skill} style={s.skillChip(workerForm.skills.includes(skill))} onClick={() => toggleSkill(skill)}>{skill}</div>
                      ))}
                    </div>
                    {step2Errors.skills && <span style={{ color: '#dc2626', fontSize: '11px', display: 'block', marginBottom: '10px' }}>{step2Errors.skills}</span>}
                    {!step2Errors.skills && <div style={{ marginBottom: '10px' }} />}

                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.07em', color: C.ink3, marginBottom: '8px', fontFamily: sans }}>Setup *</div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                      {[['Stay-in', 'Stay-in'], ['Stay-out', 'Stay-out'], ['Pareho okay', 'Kahit alin']].map(([label, value]) => (
                        <div key={value} onClick={() => setWorkerForm(f => ({ ...f, setup: value }))}
                          style={{ flex: 1, padding: '9px 6px', borderRadius: '10px', border: `1.5px solid ${workerForm.setup === value ? C.forest : C.line}`, background: workerForm.setup === value ? C.forest : C.paper, color: workerForm.setup === value ? '#fff' : C.ink3, fontSize: '12px', fontWeight: 700, cursor: 'pointer', textAlign: 'center' as const, fontFamily: sans }}>
                          {label}
                        </div>
                      ))}
                    </div>
                    {step2Errors.setup && <span style={{ color: '#dc2626', fontSize: '11px', display: 'block', marginBottom: '10px' }}>{step2Errors.setup}</span>}
                    {!step2Errors.setup && <div style={{ marginBottom: '10px' }} />}

                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.07em', color: C.ink3, marginBottom: '8px', fontFamily: sans }}>Kelan pwede magsimula *</div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' as const }}>
                      {[['Pwede na agad', 'Immediate'], ['1 linggo', 'Within 1 week'], ['1 buwan', 'Within 1 month']].map(([label, value]) => (
                        <div key={value} onClick={() => setWorkerForm(f => ({ ...f, availability: value }))}
                          style={{ padding: '9px 14px', borderRadius: '10px', border: `1.5px solid ${workerForm.availability === value ? C.forest : C.line}`, background: workerForm.availability === value ? C.forest : C.paper, color: workerForm.availability === value ? '#fff' : C.ink3, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: sans }}>
                          {label}
                        </div>
                      ))}
                    </div>
                    {step2Errors.availability && <span style={{ color: '#dc2626', fontSize: '11px', display: 'block', marginBottom: '10px' }}>{step2Errors.availability}</span>}
                    {!step2Errors.availability && <div style={{ marginBottom: '10px' }} />}

                    <label style={s.lbl}>Hinahangad na Sahod (₱/buwan) *</label>
                    <div style={{ position: 'relative', marginBottom: '4px' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontFamily: serif, fontSize: '16px', color: C.ink2, pointerEvents: 'none' }}>₱</span>
                      <input style={{ ...s.inp, paddingLeft: '26px', marginBottom: 0, borderColor: step2Errors.salary ? '#dc2626' : undefined }} type="number" placeholder="9000" value={workerSalary}
                        onChange={e => setWorkerSalary(e.target.value)} />
                    </div>
                    {step2Errors.salary && <span style={{ color: '#dc2626', fontSize: '11px', display: 'block', marginBottom: '10px' }}>{step2Errors.salary}</span>}
                    {!step2Errors.salary && <div style={{ marginBottom: '10px' }} />}

                    <button
                      onClick={() => {
                        const errs: Record<string, string> = {}
                        if (workerForm.skills.length === 0) errs.skills = 'Pumili ng kahit isang kasanayan'
                        if (!workerForm.setup) errs.setup = 'Piliin ang setup'
                        if (!workerForm.availability) errs.availability = 'Piliin ang availability'
                        if (!workerSalary) errs.salary = 'Ilagay ang hinahangad na sahod'
                        if (Object.keys(errs).length > 0) { setStep2Errors(errs); return }
                        setStep2Errors({})
                        setManualStep(3)
                      }}
                      style={{ ...s.submitBtn, background: C.forest }}
                    >
                      Susunod — Verification →
                    </button>
                  </div>
                )}

                {/* STEP 3 — Huling Hakbang */}
                {manualStep === 3 && (
                  <div style={{ background: C.paper, borderRadius: '13px', padding: '16px', border: `1px solid ${C.line}` }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.07em', color: C.amber, marginBottom: '14px', fontFamily: sans }}>Hakbang 3 — Huling Hakbang</div>

                    <label style={s.lbl}>Litrato ng Kasambahay (optional)</label>
                    {workerForm.photo && <img src={workerForm.photo} alt="worker" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '10px', marginBottom: '8px' }} />}
                    <div onClick={() => photoRef.current?.click()}
                      style={{ background: '#fdf9f4', border: `2px dashed ${workerForm.photo ? C.forest : C.line}`, borderRadius: '11px', padding: '20px', textAlign: 'center' as const, cursor: 'pointer', marginBottom: '10px' }}>
                      {workerForm.photo
                        ? <><div style={{ fontSize: '18px', marginBottom: '4px' }}>✅</div><div style={{ fontSize: '13px', color: C.forest, fontWeight: 700, fontFamily: sans }}>Litrato na-upload!</div></>
                        : <><div style={{ fontSize: '28px', marginBottom: '6px' }}>📷</div><div style={{ fontSize: '13px', fontWeight: 700, fontFamily: sans }}>I-upload ang litrato ng kasambahay</div></>
                      }
                    </div>
                    <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />

                    <div style={{ background: C.amberSoft, border: `1px solid ${C.amberLine}`, borderRadius: '10px', padding: '10px 13px', marginBottom: '10px', fontSize: '12px', color: '#92400e', lineHeight: 1.65 }}>
                      📸 Ang litrato ay makakatulong sa mga homeowner na makilala ang kasambahay.
                    </div>
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '10px 13px', marginBottom: '14px', fontSize: '12px', color: '#1d4ed8', lineHeight: 1.65 }}>
                      ℹ️ Maaari pang kumpletuhin ng kasambahay ang kanyang profile sa pamamagitan ng link na ipapadala sa kanya.
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: C.paper, border: `1.5px solid ${workerConfirmed ? C.forest : C.line}`, borderRadius: '12px', padding: '14px', marginBottom: '14px', cursor: 'pointer' }}
                      onClick={() => setWorkerConfirmed(!workerConfirmed)}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: `2px solid ${workerConfirmed ? C.forest : '#d1d5db'}`, background: workerConfirmed ? C.forest : C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                        {workerConfirmed && <span style={{ color: '#fff', fontSize: '13px', fontWeight: 900 }}>✓</span>}
                      </div>
                      <div style={{ fontSize: '13px', color: C.ink, lineHeight: 1.6, fontFamily: sans }}>
                        Pinatutunayan ko na ang kasambahay na ito ay personal na nagbigay ng kanyang pahintulot na irehistro siya sa MaidIt platform sa pamamagitan ko bilang kanyang Community Partner.
                      </div>
                    </div>

                    <button style={{ ...s.submitBtn, opacity: saving ? .6 : 1 }} onClick={handleAddWorker} disabled={saving}>
                      {saving ? 'Nagse-save...' : `I-refer si ${workerForm.pangalan || 'Kasambahay'} →`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '20px' }}>
          Patuloy na mag-refer at kumita kasama ang MaidIt! 💚
        </div>
      </div>


      {/* COUNTER BOTTOM SHEET */}
      {counterSheet && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => !proxyActioning && setCounterSheet(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.paper, borderRadius: '20px 20px 0 0', padding: '24px 20px 48px', width: '100%', maxWidth: 480, fontFamily: sans }}>
            <div style={{ width: '40px', height: '4px', background: C.line, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontFamily: serif, fontSize: '20px', color: C.forestDeep, marginBottom: '4px' }}>I-counter ang Offer</div>
            <div style={{ fontSize: '13px', color: C.ink3, marginBottom: '16px', fontFamily: sans }}>Ilagay ang iyong proposed na terms.</div>

            <label style={s.lbl}>Proposed na Sweldo (₱/buwan)</label>
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontFamily: serif, fontSize: '16px', color: C.ink2, pointerEvents: 'none' as const }}>₱</span>
              <input style={{ ...s.inp, paddingLeft: '28px', marginBottom: 0 }} type="number" placeholder="9000" value={counterSalaryInput} onChange={e => setCounterSalaryInput(e.target.value)} inputMode="numeric" />
            </div>

            <label style={s.lbl}>Proposed na Simula (optional)</label>
            <input style={s.inp} type="date" value={counterDateInput} onChange={e => setCounterDateInput(e.target.value)} />

            <div style={{ background: C.amberSoft, border: `1px solid ${C.amberLine}`, borderRadius: '10px', padding: '9px 12px', marginBottom: '16px', fontSize: '12px', color: '#92400e', lineHeight: 1.5, fontFamily: sans }}>
              Makikita ng homeowner na ikaw ang nag-counter bilang proxy.
            </div>

            <button
              disabled={!counterSalaryInput || !!proxyActioning}
              onClick={async () => {
                if (!counterSalaryInput) return
                setProxyActioning(counterSheet)
                const { supabase } = await import('../../../lib/supabase')
                await supabase.from('offers').update({
                  status: 'countered',
                  counter_salary: parseInt(counterSalaryInput),
                  ...(counterDateInput ? { counter_start_date: counterDateInput } : {}),
                  negotiated_by: 'partner',
                }).eq('id', counterSheet)
                setProxyOffers(prev => prev.filter((o: any) => o.id !== counterSheet))
                setCounterSheet(null)
                setProxyActioning(null)
              }}
              style={{ ...s.submitBtn, background: C.amber, opacity: !counterSalaryInput || !!proxyActioning ? 0.5 : 1 }}
            >
              {proxyActioning === counterSheet ? 'Nagse-save...' : 'I-submit ang Counter →'}
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS FULL-SCREEN */}
      {showSuccess && (
        <div style={{ position: 'fixed', inset: 0, background: C.paper2, zIndex: 50, overflowY: 'auto', padding: '32px 20px', fontFamily: sans }}>
          <div style={{ maxWidth: 420, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🎉</div>
              <div style={{ fontFamily: serif, fontSize: '26px', color: C.forest, letterSpacing: '-0.3px', marginBottom: '8px' }}>
                Na-refer na si {savedName}!
              </div>
              <div style={{ fontSize: '14px', color: C.ink3, lineHeight: 1.6 }}>
                Makakatanggap ka ng <strong style={{ color: C.forest }}>₱500</strong> kapag na-hire siya ng isang homeowner.
              </div>
            </div>

            <div style={{ background: C.paper, borderRadius: '14px', border: `1px solid ${C.line}`, padding: '14px 16px', marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: C.ink3, marginBottom: '4px' }}>I-share din ang referral link mo</div>
              <div style={{ fontSize: '13px', color: C.ink, wordBreak: 'break-all' as const, fontWeight: 600, marginBottom: '10px' }}>
                maidit.vercel.app/signup/kasambahay?ref={referralCode}
              </div>
              <button onClick={() => { navigator.clipboard.writeText(`https://maidit.vercel.app/signup/kasambahay?ref=${referralCode}`).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                style={{ width: '100%', padding: '10px', borderRadius: '9px', border: 'none', background: copied ? C.forest : '#f0fdf4', color: copied ? '#fff' : C.forest, fontFamily: sans, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                {copied ? '✓ Copied!' : '📋 Copy Link'}
              </button>
            </div>

            <div style={{ background: C.paper, borderRadius: '14px', border: `1px solid ${C.line}`, padding: '14px 16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: C.ink, marginBottom: '10px' }}>Susunod na hakbang:</div>
              {[
                ['1', 'Mag-aabiso kami kay ' + savedName + ' na nag-refer ka sa kanya.'],
                ['2', 'Kapag nag-confirm siya, makikita na siya ng mga homeowner.'],
                ['3', 'Kapag na-hire siya, automatic na darating ang iyong ₱500 payout.'],
              ].map(([num, text]) => (
                <div key={num} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: C.forest, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{num}</div>
                  <div style={{ fontSize: '13px', color: C.ink2, lineHeight: 1.5 }}>{text}</div>
                </div>
              ))}
            </div>

            <button onClick={async () => {
              setShowSuccess(false)
              setReferMode(null)
              const { supabase } = await import('../../../lib/supabase')
              const { data: workersData } = await supabase.from('kasambahay')
                .select('id, profile_id, asking_salary, setup, skills, province, selfie_url, availability, edad, referred_by, proxy_mode, proxy_partner_id')
                .eq('referred_by', partner.referral_code)
              setWorkers(workersData || [])
              setTab('workers')
            }} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: C.forest, border: 'none', color: '#fff', fontFamily: sans, fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
              Bumalik sa Dashboard →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
