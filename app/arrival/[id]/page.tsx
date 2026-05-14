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
      // Check partner balance — hold payout if balance is negative
      const { data: partnerData } = await supabase.from('partners').select('balance').eq('id', referrorId).single()
      const partnerBalance = partnerData?.balance ?? 0
      const payoutStatus = partnerBalance < 0 ? 'held' : 'pending'
      // Recruitment fee payout
      await supabase.from('payouts').insert({
        partner_id: referrorId,
        offer_id: offerId,
        amount: 500,
        type: 'arrival',
        status: payoutStatus,
        due_at: now
      })
      // Transport assistance payout (only if MaidIt Assisted Travel was selected)
      if (offer.transport_service === true) {
        await supabase.from('payouts').insert({
          partner_id: referrorId,
          offer_id: offerId,
          amount: 500,
          type: 'transport',
          status: payoutStatus,
          due_at: now
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
  const kbFacebookUrl = offer?.kasambahay?.facebook_url

  const s: any = {
    wrap: { minHeight: '100vh', background: '#f9fafb', fontFamily: 'sans-serif', color: '#111827' },
    head: { background: '#0d1117', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' },
    back: { background: 'none', border: 'none', color: 'rgba(255,255,255,.85)', fontSize: '1rem', cursor: 'pointer', padding: 0 },
    body: { padding: '20px 18px 40px' },
    card: { background: '#fff', borderRadius: '12px', padding: '16px', border: '1.5px solid #e5e7eb', marginBottom: '14px' },
    btn: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#1a6b3c', color: '#fff', fontFamily: 'sans-serif', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginBottom: '10px' },
    btnOutline: { width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e5e7eb', background: 'transparent', color: '#6b7280', fontFamily: 'sans-serif', fontSize: '.86rem', fontWeight: 600, cursor: 'pointer' },
    center: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '28px', textAlign: 'center' as const, fontFamily: 'sans-serif', background: '#f9fafb' },
  }

  if (loading) return <div style={{ ...s.center, color: '#6b7280' }}>Loading...</div>

  if (done) return (
    <div style={s.center}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏠</div>
      <h1 style={{ fontFamily: 'serif', fontSize: '1.4rem', fontWeight: 900, color: '#1a6b3c', marginBottom: '8px' }}>Arrival Confirmed!</h1>
      <p style={{ color: '#6b7280', fontSize: '.84rem', lineHeight: 1.7, marginBottom: '8px' }}>
        Your 30-day trial period has started.
      </p>
      <div style={{ background: '#f0fdf4', border: '1px solid rgba(26,107,60,.2)', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px', maxWidth: '300px', width: '100%' }}>
        <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#6b7280', marginBottom: '4px' }}>Trial ends in</div>
        <div style={{ fontFamily: 'serif', fontSize: '2rem', fontWeight: 900, color: '#1a6b3c' }}>30 days</div>
        <div style={{ fontSize: '.7rem', color: '#6b7280', marginTop: '4px' }}>If issues arise, contact us for a rematch</div>
      </div>
      {kbMobile && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', maxWidth: '300px', width: '100%', textAlign: 'left' as const }}>
          <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#166534', marginBottom: '8px' }}>Contact your kasambahay</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>{kbFullName.split(' ')[0]}</div>
          <div style={{ fontSize: '13px', color: '#374151', marginBottom: '10px' }}>{kbMobile}</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
            <a href={`sms:+${toIntl(kbMobile)}`} style={{ padding: '10px', borderRadius: '9px', background: '#1a6b3c', color: '#fff', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 700, textAlign: 'center' as const, textDecoration: 'none', display: 'block' }}>📱 Send SMS</a>
            {kbFacebookUrl && <a href={kbFacebookUrl} target="_blank" rel="noreferrer" style={{ padding: '10px', borderRadius: '9px', background: '#1877f2', color: '#fff', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 700, textAlign: 'center' as const, textDecoration: 'none', display: 'block' }}>💬 Message on Facebook</a>}
          </div>
        </div>
      )}
      <button style={{ ...s.btn, maxWidth: '320px' }} onClick={() => router.push('/dashboard/homeowner')}>
        Back to Dashboard
      </button>
    </div>
  )

  if (alreadyConfirmed && offer) return (
    <div style={s.center}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏱️</div>
      <h1 style={{ fontFamily: 'serif', fontSize: '1.3rem', fontWeight: 900, color: '#111827', marginBottom: '8px' }}>Trial In Progress</h1>
      <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '12px', maxWidth: '280px', width: '100%' }}>
        <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#6b7280', marginBottom: '6px' }}>Days remaining</div>
        <div style={{ fontFamily: 'serif', fontSize: '3rem', fontWeight: 900, color: '#1a6b3c', lineHeight: 1 }}>{daysLeft}</div>
        <div style={{ fontSize: '.72rem', color: '#6b7280', marginTop: '6px' }}>of 30-day trial period</div>
      </div>
      <div style={{ fontSize: '.74rem', color: '#6b7280', lineHeight: 1.7, marginBottom: '16px' }}>
        Arrived: {new Date(offer.arrived_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
      </div>
      {kbMobile && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', maxWidth: '300px', width: '100%', textAlign: 'left' as const }}>
          <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#166534', marginBottom: '8px' }}>Contact your kasambahay</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>{kbFullName.split(' ')[0]}</div>
          <div style={{ fontSize: '13px', color: '#374151', marginBottom: '10px' }}>{kbMobile}</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
            <a href={`sms:+${toIntl(kbMobile)}`} style={{ padding: '10px', borderRadius: '9px', background: '#1a6b3c', color: '#fff', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 700, textAlign: 'center' as const, textDecoration: 'none', display: 'block' }}>📱 Send SMS</a>
            {kbFacebookUrl && <a href={kbFacebookUrl} target="_blank" rel="noreferrer" style={{ padding: '10px', borderRadius: '9px', background: '#1877f2', color: '#fff', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 700, textAlign: 'center' as const, textDecoration: 'none', display: 'block' }}>💬 Message on Facebook</a>}
          </div>
        </div>
      )}
      <button style={{ ...s.btnOutline, maxWidth: '320px' }} onClick={() => router.push('/dashboard/homeowner')}>
        Back to Dashboard
      </button>
    </div>
  )

  const kbName = offer?.kasambahay?.profiles?.full_name || 'your kasambahay'

  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <button style={s.back} onClick={() => router.back()}>←</button>
        <span style={{ fontFamily: 'serif', fontSize: '1rem', fontWeight: 900, color: '#fff' }}>Confirm Arrival</span>
      </div>
      <div style={s.body}>
        <div style={{ fontFamily: 'serif', fontSize: '1.15rem', fontWeight: 900, marginBottom: '4px' }}>
          Has {kbName.split(' ')[0]} arrived? 👋
        </div>
        <div style={{ fontSize: '.76rem', color: '#6b7280', marginBottom: '20px', lineHeight: 1.6 }}>
          Confirming arrival starts the 30-day trial and releases the referror's first payout.
        </div>

        <div style={s.card}>
          <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#6b7280', marginBottom: '12px' }}>What happens next</div>
          {[
            { icon: '✅', title: '30-day trial begins', desc: 'You have 30 days to raise concerns or request a rematch' },
            { icon: '💸', title: 'Referror paid ₱500', desc: 'Arrival payout released to the community referror immediately' },
            { icon: '🔄', title: 'Rematch protection active', desc: 'If kasambahay departs early, MaidIt will arrange a free rematch' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none' }}>
              <div style={{ fontSize: '1.2rem', minWidth: '24px' }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: '.82rem', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>{item.title}</div>
                <div style={{ fontSize: '.72rem', color: '#6b7280', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {kbMobile && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px 16px', marginBottom: '14px', textAlign: 'left' as const }}>
            <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#166534', marginBottom: '8px' }}>Contact your kasambahay</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>{kbName.split(' ')[0]}</div>
            <div style={{ fontSize: '13px', color: '#374151', marginBottom: '10px' }}>{kbMobile}</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
              <a href={`sms:+${toIntl(kbMobile)}`} style={{ padding: '10px', borderRadius: '9px', background: '#1a6b3c', color: '#fff', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 700, textAlign: 'center' as const, textDecoration: 'none', display: 'block' }}>📱 Send SMS</a>
              {kbFacebookUrl && <a href={kbFacebookUrl} target="_blank" rel="noreferrer" style={{ padding: '10px', borderRadius: '9px', background: '#1877f2', color: '#fff', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 700, textAlign: 'center' as const, textDecoration: 'none', display: 'block' }}>💬 Message on Facebook</a>}
            </div>
          </div>
        )}

        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '11px', padding: '12px 14px', marginBottom: '18px' }}>
          <div style={{ fontSize: '.74rem', color: '#dc2626', lineHeight: 1.6 }}>
            ⚠️ Only confirm once {kbName.split(' ')[0]} has physically arrived. This cannot be undone.
          </div>
        </div>

        <button style={{ ...s.btn, opacity: submitting ? .6 : 1 }} onClick={handleConfirmArrival} disabled={submitting}>
          {submitting ? 'Confirming...' : `✅ Yes, ${kbName.split(' ')[0]} has arrived`}
        </button>
        <button style={s.btnOutline} onClick={() => router.push('/dashboard/homeowner')}>
          Not yet — back to dashboard
        </button>
      </div>
    </div>
  )
}