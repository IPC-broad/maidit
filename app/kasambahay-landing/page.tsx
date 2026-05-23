'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const C = {
  forest: '#27500A', forestDeep: '#1c3b07', forestSoft: '#f0f5ec', forestLine: '#e2ecdb',
  amber: '#c9943a', amberSoft: '#fbf3e2', amberLine: '#efe1bf', amberDeep: '#a87528',
  ink: '#1a1a14', inkMid: '#4a4a3a', inkLight: '#8a8a7a',
  paper: '#faf9f5', paperWarm: '#f3ecdf', line: '#ebe9e2',
}
const serif = "'Instrument Serif', Georgia, serif"
const sans = "'Geist', ui-sans-serif, sans-serif"

const promises = [
  {
    icon: '₱',
    title: 'Walang bayad',
    desc: 'Libreng-libre ang lahat. Walang kaltas sa sweldo mo.',
  },
  {
    icon: '✓',
    title: 'Verified employer',
    desc: 'ID-verified ang lahat ng pamilya. Ligtas kang makikipag-usap.',
  },
  {
    icon: '❤',
    title: 'May Boses ka',
    desc: 'Parte ka ng lahat ng diskusyon mula sweldo hanggang sa araw mo.',
  },
]

export default function KasambahayLanding() {
  const router = useRouter()

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap'
    document.head.appendChild(link)
    return () => { try { document.head.removeChild(link) } catch {} }
  }, [])

  return (
    <main style={{ minHeight: '100vh', background: C.paper, fontFamily: sans }}>

      {/* Photo Hero */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: 340 }}>
        <Image
          src="https://images.unsplash.com/photo-1608889825205-eebdb9fc5806?w=800&h=500&fit=crop&crop=faces"
          fill
          style={{ objectFit: 'cover', objectPosition: 'center top' }}
          alt=""
          priority
        />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(28,59,7,0.3) 0%, rgba(28,59,7,0.78) 100%)',
        }} />

        {/* Nav */}
        <div style={{
          position: 'relative', zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px',
        }}>
          <div style={{ fontFamily: serif, fontSize: 26, color: '#fff', lineHeight: 1 }}>
            Maid<span style={{ color: C.amber }}>It</span>
          </div>
          <button
            onClick={() => router.push('/login')}
            style={{
              padding: '7px 16px', borderRadius: 50,
              background: 'transparent', border: '1.5px solid rgba(255,255,255,0.45)',
              color: '#fff', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: sans,
            }}
          >
            Mag-login
          </button>
        </div>

        {/* Hero content — pinned to bottom of photo */}
        <div style={{
          position: 'relative', zIndex: 10,
          padding: '32px 20px 40px',
        }}>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-block',
            background: 'rgba(201,148,58,0.22)',
            border: '1px solid rgba(201,148,58,0.4)',
            borderRadius: 50, padding: '5px 14px',
            fontSize: 10, fontWeight: 700,
            color: '#fde8c0', letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            marginBottom: 14,
          }}>
            Para sa Kasambahay
          </div>

          <h1 style={{
            fontFamily: serif, fontSize: 28, color: '#fff',
            lineHeight: 1.15, letterSpacing: '-0.02em',
            margin: '0 0 10px', fontWeight: 400,
          }}>
            Maghanap ng trabaho.{' '}
            <span style={{ fontStyle: 'italic', color: C.amber }}>Tingnan ang mga job offers.</span>
          </h1>

          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)', margin: 0, lineHeight: 1.5 }}>
            Libre ang sign-up. Walang ahensya, walang bayad.
          </p>
        </div>
      </section>

      {/* CTA card — overlapping hero */}
      <div style={{
        margin: '-22px 16px 0',
        background: '#fff',
        borderRadius: 20,
        padding: '20px 18px',
        boxShadow: '0 10px 24px -10px rgba(28,59,7,0.22)',
        border: `1px solid ${C.line}`,
        position: 'relative', zIndex: 20,
        display: 'flex', flexDirection: 'column' as const, gap: 10,
      }}>
        <button
          onClick={() => router.push('/signup/kasambahay')}
          style={{
            width: '100%', height: 50, borderRadius: 50,
            background: C.amber, border: 'none',
            color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', fontFamily: sans,
          }}
        >
          Mag-sign up →
        </button>
        <button
          onClick={() => router.push('/login')}
          style={{
            width: '100%', height: 46, borderRadius: 50,
            background: C.forestSoft,
            border: `1px solid ${C.forestLine}`,
            color: C.forestDeep, fontSize: 13.5, fontWeight: 600,
            cursor: 'pointer', fontFamily: sans,
          }}
        >
          May account na? Mag-log in
        </button>
      </div>

      {/* Promise section */}
      <section style={{ padding: '36px 20px 32px' }}>
        {/* Eyebrow */}
        <div style={{
          fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em', color: C.inkLight,
          marginBottom: 8,
        }}>
          Ang Aming Pangako Sayo
        </div>

        {/* Headline */}
        <div style={{
          fontFamily: serif, fontSize: 24,
          color: C.forestDeep, lineHeight: 1.2,
          marginBottom: 22, letterSpacing: '-0.015em',
        }}>
          Tatlong bagay na{' '}
          <span style={{ fontStyle: 'italic', color: C.amberDeep }}>hinding-hindi</span>{' '}
          mababago.
        </div>

        {/* Promise cards — 2-column grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}>
          {promises.map((p, i) => (
            <div
              key={p.title}
              style={{
                background: '#fff',
                border: `1px solid ${C.line}`,
                borderRadius: 18,
                padding: '16px 14px',
                gridColumn: i === 2 ? '1 / -1' : undefined,
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 12,
                background: C.forestSoft,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, color: C.forest,
                marginBottom: 10, fontWeight: 700,
              }}>
                {p.icon}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, marginBottom: 5 }}>
                {p.title}
              </div>
              <div style={{ fontSize: 12, color: C.inkLight, lineHeight: 1.5 }}>
                {p.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '20px 20px 32px',
        textAlign: 'center',
        borderTop: `1px solid ${C.line}`,
      }}>
        <div style={{ fontSize: 12, color: C.inkLight }}>© 2025 MaidIt · Philippines</div>
        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center', gap: 12 }}>
          <span onClick={() => router.push('/privacy')} style={{ fontSize: 12, color: C.forest, cursor: 'pointer' }}>Privacy</span>
          <span onClick={() => router.push('/terms')} style={{ fontSize: 12, color: C.forest, cursor: 'pointer' }}>Terms</span>
        </div>
      </footer>
    </main>
  )
}
