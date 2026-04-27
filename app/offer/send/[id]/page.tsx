'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SendOfferPage({ params }: any) {
  const router = useRouter()
  const kasambahayId = params.id

  const [form, setForm] = useState({
    salary: '',
    start_date: '',
    scope: []
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)

  const handleSendOffer = async () => {
    if (!form.salary || !form.start_date || form.scope.length === 0) {
      setError('Please fill all fields')
      return
    }

    setSubmitting(true)
    setError('')

    const { supabase } = await import('../../../../lib/supabase')
    const { data: { user } } = await supabase.auth.getUser()

    // 🔐 LOGIN CHECK
    if (!user) {
      setSubmitting(false)
      router.push(`/login?redirect=/send-offer/${kasambahayId}`)
      return
    }

    // 💰 PAYMENT CHECK
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_paid, job_offer_credits')
      .eq('id', user.id)
      .single()

    if (!profile?.is_paid || profile.job_offer_credits <= 0) {
      setSubmitting(false)
      setShowPaywall(true)
      return
    }

    // 🏠 GET HOMEOWNER
    const { data: hw } = await supabase
      .from('homeowners')
      .select('id')
      .eq('profile_id', user.id)
      .single()

    // 📩 INSERT OFFER
    const { error: offerError } = await supabase
      .from('offers')
      .insert({
        homeowner_id: hw?.id,
        kasambahay_id: kasambahayId,
        salary: parseInt(form.salary),
        start_date: form.start_date,
        scope: form.scope,
        status: 'pending'
      })

    if (offerError) {
      setSubmitting(false)
      setError(offerError.message)
      return
    }

    // ➖ DEDUCT CREDIT
    await supabase
      .from('profiles')
      .update({
        job_offer_credits: profile.job_offer_credits - 1
      })
      .eq('id', user.id)

    setSubmitting(false)
    setSuccess(true)
  }

  return (
    <div style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
      <h1>Send Job Offer</h1>

      <input
        placeholder="Salary"
        value={form.salary}
        onChange={(e) => setForm({ ...form, salary: e.target.value })}
        style={{ width: '100%', marginBottom: 10 }}
      />

      <input
        type="date"
        value={form.start_date}
        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
        style={{ width: '100%', marginBottom: 10 }}
      />

      <button onClick={handleSendOffer} disabled={submitting}>
        {submitting ? 'Sending...' : 'Send Offer'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>Offer sent!</p>}

      {/* 💳 PAYWALL MODAL */}
      {showPaywall && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'white',
            padding: 24,
            borderRadius: 12,
            width: 320,
            textAlign: 'center'
          }}>
            <h2>Start sending job offers</h2>

            <p>Sign up for ₱499 (30 days)</p>

            <div style={{ textAlign: 'left', marginBottom: 16 }}>
              • 10 job offers<br />
              • 1 job posting<br />
              • Contact helpers directly
            </div>

            <button
              onClick={async () => {
                const res = await fetch('/api/pay', { method: 'POST' })
                const data = await res.json()

                if (data.checkout_url) {
                  window.location.href = data.checkout_url
                } else {
                  alert('Payment failed')
                }
              }}
              style={{
                width: '100%',
                padding: 12,
                background: '#1a6b3c',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                marginBottom: 10
              }}
            >
              Pay ₱499 and Continue
            </button>

            <button onClick={() => setShowPaywall(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}