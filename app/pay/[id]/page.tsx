'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

const PAYMONGO_LINK = 'https://pm.link/org-9FQv6XBpoCxdDMaMPY8gze3N/bK90nx0'

export default function PayPage() {
  const router = useRouter()
  const params = useParams()
  const offerId = params?.id as string

  const [offer, setOffer] = useState<any>(null)
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
        .select('*, kasambahay_profile:profiles!offers_kasambahay_id_fkey(full_name)')
        .eq('id', offerId)
        .single()

      if (!data) { router.push('/dashboard/homeowner'); return }
      if (data.status === 'paid' || data.status === 'payment_pending') {
        setStep('already')
      }
      setOffer(data)
      setLoading(false)
    }
    init()
  }, [offerId])

  const handleOpenPayMongo = () => {
    setStep('confirm')
    window.open(PAYMONGO_LINK, '_blank')
  }

  const handleConfirmPaid = async () => {
    setSubmitting(true)
    const { supabase } = await import('../../../lib/supabase')

    await supabase.from('offers').update({
      status: 'payment_pending'
    }).eq('id', offerId)

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
    head: { background: '#0d1117', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' },
    back: { background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', fontSize: '1rem', cursor: 'pointer', padding: 0 },
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
          Once you've paid ₱2,001 on PayMongo, tap confirm below.
        </div>
        <div style={{ ...s.card, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '.74rem', color: '#166534', lineHeight: 1.8 }}>
            ✅ PayMongo accepts <strong>QRPh</strong><br />
            Scan with GCash, BPI, BDO, UnionBank, or any bank app.<br />
            Make sure the amount shows <strong>₱2,001.00</strong>.
          </div>
        </div>
        <button style={{ ...s.btn, opacity: submitting ? .6 : 1 }} onClick={handleConfirmPaid} disabled={submitting}>
          {submitting ? 'Submitting...' : "✅ Yes, I've paid ₱2,001"}
        </button>
        <button style={s.btnBlue} onClick={() => window.open(PAYMONGO_LINK, '_blank')}>
          ↗ Re-open PayMongo
        </button>
        <button style={s.btnOutline} onClick={() => router.push('/dashboard/homeowner')}>
          Pay later
        </button>
      </div>
    </div>
  )

  const kbName = offer?.kasambahay_profile?.full_name?.split(' ')[0] || 'your kasambahay'

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
        <div style={{ ...s.card, background: '#0d1117', border: 'none', textAlign: 'center' as const, padding: '22px' }}>
          <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '1px', color: 'rgba(255,255,255,.35)', marginBottom: '6px' }}>
            Hire Protection Fee
          </div>
          <div style={{ fontFamily: 'serif', fontSize: '2.6rem', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>₱2,001</div>
          <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.35)' }}>One-time · 30-day rematch included</div>
        </div>
        <div style={s.card}>
          <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#6b7280', marginBottom: '10px' }}>What's included</div>
          {[
            { icon: '🛡️', text: '30-day rematch guarantee' },
            { icon: '✅', text: 'Verified kasambahay profile' },
            { icon: '📋', text: 'RA 10361-compliant employment terms' },
            { icon: '💬', text: 'MaidIt support during trial period' },
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
        <button style={s.btn} onClick={handleOpenPayMongo}>
          Pay ₱2,001 via PayMongo →
        </button>
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