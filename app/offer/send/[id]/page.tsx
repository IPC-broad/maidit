'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { provinces as PH } from '../../../../lib/ph-locations'

const provinceList = Object.keys(PH)

const TRANSPORT_PROVINCES = [
  'Leyte', 'Southern Leyte', 'Samar', 'Eastern Samar', 'Northern Samar', 'Western Samar',
  'Camarines Norte', 'Camarines Sur', 'Albay', 'Sorsogon', 'Catanduanes', 'Masbate',
]

const C = {
  forest: '#27500A', forestDeep: '#1c3b07', forestSoft: '#f0f5ec', forestLine: '#e2ecdb',
  amber: '#c9943a', amberSoft: '#fbf3e2', amberLine: '#efe1bf', amberDeep: '#8a6418',
  ink: '#1a1d18', ink2: '#4a504a', ink3: '#8a8f88', ink4: '#b8bcb5',
  paper: '#ffffff', paper2: '#faf9f5', line: '#ebe9e2',
}
const serif = "'Instrument Serif', Georgia, serif"
const sans  = "'Geist', ui-sans-serif, sans-serif"

const IcPin = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.4"/>
  </svg>
)
const IcCal = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
)
const IcArrowRight = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 5l7 7-7 7"/>
  </svg>
)
const IcChevDown = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6"/>
  </svg>
)
const IcCheck = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
)

const SCOPE_ITEMS = [
  { label: 'All-Around Maid', icon: '🧹' },
  { label: 'Cook',            icon: '🍳' },
  { label: 'Laundry',        icon: '👕' },
  { label: 'Nanny',          icon: '👶' },
  { label: 'Pet Care',       icon: '🐾' },
  { label: 'Elder Care',     icon: '🦽' },
  { label: 'Driver',         icon: '🚗' },
  { label: 'Grocery / Errands', icon: '🛍️' },
]

function SectionHeader({ eyebrow, pre, italic, post }: { eyebrow: string; pre: string; italic: string; post: string }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.ink3, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 8 }}>{eyebrow}</div>
      <div style={{ fontFamily: serif, fontSize: 26, color: C.ink, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
        {pre}<em style={{ color: C.amber }}>{italic}</em>{post}
      </div>
    </div>
  )
}

export default function SendOfferPage() {
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap'
    document.head.appendChild(link)
    return () => { try { document.head.removeChild(link) } catch {} }
  }, [])

  const router = useRouter()
  const rawParams = useParams()
  const kasambahayId = rawParams?.id as string

  const [kb, setKb] = useState<any>(null)
  const [form, setForm] = useState({
    salary: '',
    urgency: 'ASAP',
    start_date: '',
    scope: [] as string[],
    setup: 'Stay-in',
    province: '',
    city: '',
    adults: '1',
    seniors: '0',
    kids: '0',
    pets: 'None',
    transport_arrangement: '' as 'direct' | 'maidit_transport' | '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [subscribeLoading, setSubscribeLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [hwId, setHwId] = useState<string | null>(null)
  const [hwProvinceKey, setHwProvinceKey] = useState<string | null>(null)
  const [transportDirectType, setTransportDirectType] = useState<'homeowner_pays' | 'reimburse' | 'kasambahay_pays' | ''>('')
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { supabase } = await import('../../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: kbData } = await supabase.from('kasambahay').select('*, profiles(full_name, mobile, city)').eq('id', kasambahayId).single()
      setKb(kbData)
      const TEST_EMAILS = ['test@maidit.com', 'homeowner@maidit.app', 'test.kasambahay@maidit.app', 'partner@maidit.com']
      const isTestAccount = TEST_EMAILS.includes(user.email ?? '')
      const { data: hw } = await supabase.from('homeowners').select('id, subscription_expires_at').eq('profile_id', user.id).single()
      const subscribed = isTestAccount || !!(hw?.subscription_expires_at && new Date(hw.subscription_expires_at) > new Date())
      if (!subscribed) setShowPaywall(true)
      if (hw?.id) setHwId(hw.id)
      const { data: prof } = await supabase.from('profiles').select('city').eq('id', user.id).single()
      const hwCity = prof?.city || null
      if (hwCity) {
        const found = provinceList.find(prov => (PH[prov] || []).includes(hwCity))
        setHwProvinceKey(found || null)
        if (found) setForm(f => ({ ...f, province: found, city: hwCity }))
      }
    }
    init()
  }, [kasambahayId])

  const handleSendOffer = async () => {
    if (!form.salary || form.scope.length === 0) { setError('Please fill in the monthly salary and scope of work.'); return }
    if (showTransportSection && showMaidItOption && !form.transport_arrangement) {
      setError('Please choose a transport arrangement.'); return
    }
    console.log('[offer-send]', {
      transport_arrangement: isDirect ? 'direct' : isMaidIt ? 'maidit_transport' : '',
      transport_service: isMaidIt,
      transport_direct_type: isDirect ? transportDirectType : null,
    })
    setSubmitting(true)
    setError('')
    const { supabase } = await import('../../../../lib/supabase')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: hw } = await supabase.from('homeowners').select('id').eq('profile_id', user.id).single()
    if (!hw) { setSubmitting(false); setError('Homeowner profile not found. Please contact support.'); return }
    const household = {
      adults: parseInt(form.adults) || 0,
      seniors: parseInt(form.seniors) || 0,
      kids: parseInt(form.kids) || 0,
    }
    const isTransport = form.transport_arrangement === 'maidit_transport'
    const { error: offerError } = await supabase.from('offers').insert({
      homeowner_id: hw?.id,
      kasambahay_id: kasambahayId,
      salary: parseInt(form.salary),
      urgency: form.urgency,
      start_date: form.start_date || null,
      scope: form.scope,
      setup: form.setup,
      city: form.city,
      household,
      pets: form.pets,
      status: 'pending',
      transport_service: isTransport,
      transport_fee: isTransport ? 6000 : 0,
      transport_direct_type: isTransport ? null : (transportDirectType || null),
    })
    if (offerError) { setSubmitting(false); setError(offerError.message); return }
    const { data: newOffer } = await supabase.from('offers').select('id').eq('kasambahay_id', kasambahayId).eq('status', 'pending').order('created_at', { ascending: false }).limit(1).single()
    if (newOffer?.id) {
      await fetch('/api/send-sms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'offer_sent', offerId: newOffer.id }) }).catch(() => {})
      const { data: kbRef } = await supabase.from('kasambahay').select('referred_by').eq('id', kasambahayId).single()
      if (kbRef?.referred_by) {
        await fetch('/api/send-sms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'referral_offer_received', offerId: newOffer.id, partnerId: kbRef.referred_by }) }).catch(() => {})
      }
    }
    setSubmitting(false)
    setSuccess(true)
  }

  const toggleScope = (sc: string) => setForm(f => ({ ...f, scope: f.scope.includes(sc) ? f.scope.filter((x: string) => x !== sc) : [...f.scope, sc] }))

  const kbProvince = kb?.province || ''
  const sameProvince = !!(hwProvinceKey && kbProvince && hwProvinceKey === kbProvince)
  const showTransportSection = !!(kb && kbProvince && (hwProvinceKey !== kbProvince))
  const showMaidItOption = TRANSPORT_PROVINCES.includes(kbProvince)
  console.log('[transport]', { kbProvince, hwProvinceKey, sameProvince, showTransportSection, showMaidItOption })
  const isDirect = form.transport_arrangement === 'direct' || (showTransportSection && !showMaidItOption)
  const isMaidIt = form.transport_arrangement === 'maidit_transport'
  const transportBlocked = showTransportSection && showMaidItOption && !form.transport_arrangement

  // Completion tracking
  const s1Done = !!(form.salary)
  const s2Done = !!(form.city)
  const s3Done = form.scope.length > 0
  const s4Done = !showTransportSection || !showMaidItOption || !!(form.transport_arrangement)
  const completedSections = [s1Done, s2Done, s3Done, showTransportSection ? s4Done : null].filter(x => x === true).length
  const totalSections = showTransportSection ? 4 : 3

  // Salary validation
  const salaryNum = parseInt(form.salary) || 0
  const askingNum = kb?.asking_salary || 0
  const salaryBelowAsking = salaryNum > 0 && askingNum > 0 && salaryNum < askingNum
  const salaryAtOrAbove = salaryNum > 0 && askingNum > 0 && salaryNum >= askingNum

  // Derived display values
  const fullName = kb?.profiles?.full_name || ''
  const initials = fullName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  const STORAGE = 'https://xlagwtsrjbylhxfozoem.supabase.co/storage/v1/object/public/Selfies'
  const selfieUrl = kb?.profile_id ? `${STORAGE}/${kb.profile_id}/selfie.png` : null

  // Stepper helper
  const step = (key: 'adults' | 'seniors' | 'kids', delta: number) => {
    const cur = parseInt(form[key]) || 0
    const next = Math.max(0, Math.min(9, cur + delta))
    setForm(f => ({ ...f, [key]: String(next) }))
  }

  // Formatted start date display
  const fmtDate = form.start_date
    ? new Date(form.start_date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
    : ''

  if (success) return (
    <div style={{ minHeight: '100vh', background: C.paper2, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center' as const, fontFamily: sans }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.forestSoft, border: `2px solid ${C.forestLine}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, marginBottom: 20 }}>✅</div>
      <div style={{ fontFamily: serif, fontSize: 28, color: C.forestDeep, letterSpacing: '-0.02em', marginBottom: 8 }}>Offer sent!</div>
      <p style={{ color: C.ink3, fontSize: 14, lineHeight: 1.6, marginBottom: 28, maxWidth: 280 }}>Your offer has been sent. The kasambahay will review it shortly.</p>
      <button
        style={{ width: '100%', maxWidth: 320, height: 52, borderRadius: 14, background: C.forest, color: C.paper, border: 'none', fontFamily: sans, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        onClick={() => router.push('/dashboard/homeowner')}
      >
        Back to Dashboard <IcArrowRight size={14} />
      </button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.paper2, fontFamily: sans, color: C.ink, paddingBottom: 120 }}>

      {/* ── NAV ROW ── */}
      <div style={{ background: C.paper, borderBottom: `1px solid ${C.line}`, padding: '10px 16px', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 60 }}>
        <button
          onClick={() => router.back()}
          style={{ width: 38, height: 38, borderRadius: 11, background: C.paper, border: `1.5px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.ink, fontSize: 18, flexShrink: 0 }}
        >←</button>
        <div style={{ flex: 1, textAlign: 'center' as const, fontSize: 15, fontWeight: 600, color: C.ink, letterSpacing: '-0.005em' }}>Send Offer</div>
        <div style={{ width: 38 }} />
      </div>

      {/* ── STICKY SUMMARY CARD ── */}
      {kb && (
        <div style={{ background: C.paper, borderBottom: `1px solid ${C.line}`, padding: '12px 18px', position: 'sticky', top: 58, zIndex: 50, display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Portrait */}
          <div style={{ width: 52, height: 52, borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(155deg, #fde8c0 0%, #e8c47a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {selfieUrl && !imgError ? (
              <img src={selfieUrl} alt={fullName} onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' as const, objectPosition: 'top' }} />
            ) : (
              <span style={{ fontFamily: serif, fontSize: 20, color: '#fff', lineHeight: 1 }}>{initials}</span>
            )}
          </div>
          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.ink3, letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 2 }}>OFFERING TO</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, lineHeight: 1.2, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{fullName}</div>
            <div style={{ fontSize: 12, color: C.ink3, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <span style={{ color: C.forest }}><IcPin /></span>
              {kb.province}{kb.setup ? ` · ${kb.setup}` : ''}
            </div>
          </div>
          {/* Asking salary */}
          {kb.asking_salary ? (
            <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: C.ink3, marginBottom: 1 }}>Asking</div>
              <div style={{ fontFamily: serif, fontSize: 17, color: C.ink, letterSpacing: '-0.01em', lineHeight: 1 }}>₱{kb.asking_salary.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: C.ink3 }}>/mo</div>
            </div>
          ) : null}
        </div>
      )}

      {/* ── BODY ── */}
      <div style={{ padding: '28px 18px 8px' }}>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '11px 14px', fontSize: 13, color: '#dc2626', marginBottom: 20 }}>{error}</div>
        )}

      {/* ── PROXY BANNER ── */}
      {kb?.proxy_mode && (
        <div style={{ margin: '12px 18px 0', background: '#fbf3e2', border: '1px solid #e8d4a0', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>🤝</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#a87528', marginBottom: 3 }}>Represented by a Community Partner</div>
            <div style={{ fontSize: 12, color: '#4a4a3a', lineHeight: 1.6 }}>This kasambahay is represented by a verified Community Partner who will negotiate and respond to offers on her behalf. You will be notified of any updates directly through this platform.</div>
          </div>
        </div>
      )}

        {/* ──────────── SECTION 1: THE JOB ──────────── */}
        <SectionHeader eyebrow="THE JOB" pre="What you're " italic="offering" post="." />

        {/* Salary */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.ink3, marginBottom: 10 }}>Monthly Salary</div>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: C.paper, border: `1.5px solid ${salaryBelowAsking ? C.amber : salaryAtOrAbove ? C.forest : C.line}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color .15s' }}>
              <span style={{ fontFamily: serif, fontSize: 26, color: C.ink3, padding: '0 4px 0 18px', lineHeight: 1, flexShrink: 0 }}>₱</span>
              <input
                type="number"
                placeholder="9,000"
                value={form.salary}
                onChange={e => setForm(f => ({ ...f, salary: e.target.value }))}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 22, fontFamily: serif, color: C.ink, padding: '14px 8px 14px 4px', background: 'transparent', width: '100%' }}
              />
              {salaryBelowAsking && <span style={{ paddingRight: 14, fontSize: 18 }}>⚠️</span>}
              {salaryAtOrAbove && (
                <span style={{ paddingRight: 14, color: C.forest, display: 'flex' }}><IcCheck /></span>
              )}
            </div>
            {salaryBelowAsking && askingNum > 0 && (
              <div style={{ marginTop: 6, fontSize: 12, color: C.amberDeep, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: C.amber }}>⚠</span>
                Below her asking salary of ₱{askingNum.toLocaleString()}
              </div>
            )}
            {salaryAtOrAbove && (
              <div style={{ marginTop: 6, fontSize: 12, color: C.forest, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>✓</span> Matches or exceeds her asking salary
              </div>
            )}
          </div>
        </div>

        {/* Urgency pills */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.ink3, marginBottom: 10 }}>When do you need them?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
            {[
              { val: 'ASAP', label: 'ASAP' },
              { val: 'Within a few days', label: 'A few days' },
              { val: 'Next week', label: 'Next week' },
              { val: 'Flexible / To be discussed', label: 'Flexible' },
            ].map(({ val, label }) => {
              const active = form.urgency === val
              return (
                <button
                  key={val}
                  onClick={() => setForm(f => ({ ...f, urgency: val }))}
                  style={{ padding: '8px 16px', borderRadius: 50, border: `1.5px solid ${active ? C.forest : C.line}`, background: active ? C.forest : C.paper, color: active ? C.paper : C.ink2, fontFamily: sans, fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer' }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Start date */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.ink3, marginBottom: 10 }}>Start Date <span style={{ fontWeight: 400, color: C.ink4 }}>(optional)</span></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 0, background: C.paper, border: `1.5px solid ${C.line}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer' }}>
            <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.paper2, borderRight: `1px solid ${C.line}`, color: C.ink3, flexShrink: 0 }}>
              <IcCal />
            </div>
            <div style={{ flex: 1, padding: '0 14px', position: 'relative' }}>
              <div style={{ fontSize: fmtDate ? 14 : 13, color: fmtDate ? C.ink : C.ink4, fontWeight: fmtDate ? 500 : 400 }}>
                {fmtDate || 'Pick a date…'}
              </div>
              <input
                type="date"
                value={form.start_date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
              />
            </div>
          </label>
        </div>

        {/* Setup toggle */}
        <div style={{ marginBottom: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.ink3, marginBottom: 10 }}>Setup</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {['Stay-in', 'Stay-out'].map(opt => {
              const active = form.setup === opt
              return (
                <button
                  key={opt}
                  onClick={() => setForm(f => ({ ...f, setup: opt }))}
                  style={{ padding: '13px 8px', borderRadius: 13, border: `1.5px solid ${active ? C.forest : C.line}`, background: active ? C.forestSoft : C.paper, color: active ? C.forestDeep : C.ink2, fontFamily: sans, fontSize: 14, fontWeight: active ? 700 : 500, cursor: 'pointer', transition: 'all .12s' }}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        </div>

        {/* Section divider */}
        <div style={{ height: 1, background: C.line, margin: '32px 0' }} />

        {/* ──────────── SECTION 2: YOUR HOUSEHOLD ──────────── */}
        <SectionHeader eyebrow="YOUR HOUSEHOLD" pre="Who she'll be " italic="helping" post="." />

        {/* Location cascade */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.ink3, marginBottom: 10 }}>Your City</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {/* Province */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: C.paper, border: `1.5px solid ${C.line}`, borderRadius: 13, overflow: 'hidden' }}>
              <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.forest, background: C.forestSoft, borderRight: `1px solid ${C.forestLine}`, flexShrink: 0 }}>
                <IcPin />
              </div>
              <select
                value={form.province}
                onChange={e => {
                  const prov = e.target.value
                  const cities = PH[prov] || []
                  setForm(f => ({ ...f, province: prov, city: cities[0] || '' }))
                }}
                style={{ flex: 1, border: 'none', outline: 'none', padding: '13px 36px 13px 12px', fontSize: 14, color: form.province ? C.ink : C.ink4, background: 'transparent', appearance: 'none' as const, fontFamily: sans, cursor: 'pointer' }}
              >
                <option value="">Province / Region</option>
                {provinceList.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <div style={{ position: 'absolute', right: 12, color: C.ink3, pointerEvents: 'none' }}><IcChevDown /></div>
            </div>
            {/* City */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: form.province ? C.paper : C.paper2, border: `1.5px solid ${C.line}`, borderRadius: 13, overflow: 'hidden', opacity: form.province ? 1 : 0.6 }}>
              <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.forest, background: C.forestSoft, borderRight: `1px solid ${C.forestLine}`, flexShrink: 0 }}>
                <IcPin />
              </div>
              <select
                value={form.city}
                disabled={!form.province}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                style={{ flex: 1, border: 'none', outline: 'none', padding: '13px 36px 13px 12px', fontSize: 14, color: form.city ? C.ink : C.ink4, background: 'transparent', appearance: 'none' as const, fontFamily: sans, cursor: form.province ? 'pointer' : 'not-allowed' }}
              >
                {!form.province
                  ? <option value="">Select province first</option>
                  : (PH[form.province] || []).map(c => <option key={c} value={c}>{c}</option>)
                }
              </select>
              <div style={{ position: 'absolute', right: 12, color: C.ink3, pointerEvents: 'none' }}><IcChevDown /></div>
            </div>
          </div>
        </div>

        {/* Household members stepper */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.ink3, marginBottom: 10 }}>Household Members</div>
          <div style={{ background: C.paper, border: `1.5px solid ${C.line}`, borderRadius: 14, overflow: 'hidden' }}>
            {([
              { key: 'adults',  label: 'Adults',       sub: '18–59 years' },
              { key: 'seniors', label: 'Seniors',      sub: '60+ years' },
              { key: 'kids',    label: 'Children',     sub: 'Under 18' },
            ] as const).map(({ key, label, sub }, i, arr) => {
              const val = parseInt(form[key]) || 0
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${C.line}` : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: C.ink }}>{label}</div>
                    <div style={{ fontSize: 11, color: C.ink3, marginTop: 1 }}>{sub}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button
                      onClick={() => step(key, -1)}
                      style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${C.line}`, background: val === 0 ? C.paper2 : C.paper, color: val === 0 ? C.ink4 : C.ink, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}
                    >−</button>
                    <span style={{ fontFamily: serif, fontSize: 20, color: C.ink, minWidth: 22, textAlign: 'center' as const }}>{val >= 9 ? '9+' : val}</span>
                    <button
                      onClick={() => step(key, 1)}
                      style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: C.forest, color: C.paper, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}
                    >+</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pets pills */}
        <div style={{ marginBottom: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.ink3, marginBottom: 10 }}>Pets</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
            {[
              { val: 'None',      label: 'No pets' },
              { val: 'Dog',       label: 'Dog' },
              { val: 'Cat',       label: 'Cat' },
              { val: 'Dog & Cat', label: 'Both' },
              { val: 'Others',    label: 'Other' },
            ].map(({ val, label }) => {
              const active = form.pets === val
              return (
                <button
                  key={val}
                  onClick={() => setForm(f => ({ ...f, pets: val }))}
                  style={{ padding: '8px 16px', borderRadius: 50, border: `1.5px solid ${active ? C.forest : C.line}`, background: active ? C.forestSoft : C.paper, color: active ? C.forestDeep : C.ink2, fontFamily: sans, fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer' }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ height: 1, background: C.line, margin: '32px 0' }} />

        {/* ──────────── SECTION 3: SCOPE OF WORK ──────────── */}
        <SectionHeader eyebrow="SCOPE OF WORK" pre="What she'll " italic="handle" post="." />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {SCOPE_ITEMS.map(({ label, icon }) => {
            const active = form.scope.includes(label)
            return (
              <button
                key={label}
                onClick={() => toggleScope(label)}
                style={{
                  display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-start',
                  padding: '13px 13px', borderRadius: 14, cursor: 'pointer', textAlign: 'left' as const,
                  border: `1.5px solid ${active ? C.forest : C.line}`,
                  background: active ? C.forestSoft : C.paper,
                  transition: 'all .12s',
                }}
              >
                <span style={{ fontSize: 20, marginBottom: 6, lineHeight: 1 }}>{icon}</span>
                <span style={{ fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? C.forestDeep : C.ink2, lineHeight: 1.3, fontFamily: sans }}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>

        {/* ──────────── SECTION 4: TRANSPORT ──────────── */}
        {showTransportSection && (
          <>
            <div style={{ height: 1, background: C.line, margin: '32px 0' }} />
            <SectionHeader eyebrow="TRANSPORT" pre="Getting her " italic="here" post="." />

            {/* Inter-province amber notice */}
            <div style={{ background: C.amberSoft, border: `1.5px solid ${C.amberLine}`, borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: showMaidItOption ? 16 : 0 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>🚌</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.amberDeep, marginBottom: 4 }}>Inter-province transport needed</div>
                <div style={{ fontSize: 12, color: C.amberDeep, lineHeight: 1.55, opacity: 0.85 }}>
                  {showMaidItOption
                    ? "This kasambahay is coming from far away. Choose how you’d like to handle travel."
                    : 'This kasambahay is from another province. You will need to arrange transport directly.'}
                </div>
              </div>
            </div>

            {/* Different province, NOT Leyte/Samar/Bicol — direct sub-options only */}
            {!showMaidItOption && (
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginTop: 12 }}>
                {([
                  { value: 'homeowner_pays', label: 'I will pay for transport', sub: 'Kasambahay provides fare estimate on review' },
                  { value: 'reimburse',      label: 'Kasambahay pays first, I reimburse on arrival' },
                  { value: 'kasambahay_pays', label: 'Kasambahay pays her own fare' },
                ] as const).map(opt => {
                  const active = transportDirectType === opt.value
                  return (
                    <div
                      key={opt.value}
                      onClick={() => setTransportDirectType(opt.value)}
                      style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 13, cursor: 'pointer', border: `1.5px solid ${active ? C.forest : C.line}`, background: active ? C.forestSoft : C.paper }}
                    >
                      <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 2, border: active ? `5px solid ${C.forest}` : `2px solid ${C.ink4}`, background: C.paper }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, lineHeight: 1.4 }}>{opt.label}</div>
                        {'sub' in opt && <div style={{ fontSize: 11, color: C.ink3, marginTop: 2, lineHeight: 1.4 }}>{opt.sub}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Leyte/Samar/Bicol — Direct and MaidIt two cards */}
            {showMaidItOption && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'flex-start' }}>
                {/* Direct card */}
                <div
                  onClick={() => setForm(f => ({ ...f, transport_arrangement: 'direct' }))}
                  style={{ padding: 14, borderRadius: 14, cursor: 'pointer', border: `${isDirect ? 2 : 1.5}px solid ${isDirect ? C.forest : C.line}`, background: isDirect ? C.forestSoft : C.paper }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Direct</div>
                  <div style={{ fontSize: 12, color: C.ink2, lineHeight: 1.5, marginBottom: 8 }}>You coordinate with the kasambahay directly.</div>
                  <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, color: C.forestDeep }}>Free</div>
                  {isDirect && (
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6, marginTop: 12 }}>
                      {([
                        { value: 'homeowner_pays',   label: 'I will pay for transport', sub: 'Kasambahay provides fare estimate on review' },
                        { value: 'reimburse',        label: 'She pays first, I reimburse on arrival' },
                        { value: 'kasambahay_pays',  label: 'Kasambahay pays her own fare' },
                      ] as const).map(opt => {
                        const a = transportDirectType === opt.value
                        return (
                          <div key={opt.value} onClick={e => { e.stopPropagation(); setTransportDirectType(opt.value) }}
                            style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${a ? C.forest : C.line}`, background: a ? '#f0fdf4' : C.paper }}>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: 2, border: a ? `4px solid ${C.forest}` : `2px solid ${C.ink4}`, background: C.paper }} />
                            <div>
                              <div style={{ fontSize: 11.5, fontWeight: 600, color: C.ink, lineHeight: 1.4 }}>{opt.label}</div>
                              {'sub' in opt && <div style={{ fontSize: 10.5, color: C.ink3, marginTop: 2, lineHeight: 1.4 }}>{opt.sub}</div>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* OR */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 20 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink3 }}>or</span>
                </div>

                {/* MaidIt Assisted */}
                <div
                  onClick={() => setForm(f => ({ ...f, transport_arrangement: 'maidit_transport' }))}
                  style={{ padding: 14, borderRadius: 14, cursor: 'pointer', border: `${isMaidIt ? 2 : 1.5}px solid ${isMaidIt ? C.amber : C.line}`, background: isMaidIt ? C.amberSoft : C.paper }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4 }}>MaidIt Assisted Transport — ₱5,000</div>
                  <div style={{ fontSize: 12, color: C.ink2, lineHeight: 1.5 }}>We coordinate and guarantee arrival.</div>
                </div>
              </div>
            )}
            {isMaidIt && (
              <div style={{ background: '#fbf3e2', border: '1px solid #e8d4a0', borderRadius: 10, padding: '10px 12px', marginTop: 12, fontSize: 11, color: '#92400e', lineHeight: 1.7 }}>
                <div>Transport arrangement: ₱3,500</div>
                <div>Kasambahay travel allowance: ₱1,000</div>
                <div>MaidIt assistance fee: ₱500</div>
                <div style={{ marginTop: 8 }}>
                  Important: The ₱3,500 transport cost and ₱1,000 travel allowance are released only after MaidIt confirms the kasambahay is boarding the bus. If she does not board, the full ₱5,000 is refunded to you. The ₱500 MaidIt assistance fee is non-refundable once transport is arranged.
                </div>
                <div style={{ marginTop: 8 }}>
                  If the kasambahay leaves your home within 6 months without justifiable reason, you may recover the ₱4,000 directly from her pursuant to RA 10361. MaidIt is not involved in this recovery.
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── STICKY ACTION BAR ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.paper, borderTop: `1px solid ${C.line}`, padding: '12px 18px 20px', zIndex: 60 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: C.ink3 }}>
            <span style={{ fontWeight: 700, color: completedSections === totalSections ? C.forest : C.ink }}>{completedSections}</span>
            <span> / {totalSections} sections complete</span>
          </span>
          {salaryNum > 0 && (
            <span style={{ fontFamily: serif, fontSize: 16, color: C.ink, letterSpacing: '-0.01em' }}>
              ₱{salaryNum.toLocaleString()}<span style={{ fontSize: 12, fontWeight: 400, color: C.ink3 }}>/mo</span>
            </span>
          )}
        </div>
        <button
          onClick={handleSendOffer}
          disabled={submitting || transportBlocked}
          style={{ width: '100%', height: 52, borderRadius: 14, border: 'none', background: submitting || transportBlocked ? C.ink4 : C.forest, color: C.paper, fontFamily: sans, fontSize: 15, fontWeight: 600, cursor: submitting || transportBlocked ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, letterSpacing: '-0.005em', transition: 'background .15s' }}
        >
          {submitting ? 'Sending…' : <>Send Offer <IcArrowRight size={15} /></>}
        </button>
      </div>

      {/* ── PAYWALL MODAL ── */}
      {showPaywall && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 }}>
          <div style={{ background: C.paper, borderRadius: 20, padding: '24px 20px', maxWidth: 340, width: '100%' }}>
            <div style={{ fontFamily: serif, fontSize: 22, color: C.ink, marginBottom: 8, letterSpacing: '-0.015em' }}>Subscribe to Send Offers</div>
            <div style={{ fontSize: 13, color: C.ink2, marginBottom: 20, lineHeight: 1.6 }}>
              A ₱499/month subscription gives you platform access and a ₱499 credit toward your first hire fee.
            </div>
            <button
              style={{ width: '100%', height: 48, borderRadius: 13, border: 'none', background: C.forest, color: C.paper, fontFamily: sans, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 10, opacity: subscribeLoading ? 0.6 : 1 }}
              disabled={subscribeLoading}
              onClick={async () => {
                setSubscribeLoading(true)
                try {
                  const res = await fetch('/api/create-payment-link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: 49900, description: 'MaidIt Subscription - ₱499', homeowner_id: hwId, type: 'subscription' }),
                  })
                  const data = await res.json()
                  if (data.checkout_url) { window.location.href = data.checkout_url }
                  else setSubscribeLoading(false)
                } catch { setSubscribeLoading(false) }
              }}
            >
              {subscribeLoading ? 'Preparing payment...' : 'Subscribe for ₱499 →'}
            </button>
            <button
              style={{ width: '100%', padding: '12px', borderRadius: 13, border: `1.5px solid ${C.line}`, background: 'transparent', color: C.ink3, fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              onClick={() => router.push('/browse')}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
