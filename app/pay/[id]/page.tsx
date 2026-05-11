'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

const PAYMONGO_LINK      = process.env.NEXT_PUBLIC_PAYMONGO_LINK      || 'https://pm.link/org-9FQv6XBpoCxdDMaMPY8gze3N/bK90nx0'
const PAYMONGO_LINK_2500 = process.env.NEXT_PUBLIC_PAYMONGO_LINK_2500 || ''
const PAYMONGO_LINK_8001 = process.env.NEXT_PUBLIC_PAYMONGO_LINK_8001 || ''
const PAYMONGO_LINK_8500 = process.env.NEXT_PUBLIC_PAYMONGO_LINK_8500 || ''
const MAIDIT_WA          = process.env.NEXT_PUBLIC_MAIDIT_WHATSAPP    || '63XXXXXXXXX'

export default function PayPage() {
  const router = useRouter()
  const params = useParams()
  const offerId = params?.id as string

  const [offer, setOffer] = useState<any>(null)
  const [hwRecord, setHwRecord] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'pay' | 'confirm' | 'done' | 'already'>('pay')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { supabase } = await import('../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('offers')
        .select('*, kasambahay:kasambahay_id(*, profiles(full_name))')
        .eq('id', offerId)
        .single()

      if (!data) { router.push('/dashboard/homeowner'); return }

      let { data: hw } = await supabase
        .from('homeowners')
        .select('id, subscription_credit_used, subscription_expires_at')
        .eq('profile_id', user.id)
        .single()

      if (!hw) {
        const { data: created } = await supabase
          .from('homeowners')
          .insert({ profile_id: user.id })
          .select('id, subscription_credit_used, subscription_expires_at')
          .single()
        hw = created
      }

      setHwRecord(hw)

      if (['paid', 'payment_pending', 'active', 'hired'].includes(data.status)) {
        setStep('already')
      }
      setOffer(data)
      setLoading(false)
    }
    init()
  }, [offerId])

  const now = new Date()
  const creditApplicable =
    hwRecord &&
    !hwRecord.subscription_credit_used &&
    hwRecord.subscription_expires_at &&
    new Date(hwRecord.subscription_expires_at) > now

  const hasTransport = offer?.transport_service === true
  const baseFee = creditApplicable ? 2001 : 2500
  const transportFee = hasTransport ? 6000 : 0
  const total = baseFee + transportFee

  const resolvedLink =
    !hasTransport && creditApplicable  ? PAYMONGO_LINK      :
    !hasTransport && !creditApplicable ? PAYMONGO_LINK_2500  :
     hasTransport && creditApplicable  ? PAYMONGO_LINK_8001  :
                                         PAYMONGO_LINK_8500
  const paymongoLink = resolvedLink
  const paymongoMissing = !resolvedLink

  const handleOpenPayMongo = () => {
    if (!paymongoLink) return
    setStep('confirm')
    window.open(paymongoLink, '_blank')
  }

  const handleConfirmPaid = async () => {
    setSubmitting(true)
    const { supabase } = await import('../../../lib/supabase')

    await supabase.from('offers').update({ status: 'payment_pending' }).eq('id', offerId)

    if (hwRecord?.id) {
      const updates: any = { subscription_credit_used: true }
      if (!hwRecord.subscription_expires_at) {
        const exp = new Date()
        exp.setDate(exp.getDate() + 30)
        updates.subscription_expires_at = exp.toISOString()
      }
      await supabase.from('homeowners').update(updates).eq('id', hwRecord.id)
    }

    await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'payment_confirmed', offerId })
    })

    setSubmitting(false)
    setStep('done')
  }

  const s: any = {
    wrap: { minHeight: '100vh', background: '#f9fafb', fontFamily: 'sans-serif', color: '#111827' },
    head: { background: '#1a6b3c', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' },
    back: { background: 'none', border: 'none', color: '#9ca3af', fontSize: '1rem', cursor: 'pointer', padding: 0 },
    body: { padding: '24px 18px 48px', maxWidth: '480px', margin: '0 auto' },
    card: { background: '#fff', borderRadius: '12px', padding: '16px', border: '1.5px solid #e5e7eb', marginBottom: '14px' },
    btn: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#1a6b3c', color: '#fff', fontFamily: 'sans-serif', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginBottom: '10px' },
    btnBlue: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#0d6efd', color: '#fff', fontFamily: 'sans-serif', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginBottom: '10px' },
    btnOutline: { width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e5e7eb', background: 'transparent', color: '#6b7280', fontFamily: 'sans-serif', fontSize: '.86rem', fontWeight: 600, cursor: 'pointer' },
    center: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '28px', textAlign: 'center' as const, fontFamily: 'sans-serif', background: '#f9fafb' },
  }

  if (loading) return <div style={{ ...s.center, color: '#6b7280' }}>Loading...</div>

  if (step === 'already') return (
    <div style={s.center}>
      <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>⏳</div>
      <h1 style={{ fontFamily: 'serif', fontSize: '1.3rem', fontWeight: 900, color: '#111827', marginBottom: '8px' }}>Payment Under Review</h1>
      <p style={{ color: '#6b7280', fontSize: '.84rem', lineHeight: 1.7, marginBottom: '24px' }}>
        We received your payment notification.<br />
        We'll activate your hire once confirmed.
      </p>
      <button style={{ ...s.btnOutline, maxWidth: '300px' }} onClick={() => router.push('/dashboard/homeowner')}>
        Back to Dashboard
      </button>
    </div>
  )

  if (step === 'done') return (
    <div style={s.center}>
      <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>✅</div>
      <h1 style={{ fontFamily: 'serif', fontSize: '1.4rem', fontWeight: 900, color: '#1a6b3c', marginBottom: '8px' }}>Payment Submitted!</h1>
      <p style={{ color: '#6b7280', fontSize: '.84rem', lineHeight: 1.7, marginBottom: '24px' }}>
        We're verifying your PayMongo payment.<br />
        You'll get an SMS once your hire is active.<br />
        Usually within a few hours.
      </p>
      <button style={{ ...s.btn, maxWidth: '300px' }} onClick={() => router.push('/dashboard/homeowner')}>
        Back to Dashboard
      </button>
    </div>
  )

  if (step === 'confirm') return (
    <div style={s.wrap}>
      <div style={s.head}>
        <span style={{ fontFamily: 'serif', fontSize: '1rem', fontWeight: 900, color: '#fff' }}>Confirm Payment</span>
      </div>
      <div style={s.body}>
        <div style={{ fontFamily: 'serif', fontSize: '1.1rem', fontWeight: 900, marginBottom: '6px' }}>
          Did you complete the payment? 💳
        </div>
        <div style={{ fontSize: '.76rem', color: '#6b7280', marginBottom: '20px', lineHeight: 1.6 }}>
          Once you've completed the PayMongo payment, tap the button below to notify us. We'll verify and activate your hire within a few minutes.
        </div>
        <div style={{ ...s.card, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '.74rem', color: '#166534', lineHeight: 1.8 }}>
            ✅ PayMongo accepts <strong>QRPh</strong><br />
            Scan with GCash, BPI, BDO, UnionBank, or any bank app.<br />
            Make sure the amount shows <strong>₱{total.toLocaleString()}.00</strong>.
          </div>
        </div>
        <button style={{ ...s.btn, opacity: submitting ? .6 : 1 }} onClick={handleConfirmPaid} disabled={submitting}>
          {submitting ? 'Verifying...' : "✅ I've Completed Payment"}
        </button>
        {!paymongoMissing && (
          <button style={s.btnBlue} onClick={() => window.open(paymongoLink, '_blank')}>
            ↗ Re-open PayMongo
          </button>
        )}
        <button style={s.btnOutline} onClick={() => router.push('/dashboard/homeowner')}>
          Pay later
        </button>
      </div>
    </div>
  )

  const kbName = offer?.kasambahay?.profiles?.full_name?.split(' ')[0] || 'your kasambahay'

  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <button style={s.back} onClick={() => router.back()}>←</button>
        <span style={{ fontFamily: 'serif', fontSize: '1rem', fontWeight: 900, color: '#1a1a1a' }}>Pay Hire Fee</span>
      </div>
      <div style={s.body}>
        <div style={{ fontFamily: 'serif', fontSize: '1.15rem', fontWeight: 900, marginBottom: '4px' }}>
          Last step — pay the hire fee 🎉
        </div>
        <div style={{ fontSize: '.76rem', color: '#6b7280', marginBottom: '20px', lineHeight: 1.6 }}>
          Activate your hire of <strong>{kbName}</strong> with a one-time fee.
        </div>

        {/* Pricing Breakdown */}
        <div style={s.card}>
          <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#6b7280', marginBottom: '12px' }}>Pricing Breakdown</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: creditApplicable ? '1px solid #f3f4f6' : (hasTransport ? '1px solid #f3f4f6' : 'none') }}>
            <span style={{ fontSize: '.82rem', color: '#374151' }}>Hiring Fee</span>
            {creditApplicable
              ? <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '.82rem' }}>₱2,500</span>
              : <span style={{ fontSize: '.82rem', color: '#374151', fontWeight: 600 }}>₱2,500</span>
            }
          </div>
          {creditApplicable && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: hasTransport ? '1px solid #f3f4f6' : 'none' }}>
              <span style={{ fontSize: '.82rem', color: '#374151' }}>First hire credit</span>
              <span style={{ fontSize: '.82rem', color: '#1a6b3c', fontWeight: 700 }}>−₱499</span>
            </div>
          )}
          {hasTransport && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
              <div>
                <div style={{ fontSize: '.82rem', color: '#374151' }}>🛡️ MaidIt Assisted Travel</div>
                <div style={{ fontSize: '.68rem', color: '#9ca3af', marginTop: '1px' }}>₱5,500 transport · ₱500 MaidIt fee</div>
              </div>
              <span style={{ fontSize: '.82rem', color: '#92400e', fontWeight: 700 }}>+₱6,000</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0 4px' }}>
            <span style={{ fontSize: '.88rem', fontWeight: 700, color: '#111827' }}>You pay today</span>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#1a6b3c', fontFamily: 'serif' }}>₱{total.toLocaleString()}</span>
          </div>
        </div>

        {/* Credit applied note */}
        {creditApplicable && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '11px', padding: '11px 14px', marginBottom: '14px' }}>
            <div style={{ fontSize: '.74rem', color: '#166534', lineHeight: 1.7 }}>
              ✅ <strong>First hire credit applied:</strong> Your ₱499 subscription credit has been deducted — you pay ₱2,001 for this hire. Subsequent hires within 30 days are ₱2,500.
            </div>
          </div>
        )}

        {/* Transport protection note */}
        {hasTransport && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '11px', padding: '12px 14px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.1rem' }}>🛡️</span>
              <div>
                <div style={{ fontSize: '.74rem', fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>Transport coordination</div>
                <div style={{ fontSize: '.72rem', color: '#78350f', lineHeight: 1.6 }}>
                  Transport coordination is considered completed once the kasambahay has safely arrived. Rematch within 30 days remains free, but transport for replacement is separate.
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={s.card}>
          <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#6b7280', marginBottom: '10px' }}>What's included</div>
          {[
            { icon: '🔄', text: '1 free rematch if the kasambahay does not arrive or leaves within 30 days. Transport for replacement hires is separate.' },
            { icon: '✅', text: 'Verified kasambahay profile' },
            { icon: '📋', text: 'RA 10361-compliant employment terms' },
            { icon: '🎁', text: 'One hiring fee credit (₱499) valid for 30 days — applied to your first hire' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', padding: '7px 0', borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1rem', minWidth: '20px' }}>{item.icon}</span>
              <span style={{ fontSize: '.78rem', color: '#374151', lineHeight: 1.5 }}>{item.text}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '11px', padding: '12px 14px', marginBottom: '18px' }}>
          <div style={{ fontSize: '.7rem', fontWeight: 700, color: '#92400e', marginBottom: '6px' }}>How it works:</div>
          {[
            'Tap "Pay via PayMongo" — a new tab opens',
            'Scan the QRPh code with your bank app or GCash',
            'Come back here and tap "I\'ve paid"',
          ].map((txt, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '.68rem', fontWeight: 700, color: '#92400e', minWidth: '14px' }}>{i + 1}.</span>
              <span style={{ fontSize: '.72rem', color: '#78350f', lineHeight: 1.5 }}>{txt}</span>
            </div>
          ))}
        </div>
        {paymongoMissing ? (
          <>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '11px', padding: '12px 14px', marginBottom: '10px' }}>
              <div style={{ fontSize: '.74rem', color: '#dc2626', lineHeight: 1.6 }}>
                Online payment is temporarily unavailable for this amount. Please contact MaidIt to complete payment.
              </div>
            </div>
            <a
              href={`https://wa.me/${MAIDIT_WA}?text=${encodeURIComponent(`Hi, I'd like to complete payment of ₱${total.toLocaleString()} for my hire (offer ${offerId}).`)}`}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '12px', background: '#16a34a', color: '#fff', fontFamily: 'sans-serif', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginBottom: '10px', textAlign: 'center' as const, textDecoration: 'none', boxSizing: 'border-box' as const }}
            >
              💬 Contact MaidIt to Complete Payment
            </a>
          </>
        ) : (
          <button style={s.btn} onClick={handleOpenPayMongo}>
            Pay ₱{total.toLocaleString()} via PayMongo →
          </button>
        )}
        <button style={s.btnOutline} onClick={() => router.push('/dashboard/homeowner')}>
          Pay later
        </button>
        <div style={{ fontSize: '.67rem', color: '#9ca3af', textAlign: 'center' as const, marginTop: '14px', lineHeight: 1.6 }}>
          Secured by PayMongo · QRPh accepted<br />
          Hire activates after payment is verified.
        </div>
      </div>
    </div>
  )
}
