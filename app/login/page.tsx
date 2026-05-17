'use client'
import { Suspense } from 'react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get('redirect') || ''

  // Email login (homeowners / partners)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Kasambahay mobile-or-email login
  const [mobileOrEmail, setMobileOrEmail] = useState('')
  const [mobilePassword, setMobilePassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [fbLoading, setFbLoading] = useState(false)
  const [error, setError] = useState('')

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 13px', border: '1.5px solid #e5e7eb',
    borderRadius: '11px', fontFamily: 'sans-serif', fontSize: '.88rem',
    outline: 'none', marginBottom: '13px', background: '#fff', color: '#111827',
    boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: '.63rem', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '.5px',
    color: '#6b7280', marginBottom: '4px',
  }

  const handleEmailLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true)
    setError('')
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
      setLoading(false)
      let dest = redirectTo || (
        profile?.role === 'kasambahay' ? '/dashboard/kasambahay' :
        profile?.role === 'partner'    ? '/dashboard/partner' :
        '/dashboard/homeowner'
      )
      if (profile?.role === 'homeowner' && !redirectTo) {
        const intent = localStorage.getItem('maidit_intent')
        if (intent === 'post_job') { localStorage.removeItem('maidit_intent'); dest = '/dashboard/homeowner/post-job' }
      }
      router.push(dest)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleKbLogin = async () => {
    if (!mobileOrEmail || !mobilePassword) { setError('Punan ang lahat ng fields'); return }
    setLoading(true)
    setError('')
    try {
      const { supabase } = await import('../../lib/supabase')
      const val = mobileOrEmail.trim()
      const isMobile = /^(\+63|09)\d/.test(val) || /^\d{10,11}$/.test(val)
      let kbEmail: string
      if (isMobile) {
        const digits = val.replace(/\D/g, '')
        const normalized = digits.startsWith('63') ? '0' + digits.slice(2) : digits
        kbEmail = `kb_${normalized}@maidit.app`
      } else {
        kbEmail = val
      }
      const { error } = await supabase.auth.signInWithPassword({ email: kbEmail, password: mobilePassword })
      if (error) { setError('Mali ang mobile/email o password. Subukan ulit.'); setLoading(false); return }
      setLoading(false)
      router.push('/dashboard/kasambahay')
    } catch {
      setError('May error. Subukan ulit.')
      setLoading(false)
    }
  }

  const handleFacebookLogin = async () => {
    setFbLoading(true)
    setError('')
    try {
      const { supabase } = await import('../../lib/supabase')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) { setError(error.message); setFbLoading(false) }
    } catch {
      setError('Facebook login failed. Try again.')
      setFbLoading(false)
    }
  }

  const divider = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0' }}>
      <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
      <span style={{ fontSize: '.72rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>— o kaya —</span>
      <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'serif', fontSize: '2rem', fontWeight: 900, marginBottom: '4px', color: '#111827' }}>
            Maid<span style={{ color: '#c9943a' }}>It</span>
          </h1>
          <p style={{ color: '#6b7280', fontSize: '.82rem' }}>Sign in to your account</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '9px', padding: '10px 13px', fontSize: '.78rem', color: '#dc2626', marginBottom: '12px' }}>
            {error}
          </div>
        )}

        {/* ── KASAMBAHAY: Mobile + Password ── */}
        <div style={{ background: '#fff', border: '1.5px solid #fde8c0', borderRadius: '13px', padding: '16px', marginBottom: '4px' }}>
          <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#c9943a', marginBottom: '12px' }}>
            Para sa Kasambahay
          </div>
          <label style={lbl}>Mobile number or email</label>
          <input
            style={inp}
            placeholder="09XXXXXXXXX or email@example.com"
            value={mobileOrEmail}
            onChange={e => setMobileOrEmail(e.target.value)}
            autoComplete="username"
          />
          <label style={lbl}>Password</label>
          <input
            style={inp}
            type="password"
            placeholder="Iyong password"
            value={mobilePassword}
            onChange={e => setMobilePassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleKbLogin()}
            autoComplete="current-password"
          />
          <button
            style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: '#c9943a', color: '#fff', fontFamily: 'sans-serif', fontSize: '.92rem', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1, marginBottom: '10px' }}
            onClick={handleKbLogin}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Mag-sign in →'}
          </button>

          {divider}

          <button
            style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: '#1877f2', color: '#fff', fontFamily: 'sans-serif', fontSize: '.92rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: fbLoading ? 0.6 : 1 }}
            onClick={handleFacebookLogin}
            disabled={fbLoading}
          >
            <FacebookIcon />
            <span>{fbLoading ? 'Redirecting...' : 'Continue with Facebook'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          <span style={{ fontSize: '.72rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>Homeowner or Partner</span>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
        </div>

        {/* ── HOMEOWNER / PARTNER: Email + Password ── */}
        <label style={lbl}>Email Address</label>
        <input
          style={inp}
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <label style={lbl}>Password</label>
        <input
          style={inp}
          type="password"
          placeholder="Your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleEmailLogin()}
        />
        <button
          style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: '#1a6b3c', color: '#fff', fontFamily: 'sans-serif', fontSize: '.92rem', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
          onClick={handleEmailLogin}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '.78rem', color: '#6b7280' }}>
          No account?{' '}
          <a href="/signup/homeowner" style={{ color: '#1a6b3c', fontWeight: 700, textDecoration: 'none' }}>Homeowner</a>
          {' or '}
          <a href="/signup/kasambahay" style={{ color: '#c9943a', fontWeight: 700, textDecoration: 'none' }}>Kasambahay</a>
        </div>
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <a href="/forgot-password" style={{ fontSize: '.76rem', color: '#6b7280', textDecoration: 'none' }}>Forgot password?</a>
        </div>
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <a href="/" style={{ fontSize: '.76rem', color: '#9ca3af', textDecoration: 'none' }}>Back to Home</a>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>
}
