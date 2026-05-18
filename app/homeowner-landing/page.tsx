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

const steps = [
  {
    num: '1',
    title: 'Browse verified profiles',
    desc: 'Every kasambahay has a selfie, listed skills, and work experience.',
  },
  {
    num: '2',
    title: 'Send a job offer',
    desc: 'Set your salary, schedule, and household details directly in the app.',
  },
  {
    num: '3',
    title: 'Hire with confidence',
    desc: 'Pay securely through MaidIt. Kasambahay confirms before starting.',
  },
]

const trustItems = [
  {
    icon: '📸',
    title: 'Selfie Verified',
    desc: 'Profile photo required for every kasambahay.',
  },
  {
    icon: '🛡️',
    title: 'ID Checked',
    desc: 'Government ID verification available.',
  },
  {
    icon: '💬',
    title: 'Direct Communication',
    desc: 'Chat directly — no intermediaries.',
  },
  {
    icon: '🔒',
    title: 'Safe Payment',
    desc: 'Payment released only after confirmed arrival.',
  },
]

const features = [
  'Send up to 10 job offers',
  'Post 1 job listing',
  'Discounted hiring fee',
]

export default function HomeownerLanding() {
  const router = useRouter()

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap'
    document.head.appendChild(link)
    return () => { try { document.head.removeChild(link) } catch {} }
  }, [])

  return (
    <main style={{ minHeight: '100vh', background: C.paper2, fontFamily: sans }}>

      {/* Sticky nav */}
      <nav style={{
        background: C.paper,
        borderBottom: `1px solid ${C.line}`,
        padding: '12px 18px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          fontFamily: serif,
          fontSize: 28,
          color: C.forestDeep,
          lineHeight: 1,
        }}>
          Maid<span style={{ color: C.amber }}>It</span>
        </div>
        <button
          onClick={() => router.push('/login')}
          style={{
            fontSize: 13,
            color: C.forest,
            fontWeight: 600,
            border: `1px solid ${C.forestLine}`,
            padding: '7px 14px',
            borderRadius: 50,
            background: 'transparent',
            cursor: 'pointer',
            fontFamily: sans,
          }}
        >
          Sign in
        </button>
      </nav>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(175deg, #1c3b07 0%, #27500A 60%, #2d5c0c 100%)',
        padding: '48px 22px 40px',
        textAlign: 'center',
      }}>
        {/* Eyebrow */}
        <div style={{
          display: 'inline-block',
          background: 'rgba(255,255,255,0.2)',
          color: '#ffffff',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          borderRadius: 50,
          padding: '5px 12px',
          marginBottom: 18,
        }}>
          For Homeowners
        </div>

        {/* H1 */}
        <h1 style={{
          fontFamily: serif,
          fontSize: 36,
          color: '#ffffff',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          margin: '0 0 8px',
          fontWeight: 400,
        }}>
          Find your trusted kasambahay{' '}
          <span style={{ fontStyle: 'italic', color: C.amber }}>safely.</span>
        </h1>

        {/* Subtext */}
        <p style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.75)',
          marginTop: 8,
          marginBottom: 0,
        }}>
          Browse real profiles. Hire with confidence.
        </p>

        {/* Action buttons */}
        <div style={{
          maxWidth: 320,
          margin: '24px auto 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <button
            onClick={() => router.push('/browse')}
            style={{
              background: C.paper,
              color: C.forestDeep,
              height: 52,
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              fontFamily: sans,
              width: '100%',
            }}
          >
            Browse Kasambahay Profiles →
          </button>
          <button
            onClick={() => router.push('/dashboard/homeowner/post-job')}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              border: '1.5px solid rgba(255,255,255,0.35)',
              height: 48,
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: sans,
              width: '100%',
            }}
          >
            Post a Job
          </button>
        </div>
      </section>

      {/* How it works */}
      <section style={{
        padding: '32px 22px',
        background: C.paper2,
      }}>
        <div style={{
          fontFamily: serif,
          fontSize: 26,
          color: C.forestDeep,
          marginBottom: 22,
        }}>
          How it works.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {steps.map((step) => (
            <div key={step.num} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                background: C.forest,
                color: '#ffffff',
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: serif,
                fontSize: 15,
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {step.num}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 13, color: C.ink3, lineHeight: 1.5 }}>
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust section */}
      <section style={{
        padding: '28px 22px',
        background: C.paper,
      }}>
        <div style={{
          fontFamily: serif,
          fontSize: 26,
          color: C.forestDeep,
          marginBottom: 6,
        }}>
          MaidIt — Built for safe hiring.
        </div>
        <div style={{ fontSize: 13, color: C.ink3 }}>
          Every profile is manually reviewed for quality and safety.
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginTop: 18,
        }}>
          {trustItems.map((item) => (
            <div key={item.title} style={{
              background: C.paper,
              border: `1px solid ${C.line}`,
              borderRadius: 14,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}>
              <div style={{ fontSize: 20 }}>{item.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{item.title}</div>
              <div style={{ fontSize: 11.5, color: C.ink3, lineHeight: 1.4 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ₱499 CTA card */}
      <div style={{
        margin: '20px 22px',
        borderRadius: 22,
        background: 'linear-gradient(160deg, #1c3b07 0%, #27500A 100%)',
        padding: '24px 22px',
        color: '#ffffff',
      }}>
        {/* Eyebrow */}
        <div style={{
          display: 'inline-block',
          background: 'rgba(255,255,255,0.2)',
          color: '#ffffff',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          borderRadius: 50,
          padding: '4px 10px',
          marginBottom: 14,
        }}>
          START HIRING
        </div>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
          <span style={{
            fontFamily: serif,
            fontSize: 52,
            color: C.amber,
            lineHeight: 1,
          }}>
            ₱499
          </span>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>/month</span>
        </div>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {features.map((f) => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
              <span style={{ color: C.amber, fontWeight: 700 }}>✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>

        {/* CTA button */}
        <button
          onClick={() => router.push('/browse')}
          style={{
            background: C.paper,
            color: C.forestDeep,
            borderRadius: 14,
            height: 52,
            fontSize: 15,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            fontFamily: sans,
            marginTop: 20,
          }}
        >
          Browse Kasambahay Profiles →
        </button>

        {/* Fine print */}
        <div style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.5)',
          textAlign: 'center',
          marginTop: 10,
        }}>
          No commitment. Cancel anytime.
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        padding: '28px 22px',
        textAlign: 'center',
        borderTop: `1px solid ${C.line}`,
        background: C.paper2,
      }}>
        <div style={{ fontSize: 12, color: C.ink4 }}>© 2025 MaidIt · Philippines</div>
        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center', gap: 12 }}>
          <span
            onClick={() => router.push('/privacy')}
            style={{ fontSize: 12, color: C.forest, cursor: 'pointer' }}
          >
            Privacy
          </span>
          <span
            onClick={() => router.push('/terms')}
            style={{ fontSize: 12, color: C.forest, cursor: 'pointer' }}
          >
            Terms
          </span>
        </div>
      </footer>
    </main>
  )
}
