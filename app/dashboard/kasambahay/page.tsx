'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function KBDashboard() {
  const router = useRouter()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [applied, setApplied] = useState({})

  useEffect(() => {
    const init = async () => {
      const { supabase } = await import('../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
      setJobs(jobs || [])
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f9fafb', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif', color:'#6b7280' }}>
      Loading jobs...
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#f9fafb', fontFamily:'sans-serif', paddingBottom:'80px' }}>

      <div style={{ background:'#0d1117', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h1 style={{ fontFamily:'serif', fontSize:'1.3rem', fontWeight:900, color:'#fff', letterSpacing:'-0.5px' }}>
          Maid<span style={{ color:'#f0c97a' }}>It</span>
        </h1>
        <span style={{ fontSize:'.72rem', color:'rgba(255,255,255,.5)' }}>Mga Trabaho</span>
      </div>

      <div style={{ padding:'16px 16px 8px' }}>
        <div style={{ fontFamily:'serif', fontSize:'1.1rem', fontWeight:900, marginBottom:'2px', color:'#111827' }}>
          Mga Trabaho Para sa Iyo
        </div>
        <div style={{ fontSize:'.72rem', color:'#6b7280', marginBottom:'16px' }}>
          {jobs.length} trabaho ang available — mag-apply nang libre!
        </div>
      </div>

      <div style={{ padding:'0 16px 32px', display:'flex', flexDirection:'column', gap:'12px' }}>

        {jobs.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 20px', color:'#6b7280', fontSize:'.84rem' }}>
            Walang available na trabaho ngayon. Bumalik mamaya.
          </div>
        )}

        {jobs.map((job: any) => (
          <div key={job.id} style={{ background:'#fff', borderRadius:'14px', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,.06)', border:'1.5px solid #f3f4f6' }}>
            <div style={{ padding:'13px 14px', borderBottom:'1px solid #f9fafb' }}>
              <div style={{ display:'flex', gap:'10px', alignItems:'center', marginBottom:'8px' }}>
                <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:'#e8f5ee', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0, border:'2px solid rgba(26,107,60,.15)' }}>
                  🏠
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:'.86rem', color:'#111827' }}>
                    Pamilya sa {job.city}
                  </div>
                  <div style={{ fontSize:'.65rem', color:'#6b7280' }}>
                    {job.setup} · {job.day_off}
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'serif', fontSize:'1.1rem', fontWeight:900, color:'#1a6b3c' }}>
                    ₱{job.salary?.toLocaleString()}
                  </div>
                  <div style={{ fontSize:'.6rem', color:'#6b7280' }}>bawat buwan</div>
                </div>
              </div>

              <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                <span style={{ fontSize:'.63rem', fontWeight:600, padding:'2px 8px', borderRadius:'4px', background:'#f3f4f6', color:'#6b7280' }}>
                  📍 {job.city}
                </span>
                <span style={{ fontSize:'.63rem', fontWeight:600, padding:'2px 8px', borderRadius:'4px', background:'#e8f5ee', color:'#1a6b3c' }}>
                  🏠 {job.setup}
                </span>
                <span style={{ fontSize:'.63rem', fontWeight:600, padding:'2px 8px', borderRadius:'4px', background:'#fdf3e3', color:'#c9943a' }}>
                  Simula: {new Date(job.start_date).toLocaleDateString('fil-PH', { month:'short', day:'numeric' })}
                </span>
              </div>
            </div>

            <div style={{ padding:'10px 14px' }}>
              <div style={{ fontSize:'.76rem', marginBottom:'9px', color:'#374151', lineHeight:1.5 }}>
                Kailangan: <strong>{job.scope?.join(', ')}</strong>
              </div>

              {applied[job.id] ? (
                <div style={{ width:'100%', padding:'10px', borderRadius:'9px', background:'#e8f5ee', border:'1.5px solid rgba(26,107,60,.2)', color:'#1a6b3c', fontSize:'.78rem', fontWeight:700, textAlign:'center' }}>
                  ✅ Nag-apply ka na! Hintayin ang sagot ng homeowner.
                </div>
              ) : (
                <button
                  style={{ width:'100%', padding:'10px', borderRadius:'9px', background:'#c9943a', color:'#fff', border:'none', fontFamily:'sans-serif', fontSize:'.82rem', fontWeight:700, cursor:'pointer' }}
                  onClick={() => router.push(`/jobs/${job.id}/apply`)}
                >
                  ✋ Mag-apply — Libre!
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderTop:'1px solid #f3f4f6', display:'flex' }}>
        <button style={{ flex:1, padding:'10px 4px 9px', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', border:'none', background:'transparent', cursor:'pointer' }}>
          <span style={{ fontSize:'1.1rem' }}>💼</span>
          <span style={{ fontSize:'.57rem', fontWeight:700, color:'#c9943a' }}>Mga Trabaho</span>
        </button>
        <button style={{ flex:1, padding:'10px 4px 9px', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', border:'none', background:'transparent', cursor:'pointer' }}>
          <span style={{ fontSize:'1.1rem' }}>📋</span>
          <span style={{ fontSize:'.57rem', fontWeight:600, color:'#6b7280' }}>Mga Alok</span>
        </button>
        <button style={{ flex:1, padding:'10px 4px 9px', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', border:'none', background:'transparent', cursor:'pointer' }}>
          <span style={{ fontSize:'1.1rem' }}>👩</span>
          <span style={{ fontSize:'.57rem', fontWeight:600, color:'#6b7280' }}>Profile Ko</span>
        </button>
        <button style={{ flex:1, padding:'10px 4px 9px', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', border:'none', background:'transparent', cursor:'pointer' }}>
          <span style={{ fontSize:'1.1rem' }}>💬</span>
          <span style={{ fontSize:'.57rem', fontWeight:600, color:'#6b7280' }}>Chat</span>
        </button>
      </div>
    </div>
  )
}
