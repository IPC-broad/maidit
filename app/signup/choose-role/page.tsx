'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const C = {
  forest: '#27500A', forestDeep: '#1c3b07', forestSoft: '#f0f5ec', forestLine: '#e2ecdb',
  amber: '#c9943a', amberSoft: '#fbf3e2', amberLine: '#efe1bf',
  ink: '#1a1d18', ink2: '#4a504a', ink3: '#8a8f88',
  paper: '#ffffff', paper2: '#faf9f5', line: '#ebe9e2',
}
const serif = "'Instrument Serif', Georgia, serif"
const sans  = "'Geist', ui-sans-serif, sans-serif"

const IcArrowRight = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 5l7 7-7 7"/>
  </svg>
)

function ChooseRoleContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap'
    document.head.appendChild(link)
    return () => { try { document.head.removeChild(link) } catch {} }
  }, [])

  // Facebook pre-fill params (passed from /auth/callback for new OAuth users)
  const fbName  = searchParams?.get('name')  || ''
  const fbEmail = searchParams?.get('email') || ''
  const fbUrl   = searchParams?.get('fb')    || ''
  const fbQuery = fbName || fbEmail || fbUrl
    ? `?name=${encodeURIComponent(fbName)}&email=${encodeURIComponent(fbEmail)}&fb=${encodeURIComponent(fbUrl)}`
    : ''

  const isFacebook = !!(fbName || fbEmail || fbUrl)

  const roles = [
    {
      emoji: '🏠',
      title: 'Naghahanap ng kasambahay',
      sub: 'I need help at home.',
      href: `/signup/homeowner${fbQuery}`,
      border: C.forestLine,
      bg: C.forestSoft,
      accent: C.forest,
    },
    {
      emoji: '👩',
      title: 'Naghahanap ng trabaho',
      sub: 'Naghahanap ako ng trabaho.',
      href: `/signup/kasambahay${fbQuery}`,
      border: C.amberLine,
      bg: C.amberSoft,
      accent: C.amber,
    },
  ]

  return (
    <div style={{
      minHeight: '100vh', background: C.paper2, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '32px 20px', fontFamily: sans,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: serif, fontSize: 38, color: C.forestDeep, letterSpacing: '-1px', lineHeight: 1 }}>
            Maid<span style={{ color: C.amber }}>It</span>
          </div>
          {isFacebook ? (
            <div style={{ fontFamily: serif, fontSize: 24, color: C.ink, marginTop: 10, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              Kumusta, <em style={{ color: C.amber }}>{fbName.split(' ')[0]}!</em> 👋
            </div>
          ) : (
            <div style={{ fontFamily: serif, fontSize: 24, color: C.ink, marginTop: 10, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              Who are <em style={{ color: C.amber }}>you?</em>
            </div>
          )}
          <div style={{ fontSize: 13, color: C.ink3, marginTop: 6 }}>
            Choose how you'll use MaidIt
          </div>
        </div>

        {/* Facebook connected banner */}
        {isFacebook && (
          <div style={{
            background: '#E6F1FB', border: '1px solid rgba(24,119,242,0.2)',
            borderRadius: 12, padding: '10px 14px',
            fontSize: 13, color: '#1877f2', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            🔗 Naka-connect ang iyong Facebook
          </div>
        )}

        {/* Role cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {roles.map(role => (
            <button
              key={role.href}
              onClick={() => router.push(role.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '18px 18px', borderRadius: 18,
                border: `1.5px solid ${role.border}`,
                background: role.bg,
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'box-shadow .12s',
              }}
            >
              <span style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>{role.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, lineHeight: 1.3, marginBottom: 3 }}>
                  {role.title}
                </div>
                <div style={{ fontSize: 12.5, color: C.ink3, lineHeight: 1.4 }}>
                  {role.sub}
                </div>
              </div>
              <span style={{ color: role.accent, flexShrink: 0 }}><IcArrowRight /></span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: C.ink3 }}>
          Already have an account?{' '}
          <span
            onClick={() => router.push('/login')}
            style={{ color: C.forest, fontWeight: 700, cursor: 'pointer' }}
          >
            Sign in
          </span>
        </div>
      </div>
    </div>
  )
}

export default function ChooseRolePage() {
  return <Suspense fallback={null}><ChooseRoleContent /></Suspense>
}
