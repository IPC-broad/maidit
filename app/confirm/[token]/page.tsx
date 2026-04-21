'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function ConfirmWorkerPage() {
  const params = useParams()
  const token = params?.token as string
  const [status, setStatus] = useState<'loading'|'ready'|'confirming'|'done'|'already'|'error'>('loading')
  const [worker, setWorker] = useState<any>(null)

  useEffect(() => {
    const init = async () => {
      if (!token) { setStatus('error'); return }
      const { supabase } = await import('../../../lib/supabase')
      const { data: kb } = await supabase
        .from('kasambahay')
        .select('*, profiles(full_name, mobile)')
        .eq('confirm_token', token)
        .single()
      if (!kb) { setStatus('error'); return }
      if (kb.status === 'available') { setStatus('already'); setWorker(kb); return }
      setWorker(kb)
      setStatus('ready')
    }
    init()
  }, [token])

  const handleConfirm = async () => {
    setStatus('confirming')
    const { supabase } = await import('../../../lib/supabase')
    await supabase.from('kasambahay')
      .update({ status: 'available', confirmed_at: new Date().toISOString() })
      .eq('confirm_token', token)
    setStatus('done')
  }

  const s: any = {
    wrap: { minHeight: '100vh', background: '#faf8f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 20px', textAlign: 'center', fontFamily: 'sans-serif' },
    card: { background: '#fff', borderRadius: '16px', padding: '24px 20px', border: '1px solid #ede8e0', maxWidth: '340px', width: '100%', marginBottom: '12px' },
    btn: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#1a6b3c', color: '#fff', fontFamily: 'sans-serif', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginBottom: '10px' },
    btnOutline: { width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #ede8e0', background: 'transparent', color: '#6b7280', fontFamily: 'sans-serif', fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' },
  }
  const firstName = worker?.profiles?.full_name?.split(' ')[0] || 'Ka'

  if (status === 'loading') return <div style={{ ...s.wrap }}><div style={{ color: '#9ca3af' }}>Loading...</div></div>

  if (status === 'error') return (
    <div style={s.wrap}>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>❌</div>
      <h1 style={{ fontFamily: 'serif', fontSize: '1.3rem', fontWeight: 900, color: '#1a1a1a', marginBottom: '8px' }}>Link not found</h1>
      <p style={{ fontSize: '.84rem', color: '#6b7280', lineHeight: 1.7 }}>This confirmation link is invalid or has expired.<br/>Contact your MaidIt partner for a new link.</p>
    </div>
  )

  if (status === 'already') return (
    <div style={s.wrap}>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
      <h1 style={{ fontFamily: 'serif', fontSize: '1.3rem', fontWeight: 900, color: '#1a6b3c', marginBottom: '8px' }}>Na-confirm na!</h1>
      <p style={{ fontSize: '.84rem', color: '#6b7280', lineHeight: 1.7 }}>Hi {firstName}! Available ka na sa MaidIt para sa mga homeowner.</p>
    </div>
  )

  if (status === 'done') return (
    <div style={s.wrap}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
      <h1 style={{ fontFamily: 'serif', fontSize: '1.5rem', fontWeight: 900, color: '#1a6b3c', marginBottom: '8px' }}>Salamat, {firstName}!</h1>
      <p style={{ fontSize: '.84rem', color: '#4b5563', lineHeight: 1.7, marginBottom: '20px' }}>Na-confirm mo na ang iyong profile sa MaidIt.<br/>Available ka na para sa mga homeowner.</p>
      <div style={{ ...s.card, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <div style={{ fontSize: '.72rem', color: '#166534', lineHeight: 1.7 }}>✅ Makikita na ng mga homeowner ang iyong profile.<br/>Makakakuha ka ng text kapag may nag-offer sa iyo.</div>
      </div>
    </div>
  )

  return (
    <div style={s.wrap}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>👋</div>
        <h1 style={{ fontFamily: 'serif', fontSize: '1.5rem', fontWeight: 900, color: '#1a1a1a', marginBottom: '6px' }}>Hi {firstName}!</h1>
        <p style={{ fontSize: '.84rem', color: '#6b7280', lineHeight: 1.7 }}>Ikaw ay na-refer sa MaidIt bilang kasambahay.</p>
      </div>
      <div style={s.card}>
        <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#9ca3af', marginBottom: '10px' }}>Ang iyong profile</div>
        <div style={{ fontFamily: 'serif', fontSize: '1.2rem', fontWeight: 900, color: '#1a1a1a', marginBottom: '4px' }}>{worker?.profiles?.full_name}</div>
        <div style={{ fontSize: '.78rem', color: '#6b7280', marginBottom: worker?.skills?.length ? '12px' : 0 }}>{worker?.province} · {worker?.profiles?.mobile}</div>
        {worker?.skills?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
            {worker.skills.map((sk: string, i: number) => (
              <span key={i} style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#f3ede5', color: '#92400e' }}>{sk}</span>
            ))}
          </div>
        )}
      </div>
      <div style={{ ...s.card, background: '#fef3e2', border: '1px solid #fde8c0' }}>
        <div style={{ fontSize: '.78rem', color: '#92400e', lineHeight: 1.7 }}>
          Sa pag-confirm, sumasang-ayon ka na ang iyong profile ay makikita ng mga homeowner sa MaidIt para sa trabahong kasambahay.
        </div>
      </div>
      <div style={{ maxWidth: '340px', width: '100%' }}>
        <button style={{ ...s.btn, opacity: status === 'confirming' ? .6 : 1 }} onClick={handleConfirm} disabled={status === 'confirming'}>
          {status === 'confirming' ? 'Nagko-confirm...' : '✅ Oo, gusto kong maging available'}
        </button>
        <button style={s.btnOutline} onClick={() => window.location.href = '/'}>Hindi, salamat</button>
      </div>
      <div style={{ fontSize: '.7rem', color: '#9ca3af', marginTop: '16px', lineHeight: 1.6, maxWidth: '300px' }}>
        MaidIt — trusted kasambahay marketplace sa Pilipinas.<br/>100% libre para sa mga kasambahay.
      </div>
    </div>
  )
}
