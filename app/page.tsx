'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const C = {
  forest: '#27500A', forestDeep: '#1c3b07', forestSoft: '#f0f5ec', forestLine: '#e2ecdb',
  amber: '#c9943a', amberSoft: '#fbf3e2', amberDeep: '#a87528',
  ink: '#1a1a14', inkMid: '#4a4a3a', inkLight: '#8a8a7a',
  paper: '#faf9f5', paperWarm: '#f3ede0', line: '#e8e4db',
}
const serif = "'Instrument Serif', Georgia, serif"
const sans = "'Geist', ui-sans-serif, sans-serif"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap'
    document.head.appendChild(link)
    return () => { try { document.head.removeChild(link) } catch {} }
  }, [])

  return (
    <main style={{ minHeight: '100vh', background: C.paper, fontFamily: sans, paddingBottom: 32 }}>

      {/* Nav */}
      <nav style={{
        padding: '14px 18px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', background: C.paper,
        position: 'sticky' as const, top: 0, zIndex: 100,
        borderBottom: `1px solid ${C.line}`,
      }}>
        <div style={{ fontFamily: serif, fontSize: 24, color: C.forestDeep, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 28, height: 28, background: C.forest, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
          }}>🏠</div>
          Maid<span style={{ color: C.amber }}>It</span>
        </div>
        <button
          onClick={() => router.push('/login')}
          style={{
            background: C.forest, color: '#fff', border: 'none',
            borderRadius: 50, padding: '7px 18px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: sans,
          }}
        >
          Log in
        </button>
      </nav>

      {/* Hero card */}
      <div style={{
        margin: '14px 14px 0', borderRadius: 22, overflow: 'hidden',
        position: 'relative', height: 420,
        boxShadow: '0 12px 32px rgba(28,59,7,0.18)',
      }}>
        <Image
          src="/photos/hero-family.jpg"
          fill
          style={{ objectFit: 'cover', objectPosition: 'center 20%' }}
          alt=""
          priority
        />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(28,59,7,0.05) 0%, rgba(28,59,7,0.15) 35%, rgba(28,59,7,0.72) 72%, rgba(28,59,7,0.90) 100%)',
        }} />
        {/* Badge */}
        <div style={{
          position: 'absolute', top: 16, left: 16,
          background: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 50, padding: '5px 12px',
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 11, fontWeight: 600, color: '#fff',
        }}>
          🏡 Built for Filipino homes
        </div>
        {/* Hero content */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 20px' }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase' as const, color: C.amber, marginBottom: 8,
          }}>
            Where two homes meet —
          </div>
          <div style={{
            fontFamily: serif, fontSize: 32, color: '#fff',
            lineHeight: 1.1, marginBottom: 6,
          }}>
            find help, find work,<br />
            <span style={{ color: C.amber }}>find each other.</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', lineHeight: 1.5 }}>
            Verified profiles. Real families. Fair pay.<br />
            The kasambahay platform built around trust.
          </div>
        </div>
      </div>

      {/* Social proof strip — no avatars */}
      <div style={{
        margin: '12px 14px 0', background: C.paperWarm,
        border: `1px solid ${C.line}`, borderRadius: 16,
        padding: '13px 16px', display: 'flex',
        alignItems: 'center', gap: 12,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: serif, fontSize: 17, color: C.forestDeep }}>2,431 families</div>
          <div style={{ fontSize: 11, color: C.inkLight, marginTop: 1 }}>matched this year</div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.amberDeep }}>+ 4.9</div>
      </div>

      {/* Section label */}
      <div style={{
        padding: '18px 18px 10px',
        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase' as const, color: C.inkLight,
      }}>
        Choose your path
      </div>

      {/* Role cards */}
      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column' as const, gap: 10 }}>

        {/* Card 1 — Homeowner */}
        <div
          onClick={() => router.push('/homeowner-landing')}
          style={{
            background: '#fff', border: `1px solid ${C.line}`,
            borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
            display: 'flex', alignItems: 'stretch',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            minHeight: 110,
          }}
        >
          <div style={{ width: 110, flexShrink: 0, overflow: 'hidden' }}>
            <img
              src="/photos/hero-family.jpg"
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }}
              onError={(e) => { (e.currentTarget.parentElement as HTMLDivElement).style.background = 'linear-gradient(160deg,#1c3b07,#27500A)' }}
            />
          </div>
          <div style={{
            flex: 1, padding: '14px 12px 12px',
            display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: C.forest, marginBottom: 3 }}>
                For Homeowners
              </div>
              <div style={{ fontFamily: serif, fontSize: 20, color: C.forestDeep, lineHeight: 1.15, marginBottom: 3 }}>
                I need help at home.
              </div>
              <div style={{ fontSize: 11, color: C.inkLight, marginBottom: 8 }}>
                Browse verified kasambahay profiles.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{
                background: C.forestSoft, color: C.forest,
                borderRadius: 50, padding: '4px 10px',
                fontSize: 10, fontWeight: 600,
              }}>
                220+ available this week
              </div>
              <div style={{
                width: 34, height: 34, background: C.forest, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 15, flexShrink: 0,
              }}>→</div>
            </div>
          </div>
        </div>

        {/* Card 2 — Kasambahay */}
        <div
          onClick={() => router.push('/kasambahay-landing')}
          style={{
            background: '#fff', border: `1px solid ${C.line}`,
            borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
            display: 'flex', alignItems: 'stretch',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            minHeight: 110,
          }}
        >
          <div style={{ width: 110, flexShrink: 0, overflow: 'hidden' }}>
            <img
              src="/photos/hero-kasambahay.jpg"
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }}
              onError={(e) => { (e.currentTarget.parentElement as HTMLDivElement).style.background = 'linear-gradient(160deg,#8a6418,#c9943a)' }}
            />
          </div>
          <div style={{
            flex: 1, padding: '14px 12px 12px',
            display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: C.amberDeep, marginBottom: 3 }}>
                Para sa Kasambahay
              </div>
              <div style={{ fontFamily: serif, fontSize: 20, color: C.ink, lineHeight: 1.15, marginBottom: 3 }}>
                Naghahanap ako ng trabaho.
              </div>
              <div style={{ fontSize: 11, color: C.inkLight, marginBottom: 8 }}>
                Mag-sign up. Libre. Walang bayad.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{
                background: C.amberSoft, color: C.amberDeep,
                borderRadius: 50, padding: '4px 10px',
                fontSize: 10, fontWeight: 600,
              }}>
                160+ pamilya naghahanap ngayon
              </div>
              <div style={{
                width: 34, height: 34, background: C.amber, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 15, flexShrink: 0,
              }}>→</div>
            </div>
          </div>
        </div>
      </div>

      {/* Login card */}
      <div
        onClick={() => router.push('/login')}
        style={{
          margin: '10px 14px 0', background: C.paperWarm,
          border: `1px solid ${C.line}`, borderRadius: 18,
          padding: '14px 18px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: C.forestDeep }}>
          Already have an account?
        </div>
        <div style={{
          width: 36, height: 36, background: C.forest, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 16,
        }}>→</div>
      </div>

      {/* Footer */}
      <footer style={{
        padding: '24px 18px', textAlign: 'center',
        fontSize: 11, color: C.inkLight,
        borderTop: `1px solid ${C.line}`, marginTop: 20,
      }}>
        MaidIt · The trusted kasambahay marketplace · Philippines
      </footer>

    </main>
  )
}
