// KASAMBAHAY PAGE — TAGLISH ONLY
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
  const [uploadingId, setUploadingId] = useState(false)
  const [uploadingClearance, setUploadingClearance] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const [activeHomeowners, setActiveHomeowners] = useState(14)
  const [nearbyFamilies, setNearbyFamilies] = useState<any[]>([])

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
          .select('*, household, pets, scope, urgency, start_date, homeowner:homeowner_id(*, profiles(full_name, mobile))')
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
      const { count: hwCount } = await supabase
        .from('homeowners')
        .select('id', { count: 'exact', head: true })
        .eq('has_subscription', true)
      if (hwCount) setActiveHomeowners(hwCount)

      const { data: nearbyData } = await supabase
        .from('homeowners')
        .select('province, municipality')
        .limit(3)
      setNearbyFamilies(nearbyData || [])

      setLoading(false)
    }
    init()
  }, [])

  const handleUpload = async (type: 'id' | 'clearance', file: File) => {
    if (!profile?.id) return
    const setter = type === 'id' ? setUploadingId : setUploadingClearance
    setter(true)
    setUploadMsg('')
    try {
      const { supabase } = await import('../../../lib/supabase')
      const path = `${profile.id}/${type === 'id' ? 'id_photo.jpg' : 'clearance.jpg'}`
      const { error: upErr } = await supabase.storage.from('Documents').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('Documents').getPublicUrl(path)
      const field = type === 'id' ? { id_photo_url: publicUrl, has_govt_id: true } : { clearance_url: publicUrl }
      await supabase.from('kasambahay').update(field).eq('profile_id', profile.id)
      setKb((prev: any) => ({ ...prev, ...field }))
      setUploadMsg(type === 'id' ? '✅ ID na-upload!' : '✅ Clearance na-upload!')
    } catch {
      setUploadMsg('❌ Hindi na-upload. Subukan ulit.')
    }
    setter(false)
    setTimeout(() => setUploadMsg(''), 3000)
  }

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
    pending:          { label: 'May Offer na',                          bg: '#fef3e2', color: '#c9943a' },
    reviewed:         { label: 'Hinihintay ang homeowner',              bg: '#eff6ff', color: '#2563eb' },
    agreed:           { label: 'May Tinanggap na Offer',                bg: '#fffbeb', color: '#92400e' },
    payment_pending:  { label: 'Hinihintay ang bayad',                  bg: '#fffbeb', color: '#92400e' },
    paid:             { label: 'Bayad na',                              bg: '#f0fdf4', color: '#1a6b3c' },
    active:           { label: 'Na-hire na',                            bg: '#f0fdf4', color: '#1a6b3c' },
    hired:            { label: 'Na-hire na',                            bg: '#f0fdf4', color: '#1a6b3c' },
    countered:        { label: 'Counter offer — naghihintay ng sagot',  bg: '#fef3e2', color: '#c9943a' },
    counter_declined: { label: 'Di nagkasundo',                         bg: '#fef2f2', color: '#dc2626' },
    declined:         { label: 'Tinanggihan',                           bg: '#fef2f2', color: '#dc2626' },
    cancelled:        { label: 'Nakansela',                             bg: '#fef2f2', color: '#dc2626' },
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

  const profileItems = [
    { done: !!kb?.facebook_url,  label: 'I-connect ang Facebook' },
    { done: !!kb?.is_verified,   label: 'I-submit ang valid ID' },
    { done: !!kb?.how_referred,  label: 'Sabihin kung paano mo nalaman ang MaidIt' },
  ]
  const completedCount = profileItems.filter(i => i.done).length
  const profilePct = Math.round((completedCount / 3) * 100)
  const missingItems = profileItems.filter(i => !i.done)

  const METRO_MANILA = ['Manila','Quezon City','Makati','Pasig','Taguig','Mandaluyong','San Juan','Marikina','Pasay','Parañaque','Las Piñas','Muntinlupa','Caloocan','Malabon','Navotas','Valenzuela','Pateros']
  const hwLocationLabel = (city: string) => !city ? null : METRO_MANILA.includes(city) ? 'Metro Manila' : city

  const pendingOffers = offers.filter(o => o.status === 'pending').length
  const isHired = offers.some(o => ['hired', 'active', 'paid'].includes(o.status))
  const EXPIRE_MS = 72 * 60 * 60 * 1000
  const activeOffers = offers.filter(o => {
    if (!['pending','agreed','countered','payment_pending','paid','active','hired'].includes(o.status)) return false
    if (o.status === 'pending' && Date.now() - new Date(o.created_at).getTime() > EXPIRE_MS) return false
    return true
  })
  const pastOffers = offers.filter(o => {
    if (['declined','cancelled','counter_declined'].includes(o.status)) return true
    if (o.status === 'pending' && Date.now() - new Date(o.created_at).getTime() > EXPIRE_MS) return true
    return false
  })
  const referralCode = kb?.referred_by || profile?.id || ''
  const referralLink = `https://maidit.vercel.app?ref=${referralCode}`

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

      {profilePct < 100 && (
        <div style={{ background: '#fff', borderBottom: '1px solid #ede8e0', padding: '11px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>Profile mo</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#c9943a' }}>{profilePct}%</span>
          </div>
          <div style={{ background: '#f3f4f6', borderRadius: '4px', height: '6px', marginBottom: '8px' }}>
            <div style={{ width: `${profilePct}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #d97706)', borderRadius: '4px', transition: 'width .3s' }} />
          </div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' as const }}>
            {missingItems.map((item, i) => (
              <span key={i} style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '50px', background: '#fef3e2', color: '#92400e', fontWeight: 600 }}>+ {item.label}</span>
            ))}
          </div>
        </div>
      )}

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
          { id: 'offers',  icon: '📩', label: 'Mga Offer Sayo',      sub: pendingOffers > 0 ? `${pendingOffers} bagong offer` : 'Tingnan' },
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
          {isHired && (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#166534', marginBottom: '4px' }}>I-refer ang Kaibigan</div>
              <div style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 600, marginBottom: '4px' }}>I-share ang iyong referral link at makakuha ng rewards</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px', lineHeight: 1.5 }}>Ipadala ang iyong unique link sa mga kaibigan na naghahanap ng trabaho bilang kasambahay.</div>
              <div style={{ background: '#fff', border: '1px solid #bbf7d0', borderRadius: '9px', padding: '9px 12px', fontSize: '12px', fontFamily: 'monospace', color: '#1a6b3c', wordBreak: 'break-all' as const, marginBottom: '10px' }}>
                {referralLink}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '7px' }}>
                <button
                  onClick={() => { navigator.clipboard.writeText(referralLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500) }) }}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', border: 'none', background: '#1a6b3c', color: '#fff', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {copied ? '✅ Nakopya!' : '📋 Kopyahin ang Link'}
                </button>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`}
                  target="_blank" rel="noreferrer"
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', border: 'none', background: '#1877f2', color: '#fff', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 700, cursor: 'pointer', textAlign: 'center' as const, textDecoration: 'none', display: 'block', boxSizing: 'border-box' as const }}
                >
                  Share sa Facebook
                </a>
              </div>
            </div>
          )}

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

          {/* ── SECTION 1: Bago at Aktibong Offer ── */}
          <div style={{ fontFamily: 'serif', fontSize: '17px', fontWeight: 900, marginBottom: '12px' }}>Bago at Aktibong Offer</div>

          {activeOffers.length === 0 && (
            <div>
              {/* Platform activity strip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', flexShrink: 0, boxShadow: '0 0 0 3px rgba(22,163,74,0.25)' }} />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534' }}>Active ang platform ngayon</div>
                  <div style={{ fontSize: '11px', color: '#16a34a' }}>Naghahanap ng kasambahay ang mga pamilya · {activeHomeowners}+ homeowners</div>
                </div>
              </div>

              {/* Ready state card */}
              <div style={{ background: '#fff', border: '1px solid #ede8e0', borderRadius: '14px', padding: '22px 16px', textAlign: 'center' as const, marginBottom: '12px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🏡</div>
                <div style={{ fontFamily: 'serif', fontSize: '17px', fontWeight: 900, color: '#1a1a1a', marginBottom: '6px' }}>Handa ka na. Abangan ang offer.</div>
                <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.6 }}>Naka-set up na ang iyong profile. Magpapadala ng offer ang mga pamilya na naghahanap ng katulad mo.</div>
              </div>

              {/* Blurred nearby families */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#9ca3af', marginBottom: '8px' }}>Mga pamilya sa paligid mo</div>
                {(nearbyFamilies.length > 0 ? nearbyFamilies : [{municipality:'Lungsod sa Maynila'},{municipality:'Pamilya sa Quezon City'},{municipality:'Lugar sa Makati'}]).map((hw: any, i: number) => (
                  <div key={i} style={{ position: 'relative', marginBottom: '8px' }}>
                    <div style={{ background: '#fff', border: '1px solid #ede8e0', borderRadius: '12px', padding: '12px 48px 12px 14px' }}>
                      <div style={{ filter: 'blur(3px)', pointerEvents: 'none', userSelect: 'none' as const }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}>{hw.municipality || hw.province || 'Pilipinas'}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Naghahanap ng kasambahay</div>
                      </div>
                    </div>
                    <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔒</div>
                  </div>
                ))}
                <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center' as const, marginTop: '2px' }}>I-complete ang iyong profile para makita ang buong detalye</div>
              </div>

              {/* Complete profile CTA — only if progress < 100% */}
              {profilePct < 100 && (
                <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '14px', padding: '16px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>I-complete ang profile mo.</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.88)', marginBottom: '12px', lineHeight: 1.5 }}>Mas maraming offer ang matatanggap mo kapag kumpleto ang iyong profile.</div>
                  <button onClick={() => setShowProfile(true)} style={{ background: '#fff', color: '#d97706', border: 'none', borderRadius: '9px', padding: '9px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>I-edit →</button>
                </div>
              )}

              {/* Tips section */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#9ca3af', marginBottom: '8px' }}>Mga tips para sa iyo</div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                  <div style={{ background: '#fff', border: '1px solid #ede8e0', borderRadius: '12px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '20px', flexShrink: 0 }}>📸</span>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#1a1a1a', marginBottom: '2px' }}>Mag-submit ng valid ID</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.5 }}>Mas mapagkakatiwalaan ka ng mga pamilya kapag may ID verification.</div>
                    </div>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #ede8e0', borderRadius: '12px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '20px', flexShrink: 0 }}>💰</span>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#1a1a1a', marginBottom: '2px' }}>Itakda ang tamang sweldo</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.5 }}>I-review ang iyong hinihinging sahod — siguraduhing naaayon ito sa market rates.</div>
                    </div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #fef3e2, #fff8ed)', border: '1px solid #fde8c0', borderRadius: '12px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '20px', flexShrink: 0 }}>⚡</span>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e' }}>Ang mga kasambahay na may kumpleto ang profile ay 3× mas mabilis na makakuha ng offer</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeOffers.map((offer: any) => {
            const offerIsHired = ['paid','active','hired'].includes(offer.status)
            const loc = hwLocationLabel(offer.city)
            const cardHeader = loc ? `Isang pamilya mula sa ${loc} ang may offer sayo` : 'Isang pamilya ang may offer sayo'
            return (
              <div key={offer.id} style={s.card}>
                <div style={{ padding: '13px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px', lineHeight: 1.4 }}>{cardHeader}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{new Date(offer.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                    {offerIsHired && <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '50px', background: '#f0fdf4', color: '#1a6b3c' }}>HIRED ✅</span>}
                  </div>

                  <div style={s.infoBox}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div><div style={s.lbl10}>Sahod</div><div style={{ fontFamily: 'serif', fontSize: '16px', fontWeight: 900, color: '#1a6b3c' }}>₱{offer.salary?.toLocaleString()}<span style={{ fontSize: '10px', fontWeight: 400, color: '#9ca3af' }}>/buwan</span></div></div>
                      <div><div style={s.lbl10}>Lokasyon</div><div style={s.val13}>{offer.city || '—'}</div></div>
                      <div><div style={s.lbl10}>Setup</div><div style={s.val13}>{offer.setup || '—'}</div></div>
                      {offer.urgency && <div><div style={s.lbl10}>Kelan</div><div style={s.val13}>{urgencyLabel(offer.urgency)}</div></div>}
                    </div>
                    {offer.household && (() => {
                      const h = typeof offer.household === 'string' ? JSON.parse(offer.household) : offer.household
                      const hText = householdText(h)
                      return hText !== '—' ? (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f3f4f6' }}>
                          <div style={s.lbl10}>Pamilya</div>
                          <div style={{ fontSize: '12px', fontWeight: 600 }}>
                            {hText}
                            {offer.pets && offer.pets !== 'No' && offer.pets !== 'Wala' && offer.pets !== 'No Pets' && ` · ${petsText(offer.pets)}`}
                          </div>
                        </div>
                      ) : null
                    })()}
                    {offer.scope?.length > 0 && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f3f4f6' }}>
                        <div style={s.lbl10}>Kailangan</div>
                        <div style={{ fontSize: '12px', fontWeight: 600 }}>{offer.scope.join(', ')}</div>
                      </div>
                    )}
                  </div>

                  {offer.status === 'pending' && (
                    <button
                      style={{ width: '100%', padding: '11px', borderRadius: '10px', border: 'none', background: '#1a6b3c', color: '#fff', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => router.push(`/offer/review/${offer.id}`)}
                    >
                      Tingnan ang buong offer →
                    </button>
                  )}

                  {offer.status === 'agreed' && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '9px', padding: '9px 12px', fontSize: '12px', color: '#92400e', textAlign: 'center' as const, fontWeight: 600 }}>
                      Tinanggap mo na — naghihintay ng bayad ng homeowner
                    </div>
                  )}

                  {offer.status === 'countered' && (
                    <div style={{ background: '#fef3e2', border: '1px solid #fde8c0', borderRadius: '9px', padding: '9px 12px', fontSize: '12px', color: '#92400e', textAlign: 'center' as const }}>
                      Nag-counter ka — naghihintay ng sagot ng homeowner
                    </div>
                  )}

                  {offer.status === 'payment_pending' && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '9px', padding: '9px 12px', fontSize: '12px', color: '#92400e', textAlign: 'center' as const, fontWeight: 600 }}>
                      Naghihintay ng bayad ng homeowner
                    </div>
                  )}

                  {offerIsHired && (
                    <>
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '9px', padding: '10px 12px', fontSize: '13px', color: '#166534', fontWeight: 700, textAlign: 'center' as const, marginBottom: '10px' }}>
                        💰 Bayad na! Maghanda ka na.
                      </div>
                      {offer.homeowner?.profiles?.mobile && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 14px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#166534', marginBottom: '6px' }}>I-contact ang employer mo</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>{offer.homeowner.profiles.full_name}</div>
                          <div style={{ fontSize: '13px', color: '#374151', marginBottom: '10px' }}>{offer.homeowner.profiles.mobile}</div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <a href={`viber://chat?number=${toIntl(offer.homeowner.profiles.mobile)}`} style={{ flex: 1, padding: '9px', borderRadius: '9px', background: '#7c3aed', color: '#fff', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 700, textAlign: 'center' as const, textDecoration: 'none', display: 'block' }}>💬 Viber</a>
                            <a href={`https://wa.me/${toIntl(offer.homeowner.profiles.mobile)}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '9px', borderRadius: '9px', background: '#16a34a', color: '#fff', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 700, textAlign: 'center' as const, textDecoration: 'none', display: 'block' }}>💬 WhatsApp</a>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}

          {/* ── SECTION 2: Nakaraang Offer ── */}
          {pastOffers.length > 0 && (
            <>
              <div style={{ fontFamily: 'serif', fontSize: '16px', fontWeight: 900, color: '#9ca3af', marginTop: '28px', marginBottom: '12px' }}>Nakaraang Offer</div>
              {pastOffers.map((offer: any) => {
                const isExpiredPending = offer.status === 'pending' && Date.now() - new Date(offer.created_at).getTime() > EXPIRE_MS
                const pastLabel =
                  isExpiredPending           ? 'Na-expire na (lumagpas ng 3 araw)'
                  : offer.status === 'declined'        ? 'Tinanggihan mo'
                  : offer.status === 'cancelled'       ? 'Nakansela ng homeowner'
                  : offer.status === 'counter_declined'? 'Di nagkasundo'
                  : offer.status
                return (
                  <div key={offer.id} style={{ ...s.card, opacity: .65 }}>
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#6b7280', marginBottom: '2px' }}>{offer.homeowner?.profiles?.full_name?.split(' ')[0] || 'Homeowner'}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>{new Date(offer.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '50px', background: '#f3f4f6', color: '#6b7280', whiteSpace: 'nowrap' as const }}>{pastLabel}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <div><div style={s.lbl10}>Sahod</div><div style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af' }}>₱{offer.salary?.toLocaleString()}</div></div>
                        <div><div style={s.lbl10}>Lokasyon</div><div style={{ fontSize: '13px', fontWeight: 600, color: '#9ca3af' }}>{offer.city || '—'}</div></div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}
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
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #ede8e0', padding: '14px', marginBottom: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#9ca3af', marginBottom: '10px' }}>Mga Dokumento</div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', marginBottom: '12px' }}>
                {[
                  { label: 'Valid ID', ok: !!kb?.has_govt_id, types: kb?.govt_id_types },
                  { label: 'NBI Clearance', ok: !!kb?.has_nbi, types: null },
                  { label: 'Police Clearance', ok: !!kb?.has_police_clearance, types: null },
                ].map((doc, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#374151' }}>{doc.label}</span>
                      {doc.types?.length > 0 && <div style={{ fontSize: '10px', color: '#9ca3af' }}>{doc.types.join(', ')}</div>}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: doc.ok ? '#1a6b3c' : '#9ca3af' }}>{doc.ok ? '✅ Mayroon' : '⏳ Wala pa'}</span>
                  </div>
                ))}
              </div>
              {uploadMsg && <div style={{ fontSize: '12px', fontWeight: 600, color: uploadMsg.startsWith('✅') ? '#1a6b3c' : '#dc2626', marginBottom: '8px' }}>{uploadMsg}</div>}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                <label style={{ width: '100%', padding: '10px', borderRadius: '9px', border: '1.5px solid #e5e0d8', background: uploadingId ? '#f3f4f6' : '#faf8f5', color: '#374151', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 700, cursor: uploadingId ? 'default' : 'pointer', textAlign: 'center' as const, display: 'block' }}>
                  {uploadingId ? 'Nag-u-upload...' : '📎 Mag-upload ng Valid ID'}
                  <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} disabled={uploadingId} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload('id', f) }} />
                </label>
                <label style={{ width: '100%', padding: '10px', borderRadius: '9px', border: '1.5px solid #e5e0d8', background: uploadingClearance ? '#f3f4f6' : '#faf8f5', color: '#374151', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 700, cursor: uploadingClearance ? 'default' : 'pointer', textAlign: 'center' as const, display: 'block' }}>
                  {uploadingClearance ? 'Nag-u-upload...' : '📎 Mag-upload ng NBI/Police Clearance'}
                  <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} disabled={uploadingClearance} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload('clearance', f) }} />
                </label>
              </div>
            </div>

            <button onClick={() => setShowProfile(false)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #ede8e0', background: 'transparent', color: '#6b7280', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: '8px' }}>Isara</button>
            <button onClick={handleSignOut} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #fecaca', background: 'transparent', color: '#dc2626', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Mag-Sign Out</button>
          </div>
        </div>
      )}
    </div>
  )
}
