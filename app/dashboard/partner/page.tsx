'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const SKILLS = [
  { en: 'Housekeeping', tl: 'Paglilinis ng Bahay' },
  { en: 'Yaya', tl: 'Pag-aalaga ng Bata' },
  { en: 'Cooking', tl: 'Pagluluto' },
  { en: 'Laundry', tl: 'Paglalaba' },
  { en: 'Elder Care', tl: 'Pag-aalaga ng Matatanda' },
  { en: 'Driving', tl: 'Pagmamaneho' },
  { en: 'Gardening', tl: 'Paghahalaman' },
  { en: 'Pet Care', tl: 'Pag-aalaga ng Alagang Hayop' },
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
  id: string; province: string; skills: string[]; status: string; confirmed_at?: string
  profiles: { full_name: string; mobile: string }
}

export default function PartnerDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<'workers' | 'payouts' | 'add'>('workers')
  const [partner, setPartner] = useState<any>(null)
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [workerOffers, setWorkerOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [savedName, setSavedName] = useState('')
  const photoRef = useRef<HTMLInputElement>(null)

  const [workerForm, setWorkerForm] = useState({
    apelyido: '', pangalan: '', mobile: '', province: '',
    skills: [] as string[], setup: 'Kahit alin', civil_status: '',
    num_children: '0', availability: '', availability_custom: '',
    photo: null as string | null, has_nbi: false, govt_id_types: [] as string[],
  })

  useEffect(() => {
    const init = async () => {
      const { supabase } = await import('../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: partnerData } = await supabase
        .from('partners').select('*, profiles(*)').eq('profile_id', user.id).single()
      if (!partnerData) { router.push('/'); return }
      setPartner(partnerData)
      const { data: payoutsData } = await supabase.from('payouts')
        .select('*, offer:offers(kasambahay_profile:profiles!offers_kasambahay_id_fkey(full_name), homeowner_profile:profiles!offers_homeowner_id_fkey(full_name))')
        .eq('partner_id', partnerData.id).order('due_at', { ascending: false })
      setPayouts(payoutsData || [])
      const { data: workersData } = await supabase.from('kasambahay')
        .select('*, profiles(*)').eq('referred_by', partnerData.id)
      setWorkers(workersData || [])
      const workerIds = (workersData || []).map((w: any) => w.id)
      if (workerIds.length > 0) {
        const { data: offersData } = await supabase
          .from('offers').select('id, kasambahay_id, status')
          .in('kasambahay_id', workerIds)
          .in('status', ['pending', 'countered', 'agreed'])
        setWorkerOffers(offersData || [])
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
      setSaveMsg('Pakisulat ang apelyido, pangalan, mobile, at probinsya.'); return
    }
    if (mobile.length !== 11 || !mobile.startsWith('09')) {
      setSaveMsg('Pakisulat ang tamang 11-digit mobile number.'); return
    }
    setSaving(true)
    setSaveMsg('')
    const { supabase } = await import('../../../lib/supabase')
    const { data: existing } = await supabase.from('profiles').select('id').eq('mobile', mobile).single()
    if (existing) {
      setSaveMsg('ERROR: Ang mobile number na ito ay rehistrado na. Gamitin ang ibang numero.')
      setSaving(false); return
    }
    const full_name = `${pangalan} ${apelyido}`
    const { data: profile, error: profileError } = await supabase.from('profiles').insert({
      full_name, mobile, city: province, role: 'kasambahay', verified: false
    }).select().single()
    if (profileError || !profile) {
      setSaveMsg('Hindi ma-save. Subukan ulit.')
      setSaving(false); return
    }
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    await supabase.from('kasambahay').insert({
      profile_id: profile.id, province, skills: workerForm.skills,
      referred_by: partner.id, status: 'pending_confirmation',
      setup: workerForm.setup, civil_status: workerForm.civil_status,
      num_children: parseInt(workerForm.num_children) || 0,
      availability: workerForm.availability === 'Iba pa (custom)' && workerForm.availability_custom
        ? `${workerForm.availability_custom} araw` : workerForm.availability,
      confirm_token: token, has_nbi: workerForm.has_nbi, govt_id_types: workerForm.govt_id_types,
    })
    const { data: newKb } = await supabase.from('kasambahay').select('id').eq('profile_id', profile.id).single()
    if (newKb?.id) {
      fetch('/api/notify-worker', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kasambahayId: newKb.id,
          token,
          name: full_name,
          mobile: workerForm.mobile,
          partnerName: partner?.profiles?.full_name?.split(' ')[0] || 'MaidIt Partner'
        }) }).catch(() => {})
    }
    setSavedName(pangalan)
    setShowSuccess(true)
    setSaving(false)
    setWorkerForm({ apelyido: '', pangalan: '', mobile: '', province: '', skills: [], setup: 'Kahit alin', civil_status: '', num_children: '0', availability: '', availability_custom: '', photo: null, has_nbi: false, govt_id_types: [] })
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
    wrap: { minHeight: '100vh', background: '#faf8f5', fontFamily: 'sans-serif', color: '#1a1a1a', paddingBottom: '40px' },
    lbl: { display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#4b5563', marginBottom: '5px' },
    inp: { width: '100%', padding: '11px 12px', border: '1.5px solid #e5e0d8', borderRadius: '10px', fontFamily: 'sans-serif', fontSize: '14px', outline: 'none', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as const, marginBottom: '10px' },
    sel: { width: '100%', padding: '11px 12px', border: '1.5px solid #e5e0d8', borderRadius: '10px', fontFamily: 'sans-serif', fontSize: '14px', outline: 'none', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as const, marginBottom: '10px' },
    submitBtn: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#1a6b3c', color: '#fff', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '8px' },
    skillChip: (on: boolean) => ({ display: 'block', padding: '9px 10px', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, textAlign: 'center' as const, border: on ? '1.5px solid #c9943a' : '1.5px solid #e5e0d8', background: on ? '#fef3e2' : '#fff', color: on ? '#92400e' : '#6b7280' }),
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#6b7280' }}>Loading...</div>
  )

  return (
    <div style={s.wrap}>
      {/* HEADER */}
      <div style={{ background: '#fff', borderBottom: '1px solid #ede8e0', padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'serif', fontSize: '20px', fontWeight: 900, color: '#1a1a1a' }}>Welcome back, {partner?.profiles?.full_name?.split(' ')[0]}! 👋</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Salamat sa pagtulong na makahanap ng maaasahang kasambahay.</div>
          </div>
          <button onClick={async () => { const { supabase } = await import('../../../lib/supabase'); await supabase.auth.signOut(); router.push('/login') }} style={{ background: '#f9f6f2', border: '1px solid #ede8e0', borderRadius: '8px', padding: '7px 13px', color: '#6b7280', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', gap: '5px' }}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
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
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.6)', marginBottom: '4px' }}>Total Kinita</div>
              <div style={{ fontFamily: 'serif', fontSize: '36px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>₱{totalEarned.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.6)', marginTop: '4px' }}>Kita mo mula sa mga successful hires</div>
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
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.5)' }}>{hiredCount} / 5 successful hire · ₱1,000 per successful hire</div>
        </div>

        {/* REFERRAL CODE */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '14px 16px', marginBottom: '12px', border: '1px solid #ede8e0' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🔗</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>Referral code mo</div>
              <div style={{ fontFamily: 'serif', fontSize: '18px', fontWeight: 900, color: '#1a6b3c', letterSpacing: '.5px' }}>{referralCode.toUpperCase()}</div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>I-share ang link na ito sa mga naghahanap ng trabaho bilang kasambahay.</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button onClick={copyCode} style={{ flex: 1, padding: '9px', borderRadius: '9px', background: copied ? '#1a6b3c' : '#f0fdf4', border: `1px solid ${copied ? '#1a6b3c' : '#bbf7d0'}`, color: copied ? '#fff' : '#1a6b3c', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              {copied ? '✓ Copied!' : '📋 Copy Code'}
            </button>
            <button onClick={shareSMS} style={{ flex: 1, padding: '9px', borderRadius: '9px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              💬 Share via SMS
            </button>
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          {[
            { icon: '💰', num: `₱${totalEarned.toLocaleString()}`, lbl: 'Kinita', sub: 'Total earnings mo', color: '#1a6b3c' },
            { icon: '👤', num: hiredCount, lbl: 'Na-hire', sub: 'Successful hires', color: '#c9943a' },
            { icon: '👥', num: workers.length, lbl: 'Narecruit', sub: 'Total referrals', color: '#2563eb' },
          ].map((stat, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '12px 10px', border: '1px solid #ede8e0', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>{stat.icon}</div>
              <div style={{ fontFamily: 'serif', fontSize: '20px', fontWeight: 900, color: stat.color }}>{stat.num}</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginTop: '1px' }}>{stat.lbl}</div>
              <div style={{ fontSize: '10px', color: '#9ca3af' }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* VIP BENEFIT */}
        {isGold && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', padding: '14px 16px', marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ fontSize: '28px' }}>⭐</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400e', marginBottom: '2px' }}>VIP Partner Benefit</div>
              <div style={{ fontSize: '13px', color: '#92400e', fontWeight: 600 }}>₱1,000 upfront sa worker arrival.</div>
              <div style={{ fontSize: '12px', color: '#b45309', marginTop: '2px' }}>Makatanggap ng pera agad kapag dumating ang worker.</div>
            </div>
          </div>
        )}
        {!isGold && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '14px 16px', marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ fontSize: '28px' }}>💰</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a6b3c', marginBottom: '2px' }}>Partner Benefit</div>
              <div style={{ fontSize: '13px', color: '#1a6b3c', fontWeight: 600 }}>₱600 sa arrival + ₱400 after 30 days</div>
              <div style={{ fontSize: '12px', color: '#166534', marginTop: '2px' }}>= ₱1,000 total kada successful hire</div>
            </div>
          </div>
        )}

        {/* TABS */}
        <div style={{ display: 'flex', background: '#fff', borderRadius: '12px', border: '1px solid #ede8e0', marginBottom: '14px', overflow: 'hidden' }}>
          {([
            { id: 'workers', icon: '👥', label: 'Workers', badge: newlyConfirmed },
            { id: 'payouts', icon: '💳', label: 'Payouts', badge: 0 },
            { id: 'add', icon: '🎁', label: 'Mag-refer', badge: 0 },
          ] as const).map((t, i) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '11px 4px', border: 'none', borderLeft: i > 0 ? '1px solid #ede8e0' : 'none', background: tab === t.id ? '#1a6b3c' : 'transparent', cursor: 'pointer', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: 700, color: tab === t.id ? '#fff' : '#6b7280', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', position: 'relative' }}>
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
              const st = statusLabel[w.status] || statusLabel.draft
              const hasOffer = workerOffers.some(o => o.kasambahay_id === w.id)
              return (
                <div key={w.id} style={{ background: '#fff', borderRadius: '14px', padding: '14px 16px', marginBottom: '10px', border: '1px solid #ede8e0' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: (w.status === 'pending_confirmation' || hasOffer) ? '10px' : '0' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#fef3e2', border: '2px solid #fde8c0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>👩</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>{w.profiles?.full_name}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '1px' }}>{w.province} · {w.profiles?.mobile}</div>
                      {w.skills?.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '5px' }}>
                          {w.skills.map((skill: string) => (
                            <span key={skill} style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#f3ede5', color: '#92400e' }}>{skill}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                      {w.confirmed_at && w.status === 'available' && (Date.now() - new Date(w.confirmed_at).getTime()) / (1000*60*60*24) <= 7 && (
                        <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 7px', borderRadius: '50px', background: '#dc2626', color: '#fff' }}>BAGO!</span>
                      )}
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '50px', background: st.bg, color: st.color, whiteSpace: 'nowrap' as const, border: `1px solid ${st.color}30` }}>{st.label}</span>
                    </div>
                  </div>
                  {hasOffer && (
                    <div style={{ background: '#e0f7fa', border: '1px solid #b2ebf2', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', color: '#006064', fontWeight: 700 }}>
                      📨 May Job Offer na natanggap
                    </div>
                  )}
                  {w.status === 'pending_confirmation' && (
                    <div style={{ background: '#fef3e2', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', color: '#92400e' }}>
                      📱 Naghhintay ng reply sa text message
                    </div>
                  )}
                </div>
              )
            })}
            <button onClick={() => setTab('add')} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#1a6b3c', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif', marginTop: '4px' }}>
              + Mag-refer ng Kasambahay
            </button>
          </>
        )}

        {/* PAYOUTS TAB */}
        {tab === 'payouts' && (
          <>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', border: '1px solid #ede8e0' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Total kinita</div>
              <div style={{ fontFamily: 'serif', fontSize: '28px', fontWeight: 900, color: '#1a6b3c' }}>₱{totalEarned.toLocaleString()}</div>
              {totalPending > 0 && <div style={{ fontSize: '12px', color: '#c9943a', marginTop: '4px', fontWeight: 600 }}>₱{totalPending.toLocaleString()} pending</div>}
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>GCash: <strong>{partner?.gcash_number || '—'}</strong></div>
            </div>
            {payouts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', background: '#fff', borderRadius: '14px', border: '1px solid #ede8e0', color: '#9ca3af', fontSize: '13px' }}>
                Wala pang payouts. Lalabas ito kapag na-hire na ang iyong workers.
              </div>
            ) : payouts.map(p => (
              <div key={p.id} style={{ background: '#fff', borderRadius: '12px', padding: '13px 14px', marginBottom: '8px', border: `1px solid ${p.status === 'pending' ? '#fde8c0' : '#ede8e0'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: p.status === 'paid' ? '#f0fdf4' : '#fef3e2', flexShrink: 0, fontSize: '16px' }}>
                  {p.status === 'paid' ? '✅' : '⏳'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>{p.offer?.kasambahay_profile?.full_name}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                    {p.type === 'arrival' ? 'Arrival payout' : 'Day-30 payout'} · {new Date(p.due_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'serif', fontSize: '15px', fontWeight: 900, color: p.status === 'paid' ? '#1a6b3c' : '#c9943a' }}>₱{p.amount.toLocaleString()}</div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '1px' }}>{p.status}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ADD WORKER TAB */}
        {tab === 'add' && (
          <>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '14px', lineHeight: 1.6 }}>
              I-upload ang kasambahay sa iyong pool.
            </div>

            {saveMsg && (
              <div style={{ background: saveMsg.includes('ERROR') ? '#fef2f2' : '#f0fdf4', border: `1px solid ${saveMsg.includes('ERROR') ? '#fecaca' : '#bbf7d0'}`, borderRadius: '9px', padding: '12px 14px', fontSize: '14px', fontWeight: 600, color: saveMsg.includes('ERROR') ? '#dc2626' : '#166534', marginBottom: '12px', lineHeight: 1.5 }}>
                {saveMsg}
              </div>
            )}

            <div style={{ background: '#fff', borderRadius: '13px', padding: '14px', border: '1px solid #ede8e0', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#c9943a', marginBottom: '13px' }}>Detalye ng Worker</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={s.lbl}>Apelyido *</label>
                  <input style={s.inp} placeholder="Santos" value={workerForm.apelyido}
                    onChange={e => setWorkerForm(f => ({ ...f, apelyido: e.target.value.replace(/\b\w/g, (c: string) => c.toUpperCase()) }))} />
                </div>
                <div>
                  <label style={s.lbl}>Pangalan *</label>
                  <input style={s.inp} placeholder="Maria" value={workerForm.pangalan}
                    onChange={e => setWorkerForm(f => ({ ...f, pangalan: e.target.value.replace(/\b\w/g, (c: string) => c.toUpperCase()) }))} />
                </div>
              </div>

              <label style={s.lbl}>Mobile Number *</label>
              <input style={s.inp} type="tel" placeholder="09XXXXXXXXX" maxLength={11} value={workerForm.mobile}
                onChange={e => setWorkerForm(f => ({ ...f, mobile: e.target.value.replace(/\D/g, '').slice(0, 11) }))} />

              <label style={s.lbl}>Probinsya *</label>
              <select style={s.sel} value={workerForm.province} onChange={e => setWorkerForm(f => ({ ...f, province: e.target.value }))}>
                <option value="">Piliin ang probinsya...</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={s.lbl}>Civil Status</label>
                  <select style={s.sel} value={workerForm.civil_status} onChange={e => setWorkerForm(f => ({ ...f, civil_status: e.target.value }))}>
                    <option value="">Piliin...</option>
                    {CIVIL_STATUS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.lbl}>Bilang ng Anak</label>
                  <select style={s.sel} value={workerForm.num_children} onChange={e => setWorkerForm(f => ({ ...f, num_children: e.target.value }))}>
                    {Array.from({ length: 21 }, (_, i) => <option key={i} value={i}>{i === 0 ? 'Wala' : i}</option>)}
                  </select>
                </div>
              </div>

              <label style={s.lbl}>Setup</label>
              <select style={s.sel} value={workerForm.setup} onChange={e => setWorkerForm(f => ({ ...f, setup: e.target.value }))}>
                {SETUPS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <label style={s.lbl}>Available Magtrabaho</label>
              <select style={s.sel} value={workerForm.availability} onChange={e => setWorkerForm(f => ({ ...f, availability: e.target.value, availability_custom: '' }))}>
                <option value="">Piliin...</option>
                {AVAILABILITY.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              {workerForm.availability === 'Iba pa (custom)' && (
                <input style={s.inp} type="number" placeholder="Ilang araw? e.g. 45" value={workerForm.availability_custom}
                  onChange={e => setWorkerForm(f => ({ ...f, availability_custom: e.target.value }))} />
              )}

              <label style={s.lbl}>Skills (piliin lahat ng applicable)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
                {SKILLS.map(skill => (
                  <div key={skill.en} style={s.skillChip(workerForm.skills.includes(skill.en))} onClick={() => toggleSkill(skill.en)}>
                    {skill.tl}
                  </div>
                ))}
              </div>

              <label style={s.lbl}>Litrato ng Worker</label>
              {workerForm.photo && <img src={workerForm.photo} alt="worker" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '10px', marginBottom: '8px' }} />}
              <div onClick={() => photoRef.current?.click()} style={{ background: '#fdf9f4', border: `2px dashed ${workerForm.photo ? '#1a6b3c' : '#e5e0d8'}`, borderRadius: '11px', padding: '20px', textAlign: 'center', cursor: 'pointer', marginBottom: '12px' }}>
                {workerForm.photo
                  ? <><div style={{ fontSize: '18px', marginBottom: '4px' }}>✅</div><div style={{ fontSize: '13px', color: '#1a6b3c', fontWeight: 700 }}>Litrato na-upload!</div></>
                  : <><div style={{ fontSize: '28px', marginBottom: '6px' }}>📷</div><div style={{ fontSize: '13px', fontWeight: 700 }}>I-tap para mag-upload ng litrato</div></>
                }
              </div>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
            </div>

            <div style={{ background: '#fff', border: '1.5px solid #e5e0d8', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#4b5563', marginBottom: '10px', textTransform: 'uppercase' as const, letterSpacing: '.5px' }}>Mga Dokumento (i-tick kung mayroon)</div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
                {['Wala','PhilHealth ID','SSS ID','Postal ID','Passport','UMID','National ID'].map((label) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => toggleGovtId(label)}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '5px', border: '2px solid', borderColor: workerForm.govt_id_types.includes(label) ? '#c9943a' : '#d1d5db', background: workerForm.govt_id_types.includes(label) ? '#c9943a' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {workerForm.govt_id_types.includes(label) && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 900 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: '13px', color: '#374151' }}>{label}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setWorkerForm(f => ({ ...f, has_nbi: !f.has_nbi }))}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '5px', border: '2px solid', borderColor: workerForm.has_nbi ? '#1a6b3c' : '#d1d5db', background: workerForm.has_nbi ? '#1a6b3c' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {workerForm.has_nbi && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 900 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: '13px', color: '#374151' }}>NBI Clearance</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px', fontSize: '12px', color: '#2563eb', lineHeight: 1.65 }}>
              📱 <strong>Makakatanggap ng text message ang iyong nirefer.</strong><br />
              Kapag kinompirma nya, siya ay makakasama na sa mga pwede i-hire ng mga homeowner.
            </div>

            <button style={{ ...s.submitBtn, opacity: saving ? .6 : 1 }} onClick={handleAddWorker} disabled={saving}>
              {saving ? 'Nagse-save...' : 'I-submit ang Worker →'}
            </button>
          </>
        )}

        <div style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '20px' }}>
          Patuloy na mag-refer at kumita kasama ang MaidIt! 💚
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccess && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px 20px', maxWidth: '320px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
            <div style={{ fontFamily: 'serif', fontSize: '20px', fontWeight: 900, color: '#1a6b3c', marginBottom: '8px' }}>Na-save na!</div>
            <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, marginBottom: '20px' }}>
              Si <strong>{savedName}</strong> ay naidagdag na. Kapag natanggap niya ang SMS confirmation at nag-confirm, makikita na siya ng mga homeowner.
            </div>
            <button onClick={async () => {
              setShowSuccess(false)
              const { supabase } = await import('../../../lib/supabase')
              const { data: workersData } = await supabase.from('kasambahay').select('*, profiles(*)').eq('referred_by', partner.id)
              setWorkers(workersData || [])
              setTab('workers')
            }} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#1a6b3c', border: 'none', color: '#fff', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
              Tingnan ang Workers
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
