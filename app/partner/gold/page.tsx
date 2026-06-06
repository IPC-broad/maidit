// GOLD PARTNER PAGE — All UI text must be in Taglish
// DO NOT translate to English during audits
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const C = {
  forest: '#27500A', forestDeep: '#1c3b07', forestDark: '#0f2105',
  amber: '#c9943a', amberSoft: '#fef3e2', amberLine: '#fde8c0', amberDeep: '#8a6418',
  ink: '#1a1a14', ink2: '#4a4a3a', ink3: '#8a8a7a',
  paper: '#ffffff', paper2: '#faf9f5', line: '#e8e4db',
  forestSoft: '#f0f5ec', forestLine: '#c8e0b8',
}
const serif = "'Instrument Serif', Georgia, serif"
const sans  = "'Geist', ui-sans-serif, sans-serif"

const EARN_ROWS = [
  {
    photo: '/photos/hero-kasambahay.jpg',
    title: 'Mag-refer ng kasambahay',
    desc: 'Competitive referral fee bawat matagumpay na hire',
    note: '+transport bonus para sa ilang probinsya',
  },
  {
    photo: '/photos/hero-family.jpg',
    title: 'Mag-recruit ng sub-agent',
    desc: 'Override commission bawat hire ng iyong sub-agent',
    note: 'Passive income kahit hindi ikaw mismo ang nag-refer',
  },
]

const STEPS = [
  {
    title: 'Mag-sign up bilang Gold Partner',
    sub: 'Libre. Gamitin ang espesyal na link sa ibaba para ma-link sa Gold Partner network.',
  },
  {
    title: 'I-refer ang kasambahay o mag-recruit ng sub-agent',
    sub: 'I-share ang iyong referral link sa Messenger, SMS, o personal.',
  },
  {
    title: 'Kumita sa dalawang paraan',
    sub: 'Sa bawat hire ng iyong referral at sa bawat hire ng iyong sub-agent.',
  },
]

export default function GoldPartnerPage() {
  const router = useRouter()

  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    return () => { try { document.head.removeChild(link) } catch {} }
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: C.paper2, fontFamily: sans, color: C.ink, maxWidth: 600, margin: '0 auto', paddingBottom: 48 }}>

      {/* NAV */}
      <nav style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.paper, borderBottom: `1px solid ${C.line}` }}>
        <button
          onClick={() => router.back()}
          style={{ fontSize: 20, color: C.forest, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0, lineHeight: 1 }}
          aria-label="Back"
        >←</button>
        <div style={{ fontFamily: serif, fontSize: 22, color: C.forestDeep, letterSpacing: '-0.01em' }}>
          Maid<span style={{ color: C.amber }}>It</span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: C.amberSoft, border: `1px solid ${C.amberLine}`, borderRadius: 50, padding: '4px 10px', fontSize: 10, fontWeight: 700, color: C.amberDeep, letterSpacing: '0.04em' }}>
          ✦ Gold Partner Program
        </div>
      </nav>

      {/* PHOTO HERO */}
      <div style={{ position: 'relative', height: 340, overflow: 'hidden' }}>
        <img
          src="/photos/hero-family.jpg"
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        {/* Fallback bg */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${C.forestDark} 0%, ${C.forestDeep} 50%, ${C.forest} 100%)`, zIndex: 0 }} />
        {/* Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(28,59,7,0.18) 0%, rgba(28,59,7,0.52) 45%, rgba(15,33,5,0.94) 100%)', zIndex: 1 }} />
        {/* Hero content */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 18px 20px', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.24)', borderRadius: 50, padding: '5px 12px', fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 10 }}>
            ✦ <span style={{ color: C.amber }}>Para sa Gold Partners</span>
          </div>
          <div style={{ fontFamily: serif, fontSize: 27, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
            Kumita sa dalawang paraan.<br />
            <em style={{ color: C.amber, fontStyle: 'italic' }}>Referral at override — sabay.</em>
          </div>
        </div>
      </div>

      {/* EARNING CARD — overlapping hero */}
      <div style={{ margin: '-22px 14px 0', background: C.paper, borderRadius: 22, padding: '18px 16px 14px', boxShadow: '0 8px 32px rgba(28,59,7,0.16)', position: 'relative', zIndex: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: C.ink3, marginBottom: 12 }}>
          Dalawang paraan ng kita
        </div>

        {EARN_ROWS.map((row, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 0',
              borderBottom: i < EARN_ROWS.length - 1 ? `1px solid ${C.line}` : 'none',
            }}
          >
            {/* Photo thumbnail */}
            <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: C.forestSoft }}>
              <img
                src={row.photo}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 2 }}>{row.title}</div>
              <div style={{ fontSize: 11, color: C.ink2, lineHeight: 1.45, marginBottom: 3 }}>{row.desc}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.amber }}>{row.note}</div>
            </div>
            {/* Arrow indicator */}
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.forestSoft, border: `1px solid ${C.forestLine}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, color: C.forest }}>→</div>
          </div>
        ))}
      </div>

      {/* AMBER INFO BOX */}
      <div style={{ margin: '12px 14px 0', background: C.amberSoft, border: `1.5px solid ${C.amberLine}`, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.2 }}>⭐</span>
        <div style={{ fontSize: 12, color: C.amberDeep, lineHeight: 1.55, fontWeight: 600 }}>
          Para sa Gold Partners lang ang dalawang paraan na ito.
          <span style={{ fontWeight: 400, color: C.ink3, display: 'block', marginTop: 2 }}>
            Ang regular Community Partners ay may referral fee lang — ang Gold Partners ay may override commission pa.
          </span>
        </div>
      </div>

      {/* PAANO SECTION */}
      <div style={{ padding: '28px 18px 0' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: C.ink3, marginBottom: 6 }}>Paano</div>
        <div style={{ fontFamily: serif, fontSize: 20, color: C.ink, marginBottom: 18, lineHeight: 1.2 }}>Tatlong hakbang lang.</div>

        <div style={{ display: 'flex', flexDirection: 'column' as const }}>
          {STEPS.map((step, i) => (
            <div
              key={i}
              style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                padding: '13px 0',
                borderBottom: i < STEPS.length - 1 ? `1px solid ${C.line}` : 'none',
              }}
            >
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.amberSoft, border: `1px solid ${C.amberLine}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.amberDeep, flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ paddingTop: 2 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 3 }}>{step.title}</div>
                <div style={{ fontSize: 12, color: C.ink3, lineHeight: 1.55 }}>{step.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM CTA */}
      <div style={{ margin: '28px 14px 0', background: `linear-gradient(150deg, ${C.forestDark} 0%, ${C.forest} 100%)`, borderRadius: 22, padding: '24px 20px', position: 'relative', overflow: 'hidden' }}>
        {/* Amber glow */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, background: 'radial-gradient(circle, rgba(201,148,58,0.20), transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: C.amber, marginBottom: 6, position: 'relative' }}>
          Simulan na ngayon —
        </div>
        <div style={{ fontFamily: serif, fontSize: 26, color: '#fff', lineHeight: 1.15, marginBottom: 6, position: 'relative', letterSpacing: '-0.01em' }}>
          Maging Gold Partner.
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 20, lineHeight: 1.55, position: 'relative' }}>
          Kumita sa referral at override. Libre ang pagsali. Walang quota, walang deadline.
        </div>

        <button
          onClick={() => router.push('/signup/partner?ref=MAIDIT-RN0001')}
          style={{ width: '100%', background: C.amber, color: '#fff', border: 'none', borderRadius: 50, padding: '14px 20px', fontSize: 14, fontWeight: 700, fontFamily: sans, cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <span>Maging Community Gold Partner →</span>
          <span style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>→</span>
        </button>

        <div style={{ marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55, textAlign: 'center' as const, position: 'relative' }}>
          Mag-sign up gamit ang link na ito para ma-link ang iyong account sa Gold Partner network.
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ padding: '24px 18px', textAlign: 'center' as const, fontSize: 11, color: C.ink3, borderTop: `1px solid ${C.line}`, marginTop: 28 }}>
        MaidIt · The trusted kasambahay marketplace · Philippines
      </div>

    </div>
  )
}
