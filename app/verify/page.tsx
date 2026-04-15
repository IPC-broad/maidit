'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function VerifyPage() {
  const router = useRouter()
  const [method, setMethod] = useState('')
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [sentOtp, setSentOtp] = useState('')
  const [step, setStep] = useState('choose')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendEmailVerification = async () => {
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not logged in'); setLoading(false); return }
    const { error } = await supabase.auth.resend({ type: 'signup', email: user.email })
    if (error) { setError(error.message); setLoading(false); return }
    setLoading(false)
    setStep('done')
    setMethod('email')
  }

  const sendMobileOtp = async () => {
    if (!mobile || mobile.length < 11) { setError('Enter a valid 11-digit mobile number'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile })
    })
    const data = await res.json()
    if (!res.ok) { setError('SMS failed. Check your number.'); setLoading(false); return }
    setSentOtp(data.otp)
    setLoading(false)
    setStep('enter')
  }

  const verifyOtp = async () => {
    if (otp !== sentOtp) { setError('Wrong code. Please try again.'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({ verified: true, verified_via: 'mobile' }).eq('id', user.id)
    setLoading(false)
    setStep('done')
    setMethod('mobile')
  }

  const goToDashboard = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role === 'kasambahay') router.push('/dashboard/kasambahay')
    else router.push('/dashboard/homeowner')
  }

  const w = { minHeight:'100vh', background:'#f9fafb', padding:'24px 20px', fontFamily:'sans-serif', color:'#111827' }
  const btn = { width:'100%', padding:'13px', borderRadius:'12px', border:'none', background:'#1a6b3c', color:'#111827', fontFamily:'sans-serif', fontSize:'.92rem', fontWeight:700, cursor:'pointer', marginTop:'8px' }
  const inp = { width:'100%', padding:'11px 13px', border:'1.5px solid #e5e7eb', borderRadius:'11px', background:'#ffffff', color:'#111827', fontFamily:'sans-serif', fontSize:'.88rem', outline:'none', marginBottom:'13px' }
  const card = { background:'#ffffff', border:'1.5px solid #e5e7eb', borderRadius:'14px', padding:'16px', marginBottom:'12px', cursor:'pointer', display:'flex', gap:'13px', alignItems:'center' }
  const cardSel = { background:'rgba(26,107,60,.15)', border:'1.5px solid #1a6b3c' }
  const errBox = { background:'rgba(220,38,38,.1)', border:'1px solid rgba(220,38,38,.3)', borderRadius:'9px', padding:'10px 13px', fontSize:'.78rem', color:'#fca5a5', marginBottom:'12px' }
  const dot = (active) => ({ width:'18px', height:'18px', borderRadius:'50%', border:'2px solid', borderColor: active ? '#1a6b3c' : 'rgba(255,255,255,.2)', background: active ? '#1a6b3c' : 'transparent', flexShrink:0 })

  return (
    <div style={w}>
      <button style={{ background:'none', border:'none', color:'#6b7280', fontSize:'1rem', cursor:'pointer', marginBottom:'20px', display:'block', padding:0 }} onClick={() => router.back()}>
        Back
      </button>

      {step === 'choose' && (
        <div>
          <div style={{ fontSize:'2rem', marginBottom:'12px' }}>🔐</div>
          <div style={{ fontWeight:900, fontSize:'1.3rem', marginBottom:'6px' }}>Verify your identity</div>
          <div style={{ fontSize:'.78rem', color:'#6b7280', marginBottom:'24px', lineHeight:1.6 }}>
            Choose email or mobile. You only need to do this once to unlock all features.
          </div>

          {error && <div style={errBox}>⚠️ {error}</div>}

          <div style={{ ...card, ...(method === 'email' ? cardSel : {}) }} onClick={() => { setMethod('email'); setError('') }}>
            <div style={{ fontSize:'1.6rem' }}>📧</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:'.88rem', marginBottom:'2px' }}>Verify via Email</div>
              <div style={{ fontSize:'.72rem', color:'#6b7280' }}>We send a link to your registered email. Free.</div>
            </div>
            <div style={dot(method === 'email')}/>
          </div>

          <div style={{ ...card, ...(method === 'mobile' ? cardSel : {}) }} onClick={() => { setMethod('mobile'); setError('') }}>
            <div style={{ fontSize:'1.6rem' }}>📱</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:'.88rem', marginBottom:'2px' }}>Verify via Mobile OTP</div>
              <div style={{ fontSize:'.72rem', color:'#6b7280' }}>We send a 6-digit code to your phone via SMS.</div>
            </div>
            <div style={dot(method === 'mobile')}/>
          </div>

          {method === 'email' && (
            <button style={{ ...btn, opacity: loading ? .6 : 1 }} onClick={sendEmailVerification} disabled={loading}>
              {loading ? 'Sending...' : 'Send Verification Email'}
            </button>
          )}

          {method === 'mobile' && (
            <div style={{ marginTop:'12px' }}>
              <label style={{ display:'block', fontSize:'.63rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px', color:'#6b7280', marginBottom:'4px' }}>
                Mobile Number
              </label>
              <input style={inp} placeholder="09XX XXX XXXX" value={mobile} onChange={e => setMobile(e.target.value)} maxLength={11}/>
              <button style={{ ...btn, background:'#c9943a', opacity: loading ? .6 : 1 }} onClick={sendMobileOtp} disabled={loading}>
                {loading ? 'Sending SMS...' : 'Send OTP via SMS'}
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'enter' && (
        <div>
          <div style={{ fontSize:'2rem', marginBottom:'12px' }}>📱</div>
          <div style={{ fontWeight:900, fontSize:'1.3rem', marginBottom:'6px' }}>Enter the 6-digit code</div>
          <div style={{ fontSize:'.78rem', color:'#6b7280', marginBottom:'20px' }}>
            Sent to {mobile}
          </div>
          {error && <div style={errBox}>⚠️ {error}</div>}
          <input
            style={{ ...inp, fontSize:'1.4rem', fontWeight:700, textAlign:'center', letterSpacing:'8px' }}
            placeholder="000000"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            maxLength={6}
          />
          <button style={{ ...btn, opacity: (loading || otp.length < 6) ? .6 : 1 }} onClick={verifyOtp} disabled={loading || otp.length < 6}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
          <button style={{ width:'100%', padding:'11px', borderRadius:'12px', border:'1.5px solid #e5e7eb', background:'transparent', color:'#6b7280', fontFamily:'sans-serif', fontSize:'.82rem', cursor:'pointer', marginTop:'8px' }}
            onClick={() => { setStep('choose'); setOtp(''); setError('') }}>
            Try a different method
          </button>
        </div>
      )}

      {step === 'done' && method === 'email' && (
        <div style={{ textAlign:'center', paddingTop:'40px' }}>
          <div style={{ fontSize:'3rem', marginBottom:'16px' }}>📧</div>
          <div style={{ fontWeight:900, fontSize:'1.3rem', marginBottom:'8px', color:'#6ee7b7' }}>Check your email!</div>
          <div style={{ background:'rgba(26,107,60,.1)', border:'1px solid rgba(26,107,60,.2)', borderRadius:'14px', padding:'16px', marginBottom:'20px' }}>
            <p style={{ color:'#374151', fontSize:'.84rem', lineHeight:1.7 }}>
              We sent a verification link to your email.
              Click the link to verify and unlock all features.
            </p>
          </div>
          <p style={{ color:'rgba(255,255,255,.35)', fontSize:'.74rem', marginBottom:'20px' }}>Did not get it? Check your spam folder.</p>
          <button style={btn} onClick={goToDashboard}>Go to Dashboard</button>
        </div>
      )}

      {step === 'done' && method === 'mobile' && (
        <div style={{ textAlign:'center', paddingTop:'40px' }}>
          <div style={{ fontSize:'3rem', marginBottom:'16px' }}>✅</div>
          <div style={{ fontWeight:900, fontSize:'1.3rem', marginBottom:'8px', color:'#6ee7b7' }}>Mobile Verified!</div>
          <p style={{ color:'#6b7280', fontSize:'.84rem', lineHeight:1.7, marginBottom:'24px' }}>
            {mobile} is now verified. All features are unlocked.
          </p>
          <button style={btn} onClick={goToDashboard}>Go to Dashboard</button>
        </div>
      )}
    </div>
  )
}
