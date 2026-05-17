'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const STORAGE = 'https://xlagwtsrjbylhxfozoem.supabase.co/storage/v1/object/public/Selfies'
const METRO = ['Quezon City','Makati','Pasig','Taguig','Manila','Mandaluyong','Marikina','Muntinlupa','Las Piñas','Parañaque','Valenzuela','Caloocan','Malabon','Navotas','Pateros','San Juan']
const TRANSPORT_PROVINCES = [
  'Leyte', 'Southern Leyte', 'Samar', 'Eastern Samar', 'Northern Samar', 'Western Samar',
  'Camarines Norte', 'Camarines Sur', 'Albay', 'Sorsogon', 'Catanduanes', 'Masbate',
]

const SKILL_LABELS: Record<string, string> = {
  'Pagluluto': 'Cooking',
  'Paglalaba': 'Laundry',
  'Paglilinis': 'Cleaning',
  'Pag-aalaga ng Bata': 'Childcare',
  'Pag-aalaga ng Matanda': 'Elder Care',
  'Pag-aalaga ng Alagang Hayop': 'Pet Care',
  'Pamimili': 'Grocery/Errands',
  'Pagmamaneho': 'Driving',
  'All-Around Maid (Lahat ng gawaing bahay)': 'All-Around Maid',
  'All-around Maid': 'All-Around Maid',
}
const displaySkill = (s: string) => SKILL_LABELS[s] || s

const C = {
  forest: '#27500A', forestDeep: '#1c3b07', forestSoft: '#f0f5ec', forestLine: '#e2ecdb',
  amber: '#c9943a', amberSoft: '#fbf3e2', amberLine: '#efe1bf', amberDeep: '#8a6418',
  ink: '#1a1d18', ink2: '#4a504a', ink3: '#8a8f88', ink4: '#b8bcb5',
  paper: '#ffffff', paper2: '#faf9f5', line: '#ebe9e2',
}

const serif = "'Instrument Serif', Georgia, serif"
const sans = "'Geist', ui-sans-serif, sans-serif"

const IcSearch = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
  </svg>
)
const IcChevDown = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
)
const IcArrowRight = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
)
const IcCheck = ({ size = 12 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
)
const IcPin = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z" /><circle cx="12" cy="10" r="2.4" />
  </svg>
)
const IcBus = () => (
  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="3" width="16" height="14" rx="2.4" /><path d="M4 11h16M9 3v8M15 3v8" />
    <path d="M7 17v2M17 17v2" />
    <circle cx="8" cy="14" r="0.9" fill="currentColor" stroke="none"/><circle cx="16" cy="14" r="0.9" fill="currentColor" stroke="none"/>
  </svg>
)
const IcHeart = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill={filled ? '#d44848' : 'none'} stroke={filled ? '#d44848' : C.ink4} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s-7-4.5-9.5-9C0.5 8 3 4 6.5 4c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3C21 4 23.5 8 21.5 12 19 16.5 12 21 12 21z" />
  </svg>
)
const IcSparkle = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M12 2l1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8L12 2zM19 14l.8 2.5L22 17l-2.2.5L19 20l-.8-2.5L16 17l2.2-.5L19 14zM5 14l.8 2.5L8 17l-2.2.5L5 20l-.8-2.5L2 17l2.2-.5L5 14z" />
  </svg>
)
const IcLock = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" />
  </svg>
)
const IcShield = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IcCam = () => (
  <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 8h3l2-2h6l2 2h3v11H4z" /><circle cx="12" cy="13" r="3" />
  </svg>
)
const IcBell = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 16l-1-2V10a5 5 0 00-10 0v4l-1 2h12z" /><path d="M10 19a2 2 0 004 0" />
  </svg>
)
const IcMenu = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)
const IcOffers = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)
const IcPlus = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const offerStatusMap: Record<string, { label: string; bg: string; color: string }> = {
  pending:         { label: 'Awaiting kasambahay',   bg: '#fef3e2', color: C.amber },
  reviewed:        { label: 'Being reviewed',         bg: '#eff6ff', color: '#2563eb' },
  fare_pending:    { label: 'Fare estimate pending',  bg: '#fffbeb', color: '#92400e' },
  agreed:          { label: 'Agreed — Pay now',       bg: C.forestSoft, color: C.forest },
  payment_pending: { label: 'Processing payment',     bg: '#fffbeb', color: '#92400e' },
  paid:            { label: 'Hired',                  bg: C.forestSoft, color: C.forest },
  active:          { label: 'Hired',                  bg: C.forestSoft, color: C.forest },
  hired:           { label: 'Hired',                  bg: C.forestSoft, color: C.forest },
  countered:       { label: 'Counter offer',          bg: '#fef3e2', color: C.amber },
  declined:        { label: 'Declined',               bg: '#fef2f2', color: '#dc2626' },
}

export default function BrowsePage() {
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap'
    document.head.appendChild(link)
    return () => { try { document.head.removeChild(link) } catch {} }
  }, [])

  const router = useRouter()
  const [tab, setTab] = useState<'browse' | 'offers'>('browse')
  const [profiles, setProfiles] = useState<any[]>([])
  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [offersLoading, setOffersLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [filter, setFilter] = useState('Lahat')
  const [search, setSearch] = useState('')
  const [passed, setPassed] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})
  const [offersLoaded, setOffersLoaded] = useState(false)
  const [subscribeModalId, setSubscribeModalId] = useState<string | null>(null)
  const [subscribeLoading, setSubscribeLoading] = useState(false)
  const [homeownerProvince, setHomeownerProvince] = useState<string | null>(null)
  const [homeownerCity, setHomeownerCity] = useState<string | null>(null)
  const [lastOfferSetup, setLastOfferSetup] = useState<string | null>(null)
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null)
  const [homeownerDbId, setHomeownerDbId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'best' | 'newest' | 'salary-asc' | 'salary-desc'>('best')
  const [profileModalKb, setProfileModalKb] = useState<any>(null)

  const load = async () => {
    const { supabase } = await import('../../lib/supabase')
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user || null)
    if (user) {
      const { data: hw, error: hwError } = await supabase
        .from('homeowners')
        .select('id, subscription_expires_at, subscription_credit_used, preferred_setup')
        .eq('profile_id', user.id)
        .single()
      if (hwError) {
        setIsSubscribed(false)
      } else {
        setIsSubscribed(!!(hw?.subscription_expires_at && new Date(hw.subscription_expires_at) > new Date()))
        setLastOfferSetup(hw?.preferred_setup || null)
        setHomeownerDbId(hw?.id || null)
      }
      const { data: prof } = await supabase
        .from('profiles')
        .select('city')
        .eq('id', user.id)
        .single()
      setHomeownerCity(prof?.city || null)
      setHomeownerProvince(prof?.city || null)
    }
    const { data } = await supabase
      .from('kasambahay')
      .select(`
        id, profile_id, asking_salary, setup, skills, experience,
        province, available_from, selfie_url, status, availability,
        has_govt_id, has_nbi, age, facebook_url, civil_status, num_children,
        profile:profile_id (
          full_name, selfie_url, city
        )
      `)
      .limit(20)
    setProfiles(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const loadOffers = async () => {
    if (offersLoaded) return
    setOffersLoading(true)
    const { supabase } = await import('../../lib/supabase')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: hw } = await supabase.from('homeowners').select('id').eq('profile_id', user.id).single()
    if (hw) {
      const { data } = await supabase
        .from('offers')
        .select('*, kasambahay:kasambahay_id(*, profiles(full_name, mobile))')
        .eq('homeowner_id', hw.id)
        .order('created_at', { ascending: false })
      setOffers(data || [])
    }
    setOffersLoaded(true)
    setOffersLoading(false)
  }

  const handleSubscribe = async () => {
    setSubscribeLoading(true)
    try {
      const res = await fetch('/api/create-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 49900,
          description: 'MaidIt Subscription - ₱499',
          homeowner_id: homeownerDbId,
          type: 'subscription',
        }),
      })
      const data = await res.json()
      if (data.checkout_url) window.location.href = data.checkout_url
      else setSubscribeLoading(false)
    } catch {
      setSubscribeLoading(false)
    }
  }

  const isProvince = (province: string) => !!(province && !METRO.includes(province))

  const showTransport = (kbProvince: string) => {
    if (!kbProvince) return false
    if (homeownerProvince) return kbProvince !== homeownerProvince
    return TRANSPORT_PROVINCES.includes(kbProvince)
  }

  const filtered = profiles.filter(p => {
    if (!p.profile) return false
    if (passed[p.id]) return false
    if (search) {
      const q = search.toLowerCase()
      const name = (p.profile?.full_name || '').toLowerCase()
      const city = (p.profile?.city || p.province || '').toLowerCase()
      const province = (p.province || '').toLowerCase()
      const skillStr = (p.skills || []).join(' ').toLowerCase()
      if (!name.includes(q) && !city.includes(q) && !province.includes(q) && !skillStr.includes(q)) return false
    }
    if (filter === 'Lahat' || filter === 'More') return true
    if (filter === 'Stay-in') return p.setup === 'Stay-in'
    if (filter === 'Stay-out') return p.setup === 'Stay-out'
    if (filter === 'Nearby') {
      if (!currentUser || !homeownerProvince) return false
      return (p.province || '').toLowerCase() === homeownerProvince.toLowerCase()
    }
    return true
  })

  const scoreCard = (kb: any): number => {
    const selfieUrl = kb.profile?.selfie_url || (kb.profile_id ? `${STORAGE}/${kb.profile_id}/selfie.png` : null)
    const hasSelfie = !!selfieUrl
    const hasGovtId = !!kb.govt_id
    const hasSkills = !!(kb.skills && kb.skills.length > 0)
    const avail = (kb.availability || '').toLowerCase()
    const isImmediate = avail === 'immediate' || avail === 'asap'
    if (currentUser) {
      let score = 0
      const kbCity = (kb.profile?.city || kb.province || '').toLowerCase()
      const kbProvince = (kb.province || '').toLowerCase()
      if (homeownerCity && kbCity && kbCity === homeownerCity.toLowerCase()) score += 3
      if (homeownerProvince && kbProvince && kbProvince === homeownerProvince.toLowerCase()) score += 2
      if (lastOfferSetup && kb.setup && kb.setup.toLowerCase() === lastOfferSetup.toLowerCase()) score += 2
      if (hasSelfie) score += 1
      if (hasGovtId) score += 1
      if (hasSkills) score += 1
      if (isImmediate) score += 1
      return score
    } else {
      let score = 0
      if (hasSelfie) score += 2
      if (hasGovtId) score += 2
      if (hasSkills) score += 1
      return score
    }
  }

  const filteredAndSorted = [...filtered].sort((a, b) => {
    if (sortBy === 'best') {
      const diff = scoreCard(b) - scoreCard(a)
      if (diff !== 0) return diff
      return (b.asking_salary || 0) - (a.asking_salary || 0)
    }
    if (sortBy === 'newest') return (b.asking_salary || 0) - (a.asking_salary || 0)
    if (sortBy === 'salary-asc') return (a.asking_salary || 0) - (b.asking_salary || 0)
    if (sortBy === 'salary-desc') return (b.asking_salary || 0) - (a.asking_salary || 0)
    return 0
  })

  const renderKBCard = (kb: any) => {
    const fullName = kb.profile?.full_name || ''
    const firstName = fullName.split(' ')[0] || ''
    const lastInit = fullName.split(' ')[1]?.[0]
    const displayName = lastInit ? `${firstName} ${lastInit}.` : firstName
    const initials = fullName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?'
    const skills: string[] = kb.skills || []
    const visibleSkills = skills.slice(0, 3)
    const extraSkills = skills.length - 3
    const selfieUrl = kb.profile?.selfie_url || (kb.profile_id ? `${STORAGE}/${kb.profile_id}/selfie.png` : null)
    const showPhoto = !!(selfieUrl && !imgErrors[kb.id])
    const availLabel = kb.availability || null
    const expRaw = kb.experience
    const expYears = (!expRaw || expRaw === 'Baguhan' || expRaw === 0 || expRaw === '0') ? null
      : typeof expRaw === 'number' ? expRaw : parseInt(expRaw) || null
    const expDisplay = (!expRaw || expRaw === 'Baguhan' || expRaw === '0' || expRaw === 0)
      ? 'No experience yet'
      : `${expRaw} exp`
    const nc = kb.num_children
    const familyLine = [
      kb.civil_status || null,
      nc === 0 ? 'No children' : nc === 1 ? '1 child' : nc > 1 ? `${nc} children` : null,
    ].filter(Boolean).join(' · ')
    const infoLine = [expDisplay, familyLine || null].filter(Boolean).join(' · ')
    const kbProvince = kb.province || ''
    const location = kbProvince || 'Province not set'
    const isNearby = !!(homeownerProvince && kbProvince && kbProvince.toLowerCase() === homeownerProvince.toLowerCase())
    const hasTransport = showTransport(kbProvince)
    const isAvailNow = availLabel?.toLowerCase() === 'immediate' || availLabel?.toLowerCase() === 'asap'

    const handleSendOffer = () => {
      if (!currentUser) router.push('/signup/homeowner')
      else if (isSubscribed) router.push(`/offer/send/${kb.id}`)
      else setSubscribeModalId(kb.id)
    }
    const handleSeeProfile = () => {
      if (!currentUser) router.push('/signup/homeowner')
      else if (isSubscribed) setProfileModalKb(kb)
      else setSubscribeModalId(kb.id)
    }

    return (
      <div key={kb.id} style={{
        position: 'relative', background: C.paper, border: `1px solid ${C.line}`,
        borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 1px 0 rgba(0,0,0,0.02), 0 10px 26px -18px rgba(28,59,7,0.18)',
        marginBottom: 12,
      }}>
        {/* upper zone */}
        <div style={{ display: 'flex', gap: 14, padding: '16px 16px 14px' }}>
          {/* portrait column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'center', flexShrink: 0 }}>
            {/* portrait */}
            <div style={{ width: 100, height: 140, borderRadius: 14, overflow: 'hidden', position: 'relative', background: 'linear-gradient(155deg, #fde8c0 0%, #e8c47a 100%)', flexShrink: 0 }}>
              {showPhoto ? (
                <img
                  src={selfieUrl!}
                  alt={displayName}
                  onError={() => setImgErrors(prev => ({ ...prev, [kb.id]: true }))}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: serif, fontSize: 36, color: '#fff', lineHeight: 1 }}>{initials}</span>
                </div>
              )}
              {selfieUrl && (
                <div style={{
                  position: 'absolute', bottom: 7, right: 7,
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(27,59,7,0.88)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff',
                }}>
                  <IcCam />
                </div>
              )}
            </div>
            {/* verified chip */}
            {selfieUrl && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 8px 3px 6px',
                background: C.forestSoft, border: `1px solid ${C.forestLine}`,
                borderRadius: 999, fontSize: 9.5, fontWeight: 600, color: C.forest,
                letterSpacing: '0.02em', textTransform: 'uppercase' as const,
                whiteSpace: 'nowrap' as const,
              }}>
                <IcCheck size={9} /> Selfie
              </div>
            )}
          </div>

          {/* content column */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
            {/* name + heart */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 600, color: C.ink, letterSpacing: '-0.012em', lineHeight: 1.2 }}>
                  {displayName}{kb.age ? <span style={{ color: C.ink3, fontWeight: 400 }}>, {kb.age}</span> : null}
                </div>
                <div style={{ fontSize: 12.5, color: C.ink2, marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 500 }}>Kasambahay{kb.setup ? ` · ${kb.setup}` : ''}</span>
                  {expYears !== null && (
                    <>
                      <span style={{ width: 3, height: 3, borderRadius: '50%', background: C.ink4, display: 'inline-block', flexShrink: 0 }} />
                      <span>{expYears} yr{expYears !== 1 ? 's' : ''}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSaved(prev => ({ ...prev, [kb.id]: !prev[kb.id] }))}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: saved[kb.id] ? '#fef2f2' : 'transparent',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  flex: '0 0 auto', border: 'none', cursor: 'pointer',
                }}
              >
                <IcHeart filled={!!saved[kb.id]} />
              </button>
            </div>

            {/* location row */}
            <div style={{
              display: 'flex', alignItems: 'center', flexWrap: 'wrap' as const, gap: 6,
              marginTop: 10, fontSize: 12, color: C.ink2,
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: C.forest }}><IcPin /></span>
                {location}
              </span>
              {isNearby && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '2px 7px', background: C.forestSoft, color: C.forest,
                  borderRadius: 999, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.02em',
                }}>
                  NEARBY
                </span>
              )}
              {hasTransport && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 8px 2px 6px', background: C.amberSoft, color: C.amberDeep,
                  borderRadius: 999, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.02em',
                }}>
                  <IcBus /> Open to relocate
                </span>
              )}
            </div>

            {/* skills */}
            {visibleSkills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5, marginTop: 10 }}>
                {visibleSkills.map((s: string) => (
                  <span key={s} style={{
                    padding: '3px 9px', background: C.paper2, border: `1px solid ${C.line}`,
                    borderRadius: 999, fontSize: 11, color: C.ink2, fontWeight: 500,
                  }}>{displaySkill(s)}</span>
                ))}
                {extraSkills > 0 && (
                  <span style={{ padding: '3px 8px', color: C.ink3, fontSize: 11, fontWeight: 500 }}>
                    +{extraSkills} more
                  </span>
                )}
              </div>
            )}

            {/* experience + family line */}
            <div style={{ marginTop: 8, fontSize: 11, color: C.ink3, lineHeight: 1.4 }}>
              {infoLine}
            </div>
          </div>
        </div>

        {/* lower tray */}
        <div style={{
          borderTop: `1px solid ${C.line}`,
          padding: '12px 16px 14px',
          background: 'linear-gradient(180deg, #fcfbf7 0%, #ffffff 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <span style={{ fontSize: 17, fontWeight: 600, color: C.ink, letterSpacing: '-0.01em' }}>
                ₱{kb.asking_salary?.toLocaleString() || '—'}
              </span>
              <span style={{ fontSize: 12, color: C.ink3, marginLeft: 3 }}>/mo</span>
            </div>
            {availLabel && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: C.ink2 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: isAvailNow ? '#3acc7f' : C.amber,
                  display: 'inline-block', flexShrink: 0,
                }} />
                {isAvailNow ? 'Available now' : availLabel.toLowerCase()}
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 8 }}>
            <button
              onClick={handleSeeProfile}
              style={{
                height: 42, borderRadius: 12, background: C.paper,
                border: `1px solid ${C.line}`, color: C.ink,
                fontSize: 13, fontWeight: 600, fontFamily: sans,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', letterSpacing: '-0.005em',
              }}
            >
              View Profile
            </button>
            <button
              onClick={handleSendOffer}
              style={{
                height: 42, borderRadius: 12, background: C.forest, color: C.paper,
                fontSize: 13, fontWeight: 600, fontFamily: sans,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                border: 'none', cursor: 'pointer', letterSpacing: '-0.005em',
                boxShadow: '0 4px 12px -6px rgba(39,80,10,0.5)',
              }}
            >
              Send Offer <IcArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sans, color: C.ink3 }}>
      Loading...
    </div>
  )

  const visibleCards = !currentUser ? filteredAndSorted.slice(0, 2) : filteredAndSorted
  const lockedCards  = !currentUser ? filteredAndSorted.slice(2) : []

  return (
    <div style={{ minHeight: '100vh', background: C.paper2, fontFamily: sans, paddingBottom: 80 }}>

      {/* ── NAVBAR ── */}
      <div style={{
        background: C.paper, padding: '12px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${C.line}`, position: 'sticky', top: 0, zIndex: 100,
      }}>
        <span style={{ fontFamily: serif, fontSize: '1.5rem', color: C.forestDeep, letterSpacing: '-0.5px', lineHeight: 1 }}>
          Maid<span style={{ color: C.amber }}>It</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: C.ink3 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink3, display: 'flex', padding: 0 }}>
            <IcBell />
          </button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink3, display: 'flex', padding: 0 }}>
            <IcMenu />
          </button>
        </div>
      </div>

      {tab === 'browse' && (
        <>
          {/* ── HEADER ── */}
          <div style={{ background: C.paper, padding: '20px 18px 0', borderBottom: `1px solid ${C.line}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
              <div>
                <h1 style={{ fontFamily: serif, fontSize: 30, color: C.forestDeep, margin: 0, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                  Browse kasambahay.
                </h1>
                <p style={{ fontSize: 13, color: C.ink3, margin: '4px 0 0', lineHeight: 1.4 }}>
                  Verified profiles. Selfie required for everyone's safety.
                </p>
              </div>
              <div style={{
                background: C.forestSoft, border: `1px solid ${C.forestLine}`,
                borderRadius: 50, padding: '4px 10px',
                display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, marginTop: 3,
              }}>
                <span style={{ color: C.forest, display: 'flex' }}><IcShield /></span>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.forest, whiteSpace: 'nowrap' as const }}>Safe hiring</span>
              </div>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', margin: '14px 0 14px' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.ink3, display: 'flex' }}>
                <IcSearch />
              </span>
              <input
                type="text"
                placeholder="Search by role, skills, or location"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '11px 14px 11px 44px', borderRadius: 14,
                  border: `1px solid ${C.line}`, background: C.paper2,
                  fontSize: 14, fontFamily: sans, color: C.ink, outline: 'none',
                  boxSizing: 'border-box' as const,
                }}
              />
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto' as const, paddingBottom: 14, scrollbarWidth: 'none' as const }}>
              {([
                { id: 'Lahat',    label: 'All Matches' },
                { id: 'Stay-in',  label: 'Stay-in' },
                { id: 'Stay-out', label: 'Stay-out' },
                { id: 'Nearby',   label: 'Nearby', disabled: !currentUser },
              ] as const).map(({ id, label, disabled }: any) => {
                const active = filter === id
                return (
                  <button
                    key={id}
                    disabled={disabled}
                    onClick={() => { if (!disabled) setFilter(id) }}
                    style={{
                      display: 'flex', alignItems: 'center', padding: '7px 14px',
                      borderRadius: 50, border: `1.5px solid ${active ? C.forest : C.line}`,
                      background: active ? C.forest : C.paper,
                      color: active ? C.paper : (disabled ? C.ink4 : C.ink2),
                      fontFamily: sans, fontSize: 12.5, fontWeight: active ? 600 : 500,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap' as const, flexShrink: 0, opacity: disabled ? 0.5 : 1,
                    }}
                  >
                    {label}
                  </button>
                )
              })}
              <button
                onClick={() => {}}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px',
                  borderRadius: 50, border: `1.5px solid ${C.line}`, background: C.paper,
                  color: C.ink2, fontFamily: sans, fontSize: 12.5, fontWeight: 500,
                  cursor: 'pointer', whiteSpace: 'nowrap' as const, flexShrink: 0,
                }}
              >
                Filters <IcChevDown />
              </button>
            </div>
          </div>

          {/* ── SUBSCRIPTION BANNER — unsubscribed ── */}
          {currentUser && isSubscribed === false && (
            <div style={{
              margin: '14px 18px 0',
              background: 'linear-gradient(180deg, #fbf3e2 0%, #f5e6c2 100%)',
              border: `1px solid ${C.amberLine}`, borderRadius: 18,
              padding: '16px 18px', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 14, right: 18, color: C.amber, opacity: 0.45 }}>
                <IcSparkle size={14} />
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '3px 9px 3px 7px', background: C.paper,
                color: C.amberDeep, border: `1px solid ${C.amberLine}`,
                borderRadius: 999, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
                marginBottom: 10, textTransform: 'uppercase' as const,
              }}>
                <IcLock /> Unlock More
              </div>
              <div style={{ fontFamily: serif, fontSize: 22, lineHeight: 1.15, color: C.forestDeep, letterSpacing: '-0.015em' }}>
                Reach <em style={{ color: C.amber }}>every</em> kasambahay on MaidIt.
              </div>
              <div style={{ fontSize: 12.5, color: C.amberDeep, opacity: 0.85, marginTop: 6, lineHeight: 1.4 }}>
                Send 10 job offers · 1 post — ₱499/month, cancel anytime.
              </div>
              <button
                onClick={handleSubscribe}
                disabled={subscribeLoading}
                style={{
                  marginTop: 14, width: '100%', height: 46, borderRadius: 13,
                  background: C.amberDeep, color: C.paper, fontFamily: sans,
                  fontSize: 14, fontWeight: 600, letterSpacing: '-0.005em', border: 'none',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  cursor: 'pointer', opacity: subscribeLoading ? 0.6 : 1,
                }}
              >
                {subscribeLoading ? 'Preparing...' : 'Subscribe'} <IcArrowRight />
              </button>
            </div>
          )}

          {/* ── CREDITS BANNER — subscribed ── */}
          {currentUser && isSubscribed && (
            <div style={{
              margin: '14px 18px 0',
              background: `linear-gradient(135deg, ${C.forestSoft} 0%, #e5eede 100%)`,
              border: `1px solid ${C.forestLine}`, borderRadius: 16,
              padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 11, background: C.paper,
                color: C.forest, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${C.forestLine}`, flexShrink: 0,
              }}>
                <IcSparkle />
              </div>
              <div style={{ flex: 1, fontSize: 12.5, color: C.ink2, lineHeight: 1.4 }}>
                <div style={{ fontWeight: 600, color: C.forestDeep, fontSize: 13 }}>
                  {filteredAndSorted.length} matches near you
                </div>
                {homeownerCity
                  ? `Ranked for your location in ${homeownerCity}`
                  : 'Complete your profile for better matches'}
              </div>
            </div>
          )}

          {/* ── SORT ROW ── */}
          <div style={{ padding: '10px 18px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12.5, color: C.ink2 }}>
              <span style={{ color: C.ink, fontWeight: 600 }}>{filteredAndSorted.length}</span> matches
            </div>
            <button
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: C.ink2, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                style={{ background: 'none', border: 'none', fontFamily: sans, fontSize: 12.5, fontWeight: 500, color: C.ink2, cursor: 'pointer', padding: 0, outline: 'none' }}
              >
                <option value="best">Best Match</option>
                <option value="newest">Newest</option>
                <option value="salary-asc">Salary: Low → High</option>
                <option value="salary-desc">Salary: High → Low</option>
              </select>
              <IcChevDown />
            </button>
          </div>

          {/* ── CARDS ── */}
          <div style={{ padding: '14px 18px 6px' }}>
            {filteredAndSorted.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: C.ink3, fontSize: 14 }}>
                No matches found.
              </div>
            )}

            {/* Visible cards */}
            {visibleCards.map(renderKBCard)}

            {/* Logged-out: blurred remainder + unlock wall */}
            {lockedCards.length > 0 && (
              <div style={{ position: 'relative' }}>
                <div style={{ filter: 'blur(3.5px)', pointerEvents: 'none', userSelect: 'none' as const }}>
                  {lockedCards.slice(0, 2).map(renderKBCard)}
                </div>
                <div style={{
                  position: 'absolute', left: 0, right: 0, bottom: -1, height: 160,
                  background: 'linear-gradient(180deg, rgba(250,249,245,0) 0%, #faf9f5 70%)',
                  pointerEvents: 'none',
                }} />
                <div style={{ marginTop: -130, position: 'relative', zIndex: 2 }}>
                  {/* Unlock wall */}
                  <div style={{
                    borderRadius: 22, overflow: 'hidden', border: `1px solid ${C.forestLine}`,
                    background: 'linear-gradient(170deg, #f0f5ec 0%, #fbf3e2 100%)',
                    padding: '26px 22px 22px', position: 'relative',
                  }}>
                    <div style={{ position: 'absolute', top: 18, right: 22, color: C.amber, opacity: 0.6 }}>
                      <IcSparkle size={16} />
                    </div>
                    <div style={{ position: 'absolute', top: 52, right: 50, color: C.amber, opacity: 0.4 }}>
                      <IcSparkle size={10} />
                    </div>

                    {/* mini avatar cluster */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                      <div style={{ display: 'flex' }}>
                        {lockedCards.slice(0, 3).map((kb: any, i: number) => {
                          const fn = kb.profile?.full_name || ''
                          const ini = fn.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?'
                          return (
                            <div key={kb.id} style={{ marginLeft: i === 0 ? 0 : -14, zIndex: 5 - i }}>
                              <div style={{
                                width: 46, height: 46, borderRadius: '50%',
                                border: '2.5px solid #fbf3e2',
                                background: 'linear-gradient(155deg, #fde8c0 0%, #c9943a 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontFamily: serif, fontSize: 18,
                              }}>{ini}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <h2 style={{
                      margin: 0, fontFamily: serif, fontSize: 26, lineHeight: 1.15,
                      color: C.forestDeep, textAlign: 'center', letterSpacing: '-0.02em',
                    }}>
                      See <em style={{ color: C.amber }}>every</em> kasambahay.
                    </h2>
                    <p style={{
                      margin: '8px auto 18px', maxWidth: 280, textAlign: 'center',
                      fontSize: 13.5, lineHeight: 1.45, color: C.ink2,
                    }}>
                      Create a free account to unlock full profiles, save favorites, and send offers.
                    </p>

                    <button
                      onClick={() => router.push('/signup/homeowner')}
                      style={{
                        width: '100%', height: 48, borderRadius: 14,
                        background: C.forest, color: C.paper, fontFamily: sans,
                        fontSize: 14.5, fontWeight: 600, letterSpacing: '-0.005em', border: 'none',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        cursor: 'pointer', boxShadow: '0 4px 14px -6px rgba(39,80,10,0.55)',
                      }}
                    >
                      Create Free Account <IcArrowRight />
                    </button>
                    <div style={{ marginTop: 10, textAlign: 'center', fontSize: 12.5, color: C.ink3 }}>
                      Already have one?{' '}
                      <span
                        onClick={() => router.push('/login')}
                        style={{ color: C.forest, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Sign in
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Subscribed footer */}
            {currentUser && isSubscribed && (
              <div style={{
                margin: '10px 0 18px', padding: '14px 16px',
                border: `1px dashed ${C.forestLine}`, borderRadius: 16, background: C.forestSoft,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 11, background: C.paper, color: C.forest,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.forestLine}`,
                }}>
                  <IcSparkle />
                </div>
                <div style={{ flex: 1, fontSize: 12.5, color: C.ink2, lineHeight: 1.4 }}>
                  <div style={{ fontWeight: 600, color: C.forestDeep, fontSize: 13 }}>New helpers join every day</div>
                  We'll notify you when fresh matches arrive.
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── OFFERS TAB ── */}
      {tab === 'offers' && (
        <div style={{ padding: '16px 16px 32px', maxWidth: 900, margin: '0 auto', width: '100%', boxSizing: 'border-box' as const }}>
          <div style={{ fontFamily: serif, fontSize: '1.2rem', marginBottom: '2px', color: C.ink }}>My Offers</div>
          <div style={{ fontSize: '.72rem', color: C.ink3, marginBottom: '14px' }}>{offers.length} offer{offers.length !== 1 ? 's' : ''} sent</div>
          {offersLoading && <div style={{ textAlign: 'center', padding: '40px', color: C.ink3 }}>Loading...</div>}
          {!offersLoading && offers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</div>
              <div style={{ color: C.ink3, fontSize: '.84rem', lineHeight: 1.7 }}>You haven't sent any offers yet.</div>
              <button onClick={() => setTab('browse')} style={{ marginTop: '16px', padding: '10px 20px', borderRadius: '10px', background: C.forest, color: C.paper, border: 'none', fontFamily: sans, fontSize: '.84rem', fontWeight: 700, cursor: 'pointer' }}>Browse Kasambahay</button>
            </div>
          )}
          {offers.map((offer: any) => {
            const st = offerStatusMap[offer.status] || { label: offer.status, bg: '#f3f4f6', color: C.ink3 }
            const kbName = offer.kasambahay?.profiles?.full_name || 'Kasambahay'
            const isHired = ['paid','active','hired'].includes(offer.status)
            const needsPayment = offer.status === 'agreed'
            return (
              <div key={offer.id} style={{ background: C.paper, borderRadius: '13px', border: `1px solid ${C.line}`, overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ padding: '13px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>{kbName}</div>
                      <div style={{ fontSize: '11px', color: C.ink3 }}>{new Date(offer.created_at).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' })}</div>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '50px', background: st.bg, color: st.color, whiteSpace: 'nowrap' as const }}>{st.label}</span>
                  </div>
                  <div style={{ background: C.paper2, borderRadius: '10px', padding: '10px 12px', marginBottom: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div><div style={{ fontSize: '10px', color: C.ink3, marginBottom: '2px' }}>Salary</div><div style={{ fontFamily: serif, fontSize: '16px', fontWeight: 900, color: C.forest }}>₱{offer.salary?.toLocaleString()}<span style={{ fontSize: '10px', fontWeight: 400, color: C.ink3 }}>/mo</span></div></div>
                      <div><div style={{ fontSize: '10px', color: C.ink3, marginBottom: '2px' }}>Location</div><div style={{ fontSize: '13px', fontWeight: 700 }}>{offer.city || '—'}</div></div>
                      <div><div style={{ fontSize: '10px', color: C.ink3, marginBottom: '2px' }}>Setup</div><div style={{ fontSize: '13px', fontWeight: 700 }}>{offer.setup || '—'}</div></div>
                      <div><div style={{ fontSize: '10px', color: C.ink3, marginBottom: '2px' }}>Scope</div><div style={{ fontSize: '12px', fontWeight: 600, lineHeight: 1.4 }}>{offer.scope?.join(', ') || '—'}</div></div>
                    </div>
                  </div>
                  {offer.fare_estimate && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '9px', padding: '9px 12px', fontSize: '12px', color: '#92400e', marginBottom: '10px' }}>
                      Kasambahay fare estimate: <strong>₱{offer.fare_estimate?.toLocaleString()}</strong>
                    </div>
                  )}
                  {needsPayment && (
                    <button style={{ width: '100%', padding: '11px', borderRadius: '10px', background: C.forest, color: C.paper, border: 'none', fontFamily: sans, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => router.push(`/pay/${offer.id}`)}>
                      Proceed to Hire →
                    </button>
                  )}
                  {isHired && (
                    <div style={{ background: C.forestSoft, border: `1px solid ${C.forestLine}`, borderRadius: '9px', padding: '9px 12px', fontSize: '12px', color: C.forest, fontWeight: 600, textAlign: 'center' as const }}>
                      Hired! Awaiting kasambahay arrival.
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── FULL PROFILE MODAL ── */}
      {profileModalKb && (() => {
        const kb = profileModalKb
        const fullName = kb.profile?.full_name || ''
        const initials = fullName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?'
        const selfieUrl = kb.profile?.selfie_url || (kb.profile_id ? `${STORAGE}/${kb.profile_id}/selfie.png` : null)
        const skills: string[] = kb.skills || []
        const numKids = kb.num_children
        const childrenLabel = (!numKids || numKids === '0' || numKids === 0)
          ? 'No children' : `${numKids} ${parseInt(String(numKids)) === 1 ? 'child' : 'children'}`
        const expRaw = kb.experience
        const expLabel = (!expRaw || expRaw === 'Baguhan' || expRaw === 0 || expRaw === '0')
          ? 'No experience yet'
          : typeof expRaw === 'number' ? `${expRaw} year${expRaw !== 1 ? 's' : ''} experience`
          : `${expRaw} experience`
        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
            onClick={e => { if (e.target === e.currentTarget) setProfileModalKb(null) }}
          >
            <div style={{
              background: C.paper, borderRadius: '22px 22px 0 0', width: '100%', maxWidth: 480,
              maxHeight: '88vh', overflowY: 'auto', position: 'relative',
              boxShadow: '0 -20px 50px -10px rgba(28,59,7,0.32)',
            }}>
              {/* drag handle */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: C.line }} />
              </div>

              {/* close */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 16px 0' }}>
                <button onClick={() => setProfileModalKb(null)} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: C.ink3, padding: '4px 6px', lineHeight: 1 }}>✕</button>
              </div>

              {/* avatar + name */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '8px 20px 18px' }}>
                <div style={{ width: 96, height: 96, borderRadius: '50%', overflow: 'hidden', border: `3px solid ${C.forestLine}`, marginBottom: 14 }}>
                  {selfieUrl && !imgErrors[kb.id] ? (
                    <img
                      src={selfieUrl}
                      alt={fullName}
                      onError={() => setImgErrors(prev => ({ ...prev, [kb.id]: true }))}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' as const }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(155deg, #fde8c0 0%, #e8c47a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: serif, fontSize: 30, color: '#fff' }}>{initials}</span>
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: serif, fontSize: 22, color: C.ink, letterSpacing: '-0.015em', marginBottom: 4 }}>{fullName}</div>
                <div style={{ fontSize: 13, color: C.ink3, marginBottom: 12 }}>
                  {kb.age ? `${kb.age} y/o · ` : ''}{kb.province || 'Province not specified'}
                </div>
                {/* badges */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
                  {kb.has_govt_id && (
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 50, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>🛡️ ID Verified</span>
                  )}
                  {kb.has_nbi && (
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 50, background: C.forestSoft, color: C.forest, border: `1px solid ${C.forestLine}` }}>✅ NBI Cleared</span>
                  )}
                  {selfieUrl && (
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 50, background: C.forestSoft, color: C.forest, border: `1px solid ${C.forestLine}` }}>
                      <IcCheck size={9} /> Selfie Verified
                    </span>
                  )}
                </div>
              </div>

              {/* details */}
              <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ background: C.paper2, borderRadius: 12, padding: '11px 12px' }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: C.ink3, marginBottom: 4 }}>Setup</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{kb.setup || '—'}</div>
                  </div>
                  <div style={{ background: C.paper2, borderRadius: 12, padding: '11px 12px' }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: C.ink3, marginBottom: 4 }}>Experience</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{expLabel}</div>
                  </div>
                  {kb.civil_status && (
                    <div style={{ background: C.paper2, borderRadius: 12, padding: '11px 12px' }}>
                      <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: C.ink3, marginBottom: 4 }}>Civil Status</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{kb.civil_status}</div>
                    </div>
                  )}
                  <div style={{ background: C.paper2, borderRadius: 12, padding: '11px 12px' }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: C.ink3, marginBottom: 4 }}>Children</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{childrenLabel}</div>
                  </div>
                  {kb.availability && (
                    <div style={{ background: C.paper2, borderRadius: 12, padding: '11px 12px', gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: C.ink3, marginBottom: 4 }}>Availability</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{kb.availability}</div>
                    </div>
                  )}
                </div>

                {skills.length > 0 && (
                  <div style={{ background: C.paper2, borderRadius: 12, padding: '11px 12px' }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: C.ink3, marginBottom: 8 }}>Skills</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                      {skills.map((skill: string) => (
                        <span key={skill} style={{ fontSize: 12, fontWeight: 600, padding: '4px 11px', borderRadius: 20, background: C.forestSoft, color: C.forest, border: `1px solid ${C.forestLine}` }}>
                          {displaySkill(skill)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => { setProfileModalKb(null); router.push(`/offer/send/${kb.id}`) }}
                  style={{
                    width: '100%', height: 48, borderRadius: 14, border: 'none',
                    background: C.forest, color: C.paper, fontFamily: sans,
                    fontSize: 15, fontWeight: 600, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 4px 14px -6px rgba(39,80,10,0.55)',
                    letterSpacing: '-0.005em',
                  }}
                >
                  Send Offer <IcArrowRight />
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── SUBSCRIBE MODAL ── */}
      {subscribeModalId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: C.paper, borderRadius: '18px', padding: '24px 20px', maxWidth: '320px', width: '100%' }}>
            <div style={{ fontFamily: serif, fontSize: '1.2rem', color: C.ink, marginBottom: '6px' }}>Subscribe to Send Offers</div>
            <p style={{ fontSize: '.82rem', color: C.ink2, lineHeight: 1.6, margin: '0 0 20px' }}>
              A ₱499/month subscription gives you platform access and a ₱499 credit toward your first hire fee.
            </p>
            <button
              onClick={handleSubscribe}
              disabled={subscribeLoading}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: C.forest, color: C.paper, fontFamily: sans, fontSize: '.9rem', fontWeight: 700, cursor: 'pointer', marginBottom: '10px', opacity: subscribeLoading ? .6 : 1 }}
            >
              {subscribeLoading ? 'Preparing payment...' : 'Subscribe for ₱499 →'}
            </button>
            <button
              onClick={() => setSubscribeModalId(null)}
              style={{ width: '100%', padding: '8px', background: 'none', border: 'none', fontFamily: sans, fontSize: '.8rem', color: C.ink3, cursor: 'pointer' }}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* ── BOTTOM NAV ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.paper, borderTop: `1px solid ${C.line}`, display: 'flex', boxShadow: '0 -2px 10px rgba(0,0,0,.04)' }}>
        {([
          { id: 'browse', label: 'Browse', icon: <IcSearch /> },
          { id: 'offers', label: 'My Offers', icon: <IcOffers /> },
          { id: 'postjob', label: 'Post Job', icon: <IcPlus /> },
        ] as const).map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => {
                if (t.id === 'postjob') { router.push('/dashboard/homeowner/post-job'); return }
                setTab(t.id as 'browse' | 'offers')
                if (t.id === 'offers') loadOffers()
              }}
              style={{
                flex: 1, padding: '10px 4px', display: 'flex', flexDirection: 'column' as const,
                alignItems: 'center', gap: 3, border: 'none', background: 'transparent',
                cursor: 'pointer', color: active ? C.forest : C.ink3,
              }}
            >
              {t.icon}
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: '-0.005em' }}>{t.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
