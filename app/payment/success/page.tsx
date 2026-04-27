'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const kasambahayId = searchParams?.get('kasambahay')
  const [status, setStatus] = useState<'loading'|'done'|'error'>('loading')
  useEffect(() => {
    const activate = async () => {
      try {
        const { supabase } = await import('../../../lib/supabase')
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        const { error } = await supabase.from('profiles').update({ is_paid: true, job_offer_credits: 10 }).eq('id', user.id)
        if (error) { setStatus('error'); return }
        setStatus('done')
      } catch { setStatus('error') }
    }
    activate()
  }, [])
  const s: any = { wrap: { minHeight:'100vh', background:'#faf8f5', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'28px', textAlign:'center', fontFamily:'sans-serif' }, btn: { padding:'13px 24px', borderRadius:'12px', border:'none', background:'#1a6b3c', color:'#fff', fontFamily:'sans-serif', fontSize:'14px', fontWeight:700, cursor:'pointer' } }
  if (status === 'loading') return <div style={s.wrap}><div style={{fontSize:'2rem',marginBottom:'12px'}}>⏳</div><div style={{color:'#6b7280'}}>Activating your account...</div></div>
  if (status === 'error') return <div style={s.wrap}><div style={{fontSize:'2rem',marginBottom:'12px'}}>❌</div><h1 style={{fontFamily:'serif',fontSize:'1.3rem',fontWeight:900,marginBottom:'8px'}}>Something went wrong</h1><p style={{color:'#6b7280',marginBottom:'20px'}}>Contact hello@maidit.app</p><button style={s.btn} onClick={() => router.push('/dashboard/homeowner')}>Back</button></div>
  return (
    <div style={s.wrap}>
      <div style={{fontSize:'3rem',marginBottom:'16px'}}>🎉</div>
      <h1 style={{fontFamily:'serif',fontSize:'1.5rem',fontWeight:900,color:'#1a6b3c',marginBottom:'8px'}}>Payment Successful!</h1>
      <p style={{color:'#4b5563',fontSize:'13px',lineHeight:1.7,marginBottom:'20px'}}>Your account is now activated.<br/>You have <strong>10 job offer credits</strong>.</p>
      <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'12px',padding:'14px',marginBottom:'20px',fontSize:'12px',color:'#166534',lineHeight:1.8}}>✅ 10 job offer credits<br/>✅ Send offers directly to kasambahay<br/>✅ ₱499 deducted from final hire fee</div>
      <button style={s.btn} onClick={() => kasambahayId ? router.push(`/offer/send/${kasambahayId}`) : router.push('/dashboard/homeowner')}>
        {kasambahayId ? 'Continue Sending Offer →' : 'Browse Kasambahay'}
      </button>
    </div>
  )
}
