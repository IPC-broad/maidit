'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HWDashboard() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Lahat')
  const [passed, setPassed] = useState<Record<string, boolean>>({})
  const [offered, setOffered] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const init = async () => {
      const { supabase } = await import('../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('kasambahay')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false })

      setProfiles(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const filters = ['Lahat', 'Stay-in', 'Stay-out', 'Metro Manila', 'Province']

  const filtered = profiles.filter(p => {
    if (filter === 'Lahat') return true
    if (filter === 'Stay-in') return p.setup === 'Stay-in'
    if (filter === 'Stay-out') return p.setup === 'Stay-out'
    if (filter === 'Metro Manila') return !p.province || p.province === 'Quezon City' || p.province === 'Makati'
    if (filter === 'Province') return p.province && p.province !== 'Quezon City' && p.province !== 'Makati'
    return true
  }).filter(p => !passed[p.id])

  const isProvince = (province: string) => {
    const metro = ['Quezon City', 'Makati', 'Pasig', 'Taguig', 'Manila', 'Mandaluyong', 'Marikina']
    return province && !metro.includes(province)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f9fafb', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif', color:'#6b7280' }}>
      Loading profiles...
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#f9fafb', fontFamily:'sans-serif', paddingBottom:'80px' }}>

      <div style={{ background:'#0d1117', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h1 style={{ fontFamily:'serif', fontSize:'1.3rem', fontWeight:900, color:'#fff', letterSpacing:'-0.5px' }}>
          Maid<span style={{ color:'#f0c97a' }}>It</span>
        </h1>
        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          <span style={{ fontSize:'.72rem', color:'rgba(255,255,255,.5)' }}>Browse</span>
          <a href="/login" style={{ fontSize:'.72rem', color:'rgba(255,255,255,.4)', textDecoration:'none' }}>Sign out</a>
        </div>
      </div>

      <div style={{ padding:'14px 16px 8px' }}>
        <div style={{ fontFamily:'serif', fontSize:'1.1rem', fontWeight:900, marginBottom:'2px', color:'#111827' }}>
          Browse Kasambahay
        </div>
        <div style={{ fontSize:'.72rem', color:'#6b7280', marginBottom:'12px' }}>
          {filtered.length} profiles available
        </div>

        <div style={{ display:'flex', gap:'6px', overflowX:'auto', paddingBottom:'8px' }}>
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{ padding:'6px 13px', borderRadius:'50px', border:'1.5px solid', borderColor: filter === f ? '#1a6b3c' : '#e5e7eb', background: filter === f ? '#e8f5ee' : '#fff', color: filter === f ? '#1a6b3c' : '#6b7280', fontFamily:'sans-serif', fontSize:'.72rem', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:'4px 16px 32px', display:'flex', flexDirection:'column', gap:'12px' }}>

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 20px', color:'#6b7280', fontSize:'.84rem' }}>
            No profiles found for this filter.
          </div>
        )}

        {filtered.map((kb) => (
          <div key={kb.id} style={{ background:'#fff', borderRadius:'14px', padding:'13px 14px', boxShadow:'0 2px 8px rgba(0,0,0,.06)', border:'1.5px solid #f3f4f6' }}>

            <div style={{ display:'flex', gap:'11px', alignItems:'center', marginBottom:'9px' }}>
              <div style={{ width:'46px', height:'46px', borderRadius:'50%', background:'#fdf3e3', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', flexShrink:0, border:'2px solid rgba(201,148,58,.2)' }}>
                👩
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:'.9rem', color:'#111827' }}>
                  {kb.profiles?.full_name?.split(' ')[0]} {kb.profiles?.full_name?.split(' ')[1]?.[0]}.
                </div>
                <div style={{ fontSize:'.68rem', color:'#6b7280' }}>
                  {kb.province || kb.profiles?.city} · {kb.setup} · {kb.experience}
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:'serif', fontSize:'1rem', fontWeight:900, color:'#1a6b3c' }}>
                  ₱{kb.asking_salary?.toLocaleString()}
                </div>
                <div style={{ fontSize:'.6rem', color:'#6b7280' }}>asking/mo</div>
              </div>
            </div>

            <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'9px' }}>
              <span style={{ fontSize:'.6rem', fontWeight:700, padding:'2px 7px', borderRadius:'4px', background:'#e8f5ee', color:'#1a6b3c' }}>
                📸 Selfie
              </span>
              {isProvince(kb.province) && (
                <span style={{ fontSize:'.6rem', fontWeight:700, padding:'2px 7px', borderRadius:'4px', background:'linear-gradient(135deg,#1e3a8a,#2563eb)', color:'#fff' }}>
                  🚌 {kb.province} · Transpo Needed · RA 10361
                </span>
              )}
            </div>

            <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', marginBottom:'9px' }}>
              {kb.skills?.map((skill: string) => (
                <span key={skill} style={{ fontSize:'.67rem', padding:'3px 7px', borderRadius:'4px', background:'#e8f5ee', color:'#1a6b3c' }}>
                  {skill}
                </span>
              ))}
            </div>

            <div style={{ fontSize:'.72rem', color:'#6b7280', marginBottom:'10px' }}>
              Available: {new Date(kb.available_from).toLocaleDateString('en-PH', { month:'long', day:'numeric', year:'numeric' })}
            </div>

            {offered[kb.id] ? (
              <div style={{ background:'#e8f5ee', border:'1.5px solid rgba(26,107,60,.2)', borderRadius:'9px', padding:'9px', textAlign:'center', fontSize:'.76rem', color:'#1a6b3c', fontWeight:700 }}>
                ✅ Offer sent! Waiting for response (48 hrs)
              </div>
            ) : (
              <div style={{ display:'flex', gap:'7px' }}>
                <button
                  style={{ flex:2, padding:'9px', background:'#1a6b3c', color:'#fff', border:'none', borderRadius:'9px', fontFamily:'sans-serif', fontSize:'.78rem', fontWeight:700, cursor:'pointer' }}
                  onClick={() => setOffered(prev => ({ ...prev, [kb.id]: true }))}
                >
                  Send Offer
                </button>
                <button
                  style={{ flex:1, padding:'9px', background:'transparent', color:'#6b7280', border:'1.5px solid #e5e7eb', borderRadius:'9px', fontFamily:'sans-serif', fontSize:'.76rem', fontWeight:600, cursor:'pointer' }}
                  onClick={() => setPassed(prev => ({ ...prev, [kb.id]: true }))}
                >
                  Pass
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderTop:'1px solid #f3f4f6', display:'flex' }}>
        <button style={{ flex:1, padding:'10px 4px 9px', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', border:'none', background:'transparent', cursor:'pointer' }}>
          <span style={{ fontSize:'1.1rem' }}>🔍</span>
          <span style={{ fontSize:'.57rem', fontWeight:700, color:'#1a6b3c' }}>Browse</span>
        </button>
        <button style={{ flex:1, padding:'10px 4px 9px', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', border:'none', background:'transparent', cursor:'pointer' }}>
          <span style={{ fontSize:'1.1rem' }}>📋</span>
          <span style={{ fontSize:'.57rem', fontWeight:600, color:'#6b7280' }}>My Offers</span>
        </button>
        <button style={{ flex:1, padding:'10px 4px 9px', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', border:'none', background:'transparent', cursor:'pointer' }}>
          <span style={{ fontSize:'1.1rem' }}>📝</span>
          <span style={{ fontSize:'.57rem', fontWeight:600, color:'#6b7280' }}>Post Job</span>
        </button>
        <button style={{ flex:1, padding:'10px 4px 9px', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', border:'none', background:'transparent', cursor:'pointer' }}>
          <span style={{ fontSize:'1.1rem' }}>💬</span>
          <span style={{ fontSize:'.57rem', fontWeight:600, color:'#6b7280' }}>Chat</span>
        </button>
      </div>
    </div>
  )
}
