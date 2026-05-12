'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function PayPage() {
  const router = useRouter()
  const params = useParams()
  const offerId = params?.id as string

  const [offer, setOffer] = useState<any>(null)
  const [hwRecord, setHwRecord] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [linkError, setLinkError] = useState(false)
  const [step, setStep] = useState<'pay' | 'already'>('pay')

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
      setOffer(data)

      if (['paid', 'payment_pending', 'active', 'hired'].includes(data.status)) {
        setStep('already')
        setLoading(false)
        return
      }

      // Determine amount and create dynamic payment link
      const now = new Date()
      const creditOk = hw &&
        !hw.subscription_credit_used &&
        hw.subscription_expires_at &&
        new Date(hw.subscription_expires_at) > now
      const transport = data.transport_service === true
      const amount =
        !transport &&  creditOk ? 200100 :
        !transport && !creditOk ? 250000 :
         transport &&  creditOk ? 800100 :
                                   850000

      try {
        const res = await fetch('/api/create-payment-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            offer_id: offerId,
            amount,
            description: `MaidIt Hire Fee — Offer ${offerId}`,
          }),
        })
        const linkData = await res.json()
        if (linkData.checkout_url) {
          setCheckoutUrl(linkData.checkout_url)
        } else {
          setLinkError(true)
        }
      } catch {
        setLinkError(true)
      }

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

  const s: any = {
    wrap: { minHeight: '100vh', background: '#f9fafb', fontFamily: 'sans-serif', color: '#111827' },
    head: { background: '#1a6b3c', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' },
    back: { background: 'none', border: 'none', color: '#9ca3af', fontSize: '1rem', cursor: 'pointer', padding: 0 },
    body: { padding: '24px 18px 48px', maxWidth: '480px', margin: '0 auto' },
    card: { background: '#fff', borderRadius: '12px', padding: '16px', border: '1.5px solid #e5e7eb', marginBottom: '14px' },
    btn: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#1a6b3c', color: '#fff', fontFamily: 'sans-serif', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginBottom: '10px' },
    btnOutline: { width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e5e7eb', background: 'transparent', color: '#6b7280', fontFamily: 'sans-serif', fontSize: '.86rem', fontWeight: 600, cursor: 'pointer' },
    center: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '28px', textAlign: 'center' as const, fontFamily: 'sans-serif', background: '#f9fafb' },
  }

  if (loading) return <div style={{ ...s.center, color: '#6b7280' }}>Loading...</div>

  if (step === 'already') return (
    <div style={s.center}>
      <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>⏳</div>
      <h1 style={{ fontFamily: 'serif', fontSize: '1.3rem', fontWeight: 900, color: '#111827', marginBottom: '8px' }}>Payment Under Review</h1>
      <p style={{ color: '#6b7280', fontSize: '.84rem', lineHeight: 1.7, marginBottom: '24px' }}>
        We received your payment.<br />
        We'll activate your hire once confirmed.
      </p>
      <button style={{ ...s.btnOutline, maxWidth: '300px' }} onClick={() => router.push('/dashboard/homeowner')}>
        Back to Dashboard
      </button>
    </div>
  )

  const kbName = offer?.kasambahay?.profiles?.full_name?.split(' ')[0] || 'your kasambahay'

  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <button style={s.back} onClick={() => router.back()}>←</button>
        <span style={{ fontFamily: 'serif', fontSize: '1rem', fontWeight: 900, color: '#fff' }}>Pay Hire Fee</span>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: (creditApplicable || hasTransport) ? '1px solid #f3f4f6' : 'none' }}>
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

        {creditApplicable && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '11px', padding: '11px 14px', marginBottom: '14px' }}>
            <div style={{ fontSize: '.74rem', color: '#166534', lineHeight: 1.7 }}>
              ✅ <strong>First hire credit applied:</strong> Your ₱499 subscription credit has been deducted — you pay ₱2,001 for this hire.
            </div>
          </div>
        )}

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
            { icon: '🔄', text: '1 free rematch if the kasambahay does not arrive or leaves within 30 days.' },
            { icon: '✅', text: 'Verified kasambahay profile' },
            { icon: '📋', text: 'RA 10361-compliant employment terms' },
            { icon: '📱', text: 'Direct contact with your kasambahay — Viber/WhatsApp number revealed after payment' },
            { icon: '🎁', text: 'One hiring fee credit (₱499) valid for 30 days — applied to your first hire' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', padding: '7px 0', borderBottom: i < 4 ? '1px solid #f3f4f6' : 'none', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1rem', minWidth: '20px' }}>{item.icon}</span>
              <span style={{ fontSize: '.78rem', color: '#374151', lineHeight: 1.5 }}>{item.text}</span>
            </div>
          ))}
        </div>

        {linkError ? (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '11px', padding: '12px 14px', marginBottom: '14px' }}>
            <div style={{ fontSize: '.74rem', color: '#dc2626', lineHeight: 1.6 }}>
              Online payment is temporarily unavailable. Please refresh the page to try again.
            </div>
          </div>
        ) : !checkoutUrl ? (
          <div style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '11px', padding: '14px', marginBottom: '10px', textAlign: 'center' as const }}>
            <div style={{ fontSize: '.78rem', color: '#6b7280' }}>Preparing secure payment link…</div>
          </div>
        ) : (
          <button
            style={s.btn}
            onClick={() => { window.location.href = checkoutUrl! }}
          >
            Pay ₱{total.toLocaleString()} via PayMongo →
          </button>
        )}

        <div style={{ fontSize: '.67rem', color: '#9ca3af', textAlign: 'center' as const, marginTop: '14px', lineHeight: 1.6 }}>
          Secured by PayMongo · QRPh, GCash, credit card accepted<br />
          Hire activates automatically after payment is confirmed.
        </div>
      </div>
    </div>
  )
}
