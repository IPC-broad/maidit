'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ApplyPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params?.id as string

  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isProvince, setIsProvince] = useState(false)

  const [form, setForm] = useState({
    fare_estimate: '',
    bus_line: '',
    availability_confirmed: false,
    setup_confirmed: false,
  })

  useEffect(() => {
    const init = async () => {
      const { supabase } = await import('../../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: jobData } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      setJob(jobData)

      const { data: profile } = await supabase
        .from('profiles')
        .select('city')
        .eq('id', user.id)
        .single()

      const metro = ['Quezon City','Makati','Pasig','Taguig','Manila','Mandaluyong','Marikina','Paranaque','Las Pinas','Muntinlupa','Caloocan','Malabon','Navotas','Valenzuela','Pasay','Pateros','San Juan']
      const city = profile?.city || ''
      setIsProvince(!metro.includes(city))
      setLoading(false)
    }
    init()
  }, [jobId])

  const handleApply = async () => {
    if (!form.availability_confirmed || !form.setup_confirmed) {
      setError('Please confirm all items before applying')
      return
    }
    if (isProvince && !form.fare_estimate) {
      setError('Please enter your estimated fare')
      return
    }
    setSubmitting(true)
    setError('')

    const { supabase } = await import('../../../../lib/supabase')
    const { data: { user } } = await supabase.auth.getUser()

    const { data: kb } = await supabase
      .from('kasambahay')
      .select('id')
      .eq('profile_id', user?.id)
      .single()

    const { error: appError } = await supabase
      .from('applications')
      .insert({
        job_id: jobId,
        kasambahay_id: kb?.id,
        applied_by: 'self',
        fare_estimate: isProvince ? parseInt(form.fare_estimate) : null,
        bus_line: form.bus_line || null,
        worker_confirmed: true,
        status: 'confirmed'
      })

    setSubmitting(false)
    if (appError) { setError(appError.message); return }
    setSuccess(true)
  }

  const s: any = {
    wrap: { minHeight:'100vh', background:'#f9fafb', fontFamily:'sans-serif', color:'#111827' },
    head: { background:'#fff', padding:'14px 18px', display:'flex', alignItems:'center', gap:'10px' },
    back: { background:'none', border:'none', color:'#9ca3af', fontSize:'1rem', cursor:'pointer', padding:0 },
    body: { padding:'20px 18px 40px' },
    title: { fontFamily:'serif', fontSize:'1.2rem', fontWeight:900, marginBottom:'4px', color:'#111827' },
    sub: { fontSize:'.76rem', color:'#6b7280', marginBottom:'20px', lineHeight:1.6 },
    card: { background:'#fff', borderRadius:'12px', padding:'14px', border:'1.5px solid #e5e7eb', marginBottom:'14px' },
    cardTitle: { fontSize:'.65rem', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'.5px', color:'#6b7280', marginBottom:'10px' },
    row: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #f3f4f6' },
    rowLast: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0' },
    rowLabel: { fontSize:'.8rem', color:'#374151' },
    rowValue: { fontSize:'.8rem', fontWeight:700, color:'#111827' },
    lbl: { display:'block', fontSize:'.63rem', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'.5px', color:'#6b7280', marginBottom:'4px' },
    input: { width:'100%', padding:'11px 13px', border:'1.5px solid #e5e7eb', borderRadius:'11px', fontFamily:'sans-serif', fontSize:'.88rem', outline:'none', marginBottom:'13px', background:'#fff', color:'#111827' },
    check: { display:'flex', gap:'11px', alignItems:'flex-start', padding:'10px 0', borderBottom:'1px solid #f3f4f6', cursor:'pointer' },
    checkLast: { display:'flex', gap:'11px', alignItems:'flex-start', padding:'10px 0', cursor:'pointer' },
    checkbox: (checked: boolean) => ({ width:'20px', height:'20px', borderRadius:'5px', border:'2px solid', borderColor: checked ? '#1a6b3c' : '#d1d5db', background: checked ? '#1a6b3c' : '#fff', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', marginTop:'1px' }),
    checkLabel: { fontSize:'.82rem', color:'#374151', lineHeight:1.5 },
    err: { background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'9px', padding:'10px 13px', fontSize:'.78rem', color:'#dc2626', marginBottom:'13px' },
    btn: { width:'100%', padding:'13px', borderRadius:'12px', border:'none', background:'#c9943a', color:'#fff', fontFamily:'sans-serif', fontSize:'.92rem', fontWeight:700, cursor:'pointer' },
    transpo: { background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'11px', padding:'13px 14px', marginBottom:'14px' },
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f9fafb', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif', color:'#6b7280' }}>
      Loading job details...
    </div>
  )

  if (success) return (
    <div style={{ minHeight:'100vh', background:'#f9fafb', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'28px', textAlign:'center', fontFamily:'sans-serif' }}>
      <div style={{ fontSize:'3rem', marginBottom:'16px' }}>✅</div>
      <h1 style={{ fontFamily:'serif', fontSize:'1.4rem', fontWeight:900, color:'#1a6b3c', marginBottom:'8px' }}>Application Sent!</h1>
      <p style={{ color:'#6b7280', fontSize:'.84rem', lineHeight:1.7, marginBottom:'24px' }}>
        The homeowner will review your application.<br/>We will notify you if they send an offer.
      </p>
      <button style={{ ...s.btn, maxWidth:'320px' }} onClick={() => router.push('/dashboard/kasambahay')}>
        Back to Jobs
      </button>
    </div>
  )

  if (!job) return (
    <div style={{ minHeight:'100vh', background:'#f9fafb', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif', color:'#6b7280' }}>
      Job not found.
    </div>
  )

  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <button style={s.back} onClick={() => router.back()}>←</button>
        <span style={{ fontFamily:'serif', fontSize:'1rem', fontWeight:900, color:'#1a1a1a' }}>Apply for Job</span>
      </div>

      <div style={s.body}>
        <div style={s.title}>Confirm your application</div>
        <div style={s.sub}>Review the job details and confirm you agree before applying.</div>

        {error && <div style={s.err}>⚠️ {error}</div>}

        <div style={s.card}>
          <div style={s.cardTitle}>Job Details</div>
          <div style={s.row}><span style={s.rowLabel}>Location</span><span style={s.rowValue}>📍 {job.city}</span></div>
          <div style={s.row}><span style={s.rowLabel}>Setup</span><span style={s.rowValue}>🏠 {job.setup}</span></div>
          <div style={s.row}><span style={s.rowLabel}>Salary</span><span style={s.rowValue} >₱{job.salary?.toLocaleString()}/mo</span></div>
          <div style={s.row}><span style={s.rowLabel}>Start Date</span><span style={s.rowValue}>{job.start_date ? new Date(job.start_date).toLocaleDateString('en-PH', { month:'long', day:'numeric', year:'numeric' }) : job.urgency}</span></div>
          <div style={s.row}><span style={s.rowLabel}>Day Off</span><span style={s.rowValue}>{job.day_off}</span></div>
          <div style={s.rowLast}><span style={s.rowLabel}>Scope</span><span style={s.rowValue}>{job.scope?.join(', ')}</span></div>
        </div>

        {isProvince && (
          <div style={s.transpo}>
            <div style={{ fontSize:'.72rem', fontWeight:700, color:'#92400e', marginBottom:'8px' }}>
              🚌 Transport Required — RA 10361
            </div>
            <div style={{ fontSize:'.74rem', color:'#78350f', lineHeight:1.6, marginBottom:'12px' }}>
              You are from outside Metro Manila. Please enter your estimated fare so the homeowner can prepare.
            </div>
            <label style={s.lbl}>Estimated Fare to {job.city} (₱)</label>
            <input
              style={s.input}
              type="number"
              placeholder="e.g. 380"
              value={form.fare_estimate}
              onChange={e => setForm(f => ({ ...f, fare_estimate: e.target.value }))}
            />
            <label style={s.lbl}>Bus Line (optional)</label>
            <input
              style={{ ...s.input, marginBottom:0 }}
              type="text"
              placeholder="e.g. JAC Liner, Victory Liner"
              value={form.bus_line}
              onChange={e => setForm(f => ({ ...f, bus_line: e.target.value }))}
            />
          </div>
        )}

        <div style={s.card}>
          <div style={s.cardTitle}>Please confirm the following</div>
          <div style={s.check} onClick={() => setForm(f => ({ ...f, availability_confirmed: !f.availability_confirmed }))}>
            <div style={s.checkbox(form.availability_confirmed)}>
              {form.availability_confirmed && <span style={{ color:'#fff', fontSize:'.7rem', fontWeight:900 }}>✓</span>}
            </div>
            <div style={s.checkLabel}>
              I am available to start on {job.start_date ? new Date(job.start_date).toLocaleDateString('en-PH', { month:'long', day:'numeric', year:'numeric' }) : job.urgency} and agree to the {job.setup} setup in {job.city}
            </div>
          </div>
          <div style={s.checkLast} onClick={() => setForm(f => ({ ...f, setup_confirmed: !f.setup_confirmed }))}>
            <div style={s.checkbox(form.setup_confirmed)}>
              {form.setup_confirmed && <span style={{ color:'#fff', fontSize:'.7rem', fontWeight:900 }}>✓</span>}
            </div>
            <div style={s.checkLabel}>
              I can do the required scope of work: {job.scope?.join(', ')}
            </div>
          </div>
        </div>

        <button
          style={{ ...s.btn, opacity: submitting ? .6 : 1 }}
          onClick={handleApply}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Application →'}
        </button>

        <div style={{ fontSize:'.68rem', color:'#9ca3af', textAlign:'center', marginTop:'8px', lineHeight:1.5 }}>
          Applying is free. You will be notified if the homeowner sends an offer.
        </div>
      </div>
    </div>
  )
}
