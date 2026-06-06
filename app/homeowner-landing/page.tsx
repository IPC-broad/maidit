'use client'

import { useEffect, useState } from 'react'
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


export default function HomeownerLanding() {
  const router = useRouter()
  const [kbProfiles, setKbProfiles] = useState<any[]>([])

  useEffect(() => {
    const fetchProfiles = async () => {
      const { supabase } = await import('../../lib/supabase')
      const { data } = await supabase
        .from('kasambahay')
        .select('id, profile_id, asking_salary, setup, age, profiles:profile_id(full_name)')
        .eq('is_verified', true)
        .limit(2)
      setKbProfiles(data || [])
    }
    fetchProfiles()
  }, [])

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap'
    document.head.appendChild(link)
    return () => { try { document.head.removeChild(link) } catch {} }
  }, [])

  return (
    <main style={{ minHeight: '100vh', background: C.paper2, fontFamily: sans, maxWidth: 600, margin: '0 auto' }}>

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
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: 320 }}>
        <Image
          src="/photos/hero-family.jpg"
          fill
          style={{ objectFit: 'cover', objectPosition: 'center top' }}
          alt=""
          priority
        />
        {/* Overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(28,59,7,0.25) 0%, rgba(28,59,7,0.85) 100%)',
        }} />
        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, padding: '48px 22px 40px', textAlign: 'center' }}>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-block',
            background: 'rgba(201,148,58,0.22)',
            color: '#fde8c0',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            borderRadius: 50,
            padding: '5px 12px',
            marginBottom: 18,
            border: '1px solid rgba(201,148,58,0.35)',
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
        </div>
      </section>

      {/* Kasambahay preview carousel */}
      <section style={{ padding: '28px 22px 8px', background: '#faf9f5' }}>
        <div style={{ fontFamily: serif, fontSize: 22, color: '#1c3b07', marginBottom: 4, letterSpacing: '-0.01em' }}>
          Some wonderful people looking for a home.
        </div>
        <div style={{ fontSize: 13, color: '#8a8a7a', marginBottom: 16 }}>Verified profiles on MaidIt.</div>
        <div
          style={{
            display: 'flex', gap: 14, overflowX: 'auto',
            scrollbarWidth: 'none', paddingBottom: 4,
          }}
        >
          {kbProfiles.map((kb: any) => {
            const fullName = kb.profiles?.full_name || ''
            const firstName = fullName.split(' ')[0] || ''
            const lastInit = fullName.split(' ')[1]?.[0]
            const displayName = lastInit ? `${firstName} ${lastInit}.` : firstName
            const selfieUrl = kb.profile_id
              ? `https://xlagwtsrjbylhxfozoem.supabase.co/storage/v1/object/public/Selfies/${kb.profile_id}/selfie.png`
              : null
            return (
              <div key={kb.id} style={{
                flexShrink: 0, width: 180,
                background: '#ffffff', borderRadius: 18,
                border: '1px solid #ebe9e2',
                overflow: 'hidden',
                boxShadow: '0 10px 24px -10px rgba(28,59,7,0.18)',
              }}>
                {/* Photo */}
                <div style={{ height: 130, background: 'linear-gradient(155deg, #fde8c0 0%, #e8c47a 100%)', position: 'relative', overflow: 'hidden' }}>
                  {selfieUrl && (
                    <img
                      src={selfieUrl}
                      alt={displayName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                </div>
                {/* Info */}
                <div style={{ padding: '12px 12px 14px' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a14', marginBottom: 2 }}>
                    {displayName}{kb.age ? <span style={{ color: '#8a8a7a', fontWeight: 400 }}>, {kb.age}</span> : null}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#4a4a3a', marginBottom: 8 }}>
                    {kb.setup || 'Kasambahay'}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#27500A' }}>
                    ₱{kb.asking_salary?.toLocaleString() || '—'}<span style={{ fontSize: 11, fontWeight: 400, color: '#8a8a7a' }}>/mo</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div
          onClick={() => router.push('/browse')}
          style={{ marginTop: 14, fontSize: 13, fontWeight: 600, color: '#27500A', cursor: 'pointer' }}
        >
          See all profiles →
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

      {/* Bottom CTA card */}
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

        <div style={{ fontFamily: serif, fontSize: 28, color: '#ffffff', lineHeight: 1.2, marginBottom: 8 }}>
          Find your kasambahay{' '}
          <span style={{ fontStyle: 'italic', color: C.amber }}>today.</span>
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 20, lineHeight: 1.5 }}>
          Browse real profiles, send job offers, and hire with confidence.
        </div>

        {/* CTA button */}
        <button
          onClick={() => router.push('/signup/homeowner')}
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
          }}
        >
          Sign Up Free →
        </button>

        {/* Fine print */}
        <div style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.5)',
          textAlign: 'center',
          marginTop: 10,
        }}>
          Free to browse. Free to send offers. Pay ₱2,500 only when you hire.
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
