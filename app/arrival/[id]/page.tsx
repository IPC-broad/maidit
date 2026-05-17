'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ArrivalPage() {
  const router = useRouter()
  const params = useParams()
  const offerId = params?.id as string

  const [offer, setOffer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false)
  const [daysLeft, setDaysLeft] = useState<number | null>(null)

  useEffect(() => {
    const init = async () => {
      const { supabase } = await import('../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('offers')
        .select('*, kasambahay:kasambahay_id(referred_by, facebook_url, profiles(full_name, mobile))')
        .eq('id', offerId)
        .single()

      if (!data) { router.push('/dashboard/homeowner'); return }

      if (data.arrived_at) {
        setAlreadyConfirmed(true)
        const arrived = new Date(data.arrived_at)
        const day30 = new Date(arrived.getTime() + 30 * 24 * 60 * 60 * 1000)
        const now = new Date()
        const diff = Math.max(0, Math.ceil((day30.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        setDaysLeft(diff)
      }

      setOffer(data)
      setLoading(false)
    }
    init()
  }, [offerId])

  const handleConfirmArrival = async () => {
    setSubmitting(true)
    const { supabase } = await import('../../../lib/supabase')
    const now = new Date().toISOString()
    const day30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    await supabase.from('offers').update({
      status: 'hired',
      arrived_at: now,
      trial_ends_at: day30,
      rematch_available: true,
      rematch_expires_at: day30,
    }).eq('id', offerId)

    const referrorId = offer.kasambahay?.referred_by
    if (referrorId) {
      const { data: partnerData } = await supabase.from('partners').select('balance').eq('id', referrorId).single()
      const partnerBalance = partnerData?.balance ?? 0
      const payoutStatus = partnerBalance < 0 ? 'held' : 'pending'
      await supabase.from('payouts').insert({
        partner_id: referrorId, offer_id: offerId, amount: 500,
        type: 'arrival', status: payoutStatus, due_at: now
      })
      if (offer.transport_service === true) {
        await supabase.from('payouts').insert({
          partner_id: referrorId, offer_id: offerId, amount: 500,
          type: 'transport', status: payoutStatus, due_at: now
        })
      }
    }

    await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'arrival_confirmed', offerId })
    })

    setSubmitting(false)
    setDone(true)
  }

  const toIntl = (mobile: string | undefined) => {
    if (!mobile) return ''
    const m = mobile.replace(/\D/g, '')
    return m.startsWith('0') ? '63' + m.slice(1) : m.startsWith('63') ? m : '63' + m
  }

  const kbMobile = offer?.kasambahay?.profiles?.mobile
  const kbFullName = offer?.kasambahay?.profiles?.full_name || 'your kasambahay'
  const kbFirstName = kbFullName.split(' ')[0]
  const kbFacebookUrl = offer?.kasambahay?.facebook_url
  const kbInitials = kbFullName.split(' ').map((n: string) => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#9ca3af', fontSize: '.9rem' }}>
      Loading…
    </div>
  )

  // ── CONTACT CARD (reused across states) ──
  const ContactCard = () => kbMobile ? (
    <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
      <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#9ca3af', marginBottom: '12px' }}>Contact {kbFirstName}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#1a6b3c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
          {kbInitials}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '.92rem', color: '#111827', marginBottom: '1px' }}>{kbFullName}</div>
          <div style={{ fontSize: '.78rem', color: '#6b7280' }}>{kbMobile}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <a
          href={`sms:+${toIntl(kbMobile)}`}
          style={{ flex: 1, padding: '10px', borderRadius: '9px', background: '#1a6b3c', color: '#fff', fontFamily: 'sans-serif', fontSize: '.8rem', fontWeight: 700, textAlign: 'center' as const, textDecoration: 'none', display: 'block' }}
        >
          📱 Send SMS
        </a>
        {kbFacebookUrl && (
          <a
            href={kbFacebookUrl}
            target="_blank"
            rel="noreferrer"
            style={{ flex: 1, padding: '10px', borderRadius: '9px', background: '#1877f2', color: '#fff', fontFamily: 'sans-serif', fontSize: '.8rem', fontWeight: 700, textAlign: 'center' as const, textDecoration: 'none', display: 'block' }}
          >
            💬 Messenger
          </a>
        )}
      </div>
    </div>
  ) : null

  // ── STATE: ARRIVAL CONFIRMED (just now) ──
  if (done) return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', fontFamily: 'sans-serif', color: '#111827' }}>
      {/* Green hero */}
      <div style={{ background: 'linear-gradient(160deg, #1a6b3c 0%, #155c33 100%)', padding: '48px 24px 36px', textAlign: 'center' as const }}>
        <div style={{ fontSize: '3rem', marginBottom: '14px' }}>🏠</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 900, color: '#fff', marginBottom: '6px' }}>
          {kbFirstName} has arrived!
        </div>
        <div style={{ fontSize: '.84rem', color: 'rgba(255,255,255,.75)', lineHeight: 1.6 }}>
          Your 30-day trial period has started.
        </div>
      </div>

      <div style={{ padding: '20px 18px 56px', maxWidth: '480px', margin: '0 auto' }}>
        {/* Trial card */}
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '18px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'center' as const, flexShrink: 0 }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '2.8rem', fontWeight: 900, color: '#1a6b3c', lineHeight: 1 }}>30</div>
            <div style={{ fontSize: '.65rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '.4px' }}>days</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#111827', marginBottom: '4px' }}>Trial period active</div>
            <div style={{ fontSize: '.78rem', color: '#6b7280', lineHeight: 1.55 }}>
              If any issues arise within 30 days, contact us to request a free rematch.
            </div>
          </div>
        </div>

        <ContactCard />

        <button
          style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: '#1a6b3c', color: '#fff', fontFamily: 'sans-serif', fontSize: '.92rem', fontWeight: 700, cursor: 'pointer' }}
          onClick={() => router.push('/dashboard/homeowner')}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  )

  // ── STATE: TRIAL ALREADY IN PROGRESS ──
  if (alreadyConfirmed && offer) return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', fontFamily: 'sans-serif', color: '#111827' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #ede8e0', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={() => router.push('/dashboard/homeowner')} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '1.1rem', cursor: 'pointer', padding: 0 }}>←</button>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 900 }}>Trial In Progress</span>
      </div>

      <div style={{ padding: '20px 18px 56px', maxWidth: '480px', margin: '0 auto' }}>
        {/* Days remaining */}
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '16px', padding: '24px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'center' as const, flexShrink: 0 }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '3.5rem', fontWeight: 900, color: '#1a6b3c', lineHeight: 1 }}>{daysLeft}</div>
            <div style={{ fontSize: '.65rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '.4px', marginTop: '2px' }}>days left</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#111827', marginBottom: '4px' }}>30-day trial in progress</div>
            <div style={{ fontSize: '.75rem', color: '#6b7280', lineHeight: 1.55, marginBottom: '6px' }}>
              Arrived: {new Date(offer.arrived_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div style={{ height: '4px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#1a6b3c', borderRadius: '4px', width: `${Math.round((1 - (daysLeft ?? 0) / 30) * 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Rematch info */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '13px 14px', marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>🔄</span>
          <div style={{ fontSize: '.78rem', color: '#166534', lineHeight: 1.6 }}>
            <strong>Free rematch available.</strong> If {kbFirstName} leaves early or there are issues, contact us within the 30-day window.
          </div>
        </div>

        <ContactCard />

        <button
          style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: '#1a6b3c', color: '#fff', fontFamily: 'sans-serif', fontSize: '.92rem', fontWeight: 700, cursor: 'pointer' }}
          onClick={() => router.push('/dashboard/homeowner')}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  )

  // ── STATE: POST-PAYMENT, AWAITING ARRIVAL ──
  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', fontFamily: 'sans-serif', color: '#111827' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #ede8e0', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px', position: 'sticky' as const, top: 0, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '1.1rem', cursor: 'pointer', padding: 0 }}>←</button>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 900 }}>Confirm Arrival</span>
      </div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg, #1a6b3c 0%, #155c33 100%)', padding: '32px 24px 28px', textAlign: 'center' as const }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: '2px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 auto 14px', letterSpacing: '-1px' }}>
          {kbInitials}
        </div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.3rem', fontWeight: 900, color: '#fff', marginBottom: '5px' }}>
          Payment confirmed! 🎉
        </div>
        <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.8)', lineHeight: 1.6 }}>
          Tap the button below once {kbFirstName} physically arrives.
        </div>
      </div>

      <div style={{ padding: '20px 18px 48px', maxWidth: '480px', margin: '0 auto' }}>

        {/* What happens when you confirm */}
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
          <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#9ca3af', marginBottom: '14px' }}>When you confirm arrival</div>
          {[
            { icon: '⏱️', title: '30-day trial begins', desc: 'You have 30 days to raise concerns or request a free rematch.' },
            { icon: '🔄', title: 'Rematch protection activates', desc: 'If there are issues within 30 days, MaidIt arranges a free replacement.' },
          ].map((item, i, arr) => (
            <div key={i} style={{ display: 'flex', gap: '13px', paddingBottom: i < arr.length - 1 ? '12px' : 0, marginBottom: i < arr.length - 1 ? '12px' : 0, borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.84rem', color: '#111827', marginBottom: '2px' }}>{item.title}</div>
                <div style={{ fontSize: '.74rem', color: '#6b7280', lineHeight: 1.55 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact card */}
        <ContactCard />

        {/* Confirm section */}
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
          <div style={{ fontSize: '.84rem', color: '#374151', lineHeight: 1.6, marginBottom: '14px' }}>
            Has <strong>{kbFirstName}</strong> physically arrived at your home?
          </div>
          <div style={{ display: 'flex', gap: '7px', alignItems: 'flex-start', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '9px', padding: '10px 12px', marginBottom: '14px' }}>
            <span style={{ fontSize: '.9rem', flexShrink: 0 }}>⚠️</span>
            <div style={{ fontSize: '.74rem', color: '#92400e', lineHeight: 1.55 }}>
              Only confirm once {kbFirstName} has physically arrived. This starts the 30-day trial and cannot be undone.
            </div>
          </div>
          <button
            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: submitting ? '#6b7280' : '#1a6b3c', color: '#fff', fontFamily: 'sans-serif', fontSize: '.95rem', fontWeight: 700, cursor: submitting ? 'default' : 'pointer', transition: 'background .15s' }}
            onClick={handleConfirmArrival}
            disabled={submitting}
          >
            {submitting ? 'Confirming…' : `✅ Yes, ${kbFirstName} has arrived`}
          </button>
        </div>

        <button
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e5e7eb', background: 'transparent', color: '#6b7280', fontFamily: 'sans-serif', fontSize: '.84rem', fontWeight: 600, cursor: 'pointer' }}
          onClick={() => router.push('/dashboard/homeowner')}
        >
          Not yet — back to dashboard
        </button>
      </div>
    </div>
  )
}
