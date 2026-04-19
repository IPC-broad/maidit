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
  const [action, setAction] = useState<'review'|'counter'|'done'>('review')
  const [counterSalary, setCounterSalary] = useState('')
  const [fareInput, setFareInput] = useState('')
  const [busLine, setBusLine] = useState('')
  const [isProvince, setIsProvince] = useState(false)
  const hasFareFromApp = false

  const [checklist, setChecklist] = useState({
    salary: false,
    location: false,
    scope: false,
    start_date: false,
    setup: false,
    day_off: false,
    transport: false,
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

      const { data: kbProfile } = await supabase
        .from('profiles')
        .select('city')
        .eq('id', user.id)
        .single()

      const city = kbProfile?.city || ''
      const provincial = !metro.includes(city)
      setIsProvince(provincial)

      if (data?.fare_estimate) {
        setFareInput(data.fare_estimate.toString())
      }

      setLoading(false)
    }
    init()
  }, [offerId])

  const allChecked = () => {
    const required = ['salary','location','scope','start_date','setup','day_off']
    if (isProvince) required.push('transport')
    return required.every(k => checklist[k as keyof typeof checklist])
  }

  const fareRequired = () => {
    return isProvince && !fareInput
  }

  const handleAccept = async () => {
    if (!allChecked()) { setError('Please tick all items before accepting'); return }
    if (fareRequired()) { setError('Please enter your estimated fare'); return }
    setSubmitting(true)
    setError('')

    const { supabase } = await import('../../../../lib/supabase')

    await supabase.from('offers').update({
      fare_estimate: fareInput ? parseInt(fareInput) : null,
      checklist_confirmed: true,
      status: 'fare_pending'
    }).eq('id', offerId)

    setSubmitting(false)
    setAction('done')
  }

  const handleCounter = async () => {
    if (!counterSalary) { setError('Please enter a counter salary'); return }
    setSubmitting(true)

    const { supabase } = await import('../../../../lib/supabase')
    await supabase.from('offers').update({
      status: 'countered',
      fare_estimate: fareInput ? parseInt(fareInput) : null,
    }).eq('id', offerId)

    setSubmitting(false)
    setAction('done')
  }

  const handleDecline = async () => {
    const { supabase } = await import('../../../../lib/supabase')
    await supabase.from('offers').update({ status: 'declined' }).eq('id', offerId)
    router.push('/dashboard/kasambahay')
  }

  const tick = (k: string) => setChecklist(c => ({ ...c, [k]: !c[k as keyof typeof c] }))

  const s: any = {
    wrap: { minHeight:'100vh', background:'#f9fafb', fontFamily:'sans-serif', color:'#111827' },
    head: { background:'#0d1117', padding:'14px 18px', display:'flex', alignItems:'center', gap:'10px' },
    back: { background:'none', border:'none', color:'rgba(255,255,255,.5)', fontSize:'1rem', cursor:'pointer', padding:0 },
    body: { padding:'20px 18px 40px' },
    card: { background:'#fff', borderRadius:'12px', padding:'14px', border:'1.5px solid #e5e7eb', marginBottom:'14px' },
    cardTitle: { fontSize:'.65rem', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'.5px', color:'#6b7280', marginBottom:'10px' },
    check: { display:'flex', gap:'11px', alignItems:'flex-start', padding:'10px 0', borderBottom:'1px solid #f3f4f6', cursor:'pointer' },
    checkLast: { display:'flex', gap:'11px', alignItems:'flex-start', padding:'10px 0', cursor:'pointer' },
    checkbox: (checked: boolean) => ({ width:'20px', height:'20px', borderRadius:'5px', border:'2px solid', borderColor: checked ? '#c9943a' : '#d1d5db', background: checked ? '#c9943a' : '#fff', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', marginTop:'1px' }),
    checkLabel: { fontSize:'.82rem', color:'#374151', lineHeight:1.5 },
    lbl: { display:'block', fontSize:'.63rem', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'.5px', color:'#6b7280', marginBottom:'4px', marginTop:'10px' },
    input: { width:'100%', padding:'11px 13px', border:'1.5px solid #e5e7eb', borderRadius:'11px', fontFamily:'sans-serif', fontSize:'.88rem', outline:'none', marginBottom:'8px', background:'#fff', color:'#111827' },
    err: { background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'9px', padding:'10px 13px', fontSize:'.78rem', color:'#dc2626', marginBottom:'13px' },
    btn: { width:'100%', padding:'13px', borderRadius:'12px', border:'none', background:'#c9943a', color:'#fff', fontFamily:'sans-serif', fontSize:'.92rem', fontWeight:700, cursor:'pointer', marginBottom:'8px' },
    btnOutline: { width:'100%', padding:'12px', borderRadius:'12px', border:'1.5px solid #e5e7eb', background:'transparent', color:'#6b7280', fontFamily:'sans-serif', fontSize:'.86rem', fontWeight:600, cursor:'pointer', marginBottom:'8px' },
    btnRed: { width:'100%', padding:'11px', borderRadius:'12px', border:'1.5px solid #fecaca', background:'transparent', color:'#dc2626', fontFamily:'sans-serif', fontSize:'.82rem', fontWeight:600, cursor:'pointer' },
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f9fafb', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif', color:'#6b7280' }}>
      Loading offer...
    </div>
  )

  if (action === 'done') return (
    <div style={{ minHeight:'100vh', background:'#f9fafb', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'28px', textAlign:'center', fontFamily:'sans-serif' }}>
      <div style={{ fontSize:'3rem', marginBottom:'16px' }}>✅</div>
      <h1 style={{ fontFamily:'serif', fontSize:'1.4rem', fontWeight:900, color:'#c9943a', marginBottom:'8px' }}>Response Sent!</h1>
      <p style={{ color:'#6b7280', fontSize:'.84rem', lineHeight:1.7, marginBottom:'24px' }}>
        The homeowner will review your fare estimate.<br/>We will notify you when they respond.
      </p>
      <button style={s.btn} onClick={() => router.push('/dashboard/kasambahay')}>Back to Jobs</button>
    </div>
  )

  if (!offer) return (
    <div style={{ minHeight:'100vh', background:'#f9fafb', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif', color:'#6b7280' }}>
      Offer not found.
    </div>
  )

  const hwName = offer?.homeowners?.profiles?.full_name || 'Homeowner'
  const hwCity = offer?.homeowners?.profiles?.city || ''

  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <button style={s.back} onClick={() => router.back()}>←</button>
        <span style={{ fontFamily:'serif', fontSize:'1rem', fontWeight:900, color:'#fff' }}>Review Offer</span>
      </div>

      <div style={s.body}>
        <div style={{ fontFamily:'serif', fontSize:'1.1rem', fontWeight:900, marginBottom:'4px' }}>
          Job Offer from {hwCity}
        </div>
        <div style={{ fontSize:'.74rem', color:'#6b7280', marginBottom:'18px' }}>
          Expires in 48 hours · Please review carefully
        </div>

        {error && <div style={s.err}>⚠️ {error}</div>}

        <div style={s.card}>
          <div style={s.cardTitle}>Please tick each item to confirm</div>

          {[
            { key:'salary', label:`Salary: ₱${offer.salary?.toLocaleString()}/month — I agree` },
            { key:'location', label:`Place of work: ${hwCity} — I agree` },
            { key:'scope', label:`Scope: ${offer.scope?.join(', ')} — I can do this` },
            { key:'start_date', label:`Start date: ${new Date(offer.start_date).toLocaleDateString('en-PH', { month:'long', day:'numeric', year:'numeric' })} — I am available` },
            { key:'setup', label:`Setup: ${offer.setup} — I agree` },
            { key:'day_off', label:`Day off: ${offer.day_off || 'Every Sunday'} — I agree` },
          ].map((item, i, arr) => (
            <div key={item.key} style={i === arr.length - 1 && !isProvince ? s.checkLast : s.check} onClick={() => tick(item.key)}>
              <div style={s.checkbox(checklist[item.key as keyof typeof checklist])}>
                {checklist[item.key as keyof typeof checklist] && <span style={{ color:'#fff', fontSize:'.7rem', fontWeight:900 }}>✓</span>}
              </div>
              <div style={s.checkLabel}>{item.label}</div>
            </div>
          ))}

          {isProvince && (
            <div style={s.checkLast} onClick={() => tick('transport')}>
              <div style={s.checkbox(checklist.transport)}>
                {checklist.transport && <span style={{ color:'#fff', fontSize:'.7rem', fontWeight:900 }}>✓</span>}
              </div>
              <div style={s.checkLabel}>
                Transport arrangement: Homeowner will {offer.transport_arrangement === 'full' ? 'shoulder full fare' : offer.transport_arrangement === 'reimburse' ? 'reimburse upon arrival' : 'not shoulder fare'} — I understand
              </div>
            </div>
          )}
        </div>

        {isProvince && (
          <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'11px', padding:'13px 14px', marginBottom:'14px' }}>
            <div style={{ fontSize:'.72rem', fontWeight:700, color:'#92400e', marginBottom:'6px' }}>
              🚌 Your Fare Estimate
            </div>
            <div style={{ fontSize:'.74rem', color:'#78350f', lineHeight:1.6, marginBottom:'10px' }}>
              {offer.fare_estimate
                ? `The homeowner has been shown ~₱${offer.fare_estimate?.toLocaleString()} as an estimate. Please confirm or correct the actual fare.`
                : 'No fare estimate was provided yet. Please enter your estimated fare so the homeowner can prepare.'}
            </div>
            <label style={{ ...s.lbl, marginTop:0 }}>Estimated Fare (₱) *</label>
            <input
              style={s.input}
              type="number"
              placeholder="e.g. 380"
              value={fareInput}
              onChange={e => setFareInput(e.target.value)}
            />
            <label style={s.lbl}>Bus Line (optional)</label>
            <input
              style={{ ...s.input, marginBottom:0 }}
              type="text"
              placeholder="e.g. JAC Liner"
              value={busLine}
              onChange={e => setBusLine(e.target.value)}
            />
            <div style={{ fontSize:'.68rem', color:'#92400e', marginTop:'6px' }}>
              This is an estimate only. Final amount to be settled directly with the homeowner.
            </div>
          </div>
        )}

        {action === 'review' && (
          <>
            <button
              style={{ ...s.btn, opacity: submitting ? .6 : 1 }}
              onClick={handleAccept}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Accept Offer →'}
            </button>
            <button style={s.btnOutline} onClick={() => setAction('counter')}>
              Counter Offer
            </button>
            <button style={s.btnRed} onClick={handleDecline}>
              Decline
            </button>
          </>
        )}

        {action === 'counter' && (
          <div style={s.card}>
            <div style={s.cardTitle}>Counter Offer</div>
            <div style={{ fontSize:'.76rem', color:'#6b7280', marginBottom:'12px', lineHeight:1.5 }}>
              You can counter the salary. One round only — homeowner will accept or decline your counter.
            </div>
            <label style={{ ...s.lbl, marginTop:0 }}>Your Counter Salary (₱)</label>
            <input
              style={s.input}
              type="number"
              placeholder="e.g. 10000"
              value={counterSalary}
              onChange={e => setCounterSalary(e.target.value)}
            />
            {error && <div style={s.err}>⚠️ {error}</div>}
            <button style={{ ...s.btn, opacity: submitting ? .6 : 1 }} onClick={handleCounter} disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Counter →'}
            </button>
            <button style={s.btnOutline} onClick={() => setAction('review')}>← Back</button>
          </div>
        )}
      </div>
    </div>
  )
}
