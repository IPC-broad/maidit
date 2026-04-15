import Link from 'next/link'
export default function Success() {
  return (
    <div style={{ minHeight:'100vh', background:'#0d1117', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'28px', textAlign:'center', fontFamily:'sans-serif', color:'#fff' }}>
      <div style={{ fontSize:'3rem', marginBottom:'16px' }}>🎉</div>
      <h1 style={{ fontWeight:900, fontSize:'1.4rem', color:'#f0c97a', marginBottom:'8px' }}>Account created!</h1>
      <p style={{ color:'rgba(255,255,255,.5)', fontSize:'.84rem', lineHeight:1.7, marginBottom:'24px' }}>
        Magiging live na ang iyong profile.<br/>Check your email to verify your account.
      </p>
      <Link href="/dashboard/kasambahay" style={{ width:'100%', maxWidth:'320px', padding:'13px 28px', borderRadius:'12px', background:'#c9943a', color:'#fff', fontWeight:700, textDecoration:'none', fontSize:'.92rem', display:'block', marginBottom:'12px' }}>
        Pumunta sa Dashboard →
      </Link>
      <Link href="/" style={{ fontSize:'.78rem', color:'rgba(255,255,255,.35)', textDecoration:'none' }}>
        ← Back to Home
      </Link>
    </div>
  )
}
