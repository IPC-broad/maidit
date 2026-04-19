import Link from 'next/link'

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#0d1117',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '28px 24px',
      textAlign: 'center',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{
        fontSize: '3rem',
        fontWeight: 900,
        color: '#fff',
        letterSpacing: '-2px',
        marginBottom: '6px'
      }}>
        Maid<span style={{ color: '#f0c97a' }}>It</span>
      </h1>

      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '32px' }}>
        The trusted kasambahay marketplace — Philippines
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', width: '100%', maxWidth: '320px' }}>
        <Link href="/homeowner" style={{
          padding: '14px',
          borderRadius: '13px',
          background: '#fff',
          color: '#111827',
          fontWeight: 700,
          textDecoration: 'none',
          fontSize: '0.95rem'
        }}>
          🏠 I Need Help at Home
        </Link>

        <Link href="/signup/kasambahay" style={{
          padding: '14px',
          borderRadius: '13px',
          background: '#c9943a',
          color: '#fff',
          fontWeight: 700,
          textDecoration: 'none',
          fontSize: '0.95rem'
        }}>
          💼 Naghahanap ng Trabaho?
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginTop: '28px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>✅ Verified profiles</span>
        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>🛡️ 30-day Rematch</span>
        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>💼 100% Free for Kasambahay</span>
      </div>
    </main>
  )
}