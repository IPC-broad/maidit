'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(175deg, #1c3b07 0%, #27500A 60%, #2d5c0c 100%)',
        padding: '52px 22px 40px',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{
          fontFamily: serif,
          fontSize: 48,
          color: '#ffffff',
          marginBottom: 16,
          lineHeight: 1,
        }}>
          Maid<span style={{ color: C.amber }}>It</span>
        </div>

        {/* Tagline */}
        <div style={{
          fontFamily: serif,
          fontSize: 34,
          fontStyle: 'italic',
          color: '#ffffff',
          lineHeight: 1.2,
          marginBottom: 12,
        }}>
          Find <span style={{ color: C.amber }}>trusted</span> help for your family.
        </div>

        {/* Subtext */}
        <div style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.7)',
          marginBottom: 24,
        }}>
          Verified kasambahay. Real families. Safe hiring.
        </div>

        {/* Stats pills */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}>
          {['✓ Trusted Profiles', '✓ Direct Communication', '✓ Safe Payment'].map((label) => (
            <span key={label} style={{
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 50,
              padding: '6px 14px',
              fontSize: 12,
              color: '#ffffff',
            }}>
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* Trusted Profiles banner card */}
      <div style={{
        margin: '16px 18px',
        background: C.paper,
        border: `1px solid ${C.line}`,
        borderRadius: 18,
        padding: '18px 18px 16px',
      }}>
        {/* Eyebrow pill */}
        <div style={{
          display: 'inline-block',
          background: C.forestSoft,
          color: C.forest,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          borderRadius: 50,
          padding: '4px 10px',
          marginBottom: 10,
        }}>
          VERIFIED & SAFE
        </div>

        {/* Heading */}
        <div style={{
          fontFamily: serif,
          fontSize: 22,
          color: C.forestDeep,
          lineHeight: 1.25,
          marginBottom: 14,
        }}>
          Selfie required. ID verified. Real people only.
        </div>

        {/* Feature pills */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          {['🛡️ ID Checked', '💬 Direct Contact', '🔒 Safe Payment'].map((label) => (
            <span key={label} style={{
              background: C.paper2,
              border: `1px solid ${C.line}`,
              color: C.ink2,
              padding: '6px 12px',
              borderRadius: 50,
              fontSize: 12,
              fontWeight: 600,
            }}>
              {label}
            </span>
          ))}
        </div>
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
            background: 'linear-gradient(135deg, #1c3b07 0%, #27500A 100%)',
            height: 80,
            padding: '18px 18px 0',
          }}>
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
          onClick={() => router.push('/signup/kasambahay')}
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
            background: 'linear-gradient(135deg, #8a6418 0%, #c9943a 100%)',
            height: 80,
            padding: '18px 18px 0',
          }}>
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
