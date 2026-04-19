'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function SendOfferPage() {
  const router = useRouter()
  const params = useParams()
  const kasambahayId = params?.id as string

  const [kb, setKb] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isProvince, setIsProvince] = useState(false)
  const [fareEstimate, setFareEstimate] = useState<number | null>(null)

  const metro = ['Quezon City','Makati','Pasig','Taguig','Manila','Mandaluyong','Marikina','Paranaque','Las Pinas','Muntinlupa','Caloocan','Malabon','Navotas','Valenzuela','Pasay','Pateros','San Juan']

  const [form, setForm] = useState({
    salary: '',
    start_date: '',
    setup: 'Stay-in',
    day_off: 'Every Sunday',
    scope: [] as string[],
    transport_arrangement: 'full',
  })

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const init = async () => {
      const { supabase } = await import('../../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('kasambahay')
        .select('*, profiles(*)')
        .eq('id', kasambahayId)
        .single()

      setKb(data)

      const province = data?.province || data?.profiles?.city || ''
      const provincial = !metro.includes(province)
      setIsProvince(provincial)

      if (provincial) {
        const { data: route } = await supabase
          .from('transport_routes')
          .select('fare_min, fare_max')
          .ilike('origin_province', '%' + province.split(' ')[0] + '%')
          .single()

        if (route) {
          setFareEstimate(Math.round((route.fare_min + route.fare_max) / 2))
        }
      }

      setLoading(false)
    }
    init()
  }, [kasambahayId])

  const toggleScope = (s: string) => setForm(f => ({
    ...f,
    scope: f.scope.includes(s) ? f.scope.filter(x => x !== s) : [...f.scope, s]
  }))

  const handleSendOffer = async () => {
    if (!form.salary || !form.start_date || form.scope.length === 0) {
      setError('Please fill in all required fields and select at least one scope')
      return
    }
    setSubmitting(true)
    setError('')

    const { supabase } = await import('../../../../lib/supabase')
    const { data: { user } } = await supabase.auth.getUser()

    const { data: hw } = await supabase
      .from('homeowners')
      .select('id')
      .eq('profile_id', user?.id)
      .single()

    const { error: offerError } = await supabase
      .from('offers')
      .insert({
        homeowner_id: hw?.id,
        kasambahay_id: kasambahayId,
        salary: parseInt(form.salary),
        start_date: form.start_date,
        setup: form.setup,
        scope: form.scope,
        transport_arrangement: isProvince ? form.transport_arrangement : null,
        fare_estimate: fareEstimate,
        status: 'pending',
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      })

    setSubmitting(false)
    if (offerError) { setError(offerError.message); return }
    setSuccess(true)
  }

  const s: any = {
    wrap: { minHeight:'100vh', background:'#f9fafb', fontFamily:'sans-serif', color:'#111827' },
    head: { background:'#0d1117', padding:'14px 18px', display:'flex', alignItems:'center', gap:'10px' },
    back: { background:'none', border:'none', color:'rgba(255,255,255,.5)', fontSize:'1rem', cursor:'pointer', padding:0 },
    body: { padding:'20px 18px 40px' },
    lbl: { display:'block', fontSize:'.63rem', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'.5px', color:'#6b7280', marginBottom:'4px' },
    input: { width:'100%', padding:'11px 13px', border:'1.5px solid #e5e7eb', borderRadius:'11px', fontFamily:'sans-serif', fontSize:'.88rem', outline:'none', marginBottom:'13px', background:'#fff', color:'#111827' },
    btn: { width:'100%', padding:'13px', borderRadius:'12px', border:'none', background:'#1a6b3c', color:'#fff', fontFamily:'sans-serif', fontSize:'.92rem', fontWeight:700, cursor:'pointer' },
    err: { background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'9px', padding:'10px 13px', fontSize:'.78rem', color:'#dc2626', marginBottom:'13px' },
    sec: { marginBottom:'20px' },
    secTitle: { fontSize:'.65rem', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'.5px', color:'rgba(0,0,0,.35)', marginBottom:'10px', paddingBottom:'6px', borderBottom:'1px solid #f3f4f6' },
    scopeGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px', marginBottom:'13px' },
    transpoOpt: (active: boolean) => ({
      padding:'12px 14px', borderRadius:'11px', border:'1.5px solid',
      borderColor: active ? '#1a6b3c' : '#e5e7eb',
      background: active ? '#e8f5ee' : '#fff',
      cursor:'pointer', marginBottom:'8px',
      display:'flex', gap:'11px', alignItems:'flex-start'
    }),
    radio: (active: boolean) => ({
      width:'18px', height:'18px', borderRadius:'50%', border:'2px solid',
      borderColor: active ? '#1a6b3c' : '#d1d5db',
      background: active ? '#1a6b3c' : '#fff',
      flexShrink:0, marginTop:'2px'
    }),
    scopeBtn: (active: boolean) => ({
      padding:'10px', borderRadius:'10px', border:'1.5px solid',
      borderColor: active ? '#1a6b3c' : '#e5e7eb',
      background: active ? '#e8f5ee' : '#fff',
      color: active ? '#1a6b3c' : '#6b7280',
      fontFamily:'sans-serif', fontSize:'.78rem', fontWeight:600,
      cursor:'pointer', textAlign:'left' as const
    })
  }

  const scopeItems = ['🧹 Housekeeping','👶 Yaya','🍳 Cooking','🧺 Laundry','🚗 Driver','👴 Elder Care']

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f9fafb', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif', color:'#6b7280' }}>
      Loading...
    </div>
  )

  if (success) return (
    <div style={{ minHeight:'100vh', background:'#f9fafb', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'28px', textAlign:'center', fontFamily:'sans-serif' }}>
      <div style={{ fontSize:'3rem', marginBottom:'16px' }}>📨</div>
      <h1 style={{ fontFamily:'serif', fontSize:'1.4rem', fontWeight:900, color:'#1a6b3c', marginBottom:'8px' }}>Offer Sent!</h1>
      <p style={{ color:'#6b7280', fontSize:'.84rem', lineHeight:1.7, marginBottom:'24px' }}>
        {kb?.profiles?.full_name?.split(' ')[0]} will review your offer.<br/>
        You will be notified when she responds.<br/>
        Offer expires in 48 hours.
      </p>
      <button style={{ ...s.btn, maxWidth:'320px' }} onClick={() => router.push('/dashboard/homeowner')}>
        Back to Browse
      </button>
    </div>
  )

  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <button style={s.back} onClick={() => router.back()}>←</button>
        <span style={{ fontFamily:'serif', fontSize:'1rem', fontWeight:900, color:'#fff' }}>
          Send Offer to {kb?.profiles?.full_name?.split(' ')[0]}
        </span>
      </div>

      <div style={s.body}>
        {error && <div style={s.err}>⚠️ {error}</div>}

        <div style={s.sec}>
          <div style={s.secTitle}>Job Details</div>
          <label style={s.lbl}>Monthly Salary (₱) *</label>
          <div style={{ position:'relative', marginBottom:'13px' }}>
            <span style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', color:'#6b7280', fontWeight:700 }}>₱</span>
            <input style={{ ...s.input, paddingLeft:'28px', marginBottom:0 }} type="number" placeholder="9000" value={form.salary} onChange={e => update('salary', e.target.value)} />
          </div>
          <label style={s.lbl}>Start Date *</label>
          <input style={s.input} type="date" value={form.start_date} onChange={e => update('start_date', e.target.value)} />
          <label style={s.lbl}>Setup</label>
          <select style={s.input} value={form.setup} onChange={e => update('setup', e.target.value)}>
            <option>Stay-in</option><option>Stay-out</option><option>Either</option>
          </select>
          <label style={s.lbl}>Day Off</label>
          <select style={s.input} value={form.day_off} onChange={e => update('day_off', e.target.value)}>
            <option>Every Sunday</option><option>Every Saturday</option><option>Flexible</option>
          </select>
        </div>

        <div style={s.sec}>
          <div style={s.secTitle}>Scope of Work *</div>
          <div style={s.scopeGrid}>
            {scopeItems.map(item => (
              <button key={item} style={s.scopeBtn(form.scope.includes(item))} onClick={() => toggleScope(item)}>{item}</button>
            ))}
          </div>
        </div>

        {isProvince && (
          <div style={s.sec}>
            <div style={s.secTitle}>Transport Arrangement — RA 10361</div>
            <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'10px', padding:'11px 13px', marginBottom:'14px', fontSize:'.74rem', color:'#1e40af', lineHeight:1.6 }}>
              ℹ️ {kb?.profiles?.full_name?.split(' ')[0]} is from <strong>{kb?.province || kb?.profiles?.city}</strong>. Under RA 10361, transport must be arranged by the employer.
              {fareEstimate && <span> Estimated fare: <strong>~₱{fareEstimate?.toLocaleString()}</strong>.</span>}
            </div>

            <div style={{ marginBottom:'13px' }}>
              <div style={s.transpoOpt(form.transport_arrangement === 'full')} onClick={() => update('transport_arrangement', 'full')}>
                <div style={s.radio(form.transport_arrangement === 'full')} />
                <div>
                  <div style={{ fontWeight:700, fontSize:'.84rem', color:'#111827', marginBottom:'2px' }}>I will shoulder the full fare</div>
                  <div style={{ fontSize:'.72rem', color:'#6b7280' }}>Recommended — highest acceptance rate</div>
                </div>
              </div>
              <div style={s.transpoOpt(form.transport_arrangement === 'reimburse')} onClick={() => update('transport_arrangement', 'reimburse')}>
                <div style={s.radio(form.transport_arrangement === 'reimburse')} />
                <div>
                  <div style={{ fontWeight:700, fontSize:'.84rem', color:'#111827', marginBottom:'2px' }}>I will reimburse upon arrival</div>
                  <div style={{ fontSize:'.72rem', color:'#6b7280' }}>Kasambahay pays first, you reimburse on Day 1</div>
                </div>
              </div>
              <div style={s.transpoOpt(form.transport_arrangement === 'own')} onClick={() => update('transport_arrangement', 'own')}>
                <div style={s.radio(form.transport_arrangement === 'own')} />
                <div>
                  <div style={{ fontWeight:700, fontSize:'.84rem', color:'#111827', marginBottom:'2px' }}>Kasambahay shoulders own fare</div>
                  <div style={{ fontSize:'.72rem', color:'#dc2626' }}>⚠️ Low acceptance rate — most provincial workers cannot pay upfront</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ background:'#f0fdf4', border:'1px solid rgba(26,107,60,.2)', borderRadius:'12px', padding:'13px', marginBottom:'16px', fontSize:'.74rem', color:'#166534', lineHeight:1.7 }}>
          ✅ Offer expires in 48 hours if not responded to<br/>
          ✅ You only pay the ₱2,001 hire fee when both agree<br/>
          ✅ 30-day rematch protection included
        </div>

        <button style={{ ...s.btn, opacity: submitting ? .6 : 1 }} onClick={handleSendOffer} disabled={submitting}>
          {submitting ? 'Sending...' : 'Send Offer →'}
        </button>
      </div>
    </div>
  )
}
