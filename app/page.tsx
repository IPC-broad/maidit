import Link from 'next/link'
export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#faf8f5',
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
        color: '#1a1a1a',
        letterSpacing: '-2px',
        marginBottom: '6px'
      }}>
        Maid<span style={{ color: '#c9943a' }}>It</span>
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '32px' }}>
        The trusted kasambahay marketplace — Philippines
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', width: '100%', maxWidth: '320px' }}>
        <Link href="/homeowner" style={{
          padding: '14px',
          borderRadius: '13px',
          background: '#fff',
          color: '#1a1a1a',
          fontWeight: 700,
          textDecoration: 'none',
          fontSize: '0.95rem',
          border: '1.5px solid #ede8e0'
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
        <Link href="/login" style={{
          padding: '12px',
          borderRadius: '13px',
          background: 'transparent',
          color: '#6b7280',
          fontWeight: 600,
          textDecoration: 'none',
          fontSize: '0.88rem',
          border: '1.5px solid #ede8e0'
        }}>
          🔐 Already have an account? Sign In
        </Link>
      </div>
      <div style={{ display: 'flex', gap: '16px', marginTop: '28px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>✅ Verified profiles</span>
        <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>🛡️ 30-day Rematch</span>
        <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>💼 100% Free for Kasambahay</span>
      </div>
    </main>
  )
}
