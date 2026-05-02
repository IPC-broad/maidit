'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HWDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<'browse' | 'offers' | 'postjob'>('browse')
  const [profiles, setProfiles] = useState<any[]>([])
  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [offersLoading, setOffersLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [filter, setFilter] = useState('Lahat')
  const [passed, setPassed] = useState<Record<string, boolean>>({})
  const [offered, setOffered] = useState<Record<string, boolean>>({})
  const [offersLoaded, setOffersLoaded] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { supabase } = await import('../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user || null)
      const { data } = await supabase.from('kasambahay').select('*, profiles(*)')
      setProfiles(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const loadOffers = async () => {
    if (offersLoaded) return
    setOffersLoading(true)
    const { supabase } = await import('../../../lib/supabase')
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

  const handleTabChange = (t: 'browse' | 'offers' | 'postjob') => {
    if (t === 'postjob') { router.push('/dashboard/homeowner/post-job'); return }
    setTab(t)
    if (t === 'offers') loadOffers()
  }

  const filters = ['Lahat', 'Stay-in', 'Stay-out', 'Metro Manila', 'Province']

  const filtered = profiles.filter(p => {
    if (!p.profiles) return false
    if (filter === 'Lahat') return true
    if (filter === 'Stay-in') return p.setup === 'Stay-in'
    if (filter === 'Stay-out') return p.setup === 'Stay-out'
    if (filter === 'Metro Manila') return !p.province || p.province === 'Quezon City' || p.province === 'Makati'
    if (filter === 'Province') return p.province && p.province !== 'Quezon City' && p.province !== 'Makati'
    return true
  }).filter(p => !passed[p.id])

  const isProvince = (province: string) => {
    const metro = ['Quezon City', 'Makati', 'Pasig', 'Taguig', 'Manila', 'Mandaluyong', 'Marikina']
    return province && !metro.includes(province)
  }

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

      <div style={{ background:'#fff', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #ede8e0' }}>
        <h1 style={{ fontFamily:'serif', fontSize:'1.3rem', fontWeight:900, color:'#1a1a1a', letterSpacing:'-0.5px' }}>
          Maid<span style={{ color:'#f0c97a' }}>It</span>
        </h1>
        <a href="/login" style={{ fontSize:'.72rem', color:'#9ca3af', textDecoration:'none' }}>Sign out</a>
      </div>

      {tab === 'browse' && (
        <>
          <div style={{ padding:'14px 16px 8px' }}>
            <div style={{ fontFamily:'serif', fontSize:'1.1rem', fontWeight:900, marginBottom:'2px', color:'#111827' }}>Browse Kasambahay</div>
            <div style={{ fontSize:'.72rem', color:'#6b7280', marginBottom:'12px' }}>{filtered.length} profiles available</div>
            <div style={{ display:'flex', gap:'6px', overflowX:'auto', paddingBottom:'8px' }}>
              {filters.map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding:'6px 13px', borderRadius:'50px', border:'1.5px solid', borderColor: filter === f ? '#1a6b3c' : '#e5e7eb', background: filter === f ? '#e8f5ee' : '#fff', color: filter === f ? '#1a6b3c' : '#6b7280', fontFamily:'sans-serif', fontSize:'.72rem', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding:'4px 16px 32px', display:'flex', flexDirection:'column', gap:'12px' }}>
            {filtered.length === 0 && <div style={{ textAlign:'center', padding:'40px 20px', color:'#6b7280', fontSize:'.84rem' }}>No profiles found.</div>}
            {filtered.map((kb) => (
              <div key={kb.id} style={{ background:'#fff', borderRadius:'14px', padding:'13px 14px', boxShadow:'0 2px 8px rgba(0,0,0,.06)', border:'1.5px solid #f3f4f6' }}>
                <div style={{ display:'flex', gap:'11px', alignItems:'center', marginBottom:'9px' }}>
                  <div style={{ width:'46px', height:'46px', borderRadius:'50%', background:'#fdf3e3', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', flexShrink:0, border:'2px solid rgba(201,148,58,.2)' }}>👩</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:'.9rem', color:'#111827' }}>
                      {kb.profiles?.full_name?.split(' ')[0]} {kb.profiles?.full_name?.split(' ')[1]?.[0]}.
                    </div>
                    <div style={{ fontSize:'.68rem', color:'#6b7280' }}>{kb.province || kb.profiles?.city} · {kb.setup}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:'serif', fontSize:'1rem', fontWeight:900, color:'#1a6b3c' }}>₱{kb.asking_salary?.toLocaleString()}</div>
                    <div style={{ fontSize:'.6rem', color:'#6b7280' }}>asking/mo</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', marginBottom:'9px' }}>
                  {isProvince(kb.province) && <span style={{ fontSize:'.6rem', fontWeight:700, padding:'2px 7px', borderRadius:'4px', background:'#eff6ff', color:'#2563eb' }}>Province · Transpo Needed</span>}
                </div>
                <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', marginBottom:'9px' }}>
                  {kb.skills?.map((skill: string) => (
                    <span key={skill} style={{ fontSize:'.67rem', padding:'3px 7px', borderRadius:'4px', background:'#e8f5ee', color:'#1a6b3c' }}>{skill}</span>
                  ))}
                </div>
                {offered[kb.id] ? (
                  <div style={{ background:'#e8f5ee', border:'1.5px solid rgba(26,107,60,.2)', borderRadius:'9px', padding:'9px', textAlign:'center', fontSize:'.76rem', color:'#1a6b3c', fontWeight:700 }}>Offer sent! Waiting for response</div>
                ) : (
                  <div style={{ display:'flex', gap:'7px' }}>
                    <button style={{ flex:2, padding:'9px', background:'#1a6b3c', color:'#fff', border:'none', borderRadius:'9px', fontFamily:'sans-serif', fontSize:'.78rem', fontWeight:700, cursor:'pointer' }}
                      onClick={() => { if (!currentUser) { router.push(`/login?redirect=/offer/send/${kb.id}`) } else { router.push(`/offer/send/${kb.id}`) } }}>
                      Send Offer
                    </button>
                    <button style={{ flex:1, padding:'9px', background:'transparent', color:'#6b7280', border:'1.5px solid #e5e7eb', borderRadius:'9px', fontFamily:'sans-serif', fontSize:'.76rem', fontWeight:600, cursor:'pointer' }}
                      onClick={() => setPassed(prev => ({ ...prev, [kb.id]: true }))}>
                      Pass
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'offers' && (
        <div style={{ padding:'16px 16px 32px' }}>
          <div style={{ fontFamily:'serif', fontSize:'1.1rem', fontWeight:900, marginBottom:'2px', color:'#111827' }}>Mga Offer Ko</div>
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
                      <div style={{ fontSize:'11px', color:'#9ca3af' }}>{new Date(offer.created_at).toLocaleDateString('fil-PH', { month:'short', day:'numeric', year:'numeric' })}</div>
                    </div>
                    <span style={{ fontSize:'10px', fontWeight:700, padding:'4px 10px', borderRadius:'50px', background:st.bg, color:st.color, whiteSpace:'nowrap' as const }}>{st.label}</span>
                  </div>
                  <div style={{ background:'#faf8f5', borderRadius:'10px', padding:'10px 12px', marginBottom:'10px' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                      <div><div style={{ fontSize:'10px', color:'#9ca3af', marginBottom:'2px' }}>Sahod</div><div style={{ fontFamily:'serif', fontSize:'16px', fontWeight:900, color:'#1a6b3c' }}>₱{offer.salary?.toLocaleString()}<span style={{ fontSize:'10px', fontWeight:400, color:'#9ca3af' }}>/buwan</span></div></div>
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

      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderTop:'1px solid #f3f4f6', display:'flex' }}>
        {([
          { id:'browse', icon:'🔍', label:'Browse' },
          { id:'offers', icon:'📋', label:'My Offers' },
          { id:'postjob', icon:'📝', label:'Post Job' },
        ] as const).map((t) => (
          <button key={t.id} onClick={() => handleTabChange(t.id)} style={{ flex:1, padding:'10px 4px 9px', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', border:'none', background:'transparent', cursor:'pointer' }}>
            <span style={{ fontSize:'1.1rem' }}>{t.icon}</span>
            <span style={{ fontSize:'.57rem', fontWeight: tab === t.id ? 700 : 600, color: tab === t.id ? '#1a6b3c' : '#6b7280' }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
