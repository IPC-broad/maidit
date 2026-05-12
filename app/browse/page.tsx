'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const STORAGE = 'https://xlagwtsrjbylhxfozoem.supabase.co/storage/v1/object/public/Selfies'

const METRO = ['Quezon City','Makati','Pasig','Taguig','Manila','Mandaluyong','Marikina','Muntinlupa','Las Piñas','Parañaque','Valenzuela','Caloocan','Malabon','Navotas','Pateros','San Juan']

const TRANSPORT_PROVINCES = [
  'Leyte', 'Southern Leyte', 'Samar', 'Eastern Samar', 'Northern Samar', 'Western Samar',
  'Camarines Norte', 'Camarines Sur', 'Albay', 'Sorsogon', 'Catanduanes', 'Masbate',
]

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
const IconChat = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)
const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)
const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)
const IconHeart = ({ filled }: { filled: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#ef4444' : 'none'} stroke={filled ? '#ef4444' : '#9ca3af'} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)

const offerStatusMap: Record<string, { label: string; bg: string; color: string }> = {
  pending:         { label: 'Awaiting kasambahay',   bg: '#fef3e2', color: '#c9943a' },
  reviewed:        { label: 'Being reviewed',         bg: '#eff6ff', color: '#2563eb' },
  fare_pending:    { label: 'Fare estimate pending',  bg: '#fffbeb', color: '#92400e' },
  agreed:          { label: 'Agreed — Pay now',       bg: '#f0fdf4', color: '#1a6b3c' },
  payment_pending: { label: 'Processing payment',     bg: '#fffbeb', color: '#92400e' },
  paid:            { label: 'Hired',                  bg: '#f0fdf4', color: '#1a6b3c' },
  active:          { label: 'Hired',                  bg: '#f0fdf4', color: '#1a6b3c' },
  hired:           { label: 'Hired',                  bg: '#f0fdf4', color: '#1a6b3c' },
  countered:       { label: 'Counter offer',          bg: '#fef3e2', color: '#c9943a' },
  declined:        { label: 'Declined',               bg: '#fef2f2', color: '#dc2626' },
}

export default function BrowsePage() {
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
  const [authModalId, setAuthModalId] = useState<string | null>(null)
  const [homeownerProvince, setHomeownerProvince] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { supabase } = await import('../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user || null)
      if (user) {
        const { data: hw } = await supabase.from('homeowners').select('province').eq('profile_id', user.id).single()
        setHomeownerProvince(hw?.province || null)
      }
      const { data } = await supabase
        .from('kasambahay')
        .select('*, profiles!kasambahay_profile_id_fkey(full_name, selfie_url, city)')
      setProfiles(data || [])
      setLoading(false)
    }
    init()
  }, [])

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

  const isProvince = (province: string) => !!(province && !METRO.includes(province))

  const showTransport = (kbProvince: string) => {
    if (!kbProvince) return false
    if (TRANSPORT_PROVINCES.includes(kbProvince)) return true
    if (homeownerProvince && homeownerProvince !== kbProvince) return true
    return false
  }

  const filtered = profiles.filter(p => {
    if (!p.profiles) return false
    if (passed[p.id]) return false
    if (search) {
      const q = search.toLowerCase()
      const name = (p.profiles?.full_name || '').toLowerCase()
      const city = (p.profiles?.city || p.city || '').toLowerCase()
      const province = (p.province || '').toLowerCase()
      const skillStr = (p.skills || []).join(' ').toLowerCase()
      const role = (p.role || '').toLowerCase()
      const roles = (p.roles || []).join(' ').toLowerCase()
      if (!name.includes(q) && !city.includes(q) && !province.includes(q) && !skillStr.includes(q) && !role.includes(q) && !roles.includes(q)) return false
    }
    if (filter === 'Lahat' || filter === 'More') return true
    if (filter === 'Stay-in') return p.setup === 'Stay-in'
    if (filter === 'Stay-out') return p.setup === 'Stay-out'
    if (filter === 'Nearby') return isProvince(p.province)
    return true
  })

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f4f6f8', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif', color:'#6b7280' }}>
      Loading...
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#f4f6f8', fontFamily:'sans-serif', paddingBottom:'80px' }}>

      {/* ── NAVBAR ── */}
      <div style={{ background:'#fff', padding:'12px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #ede8e0', position:'sticky', top:0, zIndex:100 }}>
        <span style={{ fontFamily:'Georgia, serif', fontSize:'1.35rem', fontWeight:900, color:'#1a1a1a', letterSpacing:'-0.5px' }}>
          Maid<span style={{ color:'#c9943a' }}>It</span>
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:'16px', color:'#6b7280' }}>
          <button style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280', display:'flex', padding:0 }}><IconChat /></button>
          <button style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280', display:'flex', padding:0 }}><IconBell /></button>
          <button style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280', display:'flex', padding:0 }}><IconMenu /></button>
        </div>
      </div>

      {tab === 'browse' && (
        <>
          {/* ── HEADER SECTION ── */}
          <div style={{ background:'#fff', padding:'18px 16px 0', borderBottom:'1px solid #ede8e0' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'6px', gap:'10px' }}>
              <div>
                <h1 style={{ fontFamily:'Georgia, serif', fontSize:'1.55rem', fontWeight:900, color:'#111827', margin:0, lineHeight:1.2 }}>Browse Kasambahay</h1>
                <p style={{ fontSize:'.78rem', color:'#6b7280', margin:'5px 0 0', lineHeight:1.5 }}>Verified profiles. Selfie required for everyone's safety.</p>
              </div>
              <div style={{ background:'#fef3e2', border:'1px solid #fde8c0', borderRadius:'50px', padding:'5px 10px', display:'flex', alignItems:'center', gap:'4px', flexShrink:0, marginTop:'2px' }}>
                <span style={{ fontSize:'12px' }}>🛡️</span>
                <span style={{ fontSize:'.62rem', fontWeight:700, color:'#c9943a', whiteSpace:'nowrap' as const }}>Safe hiring with MaidIt</span>
              </div>
            </div>

            {/* Search */}
            <div style={{ position:'relative', margin:'14px 0 14px' }}>
              <span style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', color:'#9ca3af', display:'flex' }}>
                <IconSearch />
              </span>
              <input
                type="text"
                placeholder="Search by role, skills, or location"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width:'100%', padding:'11px 13px 11px 42px', borderRadius:'12px', border:'1.5px solid #e5e7eb', background:'#f9fafb', fontSize:'.84rem', fontFamily:'sans-serif', color:'#111827', outline:'none', boxSizing:'border-box' as const }}
              />
            </div>

            {/* Filter pills */}
            <div style={{ display:'flex', gap:'6px', overflowX:'auto' as const, paddingBottom:'14px' }}>
              {([
                { id:'Lahat',    label:'All Matches', icon:'⭐', amber:true },
                { id:'Stay-in',  label:'Stay-in',     icon:'🏠', amber:false },
                { id:'Stay-out', label:'Stay-out',     icon:'🚶', amber:false },
                { id:'Nearby',   label:'Nearby',       icon:'📍', amber:false },
                { id:'More',     label:'More Filters', icon:'⚙️', amber:false, dropdown:true },
              ] as const).map(({ id, label, icon, amber, dropdown }: any) => {
                const active = filter === id
                return (
                  <button
                    key={id}
                    onClick={() => setFilter(id)}
                    style={{
                      display:'flex', alignItems:'center', gap:'5px', padding:'7px 14px',
                      borderRadius:'50px', border:'1.5px solid',
                      borderColor: active ? (amber ? '#c9943a' : '#1a6b3c') : '#e5e7eb',
                      background: active ? (amber ? '#fef3e2' : '#f0fdf4') : '#fff',
                      color: active ? (amber ? '#c9943a' : '#1a6b3c') : '#6b7280',
                      fontFamily:'sans-serif', fontSize:'.72rem', fontWeight:600, cursor:'pointer',
                      whiteSpace:'nowrap' as const, flexShrink:0
                    }}
                  >
                    <span style={{ fontSize:'11px' }}>{icon}</span>
                    {label}
                    {dropdown && <span style={{ fontSize:'10px' }}>▾</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── MATCHES BANNER ── */}
          <div style={{ margin:'14px 16px 0', background:'linear-gradient(135deg, #fef3e2 0%, #fffdf9 100%)', border:'1.5px solid #fde8c0', borderRadius:'16px', padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'5px', flexWrap:'wrap' as const }}>
                <span style={{ fontSize:'1.1rem' }}>⭐</span>
                <span style={{ fontFamily:'Georgia, serif', fontSize:'1rem', fontWeight:900, color:'#1a1a1a' }}>Your Matches</span>
                <span style={{ fontSize:'.6rem', fontWeight:700, background:'#f0fdf4', color:'#1a6b3c', border:'1px solid #bbf7d0', borderRadius:'50px', padding:'2px 8px' }}>Personalized for you</span>
              </div>
              <p style={{ fontSize:'.74rem', color:'#78350f', margin:0, lineHeight:1.55 }}>
                These are top matches based on your needs. More great matches are available!
              </p>
            </div>
            <div style={{ flexShrink:0, fontSize:'2.8rem', marginLeft:'14px', lineHeight:1 }}>👩‍🍳</div>
          </div>

          {/* ── SORT ROW ── */}
          <div style={{ padding:'10px 16px 6px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:'.72rem', color:'#6b7280', display:'flex', alignItems:'center', gap:'4px' }}>
              Showing top matches for you
              <span style={{ fontSize:'12px', color:'#9ca3af' }}>ℹ️</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'3px', fontSize:'.72rem', color:'#374151' }}>
              <span style={{ fontWeight:500 }}>Sort by:</span>
              <button style={{ background:'none', border:'none', fontFamily:'sans-serif', fontSize:'.72rem', fontWeight:700, color:'#1a6b3c', cursor:'pointer', display:'flex', alignItems:'center', gap:'2px', padding:0 }}>
                Best Match <span style={{ fontSize:'10px' }}>▾</span>
              </button>
            </div>
          </div>

          {/* ── CARDS ── */}
          <div style={{ padding:'0 16px 20px', maxWidth:'900px', margin:'0 auto', width:'100%', boxSizing:'border-box' as const }}>
            {filtered.length === 0 && (
              <div style={{ textAlign:'center', padding:'48px 20px', color:'#9ca3af', fontSize:'.84rem' }}>
                No matches found.
              </div>
            )}
            {filtered.map((kb) => {
              const fullName = kb.profiles?.full_name || ''
              const firstName = fullName.split(' ')[0] || ''
              const lastInit = fullName.split(' ')[1]?.[0]
              const displayName = lastInit ? `${firstName} ${lastInit}.` : firstName
              const initials = fullName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?'
              const skills: string[] = kb.skills || []
              const visibleSkills = skills.slice(0, 3)
              const extraSkills = skills.length - 3
              const selfieUrl = kb.profiles?.selfie_url || (kb.profile_id ? `${STORAGE}/${kb.profile_id}/selfie.png` : null)
              const showPhoto = !!(selfieUrl && !imgErrors[kb.id])
              const availLabel = kb.availability === 'Immediate' ? 'Immediate'
                : kb.availability ? kb.availability : null
              const expLine = [
                kb.experience ? `${kb.experience} yrs exp` : null,
                kb.religion,
                kb.education,
              ].filter(Boolean).join(' · ')
              const location = kb.province || kb.city || kb.profiles?.city || ''

              return (
                <div key={kb.id} style={{ background:'#fff', borderRadius:'16px', border:'1.5px solid #f0ece6', overflow:'hidden', marginBottom:'12px', display:'flex', boxShadow:'0 1px 8px rgba(0,0,0,.06)' }}>

                  {/* Photo */}
                  <div style={{ width:'88px', flexShrink:0, position:'relative', background:'#f3f4f6' }}>
                    {showPhoto ? (
                      <img
                        src={selfieUrl!}
                        alt={displayName}
                        onError={() => setImgErrors(prev => ({ ...prev, [kb.id]: true }))}
                        style={{ width:'88px', height:'130px', objectFit:'cover', objectPosition:'top center', display:'block' }}
                      />
                    ) : (
                      <div style={{ width:'88px', height:'130px', background:'linear-gradient(135deg, #fdf3e3, #fde8c0)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.6rem', fontWeight:800, color:'#c9943a' }}>
                        {initials}
                      </div>
                    )}
                    {/* Selfie Verified badge */}
                    <div style={{ position:'absolute', bottom:'5px', left:'3px', right:'3px', background:'rgba(26,107,60,.88)', borderRadius:'4px', padding:'2px 4px', display:'flex', alignItems:'center', gap:'2px' }}>
                      <span style={{ color:'#4ade80', fontSize:'7px', lineHeight:1 }}>●</span>
                      <span style={{ color:'#fff', fontSize:'7px', fontWeight:700, lineHeight:1 }}>Selfie Verified</span>
                    </div>
                    {/* Premium badge */}
                    {kb.govt_id && (
                      <div style={{ position:'absolute', top:'5px', left:'3px', background:'rgba(201,148,58,.92)', borderRadius:'4px', padding:'2px 5px' }}>
                        <span style={{ color:'#fff', fontSize:'7px', fontWeight:700 }}>⭐ Premium</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex:1, padding:'10px 8px 10px 10px', minWidth:0, overflow:'hidden' }}>
                    {/* Name + age + dot */}
                    <div style={{ display:'flex', alignItems:'center', gap:'4px', marginBottom:'1px', flexWrap:'wrap' as const }}>
                      <span style={{ fontWeight:800, fontSize:'14px', color:'#111827' }}>{displayName}</span>
                      {kb.age ? <span style={{ fontSize:'12px', color:'#6b7280' }}>, {kb.age}</span> : null}
                      <span style={{ color:'#22c55e', fontSize:'9px' }}>●</span>
                    </div>
                    {/* Role · setup */}
                    <div style={{ fontSize:'11px', color:'#6b7280', marginBottom:'4px', lineHeight:1.3 }}>
                      {kb.roles?.join(' and ') || kb.role || 'Kasambahay'}
                      {kb.setup ? ` · ${kb.setup}` : ''}
                    </div>
                    {/* Location */}
                    {location && (
                      <div style={{ fontSize:'11px', color:'#6b7280', marginBottom:'6px', display:'flex', alignItems:'center', gap:'2px' }}>
                        <span>📍</span>
                        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{location}</span>
                      </div>
                    )}
                    {/* Skills */}
                    {visibleSkills.length > 0 && (
                      <div style={{ display:'flex', gap:'3px', flexWrap:'wrap' as const, marginBottom:'5px' }}>
                        {visibleSkills.map((skill: string) => (
                          <span key={skill} style={{ fontSize:'9px', fontWeight:600, padding:'2px 6px', borderRadius:'5px', background:'#f0fdf4', color:'#1a6b3c', border:'1px solid #bbf7d0' }}>
                            {skill}
                          </span>
                        ))}
                        {extraSkills > 0 && (
                          <span style={{ fontSize:'9px', padding:'2px 5px', borderRadius:'5px', background:'#f3f4f6', color:'#9ca3af' }}>+{extraSkills}</span>
                        )}
                      </div>
                    )}
                    {/* Experience row */}
                    {expLine ? (
                      <div style={{ fontSize:'10px', color:'#9ca3af', lineHeight:1.4, marginBottom:'4px' }}>{expLine}</div>
                    ) : null}
                    {/* Video intro */}
                    {kb.video_intro && (
                      <div style={{ fontSize:'10px', color:'#2563eb', fontWeight:600, display:'flex', alignItems:'center', gap:'3px' }}>
                        <span>▶</span> Watch Video Intro (00:30)
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ width:'84px', flexShrink:0, padding:'10px 8px', display:'flex', flexDirection:'column' as const, alignItems:'stretch', gap:'3px' }}>
                    {/* ID Verified */}
                    {kb.govt_id ? (
                      <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'5px', padding:'2px 5px', textAlign:'center' as const, marginBottom:'2px' }}>
                        <span style={{ fontSize:'8px', fontWeight:700, color:'#2563eb' }}>🛡️ ID Verified</span>
                      </div>
                    ) : <div />}
                    {/* Heart */}
                    <div style={{ display:'flex', justifyContent:'flex-end' }}>
                      <button
                        onClick={() => setSaved(prev => ({ ...prev, [kb.id]: !prev[kb.id] }))}
                        style={{ background:'none', border:'none', cursor:'pointer', padding:'2px', display:'flex' }}
                      >
                        <IconHeart filled={!!saved[kb.id]} />
                      </button>
                    </div>
                    <div style={{ flex:1 }} />
                    {/* Transport */}
                    {showTransport(kb.province) && (
                      <div style={{ display:'flex', alignItems:'center', gap:'3px', justifyContent:'flex-end', marginBottom:'3px' }}>
                        <span style={{ fontSize:'11px' }}>🚌</span>
                        <span style={{ fontSize:'8px', fontWeight:700, color:'#c9943a' }}>Transport needed</span>
                      </div>
                    )}
                    {/* Salary */}
                    <div style={{ textAlign:'right' as const, marginBottom:'1px' }}>
                      <div style={{ fontFamily:'Georgia, serif', fontSize:'13px', fontWeight:900, color:'#1a6b3c', lineHeight:1.1 }}>
                        ₱{kb.asking_salary?.toLocaleString()}
                      </div>
                      <div style={{ fontSize:'8px', color:'#9ca3af' }}>/&nbsp;month</div>
                    </div>
                    {/* Availability */}
                    {availLabel && (
                      <div style={{ fontSize:'8px', color:'#6b7280', textAlign:'right' as const, lineHeight:1.35, marginBottom:'4px' }}>
                        Available:<br />{availLabel}
                      </div>
                    )}
                    {/* Send Offer */}
                    <button
                      onClick={() => { if (!currentUser) { setAuthModalId(kb.id) } else { router.push(`/offer/send/${kb.id}`) } }}
                      style={{ width:'100%', padding:'6px 4px', background:'#1a6b3c', color:'#fff', border:'none', borderRadius:'8px', fontFamily:'sans-serif', fontSize:'10px', fontWeight:700, cursor:'pointer', marginBottom:'3px' }}
                    >
                      Send Offer
                    </button>
                    {/* Pass */}
                    <button
                      onClick={() => setPassed(prev => ({ ...prev, [kb.id]: true }))}
                      style={{ width:'100%', padding:'5px 4px', background:'#fff', color:'#6b7280', border:'1.5px solid #e5e7eb', borderRadius:'8px', fontFamily:'sans-serif', fontSize:'9px', fontWeight:600, cursor:'pointer' }}
                    >
                      Pass
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── CTA STRIP ── */}
          <div style={{ margin:'0 16px 24px', background:'#fef3e2', border:'1.5px solid #fde8c0', borderRadius:'14px', padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
            <div style={{ fontSize:'.82rem', color:'#78350f', fontWeight:600, lineHeight:1.5 }}>
              ✨ New helpers join every day.<br />
              <span style={{ fontWeight:400, color:'#92400e', fontSize:'.76rem' }}>Find your perfect match today.</span>
            </div>
            <button
              onClick={() => router.push('/signup/homeowner')}
              style={{ padding:'10px 16px', borderRadius:'10px', background:'#c9943a', border:'none', color:'#fff', fontFamily:'sans-serif', fontSize:'.8rem', fontWeight:700, cursor:'pointer', flexShrink:0, whiteSpace:'nowrap' as const }}
            >
              Get Started
            </button>
          </div>
        </>
      )}

      {/* ── OFFERS TAB ── */}
      {tab === 'offers' && (
        <div style={{ padding:'16px 16px 32px', maxWidth:'900px', margin:'0 auto', width:'100%', boxSizing:'border-box' as const }}>
          <div style={{ fontFamily:'Georgia, serif', fontSize:'1.1rem', fontWeight:900, marginBottom:'2px', color:'#111827' }}>My Offers</div>
          <div style={{ fontSize:'.72rem', color:'#6b7280', marginBottom:'14px' }}>{offers.length} offer{offers.length !== 1 ? 's' : ''} sent</div>
          {offersLoading && <div style={{ textAlign:'center', padding:'40px', color:'#6b7280' }}>Loading...</div>}
          {!offersLoading && offers.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 20px' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'12px' }}>📭</div>
              <div style={{ color:'#6b7280', fontSize:'.84rem', lineHeight:1.7 }}>You haven't sent any offers yet.</div>
              <button onClick={() => setTab('browse')} style={{ marginTop:'16px', padding:'10px 20px', borderRadius:'10px', background:'#1a6b3c', color:'#fff', border:'none', fontFamily:'sans-serif', fontSize:'.84rem', fontWeight:700, cursor:'pointer' }}>Browse Kasambahay</button>
            </div>
          )}
          {offers.map((offer: any) => {
            const st = offerStatusMap[offer.status] || { label: offer.status, bg: '#f3f4f6', color: '#6b7280' }
            const kbName = offer.kasambahay?.profiles?.full_name || 'Kasambahay'
            const isHired = ['paid','active','hired'].includes(offer.status)
            const needsPayment = offer.status === 'agreed'
            return (
              <div key={offer.id} style={{ background:'#fff', borderRadius:'13px', border:'1px solid #ede8e0', overflow:'hidden', marginBottom:'12px' }}>
                <div style={{ padding:'13px 14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'2px' }}>{kbName}</div>
                      <div style={{ fontSize:'11px', color:'#9ca3af' }}>{new Date(offer.created_at).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' })}</div>
                    </div>
                    <span style={{ fontSize:'10px', fontWeight:700, padding:'4px 10px', borderRadius:'50px', background:st.bg, color:st.color, whiteSpace:'nowrap' as const }}>{st.label}</span>
                  </div>
                  <div style={{ background:'#faf8f5', borderRadius:'10px', padding:'10px 12px', marginBottom:'10px' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                      <div><div style={{ fontSize:'10px', color:'#9ca3af', marginBottom:'2px' }}>Salary</div><div style={{ fontFamily:'Georgia, serif', fontSize:'16px', fontWeight:900, color:'#1a6b3c' }}>₱{offer.salary?.toLocaleString()}<span style={{ fontSize:'10px', fontWeight:400, color:'#9ca3af' }}>/mo</span></div></div>
                      <div><div style={{ fontSize:'10px', color:'#9ca3af', marginBottom:'2px' }}>Location</div><div style={{ fontSize:'13px', fontWeight:700 }}>{offer.city || '—'}</div></div>
                      <div><div style={{ fontSize:'10px', color:'#9ca3af', marginBottom:'2px' }}>Setup</div><div style={{ fontSize:'13px', fontWeight:700 }}>{offer.setup || '—'}</div></div>
                      <div><div style={{ fontSize:'10px', color:'#9ca3af', marginBottom:'2px' }}>Scope</div><div style={{ fontSize:'12px', fontWeight:600, lineHeight:1.4 }}>{offer.scope?.join(', ') || '—'}</div></div>
                    </div>
                  </div>
                  {offer.fare_estimate && (
                    <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'9px', padding:'9px 12px', fontSize:'12px', color:'#92400e', marginBottom:'10px' }}>
                      Kasambahay fare estimate: <strong>₱{offer.fare_estimate?.toLocaleString()}</strong>
                    </div>
                  )}
                  {needsPayment && (
                    <button style={{ width:'100%', padding:'11px', borderRadius:'10px', background:'#1a6b3c', color:'#fff', border:'none', fontFamily:'sans-serif', fontSize:'13px', fontWeight:700, cursor:'pointer' }}
                      onClick={() => router.push(`/pay/${offer.id}`)}>
                      Proceed to Hire →
                    </button>
                  )}
                  {isHired && (
                    <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'9px', padding:'9px 12px', fontSize:'12px', color:'#166534', fontWeight:600, textAlign:'center' as const }}>
                      Hired! Awaiting kasambahay arrival.
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── AUTH MODAL ── */}
      {authModalId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'24px 20px', maxWidth:'320px', width:'100%' }}>
            <div style={{ fontFamily:'Georgia, serif', fontSize:'1.15rem', fontWeight:900, color:'#111827', marginBottom:'8px' }}>Sign in to send an offer</div>
            <p style={{ fontSize:'.82rem', color:'#6b7280', lineHeight:1.6, marginBottom:'20px', margin:'0 0 20px' }}>
              Join MaidIt to hire trusted kasambahay for your home.
            </p>
            <button
              onClick={() => router.push(`/login?redirect=/offer/send/${authModalId}`)}
              style={{ width:'100%', padding:'12px', borderRadius:'10px', border:'1.5px solid #1a6b3c', background:'transparent', color:'#1a6b3c', fontFamily:'sans-serif', fontSize:'.88rem', fontWeight:700, cursor:'pointer', marginBottom:'10px' }}
            >
              Log In
            </button>
            <button
              onClick={() => router.push('/signup/homeowner')}
              style={{ width:'100%', padding:'12px', borderRadius:'10px', border:'none', background:'#1a6b3c', color:'#fff', fontFamily:'sans-serif', fontSize:'.88rem', fontWeight:700, cursor:'pointer', marginBottom:'10px' }}
            >
              Sign Up as Homeowner
            </button>
            <button
              onClick={() => setAuthModalId(null)}
              style={{ width:'100%', padding:'8px', background:'none', border:'none', fontFamily:'sans-serif', fontSize:'.8rem', color:'#9ca3af', cursor:'pointer' }}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* ── BOTTOM NAV ── */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderTop:'1px solid #f0ece6', display:'flex', boxShadow:'0 -2px 10px rgba(0,0,0,.05)' }}>
        {([
          { id:'browse', label:'Browse', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          )},
          { id:'offers', label:'My Offers', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          )},
          { id:'postjob', label:'Post Job', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          )},
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
              style={{ flex:1, padding:'10px 4px', display:'flex', flexDirection:'column' as const, alignItems:'center', gap:'3px', border:'none', background:'transparent', cursor:'pointer', color: active ? '#1a6b3c' : '#9ca3af' }}
            >
              {t.icon}
              <span style={{ fontSize:'.57rem', fontWeight: active ? 700 : 500 }}>{t.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
