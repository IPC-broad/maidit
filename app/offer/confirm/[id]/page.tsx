'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function OfferConfirmPage() {
  const router = useRouter()
  const params = useParams()
  const offerId = params?.id as string

  const [offer, setOffer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [action, setAction] = useState<'review'|'counter'|'done'>('review')
  const [counterFare, setCounterFare] = useState('')

  useEffect(() => {
    const init = async () => {
      const { supabase } = await import('../../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('offers')
        .select('*, kasambahay(*, profiles(*))')
        .eq('id', offerId)
        .single()

      setOffer(data)
      setLoading(false)
    }
    init()
  }, [offerId])

  const handleAgree = async () => {
    setSubmitting(true)
    setError('')

    const { supabase } = await import('../../../../lib/supabase')
    await supabase.from('offers').update({
      fare_agreed: offer.fare_estimate,
      status: 'agreed'
    }).eq('id', offerId)

    setSubmitting(false)
    setAction('done')
  }

  const handleCounterFare = async () => {
    if (!counterFare) { setError('Please enter a counter fare amount'); return }
    setSubmitting(true)

    const { supabase } = await import('../../../../lib/supabase')
    await supabase.from('offers').update({
      fare_countered: parseInt(counterFare),
      status: 'fare_countered'
    }).eq('id', offerId)

    setSubmitting(false)
    setAction('done')
  }

  const handleDecline = async () => {
    const { supabase } = await import('../../../../lib/supabase')
    await supabase.from('offers').update({ status: 'declined' }).eq('id', offerId)
    router.push('/dashboard/homeowner')
  }

  const s: any = {
    wrap: { minHeight:'100vh', background:'#f9fafb', fontFamily:'sans-serif', color:'#111827' },
    head: { background:'#0d1117', padding:'14px 18px', display:'flex', alignItems:'center', gap:'10px' },
    back: { background:'none', border:'none', color:'rgba(255,255,255,.5)', fontSize:'1rem', cursor:'pointer', padding:0 },
    body: { padding:'20px 18px 40px' },
    card: { background:'#fff', borderRadius:'12px', padding:'14px', border:'1.5px solid #e5e7eb', marginBottom:'14px' },
    cardTitle: { fontSize:'.65rem', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'.5px', color:'#6b7280', marginBottom:'10px' },
    row: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #f3f4f6' },
    rowLast: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0' },
    rowLabel: { fontSize:'.8rem', color:'#6b7280' },
    rowValue: { fontSize:'.84rem', fontWeight:700, color:'#111827' },
    err: { background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'9px', padding:'10px 13px', fontSize:'.78rem', color:'#dc2626', marginBottom:'13px' },
    btn: { width:'100%', padding:'13px', borderRadius:'12px', border:'none', background:'#1a6b3c', color:'#fff', fontFamily:'sans-serif', fontSize:'.92rem', fontWeight:700, cursor:'pointer', marginBottom:'8px' },
    btnOutline: { width:'100%', padding:'12px', borderRadius:'12px', border:'1.5px solid #e5e7eb', background:'transparent', color:'#6b7280', fontFamily:'sans-serif', fontSize:'.86rem', fontWeight:600, cursor:'pointer', marginBottom:'8px' },
    btnRed: { width:'100%', padding:'11px', borderRadius:'12px', border:'1.5px solid #fecaca', background:'transparent', color:'#dc2626', fontFamily:'sans-serif', fontSize:'.82rem', fontWeight:600, cursor:'pointer' },
    lbl: { display:'block', fontSize:'.63rem', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'.5px', color:'#6b7280', marginBottom:'4px' },
    input: { width:'100%', padding:'11px 13px', border:'1.5px solid #e5e7eb', borderRadius:'11px', fontFamily:'sans-serif', fontSize:'.88rem', outline:'none', marginBottom:'13px', background:'#fff', color:'#111827' },
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f9fafb', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif', color:'#6b7280' }}>
      Loading...
    </div>
  )

  if (action === 'done') return (
    <div style={{ minHeight:'100vh', background:'#f9fafb', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'28px', textAlign:'center', fontFamily:'sans-serif' }}>
      <div style={{ fontSize:'3rem', marginBottom:'16px' }}>🎉</div>
      <h1 style={{ fontFamily:'serif', fontSize:'1.4rem', fontWeight:900, color:'#1a6b3c', marginBottom:'8px' }}>All Agreed!</h1>
      <p style={{ color:'#6b7280', fontSize:'.84rem', lineHeight:1.7, marginBottom:'24px' }}>
        Proceed to pay the ₱2,001 Hire Protection Fee<br/>to complete the hire.
      </p>
      <button
        style={{ ...s.btn, maxWidth:'320px' }}
        onClick={() => router.push(`/pay/${offerId}`)}
      >
        Pay ₱2,001 Hire Fee →
      </button>
      <button style={{ ...s.btnOutline, maxWidth:'320px' }} onClick={() => router.push('/dashboard/homeowner')}>
        Pay Later
      </button>
    </div>
  )

  if (!offer) return (
    <div style={{ minHeight:'100vh', background:'#f9fafb', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif', color:'#6b7280' }}>
      Offer not found.
    </div>
  )

  const kbName = offer?.kasambahay?.profiles?.full_name?.split(' ')[0]
  const kbProvince = offer?.kasambahay?.province || offer?.kasambahay?.profiles?.city
  const hasTransport = offer?.transport_arrangement !== null
  const fareEstimate = offer?.fare_estimate

  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <button style={s.back} onClick={() => router.back()}>←</button>
        <span style={{ fontFamily:'serif', fontSize:'1rem', fontWeight:900, color:'#fff' }}>
          Confirm Offer
        </span>
      </div>

      <div style={s.body}>
        <div style={{ fontFamily:'serif', fontSize:'1.1rem', fontWeight:900, marginBottom:'4px' }}>
          {kbName} reviewed your offer ✅
        </div>
        <div style={{ fontSize:'.74rem', color:'#6b7280', marginBottom:'18px' }}>
          All terms confirmed. One last step — agree on the fare.
        </div>

        {error && <div style={s.err}>⚠️ {error}</div>}

        <div style={s.card}>
          <div style={s.cardTitle}>Agreed Terms</div>
          <div style={s.row}><span style={s.rowLabel}>Salary</span><span style={s.rowValue}>₱{offer.salary?.toLocaleString()}/mo</span></div>
          <div style={s.row}><span style={s.rowLabel}>Start Date</span><span style={s.rowValue}>{new Date(offer.start_date).toLocaleDateString('en-PH', { month:'long', day:'numeric', year:'numeric' })}</span></div>
          <div style={s.row}><span style={s.rowLabel}>Setup</span><span style={s.rowValue}>{offer.setup}</span></div>
          <div style={s.rowLast}><span style={s.rowLabel}>Scope</span><span style={s.rowValue} style={{ fontSize:'.74rem', maxWidth:'55%', textAlign:'right' as const }}>{offer.scope?.join(', ')}</span></div>
        </div>

        {hasTransport && fareEstimate && (
          <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'11px', padding:'13px 14px', marginBottom:'14px' }}>
            <div style={{ fontSize:'.72rem', fontWeight:700, color:'#92400e', marginBottom:'8px' }}>
              🚌 Transport — Fare Estimate from {kbName}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
              <div>
                <div style={{ fontSize:'.84rem', fontWeight:700, color:'#111827' }}>₱{fareEstimate?.toLocaleString()}</div>
                <div style={{ fontSize:'.68rem', color:'#92400e' }}>{kbProvince} → Metro Manila</div>
              </div>
              <div style={{ fontSize:'.72rem', color:'#78350f', textAlign:'right' as const, maxWidth:'55%', lineHeight:1.5 }}>
                Your arrangement: {offer.transport_arrangement === 'full' ? 'You shoulder full fare' : offer.transport_arrangement === 'reimburse' ? 'You reimburse on arrival' : 'Kasambahay pays own fare'}
              </div>
            </div>
            <div style={{ fontSize:'.68rem', color:'#92400e', background:'rgba(0,0,0,.04)', borderRadius:'7px', padding:'8px 10px', lineHeight:1.5 }}>
              This is an estimate only. Actual fare to be settled directly between you and the kasambahay/referror outside the app.
            </div>
          </div>
        )}

        {hasTransport && !fareEstimate && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'11px', padding:'13px 14px', marginBottom:'14px' }}>
            <div style={{ fontSize:'.78rem', color:'#dc2626', lineHeight:1.6 }}>
              ⚠️ No fare estimate provided yet. Please contact {kbName} or their referror directly to confirm the transport amount before agreeing.
            </div>
          </div>
        )}

        {action === 'review' && (
          <>
            <div style={{ background:'#f0fdf4', border:'1px solid rgba(26,107,60,.2)', borderRadius:'11px', padding:'13px', marginBottom:'16px', fontSize:'.74rem', color:'#166534', lineHeight:1.7 }}>
              After agreeing you will be asked to pay the<br/>
              <strong>₱2,001 Hire Protection Fee</strong><br/>
              Transport ({fareEstimate ? `~₱${fareEstimate?.toLocaleString()}` : 'amount TBD'}) to be settled directly.
            </div>

            <button
              style={{ ...s.btn, opacity: submitting ? .6 : 1 }}
              onClick={handleAgree}
              disabled={submitting}
            >
              {submitting ? 'Confirming...' : `Yes, ₱${fareEstimate?.toLocaleString() || 'TBD'} — Proceed to Payment →`}
            </button>

            {fareEstimate && (
              <button style={s.btnOutline} onClick={() => setAction('counter')}>
                Counter Fare Amount
              </button>
            )}

            <button style={s.btnRed} onClick={handleDecline}>
              Decline Offer
            </button>
          </>
        )}

        {action === 'counter' && (
          <div style={s.card}>
            <div style={s.cardTitle}>Counter the Fare</div>
            <div style={{ fontSize:'.76rem', color:'#6b7280', marginBottom:'12px', lineHeight:1.5 }}>
              {kbName} estimated ₱{fareEstimate?.toLocaleString()}. You can offer a different amount. One round only.
            </div>
            {error && <div style={s.err}>⚠️ {error}</div>}
            <label style={s.lbl}>Your Counter Fare (₱)</label>
            <input
              style={s.input}
              type="number"
              placeholder="e.g. 320"
              value={counterFare}
              onChange={e => setCounterFare(e.target.value)}
            />
            <button style={{ ...s.btn, opacity: submitting ? .6 : 1 }} onClick={handleCounterFare} disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Counter →'}
            </button>
            <button style={s.btnOutline} onClick={() => setAction('review')}>← Back</button>
          </div>
        )}
      </div>
    </div>
  )
}
