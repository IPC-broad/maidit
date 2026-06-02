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
  const [skipLoading, setSkipLoading] = useState(false)
  const [isTester, setIsTester] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { supabase } = await import('../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const TEST_EMAILS = [
        'test@maidit.com',
        'homeowner@maidit.app',
        'test.kasambahay@maidit.app',
        'partner@maidit.com',
      ]
      const isTester = TEST_EMAILS.includes(user?.email ?? '')
      setIsTester(isTester)

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
            homeowner_id: hw?.id,
            type: 'hire',
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
    wrap: { minHeight: '100vh', background: '#f7f6f3', fontFamily: 'sans-serif', color: '#111827' },
    head: { background: '#1a6b3c', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' },
    back: { background: 'none', border: 'none', color: '#9ca3af', fontSize: '1rem', cursor: 'pointer', padding: 0 },
    body: { padding: '24px 18px 56px', maxWidth: '880px', margin: '0 auto' },
    card: { background: '#fff', borderRadius: '14px', padding: '18px', border: '1.5px solid #e5e7eb' },
    btn: { width: '100%', padding: '15px', borderRadius: '12px', border: 'none', background: '#1a6b3c', color: '#fff', fontFamily: 'sans-serif', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' },
    btnOutline: { width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e5e7eb', background: 'transparent', color: '#6b7280', fontFamily: 'sans-serif', fontSize: '.86rem', fontWeight: 600, cursor: 'pointer' },
    center: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '28px', textAlign: 'center' as const, fontFamily: 'sans-serif', background: '#f7f6f3' },
    dotRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', fontSize: '.84rem' },
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

  const kbFullName = offer?.kasambahay?.profiles?.full_name || 'Your kasambahay'
  const kbFirstName = kbFullName.split(' ')[0]
  const selfieUrl = offer?.kasambahay?.selfie_url
  const kbSetup = offer?.kasambahay?.setup || 'Stay-in'
  const kbSalary = offer?.salary
  const kbSkills: string[] = offer?.kasambahay?.skills || []
  const kbRole = kbSkills[0] || offer?.scope || 'General Housekeeping'
  const initials = kbFullName.split(' ').map((n: string) => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()

  const whatYouGet = [
    { icon: '✅', text: '1 free rematch for eligible no-shows or early departures' },
    { icon: '✅', text: 'Verified kasambahay profile' },
    { icon: '📱', text: 'Contact details provided after payment' },
    ...(creditApplicable ? [{ icon: '🎁', text: 'Your ₱499 first-hire credit has already been applied' }] : []),
  ]

  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <button style={s.back} onClick={() => router.back()}>←</button>
        <span style={{ fontFamily: 'serif', fontSize: '1rem', fontWeight: 900, color: '#fff' }}>Confirm Your Hire</span>
      </div>

      <div style={s.body}>
        {/* Headline */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ fontFamily: 'serif', fontSize: '1.35rem', fontWeight: 900, marginBottom: '5px' }}>
            Confirm Your Hire 🎉
          </div>
          <div style={{ fontSize: '.84rem', color: '#6b7280', lineHeight: 1.6 }}>
            You're one step away from hiring <strong style={{ color: '#111827' }}>{kbFirstName}</strong>.
          </div>
        </div>

        {/* Two-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>

          {/* LEFT — Kasambahay summary */}
          <div style={{ ...s.card, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', textAlign: 'center' as const, padding: '24px 18px' }}>
            {/* Avatar */}
            {selfieUrl ? (
              <img
                src={selfieUrl}
                alt={kbFullName}
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' as const, border: '3px solid #e5e7eb', marginBottom: '12px' }}
              />
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#1a6b3c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '12px', border: '3px solid #e5e7eb' }}>
                {initials}
              </div>
            )}

            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827', marginBottom: '3px' }}>{kbFullName}</div>
            <div style={{ fontSize: '.78rem', color: '#6b7280', marginBottom: '10px' }}>{kbRole}</div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const, justifyContent: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '.72rem', background: '#f3f4f6', color: '#374151', borderRadius: '20px', padding: '3px 10px', fontWeight: 600 }}>
                {kbSetup}
              </span>
              {kbSalary && (
                <span style={{ fontSize: '.72rem', background: '#f0fdf4', color: '#166534', borderRadius: '20px', padding: '3px 10px', fontWeight: 600 }}>
                  ₱{Number(kbSalary).toLocaleString()}/month
                </span>
              )}
            </div>

            {selfieUrl && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '.7rem', color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '20px', padding: '3px 10px', fontWeight: 700 }}>
                ✅ Selfie Verified
              </div>
            )}
          </div>

          {/* RIGHT — Payment card */}
          <div style={s.card}>
            <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#6b7280', marginBottom: '12px' }}>Today's Payment</div>

            {/* Line items */}
            <div style={{ ...s.dotRow, borderBottom: '1px solid #f3f4f6', color: '#374151' }}>
              <span>Hiring Fee</span>
              {creditApplicable
                ? <span style={{ textDecoration: 'line-through', color: '#9ca3af' }}>₱2,500</span>
                : <span style={{ fontWeight: 600 }}>₱2,500</span>
              }
            </div>
            {creditApplicable && (
              <div style={{ ...s.dotRow, borderBottom: hasTransport ? '1px solid #f3f4f6' : 'none', color: '#1a6b3c' }}>
                <span>First Hire Credit</span>
                <span style={{ fontWeight: 700 }}>−₱499</span>
              </div>
            )}
            {hasTransport && (
              <div style={{ ...s.dotRow, borderBottom: '1px solid #f3f4f6', color: '#374151' }}>
                <div>
                  <div>🛡️ MaidIt Assisted Travel</div>
                  <div style={{ fontSize: '.68rem', color: '#9ca3af', marginTop: '1px' }}>₱5,500 transport · ₱500 MaidIt fee</div>
                </div>
                <span style={{ color: '#92400e', fontWeight: 700 }}>+₱6,000</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', marginTop: '2px' }}>
              <span style={{ fontWeight: 700, color: '#111827', fontSize: '.9rem' }}>Total Today</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1a6b3c', fontFamily: 'serif' }}>₱{total.toLocaleString()}</span>
            </div>

            {/* Credit chip */}
            {creditApplicable && (
              <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '.72rem', color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '20px', padding: '4px 10px', fontWeight: 600 }}>
                ✅ ₱499 first-hire credit applied
              </div>
            )}
          </div>
        </div>

        {/* Transport note */}
        {hasTransport && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '12px 14px', marginBottom: '14px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.1rem' }}>🛡️</span>
            <div>
              <div style={{ fontSize: '.74rem', fontWeight: 700, color: '#92400e', marginBottom: '3px' }}>Transport coordination</div>
              <div style={{ fontSize: '.72rem', color: '#78350f', lineHeight: 1.6 }}>
                If the kasambahay leaves without justifiable reason within 6 months of employment, you may recover transport assistance costs directly from her pursuant to RA 10361. MaidIt is not involved in this recovery — it is solely between you and the kasambahay.
              </div>
            </div>
          </div>
        )}

        {/* What You Get */}
        <div style={{ ...s.card, marginBottom: '14px' }}>
          <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#6b7280', marginBottom: '10px' }}>What You Get</div>
          {whatYouGet.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', padding: '7px 0', borderBottom: i < whatYouGet.length - 1 ? '1px solid #f3f4f6' : 'none', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1rem', minWidth: '20px' }}>{item.icon}</span>
              <span style={{ fontSize: '.8rem', color: '#374151', lineHeight: 1.5 }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Trust strip */}
        <div style={{ background: '#f3f4f6', borderRadius: '12px', padding: '13px 16px', marginBottom: '18px', textAlign: 'center' as const }}>
          <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#374151', marginBottom: '3px' }}>🛡️ Safe hiring with MaidIt</div>
          <div style={{ fontSize: '.72rem', color: '#6b7280', lineHeight: 1.6 }}>
            Includes verified profile and 1 free rematch for eligible<br />
            no-shows or early departures.
          </div>
        </div>

        {/* Pay button */}
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
            style={{ ...s.btn, marginBottom: '10px' }}
            onClick={() => { window.location.href = checkoutUrl! }}
          >
            Pay ₱{total.toLocaleString()} via PayMongo →
          </button>
        )}

        {/* Test account skip — TEMPORARY, remove by 2026-07-01 */}
        {isTester && (
          <button
            style={{ width: '100%', height: '52px', borderRadius: '12px', border: 'none', background: '#c9943a', color: '#fff', fontFamily: 'sans-serif', fontSize: '1rem', fontWeight: 700, cursor: skipLoading ? 'not-allowed' : 'pointer', marginBottom: '10px', opacity: skipLoading ? .6 : 1 }}
            disabled={skipLoading}
            onClick={async () => {
              setSkipLoading(true)
              const { supabase } = await import('../../../lib/supabase')
              await supabase.from('offers').update({
                status: 'paid',
                paid_at: new Date().toISOString(),
              }).eq('id', offerId)
              router.push(`/arrival/${offerId}`)
            }}
          >
            {skipLoading ? 'Processing…' : 'Skip Payment (Test Account) →'}
          </button>
        )}

        <div style={{ fontSize: '.67rem', color: '#9ca3af', textAlign: 'center' as const, marginTop: '6px', lineHeight: 1.6 }}>
          Secured by PayMongo · QRPh, GCash, credit card accepted<br />
          Hire activates automatically after payment is confirmed.
        </div>
      </div>
    </div>
  )
}
