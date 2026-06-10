'use client'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [input, setInput] = useState('')
  const [sent, setSent] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!input.trim()) { setError('Please enter your email or mobile number.'); return }
    setLoading(true)
    setError('')
    const { supabase } = await import('../../lib/supabase')
    const val = input.trim().replace(/\s/g, '')
    const isMobile = /^(\+63|09)\d{8,10}$/.test(val)
    let emailToUse = val
    if (isMobile) {
      const normalized = val.startsWith('+63') ? '0' + val.slice(3) : val
      const res = await fetch('/api/lookup-mobile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: normalized }),
      })
      const json = await res.json()
      if (!res.ok || !json.email) {
        setError('Hindi mahanap ang account na may mobile number na ito.')
        setLoading(false)
        return
      }
      emailToUse = json.email
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(emailToUse, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })
    setLoading(false)
    if (resetError) { setError(resetError.message); return }
    setSentTo(isMobile ? input.trim() : emailToUse)
    setSent(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: '18px', padding: '32px 24px', border: '1px solid #ede8e0' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔑</div>
          <div style={{ fontFamily: 'serif', fontSize: '22px', fontWeight: 900, color: '#111827', marginBottom: '6px' }}>Forgot your password?</div>
          <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>Enter your email or mobile number and we'll send you a reset link.</div>
        </div>

        {sent ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>✅</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>Check your email</div>
            <div style={{ fontSize: '13px', color: '#166534', lineHeight: 1.6 }}>We sent a reset link to <strong>{sentTo}</strong>. Check your inbox (and spam folder).</div>
          </div>
        ) : (
          <>
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#dc2626', marginBottom: '14px' }}>
                {error}
              </div>
            )}
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Email o mobile number</label>
            <input
              type="text"
              placeholder="you@email.com o 09XXXXXXXXX"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '14px', fontFamily: 'sans-serif', outline: 'none', boxSizing: 'border-box' as const, marginBottom: '14px' }}
            />
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: '#1a6b3c', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'sans-serif', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <a href="/login" style={{ fontSize: '12px', color: '#6b7280', textDecoration: 'none' }}>← Back to login</a>
        </div>
      </div>
    </div>
  )
}
