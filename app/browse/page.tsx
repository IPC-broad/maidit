'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const SKILL_ICONS: Record<string, string> = {
  'Pagluluto': '🍳', 'Cooking': '🍳',
  'Pag-aalaga ng bata': '👶', 'Childcare': '👶',
  'Paglilinis': '🧹', 'Cleaning': '🧹',
  'Labada': '👕', 'Laundry': '👕',
  'Pamimili': '🛒', 'Grocery': '🛒',
  'Eldercare': '🧓', 'Pag-aalaga ng matanda': '🧓',
  'Driving': '🚗', 'Pagmamaneho': '🚗',
  'Gardening': '🌱', 'Paghahalaman': '🌱',
  'Ironing': '👔', 'Plantsa': '👔',
}

const METRO = ['Quezon City','Makati','Pasig','Taguig','Manila','Mandaluyong','Marikina','Muntinlupa','Las Piñas','Parañaque','Valenzuela','Caloocan','Malabon','Navotas','Pateros','San Juan']

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
const IconGrid = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
)
const IconHome = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
)
const IconPerson = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)
const IconPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const IconHeart = ({ filled }: { filled: boolean }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? '#ef4444' : 'none'} stroke={filled ? '#ef4444' : '#9ca3af'} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)

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
  const [offered, setOffered] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [offersLoaded, setOffersLoaded] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { supabase } = await import('../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user || null)
      const { data } = await supabase.from('kasambahay').select('*, profiles(full_name, selfie_url, city)')
      console.log('[browse] selfie check:', data?.slice(0,3).map((kb: any) => ({ id: kb.id, selfie_url: kb.profiles?.selfie_url, name: kb.profiles?.full_name })))
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

  const filtered = profiles.filter(p => {
    if (!p.profiles) return false
    if (passed[p.id]) return false
    const name = (p.profiles?.full_name || '').toLowerCase()
    if (search && !name.includes(search.toLowerCase())) return false
    if (filter === 'Lahat') return true
    if (filter === 'Stay-in') return p.setup === 'Stay-in'
    if (filter === 'Stay-out') return p.setup === 'Stay-out'
    if (filter === 'Province') return isProvince(p.province)
    return true
  })

  const offerStatusMap: Record<string, { label: string; bg: string; color: string }> = {
    pending:         { label: 'Hinihintay ang kasambahay', bg: '#fef3e2', color: '#c9943a' },
    reviewed:        { label: 'Nirereview ng kasambahay',  bg: '#eff6ff', color: '#2563eb' },
    fare_pending:    { label: 'May fare estimate',          bg: '#fffbeb', color: '#92400e' },
    agreed:          { label: 'Sumang-ayon — Bayaran na',  bg: '#f0fdf4', color: '#1a6b3c' },
    payment_pending: { label: 'Processing payment',        bg: '#fffbeb', color: '#92400e' },
    paid:            { label: 'Naka-hire',                  bg: '#f0fdf4', color: '#1a6b3c' },
    active:          { label: 'Naka-hire',                  bg: '#f0fdf4', color: '#1a6b3c' },
    hired:           { label: 'Naka-hire',                  bg: '#f0fdf4', color: '#1a6b3c' },
    countered:       { label: 'May counter offer',          bg: '#fef3e2', color: '#c9943a' },
    declined:        { label: 'Hindi tinanggap',            bg: '#fef2f2', color: '#dc2626' },
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#faf8f5', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif', color:'#6b7280' }}>
      Loading...
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#faf8f5', fontFamily:'sans-serif', paddingBottom:'80px' }}>

      {/* ── NAVBAR ── */}
      <div style={{ background:'#fff', padding:'13px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #ede8e0', position:'sticky', top:0, zIndex:100 }}>
        <span style={{ fontFamily:'Georgia, serif', fontSize:'1.4rem', fontWeight:900, color:'#1a1a1a', letterSpacing:'-0.5px' }}>
          Maid<span style={{ color:'#c9943a' }}>It</span>
        </span>
        <button
          onClick={() => router.push(currentUser ? '/dashboard/kasambahay' : '/login')}
          style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'50px', border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontFamily:'sans-serif', fontSize:'.76rem', fontWeight:600, cursor:'pointer' }}
        >
          <IconPerson />
          Profile Ko
        </button>
      </div>

      {tab === 'browse' && (
        <>
          {/* ── HERO ── */}
          <div style={{ background:'linear-gradient(135deg, #1a6b3c 0%, #14502d 100%)', overflow:'hidden' }}>
            <div style={{ maxWidth:'900px', margin:'0 auto', display:'flex', alignItems:'stretch', minHeight:'150px' }}>
              <div style={{ flex:1, padding:'22px 20px 20px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
                <div style={{ fontSize:'.62rem', fontWeight:700, color:'rgba(255,255,255,.55)', textTransform:'uppercase' as const, letterSpacing:'1px', marginBottom:'5px' }}>
                  MaidIt
                </div>
                <h2 style={{ fontFamily:'Georgia, serif', fontSize:'1.6rem', fontWeight:900, color:'#fff', margin:'0 0 8px', lineHeight:1.15 }}>
                  Browse<br/>Kasambahay
                </h2>
                <p style={{ fontSize:'.76rem', color:'rgba(255,255,255,.72)', margin:0, lineHeight:1.55, maxWidth:'200px' }}>
                  Hanap ng kasambahay na swak sa needs ng pamilya mo.
                </p>
              </div>
              <div style={{ width:'150px', flexShrink:0, position:'relative', overflow:'hidden' }}>
                <img
                  src="https://xlagwtsrjbylhxfozoem.supabase.co/storage/v1/object/public/assets/ChatGPT%20Image%20May%203,%202026%20at%2008_38_45%20PM.png"
                  alt=""
                  style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top', display:'block' }}
                />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, #1a6b3c 0%, transparent 45%)' }} />
              </div>
            </div>
          </div>

          {/* ── SEARCH + FILTERS ── */}
          <div style={{ padding:'14px 16px 0', maxWidth:'900px', margin:'0 auto', width:'100%', boxSizing:'border-box' as const }}>
            <div style={{ position:'relative', marginBottom:'10px' }}>
              <span style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', color:'#9ca3af', display:'flex' }}>
                <IconSearch />
              </span>
              <input
                type="text"
                placeholder="Search kasambahay..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width:'100%', padding:'11px 13px 11px 38px', borderRadius:'12px', border:'1.5px solid #e5e7eb', background:'#fff', fontSize:'.84rem', fontFamily:'sans-serif', color:'#111827', outline:'none', boxSizing:'border-box' as const }}
              />
            </div>
            <div style={{ display:'flex', gap:'6px', overflowX:'auto' as const, paddingBottom:'6px' }}>
              {[
                { id:'Lahat',    label:'Lahat',     Icon: IconGrid   },
                { id:'Stay-in',  label:'Stay-in',   Icon: IconHome   },
                { id:'Stay-out', label:'Stay-out',  Icon: IconPerson },
                { id:'Province', label:'Province',  Icon: IconPin    },
              ].map(({ id, label, Icon }) => {
                const active = filter === id
                return (
                  <button
                    key={id}
                    onClick={() => setFilter(id)}
                    style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 14px', borderRadius:'50px', border:'1.5px solid', borderColor: active ? '#1a6b3c' : '#e5e7eb', background: active ? '#1a6b3c' : '#fff', color: active ? '#fff' : '#6b7280', fontFamily:'sans-serif', fontSize:'.72rem', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' as const, flexShrink:0 }}
                  >
                    <Icon />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── RESULT COUNT ── */}
          <div style={{ padding:'6px 16px 10px', maxWidth:'900px', margin:'0 auto', width:'100%', boxSizing:'border-box' as const }}>
            <div style={{ fontSize:'.7rem', color:'#9ca3af' }}>{filtered.length} kasambahay available</div>
          </div>

          {/* ── CARDS ── */}
          <style>{`
            .kb-grid { display: flex; flex-direction: column; gap: 12px; }
            @media (min-width: 600px) { .kb-grid { display: grid !important; grid-template-columns: repeat(2, 1fr); gap: 14px; } }
            @media (min-width: 860px) { .kb-grid { grid-template-columns: repeat(3, 1fr); } }
          `}</style>
          <div style={{ padding:'0 16px 32px', maxWidth:'900px', margin:'0 auto', width:'100%', boxSizing:'border-box' as const }}>
            <div className="kb-grid">
              {filtered.length === 0 && (
                <div style={{ textAlign:'center', padding:'48px 20px', color:'#9ca3af', fontSize:'.84rem' }}>
                  Walang nahanap.
                </div>
              )}
              {filtered.map((kb) => {
                const firstName = kb.profiles?.full_name?.split(' ')[0] || ''
                const lastInit  = kb.profiles?.full_name?.split(' ')[1]?.[0]
                const displayName = lastInit ? `${firstName} ${lastInit}.` : firstName
                const initials = (kb.profiles?.full_name || '?').split(' ').map((w: string) => w[0]).slice(0,2).join('').toUpperCase()
                const prov = isProvince(kb.province)
                const skills: string[] = kb.skills || []
                const visibleSkills = skills.slice(0, 3)
                const extraSkills = skills.length - 3

                return (
                  <div key={kb.id} style={{ background:'#fff', borderRadius:'18px', overflow:'hidden', boxShadow:'0 2px 14px rgba(0,0,0,.07)', border:'1.5px solid #f0ece6', position:'relative', display:'flex', flexDirection:'column' }}>

                    {/* Heart */}
                    <button
                      onClick={() => setSaved(prev => ({ ...prev, [kb.id]: !prev[kb.id] }))}
                      style={{ position:'absolute', top:'11px', right:'11px', background:'rgba(255,255,255,.95)', border:'none', borderRadius:'50%', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex:2, boxShadow:'0 1px 5px rgba(0,0,0,.12)' }}
                    >
                      <IconHeart filled={!!saved[kb.id]} />
                    </button>

                    {/* Photo */}
                    <div style={{ paddingTop:'20px', display:'flex', justifyContent:'center' }}>
                      <div style={{ position:'relative' }}>
                        {kb.profiles?.selfie_url ? (
                          <img
                            src={kb.profiles.selfie_url}
                            alt={displayName}
                            style={{ width:'76px', height:'76px', borderRadius:'50%', objectFit:'cover', border:'3px solid #fff', boxShadow:'0 3px 10px rgba(0,0,0,.14)', display:'block' }}
                          />
                        ) : (
                          <div style={{ width:'76px', height:'76px', borderRadius:'50%', background:'linear-gradient(135deg, #fdf3e3, #fde8c0)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.35rem', fontWeight:800, color:'#c9943a', border:'3px solid #fff', boxShadow:'0 3px 10px rgba(0,0,0,.14)' }}>
                            {initials}
                          </div>
                        )}
                        <div style={{ position:'absolute', bottom:'4px', right:'4px', width:'14px', height:'14px', borderRadius:'50%', background:'#22c55e', border:'2.5px solid #fff' }} />
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding:'10px 14px 14px', flex:1, display:'flex', flexDirection:'column' }}>

                      {/* Name + location */}
                      <div style={{ textAlign:'center', marginBottom:'8px' }}>
                        <div style={{ fontWeight:800, fontSize:'.98rem', color:'#111827', marginBottom:'2px' }}>
                          {displayName}
                          {kb.age ? <span style={{ fontSize:'.68rem', fontWeight:500, color:'#9ca3af', marginLeft:'4px' }}>{kb.age}y</span> : null}
                        </div>
                        <div style={{ fontSize:'.68rem', color:'#9ca3af' }}>
                          {kb.province || kb.profiles?.city}{kb.setup ? ` · ${kb.setup}` : ''}
                        </div>
                      </div>

                      {/* Tags row */}
                      <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' as const, justifyContent:'center', marginBottom:'9px' }}>
                        {prov && (
                          <>
                            <span style={{ fontSize:'.58rem', fontWeight:700, padding:'3px 7px', borderRadius:'5px', background:'#eff6ff', color:'#2563eb' }}>Province</span>
                            <span style={{ fontSize:'.58rem', fontWeight:700, padding:'3px 7px', borderRadius:'5px', background:'#eff6ff', color:'#2563eb' }}>Transpo Needed</span>
                          </>
                        )}
                        {kb.availability === 'Immediate' && (
                          <span style={{ fontSize:'.58rem', fontWeight:700, padding:'3px 7px', borderRadius:'5px', background:'#f0fdf4', color:'#16a34a' }}>Available Now</span>
                        )}
                        {kb.availability && kb.availability !== 'Immediate' && (
                          <span style={{ fontSize:'.58rem', fontWeight:600, padding:'3px 7px', borderRadius:'5px', background:'#f9fafb', color:'#6b7280' }}>{kb.availability}</span>
                        )}
                      </div>

                      {/* Skills */}
                      {visibleSkills.length > 0 && (
                        <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' as const, justifyContent:'center', marginBottom:'11px' }}>
                          {visibleSkills.map((skill: string) => (
                            <span key={skill} style={{ display:'flex', alignItems:'center', gap:'3px', fontSize:'.63rem', padding:'3px 8px', borderRadius:'6px', background:'#e8f5ee', color:'#1a6b3c', fontWeight:600 }}>
                              {SKILL_ICONS[skill] || '✦'} {skill}
                            </span>
                          ))}
                          {extraSkills > 0 && (
                            <span style={{ fontSize:'.63rem', padding:'3px 8px', borderRadius:'6px', background:'#f3f4f6', color:'#6b7280', fontWeight:600 }}>+{extraSkills} more</span>
                          )}
                        </div>
                      )}

                      {/* Salary */}
                      <div style={{ textAlign:'center', marginBottom:'12px', marginTop:'auto' }}>
                        <span style={{ fontFamily:'Georgia, serif', fontSize:'1.2rem', fontWeight:900, color:'#1a6b3c' }}>
                          ₱{kb.asking_salary?.toLocaleString()}
                        </span>
                        <span style={{ fontSize:'.63rem', color:'#9ca3af', marginLeft:'3px' }}>/buwan</span>
                      </div>

                      {/* CTA */}
                      {offered[kb.id] ? (
                        <div style={{ background:'#e8f5ee', border:'1.5px solid rgba(26,107,60,.2)', borderRadius:'10px', padding:'9px', textAlign:'center', fontSize:'.74rem', color:'#1a6b3c', fontWeight:700 }}>
                          Offer sent ✓
                        </div>
                      ) : (
                        <div style={{ display:'flex', gap:'7px' }}>
                          <button
                            style={{ flex:2, padding:'10px', background:'#1a6b3c', color:'#fff', border:'none', borderRadius:'10px', fontFamily:'sans-serif', fontSize:'.78rem', fontWeight:700, cursor:'pointer' }}
                            onClick={() => { if (!currentUser) { router.push(`/login?redirect=/offer/send/${kb.id}`) } else { router.push(`/offer/send/${kb.id}`) } }}
                          >
                            Send Offer
                          </button>
                          <button
                            style={{ flex:1, padding:'10px', background:'transparent', color:'#6b7280', border:'1.5px solid #e5e7eb', borderRadius:'10px', fontFamily:'sans-serif', fontSize:'.75rem', fontWeight:600, cursor:'pointer' }}
                            onClick={() => setPassed(prev => ({ ...prev, [kb.id]: true }))}
                          >
                            Pass
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ── OFFERS TAB ── */}
      {tab === 'offers' && (
        <div style={{ padding:'16px 16px 32px', maxWidth:'900px', margin:'0 auto', width:'100%', boxSizing:'border-box' as const }}>
          <div style={{ fontFamily:'Georgia, serif', fontSize:'1.1rem', fontWeight:900, marginBottom:'2px', color:'#111827' }}>Mga Offer Ko</div>
          <div style={{ fontSize:'.72rem', color:'#6b7280', marginBottom:'14px' }}>{offers.length} offer ang naipadala mo</div>
          {offersLoading && <div style={{ textAlign:'center', padding:'40px', color:'#6b7280' }}>Loading...</div>}
          {!offersLoading && offers.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 20px' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'12px' }}>📭</div>
              <div style={{ color:'#6b7280', fontSize:'.84rem', lineHeight:1.7 }}>Wala ka pang naipadala na offer.</div>
              <button onClick={() => setTab('browse')} style={{ marginTop:'16px', padding:'10px 20px', borderRadius:'10px', background:'#1a6b3c', color:'#fff', border:'none', fontFamily:'sans-serif', fontSize:'.84rem', fontWeight:700, cursor:'pointer' }}>Mag-browse</button>
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
                      <div><div style={{ fontSize:'10px', color:'#9ca3af', marginBottom:'2px' }}>Sahod</div><div style={{ fontFamily:'Georgia, serif', fontSize:'16px', fontWeight:900, color:'#1a6b3c' }}>₱{offer.salary?.toLocaleString()}<span style={{ fontSize:'10px', fontWeight:400, color:'#9ca3af' }}>/buwan</span></div></div>
                      <div><div style={{ fontSize:'10px', color:'#9ca3af', marginBottom:'2px' }}>Lokasyon</div><div style={{ fontSize:'13px', fontWeight:700 }}>{offer.city || '—'}</div></div>
                      <div><div style={{ fontSize:'10px', color:'#9ca3af', marginBottom:'2px' }}>Setup</div><div style={{ fontSize:'13px', fontWeight:700 }}>{offer.setup || '—'}</div></div>
                      <div><div style={{ fontSize:'10px', color:'#9ca3af', marginBottom:'2px' }}>Scope</div><div style={{ fontSize:'12px', fontWeight:600, lineHeight:1.4 }}>{offer.scope?.join(', ') || '—'}</div></div>
                    </div>
                  </div>
                  {offer.fare_estimate && (
                    <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'9px', padding:'9px 12px', fontSize:'12px', color:'#92400e', marginBottom:'10px' }}>
                      Fare estimate ng kasambahay: <strong>₱{offer.fare_estimate?.toLocaleString()}</strong>
                    </div>
                  )}
                  {needsPayment && (
                    <button style={{ width:'100%', padding:'11px', borderRadius:'10px', background:'#1a6b3c', color:'#fff', border:'none', fontFamily:'sans-serif', fontSize:'13px', fontWeight:700, cursor:'pointer' }}
                      onClick={() => router.push(`/pay/${offer.id}`)}>
                      Bayaran — ₱2,001 Hire Fee
                    </button>
                  )}
                  {isHired && (
                    <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'9px', padding:'9px 12px', fontSize:'12px', color:'#166534', fontWeight:600, textAlign:'center' }}>
                      Naka-hire na! Abangan ang arrival ng kasambahay.
                    </div>
                  )}
                </div>
              </div>
            )
          })}
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
              style={{ flex:1, padding:'10px 4px 10px', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', border:'none', background:'transparent', cursor:'pointer', color: active ? '#1a6b3c' : '#9ca3af' }}
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
