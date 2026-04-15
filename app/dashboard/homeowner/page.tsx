import Link from 'next/link'
export default function HWDashboard() {
  return (
    <div style={{ minHeight:'100vh', background:'#111827', padding:'24px 20px', fontFamily:'sans-serif', color:'#fff' }}>
      <Link href="/" style={{ fontSize:'.78rem', color:'rgba(255,255,255,.4)', textDecoration:'none', display:'block', marginBottom:'20px' }}>← Back</Link>
      <h1 style={{ fontFamily:'serif', fontSize:'1.4rem', fontWeight:900, color:'#6ee7b7', marginBottom:'6px' }}>My Dashboard</h1>
      <p style={{ color:'rgba(255,255,255,.4)', fontSize:'.8rem' }}>Dashboard coming soon — logged in successfully! ✅</p>
    </div>
  )
}
