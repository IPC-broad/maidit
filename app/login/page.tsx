'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const C = {
  forest: '#27500A', forestDeep: '#1c3b07', forestSoft: '#f0f5ec', forestLine: '#e2ecdb',
  amber: '#c9943a', amberSoft: '#fbf3e2',
  ink: '#1a1d18', ink2: '#4a504a', ink3: '#8a8f88', ink4: '#b8bcb5',
  paper: '#ffffff', paper2: '#faf9f5', line: '#ebe9e2',
}
const serif = "'Instrument Serif', Georgia, serif"
const sans  = "'Geist', ui-sans-serif, sans-serif"

const IcArrowRight = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 5l7 7-7 7"/>
  </svg>
)

const FacebookIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get('redirect') || ''

  const [credential, setCredential] = useState('')
  const [password, setPassword]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [fbLoading, setFbLoading]   = useState(false)
  const [error, setError]           = useState('')
  const [showPass, setShowPass]     = useState(false)

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap'
    document.head.appendChild(link)
    return () => { try { document.head.removeChild(link) } catch {} }
  }, [])

  const redirectAfterLogin = async (supabase: any, userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (!profile?.role) {
      router.push('/signup/choose-role')
      return
    }

    if (redirectTo) { router.push(redirectTo); return }

    if (profile.role === 'homeowner') {
      const intent = localStorage.getItem('maidit_intent')
      if (intent === 'post_job') {
        localStorage.removeItem('maidit_intent')
        router.push('/dashboard/homeowner/post-job')
        return
      }
      router.push('/dashboard/homeowner')
    } else if (profile.role === 'kasambahay') {
      router.push('/dashboard/kasambahay')
    } else if (profile.role === 'partner') {
      router.push('/dashboard/partner')
    } else {
      router.push('/dashboard/homeowner')
    }
  }

  const handleLogin = async () => {
    if (!credential.trim() || !password) { setError('Please fill in all fields.'); return }
    if (password.length < 5) { setError('Password must be at least 5 characters.'); return }
    setLoading(true)
    setError('')
    try {
      const { supabase } = await import('../../lib/supabase')
      const val = credential.trim().replace(/\s/g, '')
      const isMobile = /^(\+63|09)\d{8,10}$/.test(val)
      console.log('Raw input:', credential)
      console.log('isMobile check:', isMobile, 'for input:', val)
      let loginEmail: string
      if (isMobile) {
        const normalized = val.startsWith('+63') ? '0' + val.slice(3) : val
        console.log('Normalized:', normalized)
        console.log('Attempting mobile lookup for:', normalized)
        const res = await fetch('/api/lookup-mobile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile: normalized }),
        })
        const json = await res.json()
        console.log('Profile lookup result:', json)
        if (!res.ok || !json.email) {
          setError('Hindi mahanap ang account na may mobile number na ito.')
          setLoading(false)
          return
        }
        loginEmail = json.email
      } else {
        loginEmail = val
      }
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: loginEmail, password })
      if (signInError) {
        setError('Incorrect email/mobile or password. Please try again.')
        setLoading(false)
        return
      }
      await redirectAfterLogin(supabase, data.user.id)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleFacebookLogin = async () => {
    setFbLoading(true)
    setError('')
    try {
      const { supabase } = await import('../../lib/supabase')
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (oauthError) { setError(oauthError.message); setFbLoading(false) }
    } catch {
      setError('Facebook login failed. Please try again.')
      setFbLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 14px',
    border: `1.5px solid ${C.line}`, borderRadius: 13,
    fontFamily: sans, fontSize: 15, color: C.ink,
    background: C.paper, outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: C.paper2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', fontFamily: sans }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: serif, fontSize: 42, color: C.forestDeep, letterSpacing: '-1px', lineHeight: 1 }}>
            Maid<span style={{ color: C.amber }}>It</span>
          </div>
          <div style={{ fontFamily: serif, fontSize: 22, color: C.ink, marginTop: 10, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            Welcome <em style={{ color: C.amber }}>back.</em>
          </div>
          <div style={{ fontSize: 13, color: C.ink3, marginTop: 5 }}>Sign in to your account</div>
        </div>

        {/* Card */}
        <div style={{ background: C.paper, borderRadius: 20, border: `1px solid ${C.line}`, padding: '24px 22px', boxShadow: '0 2px 20px -8px rgba(28,59,7,0.12)' }}>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 13px', fontSize: 13, color: '#dc2626', marginBottom: 18 }}>
              {error}
            </div>
          )}

          {/* Facebook — TOP */}
          <button
            onClick={handleFacebookLogin}
            disabled={fbLoading}
            style={{
              width: '100%', height: 52, borderRadius: 14, border: 'none',
              background: '#1877f2', color: '#fff',
              fontFamily: sans, fontSize: 15, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              cursor: fbLoading ? 'not-allowed' : 'pointer',
              opacity: fbLoading ? 0.7 : 1, transition: 'opacity .15s',
              boxShadow: '0 4px 14px -6px rgba(24,119,242,0.45)',
            }}
          >
            <FacebookIcon />
            {fbLoading ? 'Redirecting…' : 'Mag-login gamit ang Facebook'}
          </button>
          <div style={{ textAlign: 'center', fontSize: 12, color: C.ink3, marginTop: 6, marginBottom: 4 }}>
            Pinakamabilis na paraan ng pag-login
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
            <div style={{ flex: 1, height: 1, background: C.line }} />
            <span style={{ fontSize: 12, color: C.ink4, whiteSpace: 'nowrap' }}>o mag-login gamit ang email/mobile</span>
            <div style={{ flex: 1, height: 1, background: C.line }} />
          </div>

          {/* Credential input */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 7 }}>
              Mobile number or email
            </label>
            <input
              style={inputStyle}
              placeholder="09XXXXXXXXX or you@email.com"
              value={credential}
              onChange={e => setCredential(e.target.value)}
              autoComplete="username"
              inputMode="email"
            />
          </div>

          {/* Password input */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 7 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...inputStyle, paddingRight: 48 }}
                type={showPass ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: C.ink3, padding: 0 }}
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Sign in button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', height: 52, borderRadius: 14, border: 'none',
              background: loading ? C.ink4 : C.forest, color: C.paper,
              fontFamily: sans, fontSize: 15, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '-0.005em',
              boxShadow: loading ? 'none' : '0 4px 14px -6px rgba(39,80,10,0.45)',
              transition: 'background .15s',
            }}
          >
            {loading ? 'Signing in…' : <><span>Sign in</span> <IcArrowRight /></>}
          </button>
        </div>

        {/* Footer links */}
        <div style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: C.ink3 }}>
          Bagong user?{' '}
          <span
            onClick={() => router.push('/signup/choose-role')}
            style={{ color: C.forest, fontWeight: 700, cursor: 'pointer' }}
          >
            Gumawa ng account
          </span>
        </div>
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <a href="/forgot-password" style={{ fontSize: 12, color: C.ink4, textDecoration: 'none' }}>
            Forgot password?
          </a>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <a href="/" style={{ fontSize: 12, color: C.ink4, textDecoration: 'none' }}>
            ← Back to home
          </a>
        </div>

      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>
}
