// PARTNER PAGE — All UI text must be in Taglish
// DO NOT translate to English during audits
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const C = {
  forest: '#27500A', forestDeep: '#1c3b07', forestDark: '#0f2105',
  amber: '#c9943a', amberSoft: '#fef3e2', amberLine: '#fde8c0',
  ink: '#1a1a1a', ink2: '#4a504a', ink3: '#9ca3af',
  paper: '#ffffff', paper2: '#faf9f5', line: '#ede8e0',
}
const serif = "'Instrument Serif', Georgia, serif"
const sans  = "'Geist', ui-sans-serif, sans-serif"

const STEPS = [
  { title: 'Mag-sign up bilang partner', desc: 'Libre ang pagsali. Walang bayad, walang kontrata.' },
  { title: 'I-refer ang mga kasambahay', desc: 'I-share ang iyong referral code sa mga kakilalang naghahanap ng trabaho.' },
  { title: 'Kumita sa bawat hire', desc: '₱500 payout per successful hire — direct sa iyong GCash.' },
]

export default function PartnerPage() {
  const router = useRouter()

  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600;700&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    return () => { try { document.head.removeChild(link) } catch {} }
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: C.paper2, fontFamily: sans, color: C.ink, maxWidth: 600, margin: '0 auto' }}>

      {/* HERO — photo background */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img
          src="/photos/hero-family.jpg"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(28,59,7,0.35) 0%, rgba(28,59,7,0.88) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Sticky nav inside hero */}
        <div style={{
          position: 'sticky' as const, top: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px',
          background: 'rgba(15,33,5,0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontFamily: serif, fontSize: '26px', color: '#fff', lineHeight: 1 }}>
            Maid<span style={{ color: C.amber }}>It</span>
          </div>
          <button
            onClick={() => router.push('/login')}
            style={{
              padding: '7px 16px', borderRadius: '50px',
              background: 'transparent', border: '1.5px solid rgba(255,255,255,.45)',
              color: '#fff', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', fontFamily: sans,
            }}
          >
            Mag-login
          </button>
        </div>

        {/* Hero content */}
        <div style={{ padding: '28px 20px 0', textAlign: 'center' as const }}>

          {/* Eyebrow badge */}
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '50px',
            padding: '5px 14px',
            fontSize: '11px', fontWeight: 700,
            color: '#fff',
            letterSpacing: '0.04em',
            marginBottom: '18px',
          }}>
            ✨ Kumita habang nakakatulong
          </div>

          {/* Headline */}
          <div style={{
            fontFamily: serif, fontSize: '36px',
            color: '#fff', lineHeight: 1.2, marginBottom: '14px',
          }}>
            Kumita habang<br />
            <em style={{ color: C.amber }}>nakakatulong.</em>
          </div>

          {/* Subtext */}
          <div style={{
            fontSize: '13px', color: 'rgba(255,255,255,.75)',
            lineHeight: 1.65, marginBottom: '28px',
            maxWidth: '320px', margin: '0 auto 28px',
          }}>
            Maraming pamilya ang naghahanap ng mapagkakatiwalaang kasambahay.
            Ikaw ang tulay — at kumikita ka habang nakakatulong sa iyong komunidad.
          </div>

          {/* Earnings box */}
          <div style={{
            background: 'rgba(0,0,0,.22)',
            border: '1px solid rgba(255,255,255,.1)',
            borderRadius: '20px',
            padding: '22px 18px 18px',
            marginTop: '4px',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.1em', color: 'rgba(255,255,255,.5)', marginBottom: '4px' }}>
              KUMITA NG
            </div>
            <div style={{ fontFamily: serif, fontSize: '56px', color: C.amber, lineHeight: 1, marginBottom: '6px' }}>
              ₱500
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.55)', marginBottom: '18px' }}>
              sa bawat matagumpay na hire
            </div>

            {/* Two side-by-side cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {/* Left — Referral */}
              <div style={{
                background: '#f0f5ec',
                border: '1px solid #e2ecdb',
                borderRadius: '14px', padding: '14px 12px',
                textAlign: 'left' as const,
              }}>
                <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.07em', color: '#27500A', marginBottom: '8px' }}>
                  REFERRAL FEE
                </div>
                <div style={{ fontFamily: serif, fontSize: '28px', color: '#1c3b07', lineHeight: 1, marginBottom: '6px' }}>
                  ₱500
                </div>
                <div style={{ fontSize: '11px', color: '#4a4a3a', lineHeight: 1.5 }}>
                  Sa bawat kasambahay na ma-hire — lahat ng lugar
                </div>
              </div>

              {/* Right — Bonus */}
              <div style={{
                background: '#c9943a',
                border: 'none',
                borderRadius: '14px', padding: '14px 12px',
                textAlign: 'left' as const,
                position: 'relative' as const,
              }}>
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'rgba(255,255,255,0.25)', borderRadius: 50,
                  padding: '2px 8px', fontSize: 9, fontWeight: 800,
                  color: '#fff', letterSpacing: '0.06em',
                }}>NEW</div>
                <div style={{
                  display: 'inline-block',
                  background: C.amber, borderRadius: '50px',
                  padding: '2px 8px',
                  fontSize: '8px', fontWeight: 800,
                  color: '#fff', textTransform: 'uppercase' as const,
                  letterSpacing: '.06em', marginBottom: '8px',
                }}>
                  BONUS
                </div>
                <div style={{ fontFamily: serif, fontSize: '28px', color: '#fff', lineHeight: 1, marginBottom: '6px' }}>
                  +₱500
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.88)', lineHeight: 1.5 }}>
                  Transport assistance — Leyte, Samar, at Bicol lang
                </div>
              </div>
            </div>
            <div style={{ fontSize: 10.5, fontStyle: 'italic', color: 'rgba(255,255,255,0.55)', marginTop: 10, textAlign: 'left' as const, lineHeight: 1.5 }}>
              *Transport bonus para lang sa kasambahay na galing Leyte, Samar at Bicol.
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ padding: '32px 18px 28px', background: C.paper2 }}>
        <div style={{
          fontSize: '10px', fontWeight: 700,
          textTransform: 'uppercase' as const, letterSpacing: '.1em',
          color: C.forest, marginBottom: '8px',
        }}>
          Paano gumagana
        </div>
        <div style={{ fontFamily: serif, fontSize: '26px', color: C.forestDeep, marginBottom: '22px', lineHeight: 1.2 }}>
          Tatlong <em style={{ color: C.amber }}>simpleng</em> hakbang.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
          {STEPS.map((st, i) => (
            <div key={i} style={{
              background: C.paper,
              border: `1px solid ${C.line}`,
              borderRadius: '14px',
              padding: '16px 16px',
              display: 'flex', gap: '14px', alignItems: 'flex-start',
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: C.forest, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: serif, fontSize: '15px', fontWeight: 700, flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: C.ink, lineHeight: 1.3, marginBottom: '4px' }}>
                  {st.title}
                </div>
                <div style={{ fontSize: '12.5px', color: C.ink3, lineHeight: 1.5 }}>
                  {st.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA CARD */}
      <div style={{
        margin: '0 18px 40px',
        background: '#1c3b07',
        borderRadius: '20px', padding: '24px 20px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,148,58,0.35) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>Simulan na ngayon —</div>
        <div style={{ fontFamily: serif, fontSize: '22px', color: '#fff', marginBottom: '14px', lineHeight: 1.3 }}>
          Maging Community Partner.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '7px', marginBottom: '20px' }}>
          {['Libre ang pagsali.', 'Marami ka pang matutulungang pamilya.'].map((line, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '13px', color: 'rgba(255,255,255,.75)' }}>
              <span style={{ color: C.amber, fontWeight: 700 }}>✓</span>
              {line}
            </div>
          ))}
        </div>
        <button
          onClick={() => router.push('/signup/partner')}
          style={{
            width: '100%', padding: '14px', borderRadius: '13px',
            background: C.amber, border: 'none', color: '#fff',
            fontFamily: sans, fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Maging Community Partner →
        </button>
      </div>
    </div>
  )
}
