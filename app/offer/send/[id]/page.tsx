'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'

const PAYMONGO_LINK_499 = process.env.NEXT_PUBLIC_PAYMONGO_LINK_499 || ''

const TRANSPORT_PROVINCES = [
  'Leyte', 'Southern Leyte', 'Samar', 'Eastern Samar', 'Northern Samar', 'Western Samar',
  'Camarines Norte', 'Camarines Sur', 'Albay', 'Sorsogon', 'Catanduanes', 'Masbate',
]

export default function SendOfferPage({ params }: any) {
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
    city: 'Quezon City',
    adults: '1',
    seniors: '0',
    kids: '0',
    pets: 'None',
    transport_arrangement: '' as 'direct' | 'maidit_transport' | '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [hwProvince, setHwProvince] = useState<string | null>(null)
  const [transportDirectType, setTransportDirectType] = useState<'homeowner_pays' | 'reimburse' | 'kasambahay_pays' | ''>('')

  useEffect(() => {
    const init = async () => {
      const { supabase } = await import('../../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: kbData } = await supabase.from('kasambahay').select('*, profiles(full_name, mobile, city)').eq('id', kasambahayId).single()
      setKb(kbData)
      const { data: hw } = await supabase.from('homeowners').select('id, province, subscription_expires_at').eq('profile_id', user.id).single()
      const subscribed = !!(hw?.subscription_expires_at && new Date(hw.subscription_expires_at) > new Date())
      if (!subscribed) setShowPaywall(true)
      setHwProvince(hw?.province || null)
    }
    init()
  }, [kasambahayId])

  const handleSendOffer = async () => {
    if (!form.salary || form.scope.length === 0) { setError('Please fill in the monthly salary and scope of work.'); return }
    if (showTransportSection && showMaidItOption && !form.transport_arrangement) {
      setError('Please choose a transport arrangement.'); return
    }
    if (showTransportSection && isDirect && !transportDirectType) {
      setError('Please choose how transport will be paid.'); return
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

  const scopeItems = ['All-around Maid','Cook','Laundry','Nanny','Pet Care','Elder Care','Driver','Grocery / Errands']
  const toggleScope = (sc: string) => setForm(f => ({ ...f, scope: f.scope.includes(sc) ? f.scope.filter((x: string) => x !== sc) : [...f.scope, sc] }))

  const kbProvince = kb?.province || ''
  const sameProvince = !!(hwProvince && kbProvince && hwProvince === kbProvince)
  // Show transport section whenever kb has a province and it differs from homeowner's
  const showTransportSection = !!(kb && kbProvince && !sameProvince)
  // Show MaidIt option only for Leyte/Samar/Bicol
  const showMaidItOption = TRANSPORT_PROVINCES.includes(kbProvince)
  // Direct is active if explicitly chosen, or if it's the only option available
  const isDirect = form.transport_arrangement === 'direct' || (showTransportSection && !showMaidItOption)
  const isMaidIt = form.transport_arrangement === 'maidit_transport'
  const transportBlocked = showTransportSection && (
    (showMaidItOption && !form.transport_arrangement) ||   // both options shown but none chosen
    (isDirect && !transportDirectType)                     // Direct chosen but no sub-option
  )

  const s: any = {
    wrap: { minHeight: '100vh', background: '#faf8f5', fontFamily: 'sans-serif', color: '#1a1a1a' },
    head: { background: '#fff', borderBottom: '1px solid #ede8e0', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' },
    body: { padding: '20px 18px 48px' },
    lbl: { display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#9ca3af', marginBottom: '4px' },
    inp: { width: '100%', padding: '11px 13px', border: '1.5px solid #e5e0d8', borderRadius: '11px', fontSize: '14px', background: '#fff', color: '#1a1a1a', fontFamily: 'sans-serif', outline: 'none', marginBottom: '12px', boxSizing: 'border-box' as const },
    sel: { width: '100%', padding: '11px 13px', border: '1.5px solid #e5e0d8', borderRadius: '11px', fontSize: '14px', background: '#fff', color: '#1a1a1a', fontFamily: 'sans-serif', outline: 'none', marginBottom: '12px', boxSizing: 'border-box' as const },
    btn: { width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: '#1a6b3c', color: '#fff', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '10px' },
    btnAmber: { width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: '#c9943a', color: '#fff', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '10px' },
    btnOutline: { width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #ede8e0', background: 'transparent', color: '#6b7280', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },
    numBtn: (active: boolean) => ({ padding: '8px 14px', borderRadius: '8px', border: active ? '1.5px solid #c9943a' : '1.5px solid #e5e0d8', background: active ? '#fef3e2' : '#fff', color: active ? '#92400e' : '#6b7280', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }),
    radioCard: (active: boolean) => ({ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '11px 13px', borderRadius: '10px', border: active ? '1.5px solid #1a6b3c' : '1.5px solid #e5e0d8', background: active ? '#f0fdf4' : '#fff', cursor: 'pointer', marginBottom: '7px' }),
    radioCardAmber: (active: boolean) => ({ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '11px 13px', borderRadius: '10px', border: active ? '1.5px solid #c9943a' : '1.5px solid #e5e0d8', background: active ? '#fffbeb' : '#fff', cursor: 'pointer', marginBottom: '7px' }),
    radioDot: (active: boolean, amber?: boolean) => ({ width: '16px', height: '16px', borderRadius: '50%', border: active ? `5px solid ${amber ? '#c9943a' : '#1a6b3c'}` : '2px solid #d1d5db', background: '#fff', flexShrink: 0, marginTop: '1px' }),
  }

  if (success) return (
    <div style={{ ...s.wrap, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
      <h1 style={{ fontFamily: 'serif', fontSize: '1.4rem', fontWeight: 900, color: '#1a6b3c', marginBottom: '8px' }}>Offer Sent!</h1>
      <p style={{ color: '#6b7280', fontSize: '13px', lineHeight: 1.7, marginBottom: '24px' }}>Your offer has been sent. The kasambahay will review it.</p>
      <button style={{ ...s.btn, maxWidth: '320px' }} onClick={() => router.push('/dashboard/homeowner')}>Back to Dashboard</button>
    </div>
  )

  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '18px', cursor: 'pointer', padding: 0 }}>←</button>
        <div>
          <div style={{ fontFamily: 'serif', fontSize: '15px', fontWeight: 900 }}>Send Job Offer</div>
        </div>
      </div>
      <div style={s.body}>
        {kb && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '14px', border: '1px solid #ede8e0', marginBottom: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#fef3e2', border: '2px solid #fde8c0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>👩</div>
            <div><div style={{ fontWeight: 700, fontSize: '14px' }}>{kb.profiles?.full_name}</div><div style={{ fontSize: '12px', color: '#9ca3af' }}>{kb.province} · {kb.setup}</div></div>
          </div>
        )}
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '9px', padding: '10px 13px', fontSize: '13px', color: '#dc2626', marginBottom: '12px' }}>{error}</div>}

        <label style={s.lbl}>Monthly Salary (₱) *</label>
        <input style={s.inp} type="number" placeholder="e.g. 9000" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} />

        <label style={s.lbl}>When do you need them?</label>
        <select style={s.sel} value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}>
          <option>ASAP</option><option>Within a few days</option><option>Next week</option><option>Flexible / To be discussed</option>
        </select>

        <label style={s.lbl}>Start Date</label>
        <input style={s.inp} type="date" value={form.start_date} min={new Date().toISOString().split('T')[0]} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />

        <label style={s.lbl}>Setup</label>
        <select style={s.sel} value={form.setup} onChange={e => setForm(f => ({ ...f, setup: e.target.value }))}>
          <option>Stay-in</option><option>Stay-out</option><option>Either</option>
        </select>

        <label style={s.lbl}>City</label>
        <select style={s.sel} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}>
          <option>Quezon City</option><option>Makati</option><option>Pasig</option><option>Taguig</option><option>Mandaluyong</option><option>Marikina</option><option>Paranaque</option><option>Las Pinas</option>
        </select>

        <label style={s.lbl}>Household</label>
        <div style={{ background: '#fff', border: '1.5px solid #e5e0d8', borderRadius: '11px', padding: '13px', marginBottom: '12px' }}>
          {[
            { label: 'Adults', key: 'adults' },
            { label: 'Seniors (60+)', key: 'seniors' },
            { label: 'Kids', key: 'kids' },
          ].map(({ label, key }) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: '#374151', fontWeight: 600 }}>{label}</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['0','1','2','3','4+'].map(n => (
                  <button key={n} type="button" style={s.numBtn(form[key as keyof typeof form] === n)}
                    onClick={() => setForm(f => ({ ...f, [key]: n }))}>{n}</button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <label style={s.lbl}>Pets</label>
        <select style={s.sel} value={form.pets} onChange={e => setForm(f => ({ ...f, pets: e.target.value }))}>
          <option value="None">No Pets</option>
          <option value="Dog">Dog</option>
          <option value="Cat">Cat</option>
          <option value="Dog & Cat">Dog &amp; Cat</option>
          <option value="Others">Others</option>
        </select>

        <label style={s.lbl}>Scope of work *</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '20px' }}>
          {scopeItems.map(sc => (
            <button key={sc} onClick={() => toggleScope(sc)} style={{ padding: '9px 10px', borderRadius: '9px', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textAlign: 'center' as const, border: form.scope.includes(sc) ? '1.5px solid #c9943a' : '1.5px solid #e5e0d8', background: form.scope.includes(sc) ? '#fef3e2' : '#fff', color: form.scope.includes(sc) ? '#92400e' : '#6b7280' }}>{sc}</button>
          ))}
        </div>

        {/* Transport Arrangement */}
        {showTransportSection && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#9ca3af', marginBottom: '8px' }}>
              Transport Arrangement {showMaidItOption ? '*' : ''}
            </div>

            {/* Direct card — always shown; clickable only when MaidIt option also exists */}
            <div style={showMaidItOption ? { display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'flex-start' } : {}}>
              <div
                onClick={() => showMaidItOption && setForm(f => ({ ...f, transport_arrangement: 'direct' }))}
                style={{
                  padding: '14px', borderRadius: '12px',
                  cursor: showMaidItOption ? 'pointer' : 'default',
                  border: isDirect ? '2px solid #1a6b3c' : '1.5px solid #e5e0d8',
                  background: isDirect ? '#f0fdf4' : '#fff',
                }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px' }}>Direct</div>
                <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.5, marginBottom: '6px' }}>You coordinate transport with the kasambahay directly.</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a6b3c', marginBottom: isDirect ? '10px' : 0 }}>Free</div>
                {isDirect && (
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
                    {([
                      { value: 'homeowner_pays', label: 'I will pay for transport', sub: 'Kasambahay provides fare estimate on review' },
                      { value: 'reimburse', label: 'Kasambahay pays first, I reimburse on arrival' },
                      { value: 'kasambahay_pays', label: 'Kasambahay pays her own fare' },
                    ] as const).map(opt => (
                      <div key={opt.value}
                        onClick={e => { e.stopPropagation(); setTransportDirectType(opt.value) }}
                        style={{
                          display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '8px 10px',
                          borderRadius: '8px', cursor: 'pointer',
                          border: transportDirectType === opt.value ? '1.5px solid #1a6b3c' : '1.5px solid #d1d5db',
                          background: transportDirectType === opt.value ? '#f0fdf4' : '#fff',
                        }}>
                        <div style={{
                          width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                          border: transportDirectType === opt.value ? '4px solid #1a6b3c' : '2px solid #d1d5db',
                          background: '#fff',
                        }} />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.4 }}>{opt.label}</div>
                          {'sub' in opt && <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px', lineHeight: 1.4 }}>{opt.sub}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* OR divider + MaidIt card — only for Leyte/Samar/Bicol */}
              {showMaidItOption && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 2px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af' }}>or</span>
                  </div>
                  <div
                    onClick={() => setForm(f => ({ ...f, transport_arrangement: 'maidit_transport' }))}
                    style={{
                      padding: '14px', borderRadius: '12px', cursor: 'pointer',
                      border: isMaidIt ? '2px solid #c9943a' : '1.5px solid #e5e0d8',
                      background: isMaidIt ? '#fffbeb' : '#fff',
                    }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px' }}>🛡️ MaidIt Assisted Travel</div>
                    <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.5, marginBottom: isMaidIt ? '10px' : '0' }}>We coordinate transport and guarantee arrival.</div>
                    {!isMaidIt && <div style={{ fontSize: '13px', fontWeight: 700, color: '#c9943a', marginTop: '6px' }}>+₱6,000</div>}
                    {isMaidIt && (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px', marginBottom: '10px' }}>
                          {[
                            'Payment released only after confirmed arrival',
                            'No need to send money directly to anyone',
                            'If kasambahay does not arrive, your ₱6,000 is returned',
                          ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', gap: '7px', alignItems: 'flex-start' }}>
                              <span style={{ color: '#c9943a', fontWeight: 700, fontSize: '13px', marginTop: '1px' }}>✓</span>
                              <span style={{ fontSize: '12px', color: '#374151', lineHeight: 1.5 }}>{item}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' as const }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, background: '#fde8c0', color: '#92400e', borderRadius: '5px', padding: '3px 7px' }}>₱5,500 transport</span>
                          <span style={{ fontSize: '11px', fontWeight: 600, background: '#fde8c0', color: '#92400e', borderRadius: '5px', padding: '3px 7px' }}>₱500 MaidIt fee</span>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {showMaidItOption && (
              <div style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center' as const, marginTop: '8px', lineHeight: 1.5 }}>
                MaidIt transport fee is included in the hire fee payment at checkout.
              </div>
            )}
          </div>
        )}

        <button style={{ ...s.btn, opacity: submitting || transportBlocked ? .5 : 1 }} onClick={handleSendOffer} disabled={submitting || transportBlocked}>
          {submitting ? 'Sending...' : 'Send Offer →'}
        </button>
      </div>

      {showPaywall && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '340px', width: '100%' }}>
            <div style={{ fontFamily: 'serif', fontSize: '1.2rem', fontWeight: 900, marginBottom: '6px', color: '#1a1a1a' }}>Subscribe to MaidIt — ₱499/month</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px', lineHeight: 1.6 }}>Get platform access + 1 hiring fee credit (₱499 off your first hire)</div>
            <button style={s.btn} onClick={() => { window.location.href = PAYMONGO_LINK_499 }}>Subscribe for ₱499 →</button>
            <button style={s.btnOutline} onClick={() => router.push('/dashboard/homeowner')}>Maybe later</button>
          </div>
        </div>
      )}
    </div>
  )
}
