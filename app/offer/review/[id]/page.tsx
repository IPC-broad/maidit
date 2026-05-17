// KASAMBAHAY OFFER REVIEW — All UI text must be in Taglish
// DO NOT translate to English during audits
// DO NOT restructure or simplify this page's layout
// Homeowner pages = English, Kasambahay/Partner pages = Taglish
'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function OfferReviewPage() {
  const router = useRouter()
  const params = useParams()
  const offerId = params?.id as string

  const [offer, setOffer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [action, setAction] = useState<'review'|'done'>('review')
  const [fareInput, setFareInput] = useState('')
  const [busLine, setBusLine] = useState('')
  const [isProvince, setIsProvince] = useState(false)
  const [counterSalary, setCounterSalary] = useState('')
  const [counterDate, setCounterDate] = useState('')
  const [transportCountered, setTransportCountered] = useState('')

  const [checklist, setChecklist] = useState({
    salary: true,
    location: true,
    scope: true,
    start_date: true,
    setup: true,
    transport: true,
    urgency: true,
    household: true,
    pets: true,
  })

  const metro = ['Quezon City','Makati','Pasig','Taguig','Manila','Mandaluyong','Marikina','Paranaque','Las Pinas','Muntinlupa','Caloocan','Malabon','Navotas','Valenzuela','Pasay','Pateros','San Juan']

  useEffect(() => {
    const init = async () => {
      const { supabase } = await import('../../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('offers')
        .select('*, homeowners(*, profiles(*))')
        .eq('id', offerId)
        .single()
      setOffer(data)
      const { data: kbProfile } = await supabase.from('profiles').select('city').eq('id', user.id).single()
      setIsProvince(!metro.includes(kbProfile?.city || ''))
      if (data?.fare_estimate) setFareInput(data.fare_estimate.toString())
      setLoading(false)
    }
    init()
  }, [offerId])

  const hasValidDate = (val: any) => {
    if (!val) return false
    const d = new Date(val)
    return !isNaN(d.getTime()) && d.getFullYear() >= 2000
  }

  const isCounter = (!checklist.salary && !!counterSalary) ||
    (!checklist.start_date && !!counterDate) ||
    (!checklist.transport && !!transportCountered)

  const formatDate = (val: any) => {
    const d = new Date(val)
    return d.toLocaleDateString('fil-PH', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const transportLabel = (t: string) => {
    if (t === 'full') return 'Amo ang sasagot sa pamasahe'
    if (t === 'reimburse') return 'Ako muna ang sasagot pero irereimburse ng amo pagdating ko'
    return 'Ikaw ang magbabayad ng sarili mong pamasahe'
  }

  const tick = (k: string) => setChecklist(c => ({ ...c, [k]: !c[k as keyof typeof c] }))

  const handleSubmit = async () => {
    if (isProvince && !checklist.transport && !transportCountered) {
      setError('Pakipili ang gusto mong transport arrangement'); return
    }
    if (!checklist.salary && !counterSalary) { setError('Pakilagay ang gusto mong sweldo'); return }
    if (!checklist.start_date && !counterDate) { setError('Pakilagay ang petsa ng iyong pagdating'); return }
    const fareNeeded = isProvince && checklist.transport &&
      (offer?.transport_arrangement === 'full' || offer?.transport_arrangement === 'reimburse') && !fareInput
    if (fareNeeded) { setError('Pakilagay ang iyong estimated na pamasahe'); return }

    setSubmitting(true)
    setError('')
    const { supabase } = await import('../../../../lib/supabase')

    if (isCounter) {
      await supabase.from('offers').update({
        status: 'countered',
        fare_estimate: fareInput ? parseInt(fareInput) : null,
        bus_line: busLine || null,
        ...(counterSalary ? { fare_countered: parseInt(counterSalary) } : {}),
        ...(counterDate ? { estimated_arrival: counterDate } : {}),
        ...(transportCountered ? { transport_countered: transportCountered } : {}),
      }).eq('id', offerId)
    } else {
      await supabase.from('offers').update({
        fare_estimate: fareInput ? parseInt(fareInput) : null,
        bus_line: busLine || null,
        checklist_confirmed: true,
        status: 'agreed',
        estimated_arrival: counterDate || null,
      }).eq('id', offerId)
      fetch('/api/send-sms', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'offer_agreed', offerId }) }).catch(() => {})
    }

    setSubmitting(false)
    setAction('done')
  }

  const handleDecline = async () => {
    const { supabase } = await import('../../../../lib/supabase')
    await supabase.from('offers').update({ status: 'declined' }).eq('id', offerId)
    router.push('/dashboard/kasambahay')
  }

  const toggleBox = (checked: boolean) => ({
    width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0 as const, marginTop: '1px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    background: checked ? '#16a34a' : '#ef4444',
  })

  const toggleStatus = (checked: boolean) => ({
    fontSize: '.7rem', fontWeight: 700 as const,
    color: checked ? '#16a34a' : '#ef4444',
    marginTop: '3px',
  })

  const s: any = {
    wrap: { minHeight:'100vh', background:'#faf8f5', fontFamily:'sans-serif', color:'#111827' },
    head: { background:'#fff', borderBottom:'1px solid #ede8e0', padding:'14px 18px', display:'flex', alignItems:'center', gap:'10px' },
    back: { background:'none', border:'none', color:'#9ca3af', fontSize:'1.1rem', cursor:'pointer', padding:0 },
    body: { padding:'20px 18px 40px' },
    card: { background:'#fff', borderRadius:'12px', padding:'14px', border:'1.5px solid #e5e7eb', marginBottom:'14px' },
    cardTitle: { fontSize:'.65rem', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'.5px', color:'#9ca3af', marginBottom:'10px' },
    row: { display:'flex', gap:'11px', alignItems:'flex-start', padding:'10px 0', borderBottom:'1px solid #f3f4f6' },
    rowLast: { display:'flex', gap:'11px', alignItems:'flex-start', padding:'10px 0' },
    checkLabel: { fontSize:'.82rem', color:'#374151', lineHeight:1.5 },
    input: { width:'100%', padding:'9px 11px', border:'1.5px solid #fde8c0', borderRadius:'9px', fontFamily:'sans-serif', fontSize:'.84rem', outline:'none', background:'#fff', color:'#111827', boxSizing:'border-box' as const, marginTop:'4px' },
    err: { background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'9px', padding:'10px 13px', fontSize:'.78rem', color:'#dc2626', marginBottom:'13px' },
    btn: (bg: string) => ({ width:'100%', padding:'13px', borderRadius:'12px', border:'none', background: bg, color:'#fff', fontFamily:'sans-serif', fontSize:'.92rem', fontWeight:700, cursor:'pointer', marginBottom:'8px' }),
    btnOutline: { width:'100%', padding:'11px', borderRadius:'12px', border:'1.5px solid #fecaca', background:'transparent', color:'#dc2626', fontFamily:'sans-serif', fontSize:'.82rem', fontWeight:600, cursor:'pointer' },
    counterBox: { marginTop:'8px', background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:'10px', padding:'10px 12px' },
    counterLabel: { fontSize:'.68rem', fontWeight:700, color:'#92400e', marginBottom:'6px' },
  }

  if (loading) return <div style={{ minHeight:'100vh', background:'#faf8f5', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif', color:'#6b7280' }}>Naglo-load...</div>

  if (action === 'done') return (
    <div style={{ minHeight:'100vh', background:'#faf8f5', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'28px', textAlign:'center', fontFamily:'sans-serif' }}>
      <div style={{ fontSize:'3rem', marginBottom:'16px' }}>{isCounter ? '📨' : '✅'}</div>
      <h1 style={{ fontFamily:'serif', fontSize:'1.4rem', fontWeight:900, color: isCounter ? '#c9943a' : '#1a6b3c', marginBottom:'8px' }}>
        {isCounter ? 'Naisumite ang Counter Offer!' : 'Naisumite na ang sagot mo!'}
      </h1>
      <p style={{ color:'#6b7280', fontSize:'.84rem', lineHeight:1.7, marginBottom:'24px' }}>
        {isCounter
          ? 'Irereview ng homeowner ang iyong counter offer. Aabisuhan ka kapag may sagot.'
          : 'Irereview ng homeowner ang iyong sagot. Aabisuhan ka namin kapag may update.'}
      </p>
      <button style={{ ...s.btn('#c9943a'), maxWidth:'300px' }} onClick={() => router.push('/dashboard/kasambahay')}>Bumalik sa Dashboard</button>
    </div>
  )

  if (!offer) return <div style={{ minHeight:'100vh', background:'#faf8f5', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif', color:'#6b7280' }}>Hindi mahanap ang offer.</div>

  const closedStatuses = ['agreed', 'payment_pending', 'paid', 'active', 'hired', 'declined']
  if (closedStatuses.includes(offer.status)) return (
    <div style={{ minHeight:'100vh', background:'#faf8f5', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'28px', textAlign:'center', fontFamily:'sans-serif' }}>
      <div style={{ fontSize:'3rem', marginBottom:'16px' }}>{['paid','active','hired'].includes(offer.status) ? '🎉' : '📋'}</div>
      <h1 style={{ fontFamily:'serif', fontSize:'1.4rem', fontWeight:900, color:['paid','active','hired'].includes(offer.status) ? '#1a6b3c' : '#6b7280', marginBottom:'8px' }}>
        {['paid','active','hired'].includes(offer.status) ? 'Hired ka na!' : 'Naisumite na ang sagot mo'}
      </h1>
      <p style={{ color:'#6b7280', fontSize:'.84rem', lineHeight:1.7, marginBottom:'24px' }}>
        {['paid','active','hired'].includes(offer.status) ? 'Opisyal ka nang employed.' : 'Hindi na mababago ang offer na ito.'}
      </p>
      <button style={{ width:'100%', maxWidth:'300px', padding:'13px', borderRadius:'12px', border:'none', background:'#c9943a', color:'#fff', fontFamily:'sans-serif', fontSize:'.92rem', fontWeight:700, cursor:'pointer' }} onClick={() => router.push('/dashboard/kasambahay')}>Bumalik sa Dashboard</button>
    </div>
  )

  const hwCity = offer?.homeowners?.profiles?.city || offer?.city || ''
  const showFare = isProvince && checklist.transport &&
    (offer?.transport_arrangement === 'full' || offer?.transport_arrangement === 'reimburse')
  const showStartDate = hasValidDate(offer?.start_date) || offer?.urgency === 'ASAP'
  const household = offer?.household
    ? (typeof offer.household === 'string' ? JSON.parse(offer.household) : offer.household)
    : null
  const hasHousehold = household && (household.adults || household.seniors || household.kids)
  const householdStr = [
    household?.adults ? `${household.adults} adults` : '',
    household?.seniors ? `${household.seniors} seniors` : '',
    household?.kids ? `${household.kids} children` : '',
  ].filter(Boolean).join(', ')
  const showPets = offer?.pets && offer.pets !== 'No Pets'

  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <button style={s.back} onClick={() => router.back()}>←</button>
        <span style={{ fontFamily:'serif', fontSize:'1rem', fontWeight:900, color:'#1a1a1a' }}>I-review ang Offer</span>
      </div>

      <div style={s.body}>
        <div style={{ fontFamily:'serif', fontSize:'1.1rem', fontWeight:900, marginBottom:'4px' }}>Job Offer mula sa {hwCity}</div>
        <div style={{ fontSize:'.74rem', color:'#6b7280', marginBottom:'18px' }}>Mag-e-expire in 48 hours · Pakibasa nang maigi</div>

        {error && <div style={s.err}>⚠️ {error}</div>}

        <div style={s.card}>
          <div style={s.cardTitle}>I-toggle ang bawat item — berde kung sang-ayon, pula kung hindi</div>

          {/* SALARY */}
          <div style={s.row}>
            <div style={toggleBox(checklist.salary)} onClick={() => { tick('salary'); if (checklist.salary) setCounterSalary('') }}>
              <span style={{ color:'#fff', fontSize:'.75rem', fontWeight:900 }}>{checklist.salary ? '✓' : '✗'}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={s.checkLabel} onClick={() => { tick('salary'); if (checklist.salary) setCounterSalary('') }}>
                Sweldo: <strong>₱{offer.salary?.toLocaleString()}/buwan</strong>
              </div>
              <div style={toggleStatus(checklist.salary)}>{checklist.salary ? '✓ Sang-ayon ako' : '✗ Hindi sang-ayon'}</div>
              {!checklist.salary && (
                <div style={s.counterBox}>
                  <div style={s.counterLabel}>Ano ang gusto mong sweldo?</div>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <span style={{ fontSize:'14px', color:'#c9943a', fontWeight:700 }}>₱</span>
                    <input style={s.input} type="number" placeholder="e.g. 11000" value={counterSalary} onChange={e => setCounterSalary(e.target.value)} />
                    <span style={{ fontSize:'11px', color:'#9ca3af', whiteSpace:'nowrap' as const }}>/buwan</span>
                  </div>
                  <div style={{ fontSize:'.65rem', color:'#c9943a', marginTop:'5px' }}>Ito ay magiging counter offer sa sweldo.</div>
                </div>
              )}
            </div>
          </div>

          {/* LOCATION */}
          <div style={s.row} onClick={() => tick('location')}>
            <div style={toggleBox(checklist.location)}>
              <span style={{ color:'#fff', fontSize:'.75rem', fontWeight:900 }}>{checklist.location ? '✓' : '✗'}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={s.checkLabel}>Lugar ng pagtatrabahuan: <strong>{hwCity}</strong></div>
              <div style={toggleStatus(checklist.location)}>{checklist.location ? '✓ Sang-ayon ako' : '✗ Hindi sang-ayon'}</div>
            </div>
          </div>

          {/* SCOPE */}
          <div style={s.row} onClick={() => tick('scope')}>
            <div style={toggleBox(checklist.scope)}>
              <span style={{ color:'#fff', fontSize:'.75rem', fontWeight:900 }}>{checklist.scope ? '✓' : '✗'}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={s.checkLabel}>Mga gawaing bahay: <strong>{offer.scope?.join(', ')}</strong></div>
              <div style={toggleStatus(checklist.scope)}>{checklist.scope ? '✓ Sang-ayon ako' : '✗ Hindi sang-ayon'}</div>
            </div>
          </div>

          {/* START DATE — only when a valid date exists */}
          {showStartDate && (
            <div style={s.row}>
              <div style={toggleBox(checklist.start_date)} onClick={() => { tick('start_date'); if (checklist.start_date) setCounterDate('') }}>
                <span style={{ color:'#fff', fontSize:'.75rem', fontWeight:900 }}>{checklist.start_date ? '✓' : '✗'}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={s.checkLabel} onClick={() => { tick('start_date'); if (checklist.start_date) setCounterDate('') }}>
                  Simula ng trabaho: <strong>{offer?.urgency === 'ASAP' && !hasValidDate(offer?.start_date) ? 'Kailangan na agad' : formatDate(offer.start_date)}</strong>
                </div>
                <div style={toggleStatus(checklist.start_date)} onClick={() => { tick('start_date'); if (checklist.start_date) setCounterDate('') }}>
                  {checklist.start_date ? '✓ Sang-ayon ako' : '✗ Hindi sang-ayon'}
                </div>
                {!checklist.start_date && (
                  <div style={s.counterBox}>
                    <div style={s.counterLabel}>Kailan ka makakarating?</div>
                    <div style={{ fontSize:'.72rem', color:'#78350f', marginBottom:'6px' }}>Piliin ang petsa ng iyong pagdating:</div>
                    <input style={s.input} type="date" value={counterDate} min={new Date().toISOString().split('T')[0]} onChange={e => setCounterDate(e.target.value)} />
                    <div style={{ fontSize:'.65rem', color:'#c9943a', marginTop:'5px' }}>Ito ay magiging counter offer sa start date.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SETUP */}
          <div style={s.row} onClick={() => tick('setup')}>
            <div style={toggleBox(checklist.setup)}>
              <span style={{ color:'#fff', fontSize:'.75rem', fontWeight:900 }}>{checklist.setup ? '✓' : '✗'}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={s.checkLabel}>Setup: <strong>{offer.setup}</strong></div>
              <div style={toggleStatus(checklist.setup)}>{checklist.setup ? '✓ Sang-ayon ako' : '✗ Hindi sang-ayon'}</div>
            </div>
          </div>

          {/* TRANSPORT */}
          {isProvince && (
            <div style={s.row}>
              <div style={toggleBox(checklist.transport)} onClick={() => { tick('transport'); if (checklist.transport) setTransportCountered('') }}>
                <span style={{ color:'#fff', fontSize:'.75rem', fontWeight:900 }}>{checklist.transport ? '✓' : '✗'}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={s.checkLabel} onClick={() => { tick('transport'); if (checklist.transport) setTransportCountered('') }}>
                  Transportasyon: <strong>{transportLabel(offer.transport_arrangement)}</strong>
                </div>
                <div style={toggleStatus(checklist.transport)} onClick={() => { tick('transport'); if (checklist.transport) setTransportCountered('') }}>
                  {checklist.transport ? '✓ Sang-ayon ako' : '✗ Hindi sang-ayon'}
                </div>
                {!checklist.transport && (
                  <div style={s.counterBox}>
                    <div style={s.counterLabel}>Anong arrangement ang gusto mo?</div>
                    {[
                      { val: 'full', label: 'Amo ang magbabayad ng pamasahe' },
                      { val: 'reimburse', label: 'Ako muna ang magbabayad pero irereimburse ng amo pagdating ko' },
                    ].map((opt, i, arr) => (
                      <div
                        key={opt.val}
                        style={{ display:'flex', alignItems:'flex-start', gap:'8px', padding:'7px 0', borderBottom: i < arr.length - 1 ? '1px solid #fee2e2' : 'none', cursor:'pointer' }}
                        onClick={() => setTransportCountered(opt.val)}
                      >
                        <div style={{
                          width:'16px', height:'16px', borderRadius:'50%', border:'2px solid', flexShrink:0, marginTop:'1px',
                          borderColor: transportCountered === opt.val ? '#1a6b3c' : '#d1d5db',
                          background: transportCountered === opt.val ? '#1a6b3c' : '#fff',
                          display:'flex', alignItems:'center', justifyContent:'center',
                        }}>
                          {transportCountered === opt.val && <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#fff' }} />}
                        </div>
                        <span style={{ fontSize:'.76rem', color:'#374151', lineHeight:1.4 }}>{opt.label}</span>
                      </div>
                    ))}
                    {transportCountered && (
                      <div style={{ marginTop:'8px' }}>
                        <label style={{ fontSize:'.63rem', fontWeight:700, color:'#6b7280', textTransform:'uppercase' as const, letterSpacing:'.5px' }}>Estimated Pamasahe (₱)</label>
                        <input style={{ ...s.input, border:'1.5px solid #fde8c0' }} type="number" placeholder="Halimbawa: 380" value={fareInput} onChange={e => setFareInput(e.target.value)} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* URGENCY */}
          {offer?.urgency && (
            <div style={(!hasHousehold && !showPets) ? s.rowLast : s.row} onClick={() => tick('urgency')}>
              <div style={toggleBox(checklist.urgency)}>
                <span style={{ color:'#fff', fontSize:'.75rem', fontWeight:900 }}>{checklist.urgency ? '✓' : '✗'}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={s.checkLabel}>Kelan kailangan: <strong>{offer.urgency}</strong></div>
                <div style={toggleStatus(checklist.urgency)}>{checklist.urgency ? '✓ Sang-ayon ako' : '✗ Hindi sang-ayon'}</div>
              </div>
            </div>
          )}

          {/* HOUSEHOLD */}
          {hasHousehold && (
            <div style={!showPets ? s.rowLast : s.row} onClick={() => tick('household')}>
              <div style={toggleBox(checklist.household)}>
                <span style={{ color:'#fff', fontSize:'.75rem', fontWeight:900 }}>{checklist.household ? '✓' : '✗'}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={s.checkLabel}>Mga miyembro ng pamilya: <strong>{householdStr}</strong></div>
                <div style={toggleStatus(checklist.household)}>{checklist.household ? '✓ Sang-ayon ako' : '✗ Hindi sang-ayon'}</div>
              </div>
            </div>
          )}

          {/* PETS */}
          {showPets && (
            <div style={s.rowLast} onClick={() => tick('pets')}>
              <div style={toggleBox(checklist.pets)}>
                <span style={{ color:'#fff', fontSize:'.75rem', fontWeight:900 }}>{checklist.pets ? '✓' : '✗'}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={s.checkLabel}>Mga alagang hayop: <strong>{offer.pets}</strong></div>
                <div style={toggleStatus(checklist.pets)}>{checklist.pets ? '✓ Sang-ayon ako' : '✗ Hindi sang-ayon'}</div>
              </div>
            </div>
          )}
        </div>

        {/* FARE ESTIMATE — when transport is agreed and employer pays */}
        {showFare && (
          <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'11px', padding:'13px 14px', marginBottom:'14px' }}>
            <div style={{ fontSize:'.72rem', fontWeight:700, color:'#92400e', marginBottom:'6px' }}>Estimated na Pamasahe</div>
            <div style={{ fontSize:'.74rem', color:'#78350f', lineHeight:1.6, marginBottom:'10px' }}>
              {offer.fare_estimate
                ? `Nakita ng homeowner ang ~₱${offer.fare_estimate?.toLocaleString()} bilang estimate. Pakikumpirma o baguhin ang tamang halaga.`
                : 'Wala pang nailagay na estimate. Pakilagay ang inaasahan mong pamasahe para makapaghanda ang homeowner.'}
            </div>
            <label style={{ fontSize:'.63rem', fontWeight:700, color:'#6b7280', textTransform:'uppercase' as const, letterSpacing:'.5px' }}>Estimated Pamasahe (₱) *</label>
            <input style={{ ...s.input, border:'1.5px solid #fde68a' }} type="number" placeholder="Halimbawa: 380" value={fareInput} onChange={e => setFareInput(e.target.value)} />
            <label style={{ fontSize:'.63rem', fontWeight:700, color:'#6b7280', textTransform:'uppercase' as const, letterSpacing:'.5px', display:'block', marginTop:'8px' }}>Bus Line (optional)</label>
            <input style={{ ...s.input, border:'1.5px solid #fde68a' }} type="text" placeholder="Halimbawa: JAC Liner" value={busLine} onChange={e => setBusLine(e.target.value)} />
          </div>
        )}

        {/* COUNTER SUMMARY */}
        {isCounter && (
          <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'10px', padding:'11px 13px', marginBottom:'14px', fontSize:'.78rem', color:'#92400e', lineHeight:1.6 }}>
            <strong>Counter Offer mo:</strong><br/>
            {!checklist.salary && counterSalary && <>Sweldo: ₱{parseInt(counterSalary).toLocaleString()}/buwan<br/></>}
            {!checklist.start_date && counterDate && <>Simula: {formatDate(counterDate)}<br/></>}
            {!checklist.transport && transportCountered && <>Transport: {transportCountered === 'full' ? 'Amo ang magbabayad' : 'Reimburse pagdating'}</>}
          </div>
        )}

        <button
          style={{ ...s.btn(isCounter ? '#1a6b3c' : '#c9943a'), opacity: submitting ? .6 : 1 }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Nagsu-submit...' : isCounter ? 'I-submit ang Counter Offer →' : 'Tanggapin ang Offer →'}
        </button>
        <button style={s.btnOutline} onClick={handleDecline}>Hindi ko tatanggapin</button>
      </div>
    </div>
  )
}
