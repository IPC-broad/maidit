'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Payout = {
  id: string
  amount: number
  type: string
  status: string
  due_at: string
  offer: {
    id: string
    salary: number
    kasambahay_profile: { full_name: string }
    homeowner_profile: { full_name: string; city: string }
  }
}

type Worker = {
  id: string
  profiles: { full_name: string; city: string; mobile: string }
  province: string
  skills: string[]
  status: string
}

export default function PartnerDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<'overview' | 'workers' | 'payouts'>('overview')
  const [partner, setPartner] = useState<any>(null)
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddWorker, setShowAddWorker] = useState(false)
  const [workerForm, setWorkerForm] = useState({
    full_name: '', mobile: '', province: '', skills: ''
  })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    const init = async () => {
      const { supabase } = await import('../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: partnerData } = await supabase
        .from('partners')
        .select('*')
        .eq('profile_id', user.id)
        .single()

      if (!partnerData) { router.push('/'); return }
      setPartner(partnerData)

      const { data: payoutsData } = await supabase
        .from('payouts')
        .select(`
          *,
          offer:offers(
            id, salary,
            kasambahay_profile:profiles!offers_kasambahay_id_fkey(full_name),
            homeowner_profile:profiles!offers_homeowner_id_fkey(full_name, city)
          )
        `)
        .eq('partner_id', partnerData.id)
        .order('due_at', { ascending: false })

      setPayouts(payoutsData || [])

      const { data: workersData } = await supabase
        .from('kasambahay')
        .select('*, profiles(*)')
        .eq('referred_by', partnerData.id)
        .order('created_at', { ascending: false })

      setWorkers(workersData || [])
      setLoading(false)
    }
    init()
  }, [])

  const handleAddWorker = async () => {
    if (!workerForm.full_name || !workerForm.mobile || !workerForm.province) {
      setSaveMsg('Please fill in name, mobile, and province.')
      return
    }
    setSaving(true)
    setSaveMsg('')
    const { supabase } = await import('../../../lib/supabase')

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        full_name: workerForm.full_name,
        mobile: workerForm.mobile,
        city: workerForm.province,
        role: 'kasambahay',
        verified: false
      })
      .select()
      .single()

    if (profileError || !profile) {
      setSaveMsg('Error — mobile may already be registered.')
      setSaving(false)
      return
    }

    const skillsArray = workerForm.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
    await supabase.from('kasambahay').insert({
      profile_id: profile.id,
      province: workerForm.province,
      skills: skillsArray,
      referred_by: partner.id,
      status: 'available'
    })

    setSaveMsg('Worker added!')
    setSaving(false)
    setWorkerForm({ full_name: '', mobile: '', province: '', skills: '' })
    setShowAddWorker(false)

    const { data: workersData } = await supabase
      .from('kasambahay')
      .select('*, profiles(*)')
      .eq('referred_by', partner.id)
      .order('created_at', { ascending: false })
    setWorkers(workersData || [])
  }

  const totalEarned = payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  const totalPending = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
  const totalScheduled = payouts.filter(p => p.status === 'scheduled').reduce((sum, p) => sum + p.amount, 0)

  const statusColor: Record<string, string> = {
    paid: '#166534', pending: '#92400e', scheduled: '#1e40af'
  }
  const statusBg: Record<string, string> = {
    paid: '#f0fdf4', pending: '#fffbeb', scheduled: '#eff6ff'
  }

  const s: any = {
    wrap: { minHeight: '100vh', background: '#f9fafb', fontFamily: 'sans-serif', color: '#111827' },
    head: { background: '#0d1117', padding: '14px 18px' },
    body: { padding: '16px 18px 40px' },
    card: { background: '#fff', borderRadius: '12px', padding: '14px', border: '1.5px solid #e5e7eb', marginBottom: '12px' },
    tabBtn: (active: boolean) => ({
      padding: '8px 16px', borderRadius: '20px',
      border: active ? 'none' : '1.5px solid #e5e7eb',
      cursor: 'pointer', fontFamily: 'sans-serif', fontSize: '.78rem', fontWeight: 700,
      background: active ? '#0d1117' : '#fff',
      color: active ? '#fff' : '#6b7280'
    }),
    statCard: {
      background: '#fff', borderRadius: '12px', padding: '14px',
      border: '1.5px solid #e5e7eb', flex: 1
    },
    btn: {
      width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
      background: '#1a6b3c', color: '#fff', fontFamily: 'sans-serif',
      fontSize: '.88rem', fontWeight: 700, cursor: 'pointer', marginBottom: '8px'
    },
    input: {
      width: '100%', padding: '10px 13px', border: '1.5px solid #e5e7eb',
      borderRadius: '10px', fontFamily: 'sans-serif', fontSize: '.84rem',
      outline: 'none', marginBottom: '10px', background: '#fff',
      color: '#111827', boxSizing: 'border-box' as const
    },
    lbl: {
      display: 'block', fontSize: '.62rem', fontWeight: 700,
      textTransform: 'uppercase' as const, letterSpacing: '.5px',
      color: '#6b7280', marginBottom: '4px'
    },
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#6b7280' }}>
      Loading...
    </div>
  )

  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <div style={{ fontFamily: 'serif', fontSize: '1.1rem', fontWeight: 900, color: '#fff', marginBottom: '2px' }}>
          Partner Dashboard
        </div>
        <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.4)' }}>
          {partner?.barangay || 'Community Partner'} · {partner?.approved ? '✅ Approved' : '⏳ Pending Approval'}
        </div>
      </div>

      <div style={s.body}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '18px' }}>
          {(['overview', 'workers', 'payouts'] as const).map(t => (
            <button key={t} style={s.tabBtn(tab === t)} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              {[
                { label: 'Earned', value: `₱${totalEarned.toLocaleString()}`, color: '#1a6b3c' },
                { label: 'Pending', value: `₱${totalPending.toLocaleString()}`, color: '#92400e' },
                { label: 'Scheduled', value: `₱${totalScheduled.toLocaleString()}`, color: '#1e40af' },
              ].map((stat, i) => (
                <div key={i} style={s.statCard}>
                  <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#6b7280', marginBottom: '4px' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontFamily: 'serif', fontSize: '1.3rem', fontWeight: 900, color: stat.color }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            <div style={s.card}>
              <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#6b7280', marginBottom: '10px' }}>
                Your stats
              </div>
              {[
                { label: 'Workers uploaded', value: workers.length },
                { label: 'Active hires', value: payouts.filter(p => p.status !== 'scheduled').length },
                { label: 'GCash number', value: partner?.gcash_number || '—' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none' }}>
                  <span style={{ fontSize: '.8rem', color: '#6b7280' }}>{row.label}</span>
                  <span style={{ fontSize: '.82rem', fontWeight: 700, color: '#111827' }}>{String(row.value)}</span>
                </div>
              ))}
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '11px', padding: '13px 14px' }}>
              <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#92400e', marginBottom: '6px' }}>
                💸 Payout per hire
              </div>
              <div style={{ fontSize: '.74rem', color: '#78350f', lineHeight: 1.8 }}>
                ₱600 on worker arrival<br />
                ₱400 on Day 30 (if worker stays)<br />
                <span style={{ opacity: .7 }}>Paid to GCash: {partner?.gcash_number || 'not set'}</span>
              </div>
            </div>
          </>
        )}

        {tab === 'workers' && (
          <>
            <button style={s.btn} onClick={() => setShowAddWorker(!showAddWorker)}>
              {showAddWorker ? '✕ Cancel' : '+ Add Worker'}
            </button>

            {saveMsg && (
              <div style={{
                background: saveMsg.includes('added') ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${saveMsg.includes('added') ? '#bbf7d0' : '#fecaca'}`,
                borderRadius: '9px', padding: '10px 13px', fontSize: '.78rem',
                color: saveMsg.includes('added') ? '#166534' : '#dc2626', marginBottom: '12px'
              }}>
                {saveMsg}
              </div>
            )}

            {showAddWorker && (
              <div style={s.card}>
                <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#6b7280', marginBottom: '12px' }}>
                  Worker details
                </div>
                <label style={s.lbl}>Full name *</label>
                <input
                  style={s.input}
                  placeholder="e.g. Maria Santos"
                  value={workerForm.full_name}
                  onChange={e => setWorkerForm(f => ({ ...f, full_name: e.target.value }))}
                />
                <label style={s.lbl}>Mobile *</label>
                <input
                  style={s.input}
                  placeholder="09XXXXXXXXX"
                  value={workerForm.mobile}
                  onChange={e => setWorkerForm(f => ({ ...f, mobile: e.target.value }))}
                />
                <label style={s.lbl}>Province *</label>
                <input
                  style={s.input}
                  placeholder="e.g. Samar, Leyte, Cebu"
                  value={workerForm.province}
                  onChange={e => setWorkerForm(f => ({ ...f, province: e.target.value }))}
                />
                <label style={s.lbl}>Skills (comma-separated)</label>
                <input
                  style={s.input}
                  placeholder="e.g. cooking, laundry, childcare"
                  value={workerForm.skills}
                  onChange={e => setWorkerForm(f => ({ ...f, skills: e.target.value }))}
                />
                <button
                  style={{ ...s.btn, opacity: saving ? .6 : 1 }}
                  onClick={handleAddWorker}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Worker →'}
                </button>
              </div>
            )}

            {workers.length === 0 ? (
              <div style={{ textAlign: 'center' as const, padding: '32px 0', color: '#9ca3af', fontSize: '.82rem' }}>
                No workers yet. Tap "+ Add Worker" to start.
              </div>
            ) : workers.map(w => (
              <div key={w.id} style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '.88rem', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>
                      {w.profiles?.full_name}
                    </div>
                    <div style={{ fontSize: '.72rem', color: '#6b7280' }}>
                      {w.province} · {w.profiles?.mobile}
                    </div>
                    {w.skills?.length > 0 && (
                      <div style={{ fontSize: '.68rem', color: '#9ca3af', marginTop: '3px' }}>
                        {w.skills.join(', ')}
                      </div>
                    )}
                  </div>
                  <div style={{
                    fontSize: '.65rem', fontWeight: 700, padding: '3px 8px',
                    borderRadius: '20px',
                    background: w.status === 'hired' ? '#f0fdf4' : '#f3f4f6',
                    color: w.status === 'hired' ? '#166534' : '#6b7280'
                  }}>
                    {w.status || 'available'}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'payouts' && (
          <>
            {payouts.length === 0 ? (
              <div style={{ textAlign: 'center' as const, padding: '32px 0', color: '#9ca3af', fontSize: '.82rem' }}>
                No payouts yet. Appears once your workers are hired.
              </div>
            ) : payouts.map(p => (
              <div key={p.id} style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '.84rem', fontWeight: 700, color: '#111827' }}>
                      ₱{p.amount.toLocaleString()} — {p.type === 'arrival' ? 'Arrival payout' : 'Day-30 payout'}
                    </div>
                    <div style={{ fontSize: '.7rem', color: '#6b7280', marginTop: '2px' }}>
                      {p.offer?.kasambahay_profile?.full_name} → {p.offer?.homeowner_profile?.full_name}
                    </div>
                    <div style={{ fontSize: '.68rem', color: '#9ca3af', marginTop: '2px' }}>
                      Due: {new Date(p.due_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '.65rem', fontWeight: 700, padding: '3px 9px',
                    borderRadius: '20px',
                    background: statusBg[p.status] || '#f3f4f6',
                    color: statusColor[p.status] || '#6b7280'
                  }}>
                    {p.status}
                  </div>
                </div>
              </div>
            ))}
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '11px', padding: '12px 14px', marginTop: '8px' }}>
              <div style={{ fontSize: '.7rem', color: '#6b7280', lineHeight: 1.7 }}>
                Payouts sent to GCash: <strong>{partner?.gcash_number || 'not set'}</strong><br />
                Questions? Contact MaidIt admin.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}