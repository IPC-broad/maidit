'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HWDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<'browse' | 'offers' | 'applicants' | 'postjob'>('browse')
  const [profiles, setProfiles] = useState<any[]>([])
  const [offers, setOffers] = useState<any[]>([])
  const [applicants, setApplicants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [offersLoading, setOffersLoading] = useState(false)
  const [applicantsLoading, setApplicantsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [filter, setFilter] = useState('All')
  const [passed, setPassed] = useState<Record<string, boolean>>({})
  const [offered, setOffered] = useState<Record<string, boolean>>({})
  const [offersLoaded, setOffersLoaded] = useState(false)
  const [applicantsLoaded, setApplicantsLoaded] = useState(false)
  const [applicantCount, setApplicantCount] = useState(0)
  const [hwMeta, setHwMeta] = useState<any>(null)
  const [rematchModal, setRematchModal] = useState<string | null>(null)
  const [rematchQ1, setRematchQ1] = useState('')
  const [rematchQ2, setRematchQ2] = useState('')
  const [rematchQ3, setRematchQ3] = useState('')
  const [rematchSubmitting, setRematchSubmitting] = useState(false)
  const [rematchDone, setRematchDone] = useState(false)
  const [cancelModal, setCancelModal] = useState<string | null>(null)
  const [cancelSubmitting, setCancelSubmitting] = useState(false)
  const [profileNames, setProfileNames] = useState<Record<string, string>>({})
  const [addressModalOffer, setAddressModalOffer] = useState<any>(null)
  const [addressInput, setAddressInput] = useState('')
  const [wazePinInput, setWazePinInput] = useState('')
  const [savingAddress, setSavingAddress] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { supabase } = await import('../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user || null)
      const { data } = await supabase.from('kasambahay').select(`
        id, profile_id, asking_salary, setup, skills,
        province, selfie_url, availability, referred_by,
        has_govt_id, has_nbi, edad, how_referred,
        partner_photo_url,
        civil_status, num_children
      `)
      const profileIds = (data || []).map((k: any) => k.profile_id).filter(Boolean)
      const { data: profileData } = await supabase.from('profiles').select('id, full_name').in('id', profileIds)
      const profileMap: Record<string, string> = {}
      ;(profileData || []).forEach((p: any) => {
        if (p.full_name) {
          const parts = p.full_name.trim().split(' ')
          const first = parts[0]
          const lastInitial = parts.length > 1 ? parts[parts.length - 1][0] + '.' : ''
          profileMap[p.id] = lastInitial ? `${first} ${lastInitial}` : first
        }
      })
      setProfileNames(profileMap)
      setProfiles(data || [])
      let hw: any = null
      if (user) {
        const { data: hwData } = await supabase.from('homeowners').select('id').eq('profile_id', user.id).single()
        if (!hwData) {
          const { data: created } = await supabase.from('homeowners').insert({ profile_id: user.id }).select('id').single()
          hw = created
        } else {
          hw = hwData
        }
        setHwMeta(hw)
      }
      if (hw) {
        const { data: offersData } = await supabase.from('offers').select('id, status, kasambahay_id').eq('homeowner_id', hw.id)
        setOffers(offersData || [])
        const offeredMap: Record<string, boolean> = {}
        for (const o of offersData || []) {
          if (['pending','reviewed','agreed','payment_pending','paid','active','hired','countered','fare_pending','fare_countered'].includes(o.status)) {
            offeredMap[o.kasambahay_id] = true
          }
        }
        setOffered(offeredMap)
        // Load applicant count from job postings
        const { data: jobsData } = await supabase.from('jobs').select('id').eq('homeowner_id', hw.id)
        const jobIds = (jobsData || []).map((j: any) => j.id)
        if (jobIds.length > 0) {
          const { data: appsData } = await supabase.from('applications').select('id').in('job_id', jobIds)
          setApplicantCount((appsData || []).length)
        }
      }
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
        .select(`
          id, status, salary, setup, city, scope, household,
          pets, urgency, start_date, transport_service,
          transport_direct_type, fare_estimate, fare_countered,
          created_at, arrived_at, rematch_available, rematch_expires_at,
          estimated_arrival, kasambahay_id, negotiated_by,
          kasambahay:kasambahay_id(
            province, setup, selfie_url, asking_salary,
            profile:profile_id(full_name)
          )
        `)
        .eq('homeowner_id', hw.id)
        .order('created_at', { ascending: false })
      setOffers(data || [])
    }
    setOffersLoaded(true)
    setOffersLoading(false)
  }

  const loadApplicants = async () => {
    if (applicantsLoaded) return
    setApplicantsLoading(true)
    const { supabase } = await import('../../../lib/supabase')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: hw } = await supabase.from('homeowners').select('id').eq('profile_id', user.id).single()
    if (hw) {
      const { data: jobsData } = await supabase.from('jobs').select('id').eq('homeowner_id', hw.id)
      const jobIds = (jobsData || []).map((j: any) => j.id)
      if (jobIds.length > 0) {
        const { data } = await supabase
          .from('applications')
          .select('*, kasambahay:kasambahay_id(*, profile:profile_id(full_name))')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false })
        setApplicants(data || [])
      }
    }
    setApplicantsLoaded(true)
    setApplicantsLoading(false)
  }

  const handleTabChange = (t: 'browse' | 'offers' | 'applicants' | 'postjob') => {
    if (t === 'postjob') {
      if (!currentUser) { localStorage.setItem('maidit_intent', 'post_job'); router.push('/login'); return }
      router.push('/dashboard/homeowner/post-job')
      return
    }
    setTab(t)
    if (t === 'offers') loadOffers()
    if (t === 'applicants') loadApplicants()
  }

  const filters = ['All', 'Stay-in', 'Stay-out', 'Metro Manila', 'Province']

  const filtered = profiles.filter(p => {
    if (!p.id) return false
    if (filter === 'All') return true
    if (filter === 'Stay-in') return p.setup === 'Stay-in'
    if (filter === 'Stay-out') return p.setup === 'Stay-out'
    const metro = ['Quezon City','Makati','Pasig','Taguig','Manila','Mandaluyong','Marikina','Paranaque','Las Pinas','Muntinlupa','Caloocan','Malabon','Navotas','Valenzuela','Pasay','Pateros','San Juan']
    if (filter === 'Metro Manila') return !p.province || metro.includes(p.province)
    if (filter === 'Province') return p.province && !metro.includes(p.province)
    return true
  }).filter(p => !passed[p.id])

  const isProvince = (province: string) => {
    const metro = ['Quezon City', 'Makati', 'Pasig', 'Taguig', 'Manila', 'Mandaluyong', 'Marikina']
    return province && !metro.includes(province)
  }

  const offerStatusMap: Record<string, { label: string; bg: string; color: string }> = {
    pending:          { label: 'Waiting for kasambahay', bg: '#fef3e2', color: '#c9943a' },
    reviewed:         { label: 'Kasambahay is reviewing', bg: '#eff6ff', color: '#2563eb' },
    fare_pending:     { label: 'Fare estimate received',  bg: '#fffbeb', color: '#92400e' },
    agreed:           { label: 'Accepted — Pay Now',      bg: '#f0fdf4', color: '#1a6b3c' },
    payment_pending:  { label: 'Processing payment',      bg: '#fffbeb', color: '#92400e' },
    paid:             { label: 'Payment confirmed',        bg: '#f0fdf4', color: '#1a6b3c' },
    active:           { label: 'Payment confirmed',        bg: '#f0fdf4', color: '#1a6b3c' },
    hired:            { label: 'Hired ✅',                 bg: '#f0fdf4', color: '#1a6b3c' },
    placement_ended:  { label: 'Placement ended — Rematch', bg: '#fef3e2', color: '#c9943a' },
    countered:        { label: 'Counter offer received',  bg: '#fef3e2', color: '#c9943a' },
    fare_countered:   { label: 'Fare countered',          bg: '#fffbeb', color: '#92400e' },
    counter_declined: { label: 'Counter declined',        bg: '#fef2f2', color: '#dc2626' },
    declined:         { label: 'Declined',                bg: '#fef2f2', color: '#dc2626' },
  }

  const actionCount = offers.filter(o => o.status === 'agreed' || o.status === 'countered').length
  const paidOffer = offers.find(o => o.status === 'paid')

  const toIntl = (mobile: string | undefined) => {
    if (!mobile) return ''
    const m = mobile.replace(/\D/g, '')
    return m.startsWith('0') ? '63' + m.slice(1) : m.startsWith('63') ? m : '63' + m
  }

  const handleSubmitRematch = async () => {
    if (!rematchModal) return
    setRematchSubmitting(true)
    const departure_type = rematchQ1 === 'Did not arrive' ? 'no_show' : 'left_within_30d'
    await fetch('/api/process-departure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId: rematchModal, departure_type })
    })
    setRematchSubmitting(false)
    setRematchDone(true)
  }

  const handleCancelOffer = async () => {
    if (!cancelModal) return
    setCancelSubmitting(true)
    const { supabase } = await import('../../../lib/supabase')
    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/api/cancel-offer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({ offer_id: cancelModal }),
    })
    setCancelSubmitting(false)
    setOffers(prev => prev.filter((o: any) => o.id !== cancelModal))
    setCancelModal(null)
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
        <button onClick={async () => { const { supabase } = await import('../../../lib/supabase'); await supabase.auth.signOut(); router.push('/login') }} style={{ background:'none', border:'none', fontSize:'.72rem', color:'#9ca3af', cursor:'pointer', padding:0, fontFamily:'sans-serif' }}>Sign out</button>
      </div>

      {paidOffer && (
        <div style={{ background: '#27500A', borderLeft: '4px solid #c9943a', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>
            ✅ Na-hire mo na ang iyong kasambahay! I-coordinate ang kanyang pagdating.
          </div>
          <button
            onClick={() => router.push(`/arrival/${paidOffer.id}`)}
            style={{ flexShrink: 0, padding: '8px 14px', borderRadius: '9px', border: 'none', background: '#c9943a', color: '#fff', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const }}
          >
            Tingnan →
          </button>
        </div>
      )}

      {actionCount > 0 && tab !== 'offers' && (
        <div style={{ margin:'12px 16px 0', background:'#c9943a', borderRadius:'12px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' }} onClick={() => handleTabChange('offers')}>
          <span style={{ fontSize:'20px' }}>📨</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'13px', fontWeight:700, color:'#fff' }}>{actionCount} offer {actionCount === 1 ? 'needs' : 'need'} your attention!</div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,.8)', marginTop:'1px' }}>Tap to review accepted or countered offers.</div>
          </div>
          <span style={{ color:'#fff', fontSize:'14px' }}>→</span>
        </div>
      )}

      {applicantCount > 0 && tab !== 'applicants' && (
        <div style={{ margin:'10px 16px 0', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'12px', padding:'11px 14px', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' }} onClick={() => handleTabChange('applicants')}>
          <span style={{ fontSize:'18px' }}>✋</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'13px', fontWeight:700, color:'#1e40af' }}>{applicantCount} applied to your job posting!</div>
            <div style={{ fontSize:'11px', color:'#3b82f6', marginTop:'1px' }}>Tap to review and send offers.</div>
          </div>
          <span style={{ color:'#3b82f6', fontSize:'14px' }}>→</span>
        </div>
      )}

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
          <div style={{ padding:'4px 16px 32px', maxWidth: 960, margin: '0 auto', width: '100%', boxSizing: 'border-box' as const, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(380px, 1fr))', gap:'12px' }}>
            {filtered.length === 0 && <div style={{ textAlign:'center', padding:'40px 20px', color:'#6b7280', fontSize:'.84rem' }}>No profiles found.</div>}
            {filtered.map((kb) => (
              <div key={kb.id} style={{ background:'#fff', borderRadius:'14px', padding:'13px 14px', boxShadow:'0 2px 8px rgba(0,0,0,.06)', border:'1.5px solid #f3f4f6' }}>
                <div style={{ display:'flex', gap:'11px', alignItems:'center', marginBottom:'9px' }}>
                  <div style={{ width:'46px', height:'46px', borderRadius:'50%', background:'#fdf3e3', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', flexShrink:0, border:'2px solid rgba(201,148,58,.2)', overflow:'hidden' }}>
                    {kb.selfie_url
                      ? <img src={kb.selfie_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                      : '👩'}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:'.9rem', color:'#111827' }}>
                      {profileNames[kb.profile_id] || 'Kasambahay'}
                      {kb.edad && <span style={{ fontSize:'.72rem', fontWeight:500, color:'#9ca3af', marginLeft:'5px' }}>{kb.edad} yrs old</span>}
                    </div>
                    {kb.referred_by && (
                      <span style={{ fontSize: '9px', fontWeight: 700, padding: '3px 9px', borderRadius: '50px', background: '#f0f5ec', color: '#27500A', border: '1px solid #c8e0b0', display: 'inline-block', marginTop: '2px' }}>Referred by Community Partner</span>
                    )}
                    <div style={{ fontSize:'.68rem', color:'#6b7280' }}>{kb.province} · {kb.setup}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:'serif', fontSize:'1rem', fontWeight:900, color:'#1a6b3c' }}>₱{kb.asking_salary?.toLocaleString()}</div>
                    <div style={{ fontSize:'.6rem', color:'#6b7280' }}>asking/mo</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', marginBottom:'9px' }}>
                  {isProvince(kb.province) && <span style={{ fontSize:'.6rem', fontWeight:700, padding:'2px 7px', borderRadius:'4px', background:'#eff6ff', color:'#2563eb' }}>Province · Transpo Needed</span>}
                  {kb.proxy_mode && <span style={{ fontSize:'9px', fontWeight:700, padding:'2px 7px', borderRadius:'4px', background:'#fef3e2', color:'#c9943a', border:'1px solid #fde8c0' }}>Kinakatawan ng Partner</span>}
                </div>
                <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', marginBottom:'9px' }}>
                  {kb.skills?.map((skill: string) => (
                    <span key={skill} style={{ fontSize:'.67rem', padding:'3px 7px', borderRadius:'4px', background:'#e8f5ee', color:'#1a6b3c' }}>{skill}</span>
                  ))}
                </div>
                {kb.civil_status && (
                  <div style={{fontSize:'11px', color:'#8a8a7a', marginTop:2, marginBottom:9}}>
                    {kb.civil_status}{kb.num_children > 0 ? ` · May ${kb.num_children} anak` : ''}
                  </div>
                )}
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
          <div style={{ fontFamily:'serif', fontSize:'1.1rem', fontWeight:900, marginBottom:'2px', color:'#111827' }}>Offers Made</div>
          <div style={{ fontSize:'.72rem', color:'#6b7280', marginBottom:'14px' }}>{offers.length} offers sent</div>
          {offersLoading && <div style={{ textAlign:'center', padding:'40px', color:'#6b7280' }}>Loading...</div>}
          {!offersLoading && offers.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 20px' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'12px' }}>📭</div>
              <div style={{ color:'#6b7280', fontSize:'.84rem', lineHeight:1.7 }}>You haven't sent any offers yet.</div>
              <button onClick={() => setTab('browse')} style={{ marginTop:'16px', padding:'10px 20px', borderRadius:'10px', background:'#1a6b3c', color:'#fff', border:'none', fontFamily:'sans-serif', fontSize:'.84rem', fontWeight:700, cursor:'pointer' }}>Browse Kasambahay</button>
            </div>
          )}
          {offers.map((offer: any) => {
            const st = offer.status === 'countered' && offer.negotiated_by === 'partner'
              ? { label: 'Counter from Partner', bg: '#fef3e2', color: '#c9943a' }
              : offerStatusMap[offer.status] || { label: offer.status, bg: '#f3f4f6', color: '#6b7280' }
            const kbName = offer.kasambahay?.profile?.full_name || 'Kasambahay'
            const isPaid = ['paid','active'].includes(offer.status)
            const isHired = offer.status === 'hired'
            const needsPayment = offer.status === 'agreed'
            const now = new Date()
            const rematchWindowOpen = offer.rematch_available === true &&
              offer.rematch_expires_at && new Date(offer.rematch_expires_at) > now
            const handleRequestRematch = () => {
              setRematchModal(offer.id)
              setRematchQ1('')
              setRematchQ2('')
              setRematchQ3('')
              setRematchDone(false)
            }

            // Build household summary e.g. "2 adults · 1 child"
            let householdLabel = ''
            if (offer.household) {
              let hh = offer.household
              if (typeof hh === 'string') { try { hh = JSON.parse(hh) } catch {} }
              const parts: string[] = []
              if (hh?.adults) parts.push(`${hh.adults} adult${hh.adults !== 1 ? 's' : ''}`)
              if (hh?.kids) parts.push(`${hh.kids} child${hh.kids !== 1 ? 'ren' : ''}`)
              if (hh?.seniors) parts.push(`${hh.seniors} senior${hh.seniors !== 1 ? 's' : ''}`)
              householdLabel = parts.join(' · ')
            }
            const petsLabel = offer.pets && offer.pets !== 'No' && offer.pets !== 'Wala' ? offer.pets : ''
            const scopeLabel = Array.isArray(offer.scope) && offer.scope.length > 0 ? offer.scope[0] : (offer.scope || '—')
            const urgencyLabel = offer.urgency === 'ASAP' ? 'ASAP' : offer.urgency ? offer.urgency : ''

            return (
              <div key={offer.id} style={{ background:'#fff', borderRadius:'13px', border:'1px solid #ede8e0', ...(offer.status === 'countered' ? { borderLeft:'4px solid #dc2626' } : {}), overflow:'hidden', marginBottom:'12px' }}>
                <div style={{ padding:'13px 14px' }}>
                  {offer.kasambahay?.proxy_mode && (
                    <div style={{ background:'#fef3e2', border:'1px solid #e8d4a0', borderRadius:'12px', padding:'10px 12px', marginBottom:'10px', display:'flex', gap:'10px', alignItems:'flex-start' }}>
                      <span style={{ fontSize:'18px', flexShrink:0 }}>🤝</span>
                      <div>
                        <div style={{ fontSize:'11px', fontWeight:700, color:'#92400e' }}>Represented by Community Partner</div>
                        <div style={{ fontSize:'10px', color:'#6b7280', lineHeight:1.5, marginTop:'2px' }}>This kasambahay is represented by a verified Community Partner who will negotiate on her behalf with her full knowledge and consent.</div>
                      </div>
                    </div>
                  )}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'2px' }}>{kbName}</div>
                      <div style={{ fontSize:'11px', color:'#9ca3af' }}>{new Date(offer.created_at).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' })}</div>
                    </div>
                    <span style={{ fontSize:'10px', fontWeight:700, padding:'4px 10px', borderRadius:'50px', background:st.bg, color:st.color, whiteSpace:'nowrap' as const }}>{st.label}</span>
                  </div>
                  {/* Status timeline */}
                  {!['declined','counter_declined','placement_ended'].includes(offer.status) && (() => {
                    const steps = [
                      { key: 'sent',    label: 'Sent' },
                      { key: 'review',  label: 'Reviewing' },
                      { key: 'pay',     label: 'Payment' },
                      { key: 'hired',   label: 'Hired' },
                    ]
                    const stepIdx = (() => {
                      if (['paid','active','hired'].includes(offer.status)) return 3
                      if (['agreed','payment_pending'].includes(offer.status)) return 2
                      if (['reviewed','countered','fare_pending','fare_countered'].includes(offer.status)) return 1
                      return 0
                    })()
                    return (
                      <div style={{ display:'flex', alignItems:'center', marginBottom:'10px' }}>
                        {steps.map((step, i) => {
                          const done = i < stepIdx
                          const active = i === stepIdx
                          return (
                            <div key={step.key} style={{ display:'flex', alignItems:'center', flex: i < steps.length - 1 ? 1 : 0 }}>
                              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                                <div style={{ width:'10px', height:'10px', borderRadius:'50%', background: done || active ? '#1a6b3c' : '#e5e7eb', border: active ? '2px solid #1a6b3c' : done ? '2px solid #1a6b3c' : '2px solid #e5e7eb', flexShrink:0 }} />
                                <span style={{ fontSize:'8px', color: done || active ? '#1a6b3c' : '#9ca3af', fontWeight: active ? 700 : 500, whiteSpace:'nowrap' }}>{step.label}</span>
                              </div>
                              {i < steps.length - 1 && (
                                <div style={{ flex:1, height:'2px', background: done ? '#1a6b3c' : '#e5e7eb', margin:'0 3px', marginBottom:'10px' }} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                  {offer.status === 'pending' && (
                    <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'8px' }}>
                      <button
                        onClick={() => setCancelModal(offer.id)}
                        style={{ padding:'5px 12px', borderRadius:'8px', border:'1.5px solid #fecaca', background:'transparent', color:'#dc2626', fontFamily:'sans-serif', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
                        Cancel Offer
                      </button>
                    </div>
                  )}
                  <div style={{ background:'#faf8f5', borderRadius:'10px', padding:'10px 12px', marginBottom:'10px' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                      <div><div style={{ fontSize:'12px', color:'#4b5563', marginBottom:'3px', fontWeight:600 }}>Salary</div><div style={{ fontFamily:'serif', fontSize:'16px', fontWeight:900, color:'#1a6b3c' }}>₱{offer.salary?.toLocaleString()}<span style={{ fontSize:'10px', fontWeight:400, color:'#9ca3af' }}>/month</span></div></div>
                      <div><div style={{ fontSize:'12px', color:'#4b5563', marginBottom:'3px', fontWeight:600 }}>Location</div><div style={{ fontSize:'13px', fontWeight:700 }}>{offer.city || '—'}</div></div>
                      <div><div style={{ fontSize:'12px', color:'#4b5563', marginBottom:'3px', fontWeight:600 }}>Setup</div><div style={{ fontSize:'13px', fontWeight:700 }}>{offer.setup || '—'}</div></div>
                      <div><div style={{ fontSize:'12px', color:'#4b5563', marginBottom:'3px', fontWeight:600 }}>Scope</div><div style={{ fontSize:'12px', fontWeight:600, lineHeight:1.4 }}>{scopeLabel}</div></div>
                      {householdLabel ? <div style={{ gridColumn:'1 / -1' }}><div style={{ fontSize:'12px', color:'#4b5563', marginBottom:'3px', fontWeight:600 }}>Household</div><div style={{ fontSize:'13px', fontWeight:600 }}>{householdLabel}{petsLabel ? ` · 🐾 ${petsLabel}` : ''}</div></div> : null}
                      {urgencyLabel ? <div style={{ gridColumn:'1 / -1' }}><div style={{ fontSize:'12px', color:'#4b5563', marginBottom:'3px', fontWeight:600 }}>Start</div><div style={{ fontSize:'13px', fontWeight:600 }}>{urgencyLabel}</div></div> : null}
                    </div>
                  </div>
                  {offer.fare_estimate && offer.status !== 'countered' && (
                    <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'9px', padding:'9px 12px', fontSize:'12px', color:'#92400e', marginBottom:'10px' }}>
                      Kasambahay's fare estimate: <strong>₱{offer.fare_estimate?.toLocaleString()}</strong>
                    </div>
                  )}
                  {offer.status === 'countered' && (
                    <div style={{ background:'#fff5f5', border:'1.5px solid #fca5a5', borderRadius:'12px', padding:'14px', marginBottom:'12px' }}>
                      <div style={{ fontSize:'13px', fontWeight:800, color:'#dc2626', marginBottom:'12px' }}>⚠️ {offer.negotiated_by === 'partner' ? 'Counter from Partner' : 'Counter Offer Received'}</div>
                      <div style={{ display:'flex', flexDirection:'column' as const, gap:'9px', marginBottom:'14px' }}>
                        {offer.fare_countered && offer.fare_countered !== offer.salary ? (
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <span style={{ fontSize:'12px', color:'#6b7280' }}>Salary</span>
                            <span style={{ fontSize:'12px' }}>
                              <span style={{ textDecoration:'line-through', color:'#9ca3af' }}>₱{offer.salary?.toLocaleString()}</span>
                              {' → '}
                              <strong style={{ color:'#dc2626' }}>₱{offer.fare_countered?.toLocaleString()}/mo</strong>
                            </span>
                          </div>
                        ) : (
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <span style={{ fontSize:'12px', color:'#6b7280' }}>Salary</span>
                            <strong style={{ fontSize:'12px', color:'#1a6b3c' }}>₱{offer.salary?.toLocaleString()}/mo (accepted)</strong>
                          </div>
                        )}
                        {offer.fare_estimate > 0 && (
                          <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'8px', padding:'8px 10px' }}>
                            <span style={{ fontSize:'12px', color:'#92400e' }}>
                              🚌 Kasambahay is requesting <strong>₱{offer.fare_estimate?.toLocaleString()}</strong> for transport
                            </span>
                          </div>
                        )}
                        {offer.estimated_arrival && (
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <span style={{ fontSize:'12px', color:'#6b7280' }}>Start date</span>
                            <strong style={{ fontSize:'12px' }}>{new Date(offer.estimated_arrival).toLocaleDateString('en-PH', { month:'long', day:'numeric', year:'numeric' })}</strong>
                          </div>
                        )}
                        {!offer.fare_countered && !offer.fare_estimate && !offer.estimated_arrival && (
                          <div style={{ fontSize:'12px', color:'#6b7280' }}>No specific counter details provided.</div>
                        )}
                      </div>
                      <button
                        onClick={async () => { const { supabase } = await import('../../../lib/supabase'); await supabase.from('offers').update({ status: 'agreed' }).eq('id', offer.id); router.push('/pay/' + offer.id) }}
                        style={{ width:'100%', padding:'12px', borderRadius:'10px', background:'#1a6b3c', border:'none', color:'#fff', fontFamily:'sans-serif', fontSize:'13px', fontWeight:700, cursor:'pointer', marginBottom:'8px' }}
                      >
                        Accept Counter Offer
                      </button>
                      <button
                        onClick={async () => { const { supabase } = await import('../../../lib/supabase'); await supabase.from('offers').update({ status: 'counter_declined', fare_countered: null }).eq('id', offer.id); window.location.reload() }}
                        style={{ width:'100%', padding:'12px', borderRadius:'10px', background:'transparent', border:'1.5px solid #fecaca', color:'#dc2626', fontFamily:'sans-serif', fontSize:'13px', fontWeight:700, cursor:'pointer' }}
                      >
                        Decline Counter Offer
                      </button>
                    </div>
                  )}
                  {needsPayment && (
                    <button style={{ width:'100%', padding:'11px', borderRadius:'10px', background:'#1a6b3c', color:'#fff', border:'none', fontFamily:'sans-serif', fontSize:'13px', fontWeight:700, cursor:'pointer' }}
                      onClick={() => {
                        const id = offer?.id
                        console.log('handleProceedToHire fired', id)
                        if (!id) {
                          alert('Error: offer ID missing. Check console.')
                          return
                        }
                        if (offer.transport_service === true) {
                          setAddressModalOffer(offer)
                          setAddressInput('')
                          setWazePinInput('')
                        } else {
                          console.log('Proceeding to:', `/pay/${id}`)
                          window.location.href = `/pay/${id}`
                          console.log('window.location.href set to:', window.location.href)
                        }
                      }}>
                      Proceed to Hire →
                    </button>
                  )}
                  {isPaid && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 14px', marginBottom: '8px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>✅ Hired! Naghihintay na ang kasambahay.</div>
                      <div style={{ fontSize: '12px', color: '#374151', marginBottom: '10px', lineHeight: 1.5 }}>
                        Makipag-ugnayan sa iyong kasambahay para i-coordinate ang kanyang pagdating.
                      </div>
                      <a
                        href={`/arrival/${offer.id}`}
                        style={{ display: 'block', padding: '10px', borderRadius: '9px', background: '#1a6b3c', color: '#fff', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}
                      >
                        View Contact Details →
                      </a>
                    </div>
                  )}
                  {(!isPaid && isHired) && (
                    <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'10px', padding:'10px 12px', marginBottom:'8px', fontSize:'12px', color:'#166534', lineHeight:1.5 }}>
                      Contact details available in the arrival confirmation page.
                    </div>
                  )}
                  {isHired && (
                    <>
                      <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'9px', padding:'9px 12px', fontSize:'12px', color:'#166534', fontWeight:600, textAlign:'center', marginBottom:'8px' }}>
                        ✅ Hired! {offer.arrived_at ? `Arrived ${new Date(offer.arrived_at).toLocaleDateString('en-PH', { month:'short', day:'numeric' })}` : 'Confirm arrival when kasambahay arrives.'}
                      </div>
                      {rematchWindowOpen && (
                        <button
                          onClick={handleRequestRematch}
                          style={{ width:'100%', padding:'9px', borderRadius:'9px', background:'transparent', border:'1.5px solid #fde8c0', color:'#92400e', fontFamily:'sans-serif', fontSize:'12px', fontWeight:600, cursor:'pointer' }}
                        >
                          🔄 Request Rematch (within 30 days)
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'applicants' && (
        <div style={{ padding:'16px 16px 32px' }}>
          <div style={{ fontFamily:'serif', fontSize:'1.1rem', fontWeight:900, marginBottom:'2px', color:'#111827' }}>Applicants</div>
          <div style={{ fontSize:'.72rem', color:'#6b7280', marginBottom:'14px' }}>{applicants.length} applicant{applicants.length !== 1 ? 's' : ''} on your job posting</div>
          {applicantsLoading && <div style={{ textAlign:'center', padding:'40px', color:'#6b7280' }}>Loading...</div>}
          {!applicantsLoading && applicants.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 20px' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'12px' }}>✋</div>
              <div style={{ color:'#6b7280', fontSize:'.84rem', lineHeight:1.7 }}>No one has applied to your job posting yet.</div>
              <button onClick={() => router.push('/dashboard/homeowner/post-job')} style={{ marginTop:'16px', padding:'10px 20px', borderRadius:'10px', background:'#c9943a', color:'#fff', border:'none', fontFamily:'sans-serif', fontSize:'.84rem', fontWeight:700, cursor:'pointer' }}>Post a Job</button>
            </div>
          )}
          {applicants.map((app: any) => {
            const kb = app.kasambahay
            const kbName = profileNames[kb?.profile_id] || 'Kasambahay'
            return (
              <div key={app.id} style={{ background:'#fff', borderRadius:'14px', border:'1px solid #ede8e0', overflow:'hidden', marginBottom:'12px' }}>
                <div style={{ padding:'13px 14px' }}>
                  <div style={{ display:'flex', gap:'11px', alignItems:'center', marginBottom:'9px' }}>
                    <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'#fdf3e3', border:'2px solid #fde8c0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0, overflow:'hidden' }}>
                      {kb?.selfie_url
                        ? <img src={kb.selfie_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                        : '👩'}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:'14px', color:'#111827' }}>
                        {kbName.split(' ')[0]} {kbName.split(' ')[1]?.[0]}.
                        {kb?.age && <span style={{ fontSize:'11px', fontWeight:500, color:'#9ca3af', marginLeft:'5px' }}>{kb.age} yrs old</span>}
                      </div>
                      <div style={{ fontSize:'11px', color:'#6b7280', marginTop:'1px' }}>{kb?.province} · {kb?.setup}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:'serif', fontSize:'15px', fontWeight:900, color:'#1a6b3c' }}>₱{kb?.asking_salary?.toLocaleString()}</div>
                      <div style={{ fontSize:'10px', color:'#9ca3af' }}>asking/mo</div>
                    </div>
                  </div>
                  {kb?.skills?.length > 0 && (
                    <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', marginBottom:'9px' }}>
                      {kb.skills.map((skill: string) => (
                        <span key={skill} style={{ fontSize:'.67rem', padding:'3px 7px', borderRadius:'4px', background:'#e8f5ee', color:'#1a6b3c' }}>{skill}</span>
                      ))}
                    </div>
                  )}
                  {app.fare_estimate && (
                    <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'7px', padding:'5px 9px', fontSize:'11px', color:'#92400e', marginBottom:'8px' }}>
                      🚌 Fare estimate: ₱{app.fare_estimate?.toLocaleString()}
                    </div>
                  )}
                  {offered[kb?.id] ? (
                    <div style={{ background:'#e8f5ee', border:'1.5px solid rgba(26,107,60,.2)', borderRadius:'9px', padding:'9px', textAlign:'center', fontSize:'.76rem', color:'#1a6b3c', fontWeight:700 }}>Offer sent! Waiting for response</div>
                  ) : (
                    <button
                      style={{ width:'100%', padding:'10px', borderRadius:'9px', background:'#1a6b3c', color:'#fff', border:'none', fontFamily:'sans-serif', fontSize:'13px', fontWeight:700, cursor:'pointer' }}
                      onClick={() => router.push(`/offer/send/${kb?.id}`)}
                    >
                      Send Offer →
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {cancelModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:100, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={() => !cancelSubmitting && setCancelModal(null)}>
          <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'24px 20px 36px', width:'100%', maxWidth:'480px', fontFamily:'sans-serif' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily:'serif', fontSize:'1.1rem', fontWeight:900, color:'#111827', marginBottom:'6px' }}>Cancel this offer?</div>
            <div style={{ fontSize:'13px', color:'#6b7280', marginBottom:'20px', lineHeight:1.6 }}>
              Are you sure you want to cancel this offer? The kasambahay will be notified.
            </div>
            <button
              onClick={handleCancelOffer}
              disabled={cancelSubmitting}
              style={{ width:'100%', padding:'13px', borderRadius:'12px', border:'none', background:'#dc2626', color:'#fff', fontFamily:'sans-serif', fontSize:'.95rem', fontWeight:700, cursor:'pointer', marginBottom:'8px', opacity: cancelSubmitting ? .6 : 1 }}>
              {cancelSubmitting ? 'Cancelling...' : 'Yes, Cancel Offer'}
            </button>
            <button onClick={() => setCancelModal(null)} style={{ width:'100%', padding:'11px', borderRadius:'12px', border:'1.5px solid #e5e7eb', background:'transparent', color:'#6b7280', fontFamily:'sans-serif', fontSize:'.85rem', fontWeight:600, cursor:'pointer' }}>
              Keep Offer
            </button>
          </div>
        </div>
      )}

      {rematchModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:100, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={() => !rematchSubmitting && setRematchModal(null)}>
          <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'24px 20px 36px', width:'100%', maxWidth:'480px', fontFamily:'sans-serif' }} onClick={e => e.stopPropagation()}>
            {rematchDone ? (
              <>
                <div style={{ fontSize:'2rem', textAlign:'center', marginBottom:'12px' }}>🔄</div>
                <div style={{ fontFamily:'serif', fontSize:'1.2rem', fontWeight:900, color:'#1a6b3c', textAlign:'center', marginBottom:'8px' }}>Rematch Activated</div>
                <div style={{ fontSize:'.82rem', color:'#374151', lineHeight:1.7, textAlign:'center', marginBottom:'20px' }}>
                  You have 1 free rematch available. Browse kasambahay to find your replacement — no additional hiring fee. Transport arrangements for replacement are separate.
                </div>
                <button style={{ width:'100%', padding:'13px', borderRadius:'12px', border:'none', background:'#1a6b3c', color:'#fff', fontFamily:'sans-serif', fontSize:'.95rem', fontWeight:700, cursor:'pointer' }}
                  onClick={() => { setRematchModal(null); window.location.reload() }}>
                  Browse Kasambahay
                </button>
              </>
            ) : (
              <>
                <div style={{ fontFamily:'serif', fontSize:'1.1rem', fontWeight:900, color:'#111827', marginBottom:'4px' }}>Request Rematch</div>
                <div style={{ fontSize:'.74rem', color:'#6b7280', marginBottom:'18px', lineHeight:1.6 }}>
                  Confirm that the kasambahay is no longer working with your household. A free rematch is available if the kasambahay did not arrive or left within 30 days.
                </div>

                <div style={{ fontSize:'.74rem', fontWeight:700, color:'#374151', marginBottom:'8px' }}>What happened?</div>
                <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'16px' }}>
                  {['Did not arrive', 'Left within 30 days', 'Other'].map(opt => (
                    <button key={opt} onClick={() => setRematchQ1(opt)} style={{ padding:'7px 13px', borderRadius:'50px', border:'1.5px solid', borderColor: rematchQ1 === opt ? '#1a6b3c' : '#e5e7eb', background: rematchQ1 === opt ? '#e8f5ee' : '#fff', color: rematchQ1 === opt ? '#1a6b3c' : '#6b7280', fontFamily:'sans-serif', fontSize:'.75rem', fontWeight:600, cursor:'pointer' }}>
                      {opt}
                    </button>
                  ))}
                </div>

                <div style={{ fontSize:'.74rem', fontWeight:700, color:'#374151', marginBottom:'8px' }}>Would you like a replacement?</div>
                <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'16px' }}>
                  {['Yes, as soon as possible', 'Yes, but not immediately', 'No replacement needed'].map(opt => (
                    <button key={opt} onClick={() => setRematchQ2(opt)} style={{ padding:'7px 13px', borderRadius:'50px', border:'1.5px solid', borderColor: rematchQ2 === opt ? '#1a6b3c' : '#e5e7eb', background: rematchQ2 === opt ? '#e8f5ee' : '#fff', color: rematchQ2 === opt ? '#1a6b3c' : '#6b7280', fontFamily:'sans-serif', fontSize:'.75rem', fontWeight:600, cursor:'pointer' }}>
                      {opt}
                    </button>
                  ))}
                </div>

                <div style={{ fontSize:'.74rem', fontWeight:700, color:'#374151', marginBottom:'6px' }}>Anything we should know? <span style={{ fontWeight:400, color:'#9ca3af' }}>(optional)</span></div>
                <textarea
                  value={rematchQ3}
                  onChange={e => setRematchQ3(e.target.value)}
                  placeholder="Any details that would help us find a better match..."
                  rows={3}
                  style={{ width:'100%', padding:'10px 12px', borderRadius:'10px', border:'1.5px solid #e5e7eb', fontFamily:'sans-serif', fontSize:'.8rem', color:'#111827', resize:'none', boxSizing:'border-box', marginBottom:'16px', outline:'none' }}
                />

                <button
                  onClick={handleSubmitRematch}
                  disabled={!rematchQ1 || !rematchQ2 || rematchSubmitting}
                  style={{ width:'100%', padding:'13px', borderRadius:'12px', border:'none', background: !rematchQ1 || !rematchQ2 ? '#e5e7eb' : '#1a6b3c', color: !rematchQ1 || !rematchQ2 ? '#9ca3af' : '#fff', fontFamily:'sans-serif', fontSize:'.95rem', fontWeight:700, cursor: !rematchQ1 || !rematchQ2 ? 'default' : 'pointer', marginBottom:'8px', opacity: rematchSubmitting ? .6 : 1 }}>
                  {rematchSubmitting ? 'Submitting...' : 'Confirm Rematch Request'}
                </button>
                <button onClick={() => setRematchModal(null)} style={{ width:'100%', padding:'11px', borderRadius:'12px', border:'1.5px solid #e5e7eb', background:'transparent', color:'#6b7280', fontFamily:'sans-serif', fontSize:'.85rem', fontWeight:600, cursor:'pointer' }}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {addressModalOffer && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={() => !savingAddress && setAddressModalOffer(null)}>
          <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'24px 20px 36px', width:'100%', maxWidth:'480px', fontFamily:'sans-serif' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily:'serif', fontSize:'1.1rem', fontWeight:900, color:'#111827', marginBottom:'4px' }}>Your home address</div>
            <div style={{ fontSize:'13px', color:'#6b7280', marginBottom:'20px', lineHeight:1.6 }}>
              We need your exact home address so we can arrange the transport of your kasambahay directly to your home.
            </div>
            <div style={{ fontSize:'12px', fontWeight:700, color:'#374151', marginBottom:'6px' }}>Full home address *</div>
            <input
              type="text"
              placeholder="e.g. 123 Sampaguita St, BF Homes, Muntinlupa City"
              value={addressInput}
              onChange={e => setAddressInput(e.target.value)}
              style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #e5e7eb', borderRadius:'9px', fontFamily:'sans-serif', fontSize:'14px', outline:'none', color:'#111827', boxSizing:'border-box' as const, marginBottom:'14px' }}
            />
            <div style={{ fontSize:'12px', fontWeight:700, color:'#374151', marginBottom:'6px' }}>Waze/Google Maps pin <span style={{ fontWeight:400, color:'#9ca3af' }}>(optional but recommended)</span></div>
            <input
              type="text"
              placeholder="https://waze.com/ul?ll=..."
              value={wazePinInput}
              onChange={e => setWazePinInput(e.target.value)}
              style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #e5e7eb', borderRadius:'9px', fontFamily:'sans-serif', fontSize:'14px', outline:'none', color:'#111827', boxSizing:'border-box' as const, marginBottom:'6px' }}
            />
            <div style={{ fontSize:'11px', color:'#9ca3af', marginBottom:'18px', lineHeight:1.5 }}>Open Waze → Share → Copy Link. Helps our partner find your home faster.</div>
            <button
              disabled={!addressInput.trim() || savingAddress}
              onClick={async () => {
                if (!addressInput.trim()) return
                const capturedId = addressModalOffer.id
                setSavingAddress(true)
                const { supabase } = await import('../../../lib/supabase')
                await supabase.from('offers').update({
                  homeowner_address: addressInput.trim(),
                  homeowner_waze_pin: wazePinInput.trim() || null,
                }).eq('id', capturedId)
                setSavingAddress(false)
                setAddressModalOffer(null)
                router.push(`/pay/${capturedId}`)
              }}
              style={{ width:'100%', padding:'13px', borderRadius:'12px', border:'none', background: !addressInput.trim() || savingAddress ? '#e5e7eb' : '#1a6b3c', color: !addressInput.trim() || savingAddress ? '#9ca3af' : '#fff', fontFamily:'sans-serif', fontSize:'.95rem', fontWeight:700, cursor: !addressInput.trim() || savingAddress ? 'default' : 'pointer' }}
            >
              {savingAddress ? 'Saving...' : 'Save & proceed to payment →'}
            </button>
          </div>
        </div>
      )}

      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderTop:'1px solid #f3f4f6', display:'flex' }}>
        {([
          { id:'browse',     icon:'🔍', label:'Browse',     badge: 0 },
          { id:'offers',     icon:'📋', label:'My Offers',  badge: actionCount },
          { id:'applicants', icon:'✋', label:'Applicants', badge: applicantCount },
          { id:'postjob',    icon:'📝', label:'Post Job',   badge: 0 },
        ] as const).map((t) => (
          <button key={t.id} onClick={() => handleTabChange(t.id)} style={{ flex:1, padding:'10px 4px 9px', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', border:'none', background:'transparent', cursor:'pointer', position:'relative' }}>
            <span style={{ fontSize:'1.1rem' }}>{t.icon}</span>
            <span style={{ fontSize:'.52rem', fontWeight: tab === t.id ? 700 : 600, color: tab === t.id ? '#1a6b3c' : '#6b7280' }}>{t.label}</span>
            {t.badge > 0 && tab !== t.id && <span style={{ position:'absolute', top:'4px', right:'calc(50% - 18px)', background:'#dc2626', color:'#fff', borderRadius:'50%', width:'15px', height:'15px', fontSize:'9px', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>{t.badge}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
