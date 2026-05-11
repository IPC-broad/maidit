'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function KBDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<'jobs' | 'offers' | 'applied'>('jobs')
  const [jobs, setJobs] = useState<any[]>([])
  const [offers, setOffers] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [kb, setKb] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [appliedJobs, setAppliedJobs] = useState<any[]>([])
  const [showProfile, setShowProfile] = useState(false)
  const [actioning, setActioning] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { supabase } = await import('../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      const { data: kbData } = await supabase.from('kasambahay').select('*').eq('profile_id', user.id).single()
      setKb(kbData)
      const { data: jobsData } = await supabase.from('jobs').select('*').eq('active', true)
      setJobs(jobsData || [])
      if (kbData) {
        const { data: offersData } = await supabase
          .from('offers')
          .select('*, homeowner:homeowner_id(*, profiles(full_name, mobile))')
          .eq('kasambahay_id', kbData.id)
        setOffers(offersData || [])
        const { data: apps } = await supabase.from('applications').select('job_id').eq('kasambahay_id', kbData.id)
        if (apps) {
          const ids = apps.map((a: any) => a.job_id)
          setAppliedIds(new Set(ids))
          const { data: appliedJobsData } = await supabase.from('jobs').select('*').in('id', ids)
          setAppliedJobs(appliedJobsData || [])
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleSignOut = async () => {
    const { supabase } = await import('../../../lib/supabase')
    await supabase.auth.signOut()
    router.push('/login')
  }

  const urgencyLabel = (u: string) => {
    if (!u) return '—'
    if (['Now','ASAP','Kailangan na (ASAP)'].includes(u)) return 'Kailangan na (ASAP)'
    if (['1-7 days','Sa loob ng ilang araw'].includes(u)) return 'Sa loob ng ilang araw'
    if (['2 weeks','Sa susunod na linggo'].includes(u)) return 'Sa susunod na linggo'
    if (['Flexible','Pwede pag-usapan'].includes(u)) return 'Pwede pag-usapan'
    return u
  }

  const householdText = (h: any) => {
    if (!h) return '—'
    const parts = []
    if (h.adults > 0) parts.push(`${h.adults} adult${h.adults > 1 ? 's' : ''}`)
    if (h.seniors > 0) parts.push(`${h.seniors} senior${h.seniors > 1 ? 's' : ''}`)
    if (h.kids > 0) parts.push(`${h.kids} bata`)
    return parts.join(' · ') || '—'
  }

  const petsText = (pets: string) => (!pets || pets === 'No' || pets === 'Wala') ? 'Walang Pets' : `May ${pets}`

  const toIntl = (mobile: string | undefined) => {
    if (!mobile) return ''
    const m = mobile.replace(/\D/g, '')
    return m.startsWith('0') ? '63' + m.slice(1) : m.startsWith('63') ? m : '63' + m
  }

  const offerStatusMap: Record<string, { label: string; bg: string; color: string }> = {
    pending:         { label: 'Bagong Offer',              bg: '#fef3e2', color: '#c9943a' },
    reviewed:        { label: 'Hinihintay ang homeowner',  bg: '#eff6ff', color: '#2563eb' },
    agreed:          { label: 'Hinihintay ang bayad',      bg: '#fffbeb', color: '#92400e' },
    payment_pending: { label: 'Processing payment',        bg: '#fffbeb', color: '#92400e' },
    paid:            { label: 'HIRED',         bg: '#f0fdf4', color: '#1a6b3c' },
    active:          { label: 'HIRED',         bg: '#f0fdf4', color: '#1a6b3c' },
    hired:           { label: 'HIRED',         bg: '#f0fdf4', color: '#1a6b3c' },
    countered:       { label: 'Counter offer — naghihintay ng sagot', bg: '#fef3e2', color: '#c9943a' },
    counter_declined: { label: 'Counter Offer Declined', bg: '#fef2f2', color: '#dc2626' },
    declined:        { label: 'May Na-hire Na',             bg: '#fef2f2', color: '#dc2626' },
  }

  const s: any = {
    wrap: { minHeight: '100vh', background: '#faf8f5', fontFamily: 'sans-serif', color: '#1a1a1a' },
    card: { background: '#fff', borderRadius: '13px', border: '1px solid #ede8e0', overflow: 'hidden', marginBottom: '12px' },
    tag: (bg: string, color: string) => ({ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: bg, color, display: 'inline-block' }),
    infoBox: { background: '#faf8f5', borderRadius: '10px', padding: '10px 12px', marginBottom: '10px' },
    lbl10: { fontSize: '10px', color: '#9ca3af', marginBottom: '2px' },
    val13: { fontSize: '13px', fontWeight: 700 },
    btn: (bg: string) => ({ width: '100%', padding: '11px', borderRadius: '10px', background: bg, color: '#fff', border: 'none', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }),
  }

  if (loading) return <div style={{ minHeight: '100vh', background: '#faf8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#9ca3af' }}>Loading...</div>

  const pendingOffers = offers.filter(o => o.status === 'pending').length

  return (
    <div style={s.wrap}>
      <div style={{ background: '#fff', borderBottom: '1px solid #ede8e0', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setShowProfile(true)}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fef3e2', border: '2px solid #fde8c0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
            {profile?.selfie_url
              ? <img src={profile.selfie_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : '👩'}
            {kb?.status === 'available' && <div style={{ position: 'absolute', bottom: 0, right: 0, width: '11px', height: '11px', borderRadius: '50%', background: '#16a34a', border: '2px solid #fff' }} />}
          </div>
          <div>
            <div style={{ fontFamily: 'serif', fontSize: '16px', fontWeight: 900, color: '#1a1a1a' }}>{profile?.full_name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#6b7280' }}>
              {kb?.status === 'available' && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />}
              <span>{kb?.status === 'available' ? 'Available' : kb?.status === 'hired' ? 'Naka-hire' : 'Pending'} · {kb?.province || profile?.city || '—'}</span>
            </div>
          </div>
        </div>
        <button onClick={() => setShowProfile(true)} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '9px', padding: '6px 12px', color: '#1a6b3c', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>Profile Ko</button>
      </div>

      {pendingOffers > 0 && (
        <div style={{ background: '#fef3e2', borderBottom: '1px solid #fde8c0', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setTab('offers')}>
          <span style={{ fontSize: '18px' }}>💼</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#92400e', marginBottom: '1px' }}>Bagong offer</div>
            <div style={{ fontSize: '12px', color: '#78350f' }}><strong>{pendingOffers} bagong job offer</strong> — i-tap para tingnan</div>
          </div>
          <span style={{ color: '#c9943a', fontSize: '14px', fontWeight: 700 }}>→</span>
        </div>
      )}

      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #ede8e0' }}>
        {([
          { id: 'jobs',    icon: '💼', label: 'Mga Trabaho',         sub: `${jobs.length} available` },
          { id: 'offers',  icon: '📩', label: 'Job Offer Para Sayo', sub: pendingOffers > 0 ? `${pendingOffers} bagong offer` : 'Tingnan' },
          { id: 'applied', icon: '✋', label: 'Mga In-applyan',       sub: 'Tingnan ang status' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '9px 4px 8px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: `2px solid ${tab === t.id ? '#c9943a' : 'transparent'}`, fontFamily: 'sans-serif', color: tab === t.id ? '#c9943a' : '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', position: 'relative' }}>
            <span style={{ fontSize: '18px', marginBottom: '1px' }}>{t.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: tab === t.id ? 700 : 600, lineHeight: 1.2 }}>{t.label}</span>
            <span style={{ fontSize: '9px', fontWeight: 500, color: t.id === 'offers' && pendingOffers > 0 ? '#dc2626' : tab === t.id ? '#c9943a' : '#9ca3af', lineHeight: 1.2 }}>{t.sub}</span>
            {t.id === 'offers' && pendingOffers > 0 && tab !== 'offers' && <span style={{ position:'absolute', top:'5px', right:'calc(50% - 16px)', background:'#dc2626', color:'#fff', borderRadius:'50%', width:'15px', height:'15px', fontSize:'9px', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>{pendingOffers}</span>}
          </button>
        ))}
      </div>

      {tab === 'jobs' && (
        <div style={{ padding: '14px 14px 32px' }}>
          <div style={{ fontFamily: 'serif', fontSize: '17px', fontWeight: 900, marginBottom: '2px' }}>Mga Trabaho</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '14px' }}>{jobs.length} trabaho ang available</div>
          {jobs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '52px 24px 40px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '14px' }}>🧹</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Walang available na trabaho ngayon.</div>
              <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.7 }}>Mag-check ulit mamaya para sa mga bagong trabaho.</div>
            </div>
          )}
          {jobs.map((job: any) => (
            <div key={job.id} style={s.card}>
              <div style={{ padding: '13px 14px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, border: '2px solid #bbf7d0' }}>🏠</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '1px' }}>Pamilya sa {job.city}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>{urgencyLabel(job.urgency)}</div>
                    <div style={{ fontFamily: 'serif', fontSize: '20px', fontWeight: 900, color: '#1a6b3c' }}>₱{job.salary?.toLocaleString()}<span style={{ fontSize: '11px', fontWeight: 400, color: '#9ca3af' }}>/buwan</span></div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <span style={s.tag('#f3ede5', '#92400e')}>📍 {job.city}</span>
                  <span style={s.tag('#f0fdf4', '#1a6b3c')}>🏠 {job.setup}</span>
                  <span style={s.tag('#eff6ff', '#2563eb')}>{householdText(job.household)}</span>
                  <span style={s.tag('#f3f4f6', '#6b7280')}>{petsText(job.pets)}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#374151', marginBottom: '10px' }}>Kailangan: <strong>{job.scope?.join(' · ') || '—'}</strong></div>
                {appliedIds.has(job.id) ? (
                  <div style={{ width: '100%', padding: '10px', borderRadius: '9px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#1a6b3c', fontSize: '12px', fontWeight: 700, textAlign: 'center' }}>Nag-apply ka na - hintayin ang sagot</div>
                ) : (
                  <button style={s.btn('#c9943a')} onClick={() => router.push(`/jobs/${job.id}/apply`)}>Mag-apply - Libre</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'offers' && (
        <div style={{ padding: '14px 14px 32px' }}>
          <div style={{ fontFamily: 'serif', fontSize: '17px', fontWeight: 900, marginBottom: '2px' }}>Job Offer Para Sayo</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '14px' }}>{offers.length === 0 ? 'Wala pang offer.' : `${offers.length} offer ang natanggap mo`}</div>
          {offers.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px' }}><div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</div><div style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.7 }}>Wala ka pang natanggap na offer.</div></div>}
          {offers.map((offer: any) => {
            const st = offerStatusMap[offer.status] || { label: offer.status, bg: '#f3f4f6', color: '#6b7280' }
            const isHired = ['paid','active','hired'].includes(offer.status)
            const isClosed = offer.status === 'declined'
            const isCounterDeclined = offer.status === 'counter_declined'
            const offerExpired = isCounterDeclined && Date.now() - new Date(offer.created_at).getTime() > 48 * 60 * 60 * 1000
            return (
              <div key={offer.id} style={s.card}>
                <div style={{ padding: '13px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div><div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>Job Offer</div><div style={{ fontSize: '11px', color: '#9ca3af' }}>{new Date(offer.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</div></div>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '50px', background: st.bg, color: st.color, whiteSpace: 'nowrap' as const }}>{st.label}</span>
                  </div>
                  <div style={{ ...s.infoBox, opacity: isClosed ? .6 : 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div><div style={s.lbl10}>Sahod</div><div style={{ fontFamily: 'serif', fontSize: '16px', fontWeight: 900, color: isClosed ? '#6b7280' : '#1a6b3c' }}>₱{offer.salary?.toLocaleString()}<span style={{ fontSize: '10px', fontWeight: 400, color: '#9ca3af' }}>/buwan</span></div></div>
                      <div><div style={s.lbl10}>Lokasyon</div><div style={{ ...s.val13, color: isClosed ? '#6b7280' : '#1a1a1a' }}>{offer.city || '—'}</div></div>
                      <div><div style={s.lbl10}>Setup</div><div style={{ ...s.val13, color: isClosed ? '#6b7280' : '#1a1a1a' }}>{offer.setup || '—'}</div></div>
                      <div><div style={s.lbl10}>Pamilya</div><div style={{ fontSize: '12px', fontWeight: 600, color: isClosed ? '#6b7280' : '#1a1a1a', lineHeight: 1.4 }}>{householdText(offer.household)} · {petsText(offer.pets)}</div></div>
                    </div>
                  </div>
                  {!isClosed && <>
                    <div style={{ fontSize: '12px', color: '#374151', marginBottom: '4px' }}>Kailangan: <strong>{offer.scope?.join(' · ') || '—'}</strong></div>
                    <div style={{ fontSize: '12px', color: '#374151', marginBottom: '10px' }}>Kailan: <strong>{urgencyLabel(offer.urgency)}</strong></div>
                  </>}
                  {offer.status === 'pending' && <button style={s.btn('#c9943a')} onClick={() => router.push(`/offer/review/${offer.id}`)}>Tingnan ang Buong Offer</button>}
                  {offer.status === 'reviewed' && <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '9px', padding: '9px 12px', fontSize: '12px', color: '#2563eb', textAlign: 'center' }}>Hinihintay ang confirmation ng homeowner.</div>}
                  {offer.status === 'countered' && <div style={{ background: '#fef3e2', border: '1px solid #fde8c0', borderRadius: '9px', padding: '9px 12px', fontSize: '12px', color: '#92400e', textAlign: 'center' }}>Naisumite ang iyong counter offer. Hinihintay ang sagot ng homeowner.</div>}
                  {(offer.status === 'agreed' || offer.status === 'payment_pending') && <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '9px', padding: '9px 12px', fontSize: '12px', color: '#92400e', textAlign: 'center', fontWeight: 600 }}>Hinihintay ang bayad ng homeowner.</div>}
                  {isHired && (
                    <>
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '9px', padding: '9px 12px', fontSize: '12px', color: '#166534', fontWeight: 600, textAlign: 'center', marginBottom: '10px' }}>HIRED! Inaantay na ang pagdating mo sa lugar ng pagtatrabahuan.</div>
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 14px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#166534', marginBottom: '10px' }}>Contact your employer</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>{offer.homeowner?.profiles?.full_name?.split(' ')[0] || 'Homeowner'}</div>
                        <div style={{ fontSize: '13px', color: '#374151', marginBottom: '12px' }}>{offer.homeowner?.profiles?.mobile || '—'}</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <a href={`viber://chat?number=${toIntl(offer.homeowner?.profiles?.mobile)}`} style={{ flex: 1, padding: '9px', borderRadius: '9px', background: '#7c3aed', color: '#fff', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textAlign: 'center' as const, textDecoration: 'none', display: 'block' }}>💬 Viber</a>
                          <a href={`https://wa.me/${toIntl(offer.homeowner?.profiles?.mobile)}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '9px', borderRadius: '9px', background: '#16a34a', color: '#fff', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textAlign: 'center' as const, textDecoration: 'none', display: 'block' }}>💬 WhatsApp</a>
                        </div>
                      </div>
                    </>
                  )}
                  {isCounterDeclined && (
                    <>
                      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '9px', padding: '11px 13px', fontSize: '12px', color: '#78350f', lineHeight: 1.75, marginBottom: '10px' }}>
                        Ang iyong mga proposed na pagbabago sa offer ay hindi tinanggap ng homeowner.
                        <br /><br />
                        Ang orihinal na offer ay nananatiling valid hanggang 48 oras mula nang ito ay unang ipadala. Maaari mo pa itong tanggapin o tanggihan.
                      </div>
                      {offerExpired ? (
                        <div style={{ background: '#f3f4f6', borderRadius: '9px', padding: '10px 12px', fontSize: '12px', color: '#6b7280', textAlign: 'center' as const }}>
                          Nag-expire na ang offer.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                          <button
                            disabled={actioning === offer.id}
                            style={{ ...s.btn('#1a6b3c'), opacity: actioning === offer.id ? .6 : 1 }}
                            onClick={async () => {
                              setActioning(offer.id)
                              const { supabase } = await import('../../../lib/supabase')
                              await supabase.from('offers').update({ status: 'agreed', fare_agreed: offer.fare_estimate }).eq('id', offer.id)
                              window.location.reload()
                            }}
                          >
                            {actioning === offer.id ? 'Processing...' : 'Tanggapin ang Orihinal na Offer'}
                          </button>
                          <button
                            disabled={actioning === offer.id}
                            style={{ width: '100%', padding: '11px', borderRadius: '10px', background: 'transparent', border: '1.5px solid #fecaca', color: '#dc2626', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: actioning === offer.id ? .6 : 1 }}
                            onClick={async () => {
                              setActioning(offer.id)
                              const { supabase } = await import('../../../lib/supabase')
                              await supabase.from('offers').update({ status: 'declined' }).eq('id', offer.id)
                              window.location.reload()
                            }}
                          >
                            Tanggihan ang Offer
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  {isClosed && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '9px', padding: '9px 12px', fontSize: '12px', color: '#dc2626', textAlign: 'center' }}>Nakahanap na ng kasambahay ang pamilyang ito.</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'applied' && (
        <div style={{ padding: '14px 14px 32px' }}>
          <div style={{ fontFamily: 'serif', fontSize: '17px', fontWeight: 900, marginBottom: '2px' }}>Mga In-applyan Ko</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '14px' }}>{appliedJobs.length} trabaho ang na-apply mo</div>
          {appliedJobs.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px' }}><div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✋</div><div style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.7 }}>Wala ka pang na-apply na trabaho.</div></div>}
          {appliedJobs.map((job: any) => (
            <div key={job.id} style={s.card}>
              <div style={{ padding: '13px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div><div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '1px' }}>Pamilya sa {job.city}</div><div style={{ fontSize: '11px', color: '#9ca3af' }}>{urgencyLabel(job.urgency)}</div></div>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '50px', background: '#fffbeb', color: '#92400e' }}>Hinihintay</span>
                </div>
                <div style={s.infoBox}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div><div style={s.lbl10}>Sahod</div><div style={{ fontFamily: 'serif', fontSize: '16px', fontWeight: 900, color: '#1a6b3c' }}>₱{job.salary?.toLocaleString()}<span style={{ fontSize: '10px', fontWeight: 400, color: '#9ca3af' }}>/buwan</span></div></div>
                    <div><div style={s.lbl10}>Lokasyon</div><div style={s.val13}>{job.city}</div></div>
                    <div><div style={s.lbl10}>Setup</div><div style={s.val13}>{job.setup}</div></div>
                    <div><div style={s.lbl10}>Pamilya</div><div style={{ fontSize: '12px', fontWeight: 600, lineHeight: 1.4 }}>{householdText(job.household)} · {petsText(job.pets)}</div></div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#374151', marginBottom: '4px' }}>Kailangan: <strong>{job.scope?.join(' · ') || '—'}</strong></div>
                <div style={{ fontSize: '12px', color: '#374151', marginBottom: '10px' }}>Kailan: <strong>{urgencyLabel(job.urgency)}</strong></div>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '9px', padding: '9px 12px', fontSize: '12px', color: '#92400e', textAlign: 'center' }}>
                  Hinihintay pa ang sagot ng homeowner. Mag-aabiso kami sa SMS.
                </div>
              </div>
            </div>
          ))}
          {appliedJobs.length > 0 && <button style={{ ...s.btn('#c9943a'), marginTop: '8px' }} onClick={() => setTab('jobs')}>Mag-apply pa ng ibang trabaho</button>}
        </div>
      )}

      {showProfile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 50 }} onClick={() => setShowProfile(false)}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#faf8f5', borderRadius: '20px 20px 0 0', padding: '20px 16px 48px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ width: '40px', height: '4px', background: '#e5e0d8', borderRadius: '2px', margin: '0 auto 18px' }}></div>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fef3e2', border: '2px solid #fde8c0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 10px', overflow: 'hidden' }}>
                {profile?.selfie_url
                  ? <img src={profile.selfie_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : '👩'}
              </div>
              <div style={{ fontFamily: 'serif', fontSize: '20px', fontWeight: 900 }}>{profile?.full_name}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>{profile?.mobile}</div>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 12px', borderRadius: '50px', background: kb?.status === 'available' ? '#f0fdf4' : '#fef3e2', border: `1px solid ${kb?.status === 'available' ? '#bbf7d0' : '#fde8c0'}`, color: kb?.status === 'available' ? '#166534' : '#92400e' }}>
                {kb?.status === 'available' ? 'Available' : kb?.status === 'hired' ? 'Naka-hire' : 'Pending'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
              {[{ n: offers.length, l: 'Mga Offer', c: '#c9943a' }, { n: appliedIds.size, l: 'In-apply', c: '#2563eb' }, { n: offers.filter(o => ['paid','active','hired'].includes(o.status)).length, l: 'Na-hire', c: '#1a6b3c' }].map((stat, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: '10px', padding: '10px', border: '1px solid #ede8e0', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'serif', fontSize: '20px', fontWeight: 900, color: stat.c }}>{stat.n}</div>
                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>{stat.l}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #ede8e0', padding: '14px', marginBottom: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#9ca3af', marginBottom: '10px' }}>Detalye</div>
              {[{ label: 'Probinsya', value: kb?.province || profile?.city || '—' }, { label: 'Setup', value: kb?.setup || '—' }, { label: 'Civil Status', value: kb?.civil_status || '—' }, { label: 'Bilang ng Anak', value: kb?.num_children !== undefined ? String(kb.num_children) : '—' }, { label: 'Availability', value: kb?.availability || '—' }].map((row, i, arr) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #faf8f5' : 'none' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>{row.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>
            {kb?.skills?.length > 0 && (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #ede8e0', padding: '14px', marginBottom: '14px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#9ca3af', marginBottom: '10px' }}>Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {kb.skills.map((sk: string, i: number) => <span key={i} style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: '#f3ede5', color: '#92400e' }}>{sk}</span>)}
                </div>
              </div>
            )}
            <button onClick={() => setShowProfile(false)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #ede8e0', background: 'transparent', color: '#6b7280', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: '8px' }}>Isara</button>
            <button onClick={handleSignOut} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #fecaca', background: 'transparent', color: '#dc2626', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Sign Out</button>
          </div>
        </div>
      )}
    </div>
  )
}
