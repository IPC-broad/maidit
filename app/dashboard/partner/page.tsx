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

type Payout = {
  id: string; amount: number; type: string; status: string; due_at: string
  offer: { kasambahay_profile: { full_name: string }; homeowner_profile: { full_name: string } }
}
type Worker = {
  id: string; province: string; skills: string[]; status: string
  profiles: { full_name: string; mobile: string }
}

export default function PartnerDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<'workers' | 'payouts' | 'add'>('workers')
  const [partner, setPartner] = useState<any>(null)
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)

  const [workerForm, setWorkerForm] = useState({
    apelyido: '',
    pangalan: '',
    mobile: '',
    province: '',
    skills: [] as string[],
    setup: 'Kahit alin',
    civil_status: '',
    num_children: '0',
    availability: '',
    availability_custom: '',
    photo: null as string | null,
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
        .select('*, profiles(*)').eq('referred_by', partnerData.id).order('created_at', { ascending: false })
      setWorkers(workersData || [])
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

  const shareMessenger = () => {
    const link = encodeURIComponent(`https://maidit.vercel.app/signup/kasambahay?ref=${referralCode}`)
    window.open(`fb-messenger://share?link=${link}`, '_blank')
  }

  const toggleSkill = (skill: string) => {
    setWorkerForm(f => ({
      ...f, skills: f.skills.includes(skill) ? f.skills.filter(s => s !== skill) : [...f.skills, skill]
    }))
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
    const full_name = `${pangalan} ${apelyido}`
    const { data: profile, error: profileError } = await supabase.from('profiles').insert({
      full_name, mobile, city: province, role: 'kasambahay', verified: false
    }).select().single()
    if (profileError || !profile) {
      setSaveMsg('Hindi ma-save. Baka registered na ang mobile number na ito.')
      setSaving(false); return
    }
    // Generate a unique confirmation token
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)

    await supabase.from('kasambahay').insert({
      profile_id: profile.id,
      province,
      skills: workerForm.skills,
      referred_by: partner.id,
      status: 'pending_confirmation',
      setup: workerForm.setup,
      civil_status: workerForm.civil_status,
      num_children: parseInt(workerForm.num_children) || 0,
      availability: workerForm.availability === 'Iba pa (custom)' && workerForm.availability_custom
        ? `${workerForm.availability_custom} araw`
        : workerForm.availability,
      confirm_token: token,
    })

    // Get the new kasambahay ID
    const { data: newKb } = await supabase
      .from('kasambahay')
      .select('id')
      .eq('profile_id', profile.id)
      .single()

    // Send confirmation SMS to worker
    if (newKb?.id) {
      await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'worker_added',
          kasambahayId: newKb.id,
          token,
        })
      }).catch(() => {})
    }

    setSaveMsg('Na-save na! Makakatanggap ng text message si ' + pangalan + '.')
    setSaving(false)
    setWorkerForm({ apelyido: '', pangalan: '', mobile: '', province: '', skills: [], setup: 'Kahit alin', civil_status: '', num_children: '0', availability: '', availability_custom: '', photo: null })

    const { supabase: sb2 } = await import('../../../lib/supabase')
    const { data: workersData } = await sb2.from('kasambahay').select('*, profiles(*)').eq('referred_by', partner.id).order('created_at', { ascending: false })
    setWorkers(workersData || [])
    setTab('workers')
  }

  const totalEarned = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const totalPending = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
  const isGold = partner?.tier === 'gold'

  const statusLabel: Record<string, { label: string; bg: string; color: string }> = {
    hired: { label: 'Na-hire na', bg: 'rgba(26,107,60,.25)', color: '#6ee7b7' },
    offer: { label: 'May Offer', bg: 'rgba(139,92,246,.25)', color: '#c4b5fd' },
    available: { label: 'Available', bg: 'rgba(37,99,235,.2)', color: '#93c5fd' },
    pending_confirmation: { label: 'Hindi pa nagcoconfirm', bg: 'rgba(201,148,58,.2)', color: '#f0c97a' },
    pending: { label: 'Hindi pa nagcoconfirm', bg: 'rgba(201,148,58,.2)', color: '#f0c97a' },
    draft: { label: 'Hindi pa nagcoconfirm', bg: 'rgba(201,148,58,.2)', color: '#f0c97a' },
  }

  const s: any = {
    wrap: { minHeight: '100vh', background: '#faf8f5', color: '#1a1a1a', fontFamily: 'sans-serif' },
    tab: (active: boolean) => ({
      flex: 1, padding: '11px 4px', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 700,
      color: active ? '#c9943a' : '#9ca3af', background: 'none', border: 'none',
      cursor: 'pointer', borderBottom: `2px solid ${active ? '#c9943a' : 'transparent'}`
    }),
    card: { background: '#fff', borderRadius: '12px', padding: '13px 14px', marginBottom: '10px', border: '1px solid #ede8e0' },
    lbl: { display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#9ca3af', marginBottom: '4px' },
    inp: { width: '100%', padding: '11px 12px', border: '1.5px solid #e5e0d8', borderRadius: '10px', fontFamily: 'sans-serif', fontSize: '14px', outline: 'none', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as const, marginBottom: '10px' },
    sel: { width: '100%', padding: '11px 12px', border: '1.5px solid #e5e0d8', borderRadius: '10px', fontFamily: 'sans-serif', fontSize: '14px', outline: 'none', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as const, marginBottom: '10px' },
    submitBtn: { width: '100%', padding: '13px', borderRadius: '11px', border: 'none', background: '#c9943a', color: '#fff', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '8px' },
    skillChip: (on: boolean) => ({
      display: 'block', padding: '9px 10px', borderRadius: '9px', cursor: 'pointer',
      fontSize: '13px', fontWeight: 600, textAlign: 'center' as const, transition: 'all .15s',
      border: on ? '1.5px solid #c9943a' : '1.5px solid #e5e0d8',
      background: on ? '#fef3e2' : '#fff',
      color: on ? '#92400e' : '#6b7280',
    }),
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontFamily: 'sans-serif' }}>
      Loading...
    </div>
  )

  return (
    <div style={s.wrap}>
      {/* HEADER */}
      <div style={{ background: '#fff', borderBottom: '1px solid #ede8e0', padding: '16px 16px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>Welcome back</div>
          <button onClick={async () => { const { supabase } = await import('../../../lib/supabase'); await supabase.auth.signOut(); router.push('/login') }} style={{ background: '#f9f6f2', border: '1px solid #ede8e0', borderRadius: '8px', padding: '5px 11px', color: '#6b7280', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif' }}>Sign out</button>
        </div>
        <div style={{ fontFamily: 'serif', fontSize: '20px', fontWeight: 900 }}>{partner?.profiles?.full_name || 'Partner'}</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const, marginTop: '6px' }}>
          <span style={{ background: partner?.approved ? 'rgba(26,107,60,.2)' : 'rgba(255,255,255,.08)', border: `1px solid ${partner?.approved ? 'rgba(26,107,60,.3)' : 'rgba(255,255,255,.1)'}`, borderRadius: '50px', padding: '3px 10px', fontSize: '10px', fontWeight: 700, color: partner?.approved ? '#6ee7b7' : 'rgba(255,255,255,.4)' }}>
            {partner?.approved ? '✅ Approved' : '⏳ Pending Approval'} · {partner?.province || partner?.barangay?.split(',').slice(-1)[0]?.trim() || 'PH'}
          </span>
          {isGold && <span style={{ background: 'rgba(201,148,58,.2)', border: '1px solid rgba(201,148,58,.3)', borderRadius: '50px', padding: '3px 10px', fontSize: '10px', fontWeight: 700, color: '#f0c97a' }}>⭐ Gold Partner</span>}
        </div>

        {/* REFERRAL CODE */}
        <div style={{ background: 'rgba(201,148,58,.1)', border: '1px solid rgba(201,148,58,.2)', borderRadius: '10px', padding: '10px 13px', marginTop: '11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>Referral code mo</div>
            <div style={{ fontFamily: 'serif', fontSize: '20px', fontWeight: 900, color: '#f0c97a', letterSpacing: '1px' }}>{referralCode}</div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={copyCode} style={{ padding: '6px 12px', borderRadius: '7px', background: copied ? 'rgba(26,107,60,.3)' : 'rgba(201,148,58,.2)', border: `1px solid ${copied ? 'rgba(26,107,60,.4)' : 'rgba(201,148,58,.3)'}`, color: copied ? '#6ee7b7' : '#f0c97a', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
            <button onClick={shareSMS} style={{ padding: '6px 12px', borderRadius: '7px', background: 'rgba(37,99,235,.15)', border: '1px solid rgba(37,99,235,.25)', color: '#93c5fd', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>SMS</button>
          </div>
        </div>
        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '5px', lineHeight: 1.5 }}>I-share sa mga naghahanap ng trabaho — sila mag-e-enter nito during signup</div>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: '#ede8e0' }}>
        {[
          { num: `₱${totalEarned.toLocaleString()}`, lbl: 'Kinita', color: '#1a6b3c' },
          { num: workers.filter(w => w.status === 'hired').length, lbl: 'Na-hire', color: '#c9943a' },
          { num: workers.length, lbl: 'Narecruit', color: '#2563eb' },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#fff', padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'serif', fontSize: '22px', fontWeight: 900, color: stat.color, marginBottom: '2px' }}>{stat.num}</div>
            <div style={{ fontSize: '10px', color: '#9ca3af' }}>{stat.lbl}</div>
          </div>
        ))}
      </div>

      {/* PAYOUT BANNER */}
      <div style={{ background: isGold ? '#fef3c7' : '#dcfce7', borderBottom: '1px solid #ede8e0', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '14px' }}>{isGold ? '⭐' : '💰'}</span>
        <div style={{ fontSize: '12px', color: isGold ? '#92400e' : '#166534', lineHeight: 1.5, flex: 1 }}>
          {isGold
            ? <><strong>Gold Partner:</strong> ₱1,000 upfront sa worker arrival.</>
            : <><strong>Standard Partner:</strong> ₱600 sa arrival + ₱400 after 30 days = ₱1,000 total</>}
        </div>
        {totalPending > 0 && <div style={{ fontFamily: 'serif', fontSize: '13px', fontWeight: 900, color: '#92400e' }}>₱{totalPending.toLocaleString()} pending</div>}
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #ede8e0' }}>
        {(['workers', 'payouts', 'add'] as const).map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>
            {t === 'add' ? '+ Mag-add' : t === 'workers' ? 'Workers' : 'Payouts'}
          </button>
        ))}
      </div>

      <div style={{ padding: '14px 14px 48px' }}>

        {/* WORKERS TAB */}
        {tab === 'workers' && (
          <>
            {workers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👥</div>
                <div style={{ fontSize: '13px', marginBottom: '4px' }}>Wala pang workers sa pool mo.</div>
                <div style={{ fontSize: '12px' }}>Mag-tap ng "+ Mag-add" para magsimula.</div>
              </div>
            ) : workers.map(w => {
              const st = statusLabel[w.status] || statusLabel.draft
              return (
                <div key={w.id} style={s.card}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(201,148,58,.15)', border: '2px solid rgba(201,148,58,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>👩</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>{w.profiles?.full_name}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{w.province} · {w.profiles?.mobile}</div>
                    </div>
                    <div style={{ fontSize: '9px', fontWeight: 800, padding: '3px 9px', borderRadius: '50px', textTransform: 'uppercase', background: st.bg, color: st.color }}>{st.label}</div>
                  </div>
                  {w.skills?.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {w.skills.map((skill: string) => (
                        <span key={skill} style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#f3ede5', color: '#92400e' }}>{skill}</span>
                      ))}
                    </div>
                  )}
                  {w.status === 'pending_confirmation' && (
                    <div style={{ marginTop: '8px', background: 'rgba(201,148,58,.1)', borderRadius: '8px', padding: '7px 10px', fontSize: '11px', color: '#6b7280', lineHeight: 1.5 }}>
                      📱 Naghihintay ng reply sa text message
                    </div>
                  )}
                </div>
              )
            })}
            <button onClick={() => setTab('add')} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(201,148,58,.12)', border: '1.5px dashed rgba(201,148,58,.3)', color: '#f0c97a', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginTop: '4px', fontFamily: 'sans-serif' }}>
              + Mag-add ng Worker
            </button>
          </>
        )}

        {/* PAYOUTS TAB */}
        {tab === 'payouts' && (
          <>
            <div style={{ background: 'rgba(26,107,60,.15)', border: '1px solid rgba(26,107,60,.25)', borderRadius: '12px', padding: '14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '26px' }}>💰</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>Total kinita</div>
                <div style={{ fontFamily: 'serif', fontSize: '26px', fontWeight: 900, color: '#6ee7b7' }}>₱{totalEarned.toLocaleString()}</div>
                {totalPending > 0 && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>₱{totalPending.toLocaleString()} pending</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>GCash</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f0c97a' }}>{partner?.gcash_number || '—'}</div>
              </div>
            </div>
            {payouts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontSize: '13px' }}>
                Wala pang payouts. Lalabas ito kapag na-hire na ang iyong workers.
              </div>
            ) : payouts.map(p => (
              <div key={p.id} style={{ background: '#fff', borderRadius: '10px', padding: '12px 13px', marginBottom: '8px', border: `1px solid ${p.status === 'pending' ? '#fde8c0' : '#ede8e0'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: p.status === 'paid' ? 'rgba(26,107,60,.2)' : 'rgba(201,148,58,.15)', flexShrink: 0, fontSize: '14px' }}>
                  {p.status === 'paid' ? '💚' : '⏳'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>{p.offer?.kasambahay_profile?.full_name}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                    {p.type === 'arrival' ? 'Arrival payout' : 'Day-30 payout'} · {new Date(p.due_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'serif', fontSize: '15px', fontWeight: 900, color: p.status === 'paid' ? '#6ee7b7' : '#f0c97a' }}>₱{p.amount.toLocaleString()}</div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '1px' }}>{p.status}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ADD WORKER TAB */}
        {tab === 'add' && (
          <>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '14px', lineHeight: 1.6 }}>
              I-upload ang kasambahay sa iyong pool.
            </div>

            {saveMsg && (
              <div style={{ background: saveMsg.includes('Na-save') ? 'rgba(26,107,60,.2)' : 'rgba(220,38,38,.1)', border: `1px solid ${saveMsg.includes('Na-save') ? 'rgba(26,107,60,.3)' : 'rgba(220,38,38,.3)'}`, borderRadius: '9px', padding: '10px 13px', fontSize: '13px', color: saveMsg.includes('Na-save') ? '#6ee7b7' : '#f87171', marginBottom: '12px', lineHeight: 1.5 }}>
                {saveMsg}
              </div>
            )}

            <div style={s.card}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: '#f0c97a', marginBottom: '13px' }}>Detalye ng Worker</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={s.lbl}>Apelyido *</label>
                  <input style={s.inp} placeholder="Santos" value={workerForm.apelyido}
                    onChange={e => setWorkerForm(f => ({ ...f, apelyido: e.target.value.replace(/\b\w/g, c => c.toUpperCase()) }))} />
                </div>
                <div>
                  <label style={s.lbl}>Pangalan *</label>
                  <input style={s.inp} placeholder="Maria" value={workerForm.pangalan}
                    onChange={e => setWorkerForm(f => ({ ...f, pangalan: e.target.value.replace(/\b\w/g, c => c.toUpperCase()) }))} />
                </div>
              </div>

              <label style={s.lbl}>Mobile Number *</label>
              <input style={s.inp} type="tel" placeholder="09XXXXXXXXX" maxLength={11} value={workerForm.mobile}
                onChange={e => setWorkerForm(f => ({ ...f, mobile: e.target.value.replace(/\D/g, '').slice(0, 11) }))} />

              <label style={s.lbl}>Probinsya *</label>
              <input style={s.inp} placeholder="e.g. Batangas, Iloilo, Cebu" value={workerForm.province}
                onChange={e => setWorkerForm(f => ({ ...f, province: e.target.value }))} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={s.lbl}>Civil Status</label>
                  <select style={s.sel} value={workerForm.civil_status}
                    onChange={e => setWorkerForm(f => ({ ...f, civil_status: e.target.value }))}>
                    <option value="">Piliin...</option>
                    {CIVIL_STATUS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.lbl}>Bilang ng Anak</label>
                  <select style={s.sel} value={workerForm.num_children}
                    onChange={e => setWorkerForm(f => ({ ...f, num_children: e.target.value }))}>
                    {Array.from({ length: 21 }, (_, i) => (
                      <option key={i} value={i}>{i === 0 ? 'Wala' : i}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label style={s.lbl}>Setup</label>
              <select style={s.sel} value={workerForm.setup}
                onChange={e => setWorkerForm(f => ({ ...f, setup: e.target.value }))}>
                {SETUPS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <label style={s.lbl}>Available Magtrabaho</label>
              <select style={s.sel} value={workerForm.availability}
                onChange={e => setWorkerForm(f => ({ ...f, availability: e.target.value, availability_custom: '' }))}>
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
                  <div key={skill.en} style={s.skillChip(workerForm.skills.includes(skill.en))}
                    onClick={() => toggleSkill(skill.en)}>
                    {skill.tl}
                  </div>
                ))}
              </div>

              {/* PHOTO */}
              <label style={s.lbl}>Litrato ng Worker</label>
              {workerForm.photo && (
                <img src={workerForm.photo} alt="worker" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '10px', marginBottom: '8px' }} />
              )}
              <div onClick={() => photoRef.current?.click()} style={{ background: '#fdf9f4', border: `2px dashed ${workerForm.photo ? '#1a6b3c' : '#e5e0d8'}`, borderRadius: '11px', padding: '20px', textAlign: 'center', cursor: 'pointer', marginBottom: '12px' }}>
                {workerForm.photo
                  ? <><div style={{ fontSize: '18px', marginBottom: '4px' }}>✅</div><div style={{ fontSize: '13px', color: '#6ee7b7', fontWeight: 700 }}>Litrato na-upload!</div><div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>I-tap para palitan</div></>
                  : <><div style={{ fontSize: '28px', marginBottom: '6px' }}>📷</div><div style={{ fontSize: '13px', fontWeight: 700 }}>I-tap para mag-upload ng litrato</div><div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Malinaw na mukha ng worker</div></>
                }
              </div>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
            </div>

            {/* SMS NOTE */}
            <div style={{ background: 'rgba(37,99,235,.1)', border: '1px solid rgba(37,99,235,.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px', fontSize: '12px', color: '#93c5fd', lineHeight: 1.65 }}>
              📱 <strong>Makakatanggap ng text message ang iyong nirefer.</strong><br />
              Kapag kinompirma nya na sya ay nag-aapply, siya ay makakasama na sa mga pwede i-hire ng mga homeowner.
            </div>

            <button style={{ ...s.submitBtn, opacity: saving ? .6 : 1 }} onClick={handleAddWorker} disabled={saving}>
              {saving ? 'Nagse-save...' : 'I-submit ang Worker →'}
            </button>
            <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', marginTop: '6px', lineHeight: 1.6 }}>
              Mave-verify ng MaidIt within 24 hours.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
