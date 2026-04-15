'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true)
    setError('')
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
      setLoading(false)
      if (profile?.role === 'kasambahay') router.push('/dashboard/kasambahay')
      else router.push('/dashboard/homeowner')
    } catch (e) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f9fafb', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'28px 20px', fontFamily:'sans-serif' }}>
      <div style={{ width:'100%', maxWidth:'380px' }}>
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <h1 style={{ fontFamily:'serif', fontSize:'2rem', fontWeight:900, marginBottom:'4px', color:'#111827' }}>
            Maid<span style={{ color:'#c9943a' }}>It</span>
          </h1>
          <p style={{ color:'#6b7280', fontSize:'.82rem' }}>Sign in to your account</p>
        </div>
        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'9px', padding:'10px 13px', fontSize:'.78rem', color:'#dc2626', marginBottom:'12px' }}>
            {error}
          </div>
        )}
        <label style={{ display:'block', fontSize:'.63rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px', color:'#6b7280', marginBottom:'4px' }}>
          Email Address
        </label>
        <input
          style={{ width:'100%', padding:'11px 13px', border:'1.5px solid #e5e7eb', borderRadius:'11px', fontFamily:'sans-serif', fontSize:'.88rem', outline:'none', marginBottom:'13px', background:'#fff', color:'#111827' }}
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <label style={{ display:'block', fontSize:'.63rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px', color:'#6b7280', marginBottom:'4px' }}>
          Password
        </label>
        <input
          style={{ width:'100%', padding:'11px 13px', border:'1.5px solid #e5e7eb', borderRadius:'11px', fontFamily:'sans-serif', fontSize:'.88rem', outline:'none', marginBottom:'13px', background:'#fff', color:'#111827' }}
          type="password"
          placeholder="Your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button
          style={{ width:'100%', padding:'13px', borderRadius:'12px', border:'none', background:'#1a6b3c', color:'#fff', fontFamily:'sans-serif', fontSize:'.92rem', fontWeight:700, cursor:'pointer', opacity: loading ? 0.6 : 1 }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <div style={{ textAlign:'center', marginTop:'16px', fontSize:'.78rem', color:'#6b7280' }}>
          No account?{' '}
          <a href="/signup/homeowner" style={{ color:'#1a6b3c', fontWeight:700, textDecoration:'none' }}>Homeowner</a>
          {' or '}
          <a href="/signup/kasambahay" style={{ color:'#c9943a', fontWeight:700, textDecoration:'none' }}>Kasambahay</a>
        </div>
        <div style={{ textAlign:'center', marginTop:'12px' }}>
          <a href="/" style={{ fontSize:'.76rem', color:'#9ca3af', textDecoration:'none' }}>Back to Home</a>
        </div>
      </div>
    </div>
  )
}