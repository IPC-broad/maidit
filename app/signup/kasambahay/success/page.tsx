'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

function urgencyLabel(u: string) {
  if (u === 'asap') return 'Kailangan AGAD'
  if (u === 'within_week') return 'Sa loob ng isang linggo'
  if (u === 'within_month') return 'Sa loob ng isang buwan'
  return u || ''
}

export default function KasambahaySuccess() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { supabase } = await import('../../../../lib/supabase')
      const { data } = await supabase.from('jobs').select('*').eq('active', true).order('created_at', { ascending: false })
      setJobs(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div style={{ minHeight:'100vh', background:'#faf8f5', fontFamily:'sans-serif', color:'#1a1a1a', paddingBottom:'48px' }}>

      {/* ── HERO ── */}
      <div style={{ background:'linear-gradient(135deg, #1a6b3c 0%, #14502d 100%)', padding:'40px 28px 36px', textAlign:'center' }}>
        <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', fontSize:'2rem' }}>
          ✓
        </div>
        <h1 style={{ fontFamily:'Georgia, serif', fontSize:'1.5rem', fontWeight:900, color:'#fff', margin:'0 0 10px', lineHeight:1.2 }}>
          Maligayang pagdating<br/>sa MaidIt! 🎉
        </h1>
        <p style={{ fontSize:'.82rem', color:'rgba(255,255,255,.8)', margin:0, lineHeight:1.6, maxWidth:'300px', marginLeft:'auto', marginRight:'auto' }}>
          Ikaw ay nakarehistro na at maaaring makatanggap ng job offer sa susunod na mga araw.
        </p>
      </div>

      <div style={{ maxWidth:'500px', margin:'0 auto', padding:'0 16px' }}>

        {/* ── CTA ── */}
        <div style={{ background:'#fff', borderRadius:'16px', padding:'20px', marginTop:'-20px', boxShadow:'0 4px 20px rgba(0,0,0,.08)', marginBottom:'24px', textAlign:'center' }}>
          <p style={{ fontSize:'.82rem', color:'#6b7280', margin:'0 0 16px', lineHeight:1.6 }}>
            Pwede ka ring mag-browse ng mga trabahong pwede mong applyan.
          </p>
          <button
            onClick={() => router.push('/dashboard/kasambahay')}
            style={{ width:'100%', padding:'13px', borderRadius:'12px', background:'#1a6b3c', color:'#fff', border:'none', fontFamily:'sans-serif', fontSize:'.9rem', fontWeight:700, cursor:'pointer' }}
          >
            Mag-apply ng Trabaho →
          </button>
        </div>

        {/* ── JOBS ── */}
        <div style={{ fontSize:'.72rem', fontWeight:700, color:'#9ca3af', textTransform:'uppercase' as const, letterSpacing:'.5px', marginBottom:'12px' }}>
          Available na Trabaho
        </div>

        {loading && (
          <div style={{ textAlign:'center', padding:'32px', color:'#9ca3af', fontSize:'.84rem' }}>Loading...</div>
        )}

        {!loading && jobs.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 20px', background:'#fff', borderRadius:'16px', border:'1.5px solid #f0ece6' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'12px' }}>📋</div>
            <div style={{ fontWeight:700, fontSize:'.9rem', color:'#374151', marginBottom:'6px' }}>
              Wala pang available na trabaho ngayon.
            </div>
            <div style={{ fontSize:'.78rem', color:'#9ca3af', lineHeight:1.7 }}>
              Mag-check ulit mamaya!
            </div>
          </div>
        )}

        {!loading && jobs.map((job: any) => (
          <div key={job.id} style={{ background:'#fff', borderRadius:'14px', border:'1.5px solid #f0ece6', overflow:'hidden', marginBottom:'12px', boxShadow:'0 2px 8px rgba(0,0,0,.05)' }}>
            <div style={{ padding:'14px' }}>
              <div style={{ display:'flex', gap:'10px', alignItems:'flex-start', marginBottom:'10px' }}>
                <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0, border:'2px solid #bbf7d0' }}>
                  🏠
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:'.9rem', marginBottom:'2px' }}>Pamilya sa {job.city}</div>
                  <div style={{ fontSize:'.68rem', color:'#9ca3af' }}>{urgencyLabel(job.urgency)}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'Georgia, serif', fontSize:'1.15rem', fontWeight:900, color:'#1a6b3c' }}>
                    ₱{job.salary?.toLocaleString()}
                  </div>
                  <div style={{ fontSize:'.6rem', color:'#9ca3af' }}>/buwan</div>
                </div>
              </div>

              <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' as const, marginBottom:'10px' }}>
                <span style={{ fontSize:'.62rem', fontWeight:600, padding:'3px 7px', borderRadius:'5px', background:'#f3ede5', color:'#92400e' }}>📍 {job.city}</span>
                <span style={{ fontSize:'.62rem', fontWeight:600, padding:'3px 7px', borderRadius:'5px', background:'#f0fdf4', color:'#1a6b3c' }}>🏠 {job.setup}</span>
                {job.scope?.slice(0,3).map((s: string) => (
                  <span key={s} style={{ fontSize:'.62rem', fontWeight:600, padding:'3px 7px', borderRadius:'5px', background:'#e8f5ee', color:'#1a6b3c' }}>{s}</span>
                ))}
              </div>

              <button
                onClick={() => router.push(`/jobs/${job.id}/apply`)}
                style={{ width:'100%', padding:'10px', borderRadius:'10px', background:'#c9943a', color:'#fff', border:'none', fontFamily:'sans-serif', fontSize:'.8rem', fontWeight:700, cursor:'pointer' }}
              >
                Mag-apply — Libre
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
