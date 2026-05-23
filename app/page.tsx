'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const C = {
  forest: '#27500A', forestDeep: '#1c3b07', forestSoft: '#f0f5ec', forestLine: '#e2ecdb',
  amber: '#c9943a', amberSoft: '#fbf3e2', amberLine: '#efe1bf', amberDeep: '#8a6418',
  ink: '#1a1d18', ink2: '#4a504a', ink3: '#8a8f88', ink4: '#b8bcb5',
  paper: '#ffffff', paper2: '#faf9f5', line: '#ebe9e2',
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
    <main style={{
      minHeight: '100vh',
      background: C.paper2,
      fontFamily: sans,
      paddingBottom: 24,
    }}>
      {/* Nav */}
      <nav style={{
        background: C.paper,
        borderBottom: `1px solid ${C.line}`,
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky' as const,
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ fontFamily: serif, fontSize: 26, color: C.forestDeep, lineHeight: 1 }}>
          Maid<span style={{ color: C.amber }}>It</span>
        </div>
        <button
          onClick={() => router.push('/login')}
          style={{
            padding: '8px 18px',
            borderRadius: 50,
            background: C.forest,
            border: 'none',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: sans,
          }}
        >
          Log in
        </button>
      </nav>

      {/* Hero */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '36px 22px 32px',
        textAlign: 'center',
      }}>
        <Image
          src="https://images.unsplash.com/photo-1560472355-536de3962603?w=800&h=600&fit=crop"
          fill
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          alt=""
          priority
        />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(175deg, rgba(28,59,7,0.82) 0%, rgba(28,59,7,0.55) 40%, rgba(28,59,7,0.80) 100%)',
        }} />
        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 1, padding: '36px 22px 32px', textAlign: 'center' }}>
          {/* Amber eyebrow badge */}
          <div style={{
            display: 'inline-block',
            background: C.amber,
            borderRadius: 50,
            padding: '4px 14px',
            fontSize: 11,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '0.04em',
            textTransform: 'uppercase' as const,
            marginBottom: 14,
          }}>
            Trusted · Verified · Safe
          </div>

          {/* Tagline */}
          <div style={{
            fontFamily: serif,
            fontSize: 34,
            fontStyle: 'italic',
            color: '#ffffff',
            lineHeight: 1.2,
            marginBottom: 10,
          }}>
            Find <span style={{ color: C.amber }}>trusted</span> help for your family.
          </div>

          {/* Subtext */}
          <div style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.7)',
          }}>
            Verified kasambahay. Real families. Safe hiring.
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <div style={{
        background: C.paper,
        borderBottom: `1px solid ${C.line}`,
        padding: '12px 18px',
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        flexWrap: 'wrap' as const,
      }}>
        {['✓ Trusted Profiles', '✓ Direct Communication', '✓ Safe Payment'].map((label) => (
          <span key={label} style={{
            background: C.forestSoft,
            border: `1px solid ${C.forestLine}`,
            borderRadius: 50,
            padding: '5px 13px',
            fontSize: 11.5,
            fontWeight: 600,
            color: C.forest,
          }}>
            {label}
          </span>
        ))}
      </div>

      {/* Role cards */}
      <div style={{
        padding: '0 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {/* Card 1 — Homeowner */}
        <div
          onClick={() => router.push('/homeowner-landing')}
          style={{
            background: C.paper,
            border: `1px solid ${C.line}`,
            borderRadius: 20,
            overflow: 'hidden',
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            height: 110,
          }}>
            <Image
              src="https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=120&fit=crop"
              fill
              style={{ objectFit: 'cover', objectPosition: 'center' }}
              alt=""
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(28,59,7,0.78) 0%, rgba(39,80,10,0.65) 100%)' }} />
            <div style={{ position: 'relative', zIndex: 1, padding: '18px 18px 0' }}>
              <div style={{
                fontFamily: serif,
                fontSize: 24,
                color: '#ffffff',
                lineHeight: 1.1,
              }}>
                I need help at home.
              </div>
              <div style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.75)',
                marginTop: 4,
              }}>
                Browse verified kasambahay profiles.
              </div>
            </div>
          </div>
          <div style={{
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}>
            <span style={{
              fontSize: 20,
              color: C.forest,
              fontWeight: 700,
            }}>→</span>
          </div>
        </div>

        {/* Card 2 — Kasambahay */}
        <div
          onClick={() => router.push('/kasambahay-landing')}
          style={{
            background: C.paper,
            border: `1px solid ${C.line}`,
            borderRadius: 20,
            overflow: 'hidden',
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            height: 110,
          }}>
            <Image
              src="https://images.unsplash.com/photo-1608889825205-eebdb9fc5806?w=400&h=120&fit=crop"
              fill
              style={{ objectFit: 'cover', objectPosition: 'center' }}
              alt=""
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(138,100,24,0.78) 0%, rgba(201,148,58,0.65) 100%)' }} />
            <div style={{ position: 'relative', zIndex: 1, padding: '18px 18px 0' }}>
              <div style={{
                fontFamily: serif,
                fontSize: 24,
                color: '#ffffff',
                lineHeight: 1.1,
              }}>
                Naghahanap ako ng trabaho.
              </div>
              <div style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.75)',
                marginTop: 4,
              }}>
                Mag-sign up. Libre. Walang bayad.
              </div>
            </div>
          </div>
          <div style={{
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}>
            <span style={{
              fontSize: 20,
              color: C.amber,
              fontWeight: 700,
            }}>→</span>
          </div>
        </div>
      </div>

      {/* Already have an account? */}
      <div
        onClick={() => router.push('/login')}
        style={{
          margin: '12px 18px 0',
          borderRadius: 18,
          background: C.forestSoft,
          border: `1px solid ${C.forestLine}`,
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <span style={{
          color: C.forestDeep,
          fontWeight: 700,
          fontSize: 15,
        }}>
          Already have an account?
        </span>
        <div style={{
          background: C.forest,
          color: '#ffffff',
          width: 36,
          height: 36,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          fontWeight: 700,
          flexShrink: 0,
        }}>
          →
        </div>
      </div>

      {/* Footer */}
      <div style={{
        paddingBottom: 32,
        textAlign: 'center',
        fontSize: 12,
        color: C.ink4,
        marginTop: 28,
      }}>
        MaidIt · The trusted kasambahay marketplace · Philippines
      </div>
    </main>
  )
}
