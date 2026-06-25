'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const ADMIN_EMAILS = ['ruffa_eugenio@yahoo.com', 'ruffa.erodriguez@gmail.com', 'test@maidit.com', 'admin@maidit.com']

const C = {
  forest: '#27500A', forestDeep: '#1c3b07', forestSoft: '#f0f5ec',
  amber: '#c9943a', amberSoft: '#fbf3e2',
  ink: '#1a1d18', ink2: '#4a504a', ink3: '#8a8f88',
  paper: '#ffffff', paper2: '#faf9f5', line: '#ebe9e2',
  red: '#dc2626', blue: '#2563eb', green: '#16a34a', purple: '#7c3aed',
}
const sans = "'Geist', ui-sans-serif, sans-serif"
const serif = "'Instrument Serif', Georgia, serif"

type Section = 'overview' | 'partners' | 'homeowners' | 'kasambahay' | 'job-posts' | 'offers' | 'analytics'

function exportCSV(filename: string, rows: string[][], headers: string[]) {
  const csv = [headers, ...rows].map(r => r.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
  a.download = filename
  a.click()
}

const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

export default function AdminDashboard() {
  const router = useRouter()

  const [authed, setAuthed] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [section, setSection] = useState<Section>('overview')
  const [stats, setStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [partners, setPartners] = useState<any[]>([])
  const [partnersLoading, setPartnersLoading] = useState(false)
  const [homeowners, setHomeowners] = useState<any[]>([])
  const [homeownersLoading, setHomeownersLoading] = useState(false)
  const [kasambahay, setKasambahay] = useState<any[]>([])
  const [kasambahayLoading, setKasambahayLoading] = useState(false)
  const [offers, setOffers] = useState<any[]>([])
  const [offersLoading, setOffersLoading] = useState(false)
  const [jobPosts, setJobPosts] = useState<any[]>([])
  const [jobPostsLoading, setJobPostsLoading] = useState(false)
  const [partnerTab, setPartnerTab] = useState<'pending' | 'all'>('pending')
  const [hwSearch, setHwSearch] = useState('')
  const [kbSearch, setKbSearch] = useState('')
  const [kbProvFilter, setKbProvFilter] = useState('')
  const [kbSetupFilter, setKbSetupFilter] = useState('')
  const [kbStatusFilter, setKbStatusFilter] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  // Load fonts
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap'
    document.head.appendChild(link)
  }, [])

  // Auth check
  useEffect(() => {
    ;(async () => {
      const { supabase } = await import('../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      if (!ADMIN_EMAILS.includes(user.email ?? '')) { router.push('/login'); return }
      setUserEmail(user.email ?? '')
      setAuthed(true)
    })()
  }, [router])

  const apiFetch = async (url: string, opts?: RequestInit) => {
    const res = await fetch(url, {
      ...opts,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) }
    })
    return res.json()
  }

  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      const data = await apiFetch('/api/admin/stats')
      setStats(data)
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchPartners = async () => {
    setPartnersLoading(true)
    try {
      const data = await apiFetch('/api/admin/partners')
      setPartners(Array.isArray(data) ? data : (data.partners ?? []))
    } finally {
      setPartnersLoading(false)
    }
  }

  const fetchHomeowners = async () => {
    setHomeownersLoading(true)
    try {
      const data = await apiFetch('/api/admin/homeowners')
      setHomeowners(Array.isArray(data) ? data : (data.homeowners ?? []))
    } finally {
      setHomeownersLoading(false)
    }
  }

  const fetchKasambahay = async () => {
    setKasambahayLoading(true)
    try {
      const data = await apiFetch('/api/admin/kasambahay')
      setKasambahay(Array.isArray(data) ? data : (data.kasambahay ?? []))
    } finally {
      setKasambahayLoading(false)
    }
  }

  const fetchOffers = async () => {
    setOffersLoading(true)
    try {
      const data = await apiFetch('/api/admin/offers')
      setOffers(Array.isArray(data) ? data : (data.offers ?? []))
    } finally {
      setOffersLoading(false)
    }
  }

  const fetchJobPosts = async () => {
    setJobPostsLoading(true)
    try {
      const data = await apiFetch('/api/admin/job-posts')
      setJobPosts(Array.isArray(data) ? data : (data.jobPosts ?? []))
    } finally {
      setJobPostsLoading(false)
    }
  }

  // Fetch stats once authed
  useEffect(() => {
    if (authed) fetchStats()
  }, [authed])

  // Lazy load sections
  useEffect(() => {
    if (!authed) return
    if (section === 'partners' && partners.length === 0) fetchPartners()
    if (section === 'homeowners' && homeowners.length === 0) fetchHomeowners()
    if (section === 'kasambahay' && kasambahay.length === 0) fetchKasambahay()
    if (section === 'offers' && offers.length === 0) fetchOffers()
    if (section === 'job-posts' && jobPosts.length === 0) fetchJobPosts()
  }, [section, authed])

  const showActionMsg = (msg: string) => {
    setActionMsg(msg)
    setTimeout(() => setActionMsg(''), 3000)
  }

  const handleOfferAction = async (offerId: string, action: string) => {
    try {
      const res = await apiFetch('/api/admin/offer-action', {
        method: 'POST',
        body: JSON.stringify({ offerId, action })
      })
      if (res.error) { showActionMsg('Error: ' + res.error); return }
      showActionMsg(action === 'cancel' ? 'Offer cancelled.' : 'Offer marked as paid.')
      fetchOffers()
    } catch {
      showActionMsg('Failed to perform action.')
    }
  }

  const handlePartnerAction = async (partnerId: string, approved: boolean) => {
    try {
      const res = await apiFetch('/api/admin/approve-partner', {
        method: 'POST',
        body: JSON.stringify({ partnerId, approved })
      })
      if (res.error) { showActionMsg('Error: ' + res.error); return }
      showActionMsg(approved ? 'Partner approved!' : 'Partner rejected.')
      fetchPartners()
      fetchStats()
    } catch {
      showActionMsg('Failed to perform action.')
    }
  }

  if (!authed) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: sans, color: C.ink3, fontSize: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 32, height: 32, border: `3px solid ${C.forest}`, borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Loading...
        </div>
      </div>
    )
  }

  const today = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const navItems: { id: Section; emoji: string; label: string }[] = [
    { id: 'overview', emoji: '📊', label: 'Overview' },
    { id: 'partners', emoji: '🤝', label: 'Partners' },
    { id: 'homeowners', emoji: '🏠', label: 'Homeowners' },
    { id: 'kasambahay', emoji: '👩', label: 'Kasambahay' },
    { id: 'job-posts', emoji: '📋', label: 'Job Posts' },
    { id: 'offers', emoji: '💼', label: 'Offers & Hires' },
    { id: 'analytics', emoji: '📈', label: 'Analytics' },
  ]

  // ---- SECTION RENDERERS ----

  const renderOverview = () => {
    if (statsLoading) return <div style={{ color: C.ink3, fontFamily: sans }}>Loading stats...</div>
    if (!stats) return <div style={{ color: C.ink3, fontFamily: sans }}>No data.</div>

    const cards = [
      {
        value: (stats.totalUsers ?? 0).toLocaleString(),
        label: 'Total Users',
        sub: `${stats.totalHO ?? 0} HO · ${stats.totalKB ?? 0} KB · ${stats.totalPartners ?? 0} Partners`
      },
      { value: (stats.kbActive ?? 0).toLocaleString(), label: 'Active Kasambahay', sub: '' },
      {
        value: (stats.partnersPending ?? 0).toLocaleString(),
        label: 'Partners Pending',
        sub: '',
        red: (stats.partnersPending ?? 0) > 0
      },
      { value: (stats.successfulHires ?? 0).toLocaleString(), label: 'Successful Hires', sub: '' },
      { value: (stats.jobPostsActive ?? 0).toLocaleString(), label: 'Active Job Posts', sub: '' },
      {
        value: `₱${(stats.revenueThisMonth ?? 0).toLocaleString()}`,
        label: 'Revenue This Month',
        sub: ''
      },
      {
        value: (stats.signupsToday ?? 0).toLocaleString(),
        label: 'New Today',
        sub: `${stats.hwToday ?? 0} HO · ${stats.kbToday ?? 0} KB · ${stats.partnerToday ?? 0} Partners`
      },
      {
        value: (stats.signupsThisWeek ?? 0).toLocaleString(),
        label: 'New This Week',
        sub: stats.signupsLastWeek !== undefined
          ? `vs ${stats.signupsLastWeek} last week`
          : ''
      },
    ]

    const sourceCards = [
      { value: (stats.kbViaPartners ?? 0).toLocaleString(), label: 'KB via Partners', color: C.green },
      { value: (stats.kbDirect ?? 0).toLocaleString(), label: 'KB Direct Signups', color: C.ink3 },
    ]

    const offerFunnel = stats.offerFunnel ?? {}

    return (
      <div>
        <h2 style={{ fontFamily: serif, fontSize: 26, color: C.ink, marginBottom: 20, fontWeight: 400 }}>Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
          {cards.map((card, i) => (
            <div key={i} style={{
              background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16,
              ...(card.red ? { borderColor: C.red, background: '#fff5f5' } : {})
            }}>
              <div style={{ fontFamily: serif, fontSize: 36, color: card.red ? C.red : C.forest, lineHeight: 1.1 }}>{card.value}</div>
              <div style={{ fontFamily: sans, fontSize: 12, color: C.ink3, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 6 }}>{card.label}</div>
              {card.sub && <div style={{ fontFamily: sans, fontSize: 11, color: C.ink3, marginTop: 4 }}>{card.sub}</div>}
            </div>
          ))}
        </div>

        <h3 style={{ fontFamily: sans, fontSize: 13, color: C.ink2, marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kasambahay Sources</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(180px, 240px))', gap: 12, marginBottom: 28 }}>
          {sourceCards.map((card, i) => (
            <div key={i} style={{ background: card.color + '10', border: `1px solid ${card.color}33`, borderRadius: 14, padding: 16 }}>
              <div style={{ fontFamily: serif, fontSize: 36, color: card.color, lineHeight: 1.1 }}>{card.value}</div>
              <div style={{ fontFamily: sans, fontSize: 12, color: card.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 6 }}>{card.label}</div>
            </div>
          ))}
        </div>

        <h3 style={{ fontFamily: sans, fontSize: 14, color: C.ink2, marginBottom: 10, fontWeight: 600 }}>Offer Status Breakdown</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Pending', key: 'pending', color: '#6b7280' },
            { label: 'Agreed', key: 'agreed', color: C.blue },
            { label: 'Paid', key: 'paid', color: C.green },
            { label: 'Arrived', key: 'arrived', color: C.purple },
            { label: 'Cancelled', key: 'cancelled', color: C.red },
          ].map(s => (
            <div key={s.key} style={{
              background: s.color + '18', border: `1px solid ${s.color}44`,
              borderRadius: 20, padding: '4px 12px', fontFamily: sans, fontSize: 13, color: s.color
            }}>
              {s.label}: <strong>{(offerFunnel[s.key] ?? 0).toLocaleString()}</strong>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderPartners = () => {
    if (partnersLoading) return <div style={{ color: C.ink3, fontFamily: sans }}>Loading partners...</div>

    const pending = partners.filter(p => !p.approved)
    const allP = partners

    return (
      <div>
        <h2 style={{ fontFamily: serif, fontSize: 26, color: C.ink, marginBottom: 16, fontWeight: 400 }}>Partners</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['pending', 'all'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setPartnerTab(tab)}
              style={{
                padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: sans, fontSize: 13,
                background: partnerTab === tab ? C.forest : C.line,
                color: partnerTab === tab ? '#fff' : C.ink2,
                fontWeight: partnerTab === tab ? 600 : 400
              }}
            >
              {tab === 'pending' ? `Pending Approval (${pending.length})` : `All Partners (${allP.length})`}
            </button>
          ))}
        </div>

        {partnerTab === 'pending' && (
          pending.length === 0
            ? <div style={{ color: C.ink3, fontFamily: sans, padding: '24px 0' }}>No pending partner applications.</div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {pending.map((p: any) => (
                  <div key={p.id} style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      {p.profile?.selfie_url && (
                        <img src={p.profile.selfie_url} alt="selfie" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: serif, fontSize: 20, color: C.ink, marginBottom: 4 }}>
                          {p.profile?.full_name ?? 'Unknown'}
                        </div>
                        <div style={{ fontFamily: sans, fontSize: 13, color: C.ink2, marginBottom: 8 }}>{p.profile?.mobile ?? '—'}</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{ background: C.amberSoft, color: C.amber, border: `1px solid ${C.amber}44`, borderRadius: 12, padding: '2px 10px', fontFamily: sans, fontSize: 12 }}>
                            Tier: {p.tier ?? '—'}
                          </span>
                          <span style={{ fontFamily: 'monospace', fontSize: 12, background: C.forestSoft, color: C.forest, padding: '2px 10px', borderRadius: 8 }}>
                            {p.referral_code ?? '—'}
                          </span>
                          <span style={{ fontFamily: sans, fontSize: 12, color: C.ink3 }}>Applied: {fmtDate(p.profile?.created_at)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handlePartnerAction(p.id, true)}
                            style={{ background: C.green, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontFamily: sans, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
                          >
                            APPROVE
                          </button>
                          <button
                            onClick={() => handlePartnerAction(p.id, false)}
                            style={{ background: C.red, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontFamily: sans, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
                          >
                            REJECT
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
        )}

        {partnerTab === 'all' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: sans, fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.forestSoft }}>
                  {['Name', 'Mobile', 'Tier', 'Referral Code', 'Referred', 'Hired', 'Earnings', 'Balance', 'Workers', 'Joined', 'Approved'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: C.ink2, fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allP.map((p: any, i: number) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? C.paper : C.paper2, borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: '10px 12px', color: C.ink }}>{p.profile?.full_name ?? '—'}</td>
                    <td style={{ padding: '10px 12px', color: C.ink2 }}>{p.profile?.mobile ?? '—'}</td>
                    <td style={{ padding: '10px 12px', color: C.amber }}>{p.tier ?? '—'}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, color: C.forest }}>{p.referral_code ?? '—'}</td>
                    <td style={{ padding: '10px 12px', color: C.ink2, textAlign: 'center' }}>{p.referral_count ?? 0}</td>
                    <td style={{ padding: '10px 12px', color: C.ink2, textAlign: 'center' }}>{p.hire_count ?? 0}</td>
                    <td style={{ padding: '10px 12px', color: C.ink }}>₱{(p.earnings ?? 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', color: C.ink }}>₱{(p.balance ?? 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', color: C.ink2, textAlign: 'center' }}>{p.worker_count ?? 0}</td>
                    <td style={{ padding: '10px 12px', color: C.ink3, whiteSpace: 'nowrap' }}>{fmtDate(p.profile?.created_at)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      {p.approved
                        ? <span style={{ color: C.green, fontWeight: 700 }}>✓</span>
                        : <span style={{ color: C.ink3 }}>✗</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  const renderHomeowners = () => {
    if (homeownersLoading) return <div style={{ color: C.ink3, fontFamily: sans }}>Loading homeowners...</div>

    const filtered = homeowners.filter(h => {
      if (!hwSearch) return true
      const q = hwSearch.toLowerCase()
      return (
        (h.profile?.full_name ?? '').toLowerCase().includes(q) ||
        (h.profile?.mobile ?? '').includes(q) ||
        (h.mobile ?? '').includes(q)
      )
    })

    const doExport = () => {
      exportCSV('homeowners.csv',
        filtered.map(h => [
          h.profile?.full_name ?? '—',
          h.profile?.mobile ?? '—',
          h.profile?.email ?? '—',
          h.city ?? '—',
          String(h.offer_count ?? 0),
          fmtDate(h.profile?.created_at)
        ]),
        ['Name', 'Mobile', 'Email', 'City', 'Offers Sent', 'Joined']
      )
    }

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: serif, fontSize: 26, color: C.ink, fontWeight: 400 }}>Homeowners</h2>
          <button onClick={doExport} style={{ background: C.forest, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontFamily: sans, fontSize: 13, cursor: 'pointer' }}>
            Export CSV
          </button>
        </div>
        <input
          value={hwSearch}
          onChange={e => setHwSearch(e.target.value)}
          placeholder="Search by name or mobile..."
          style={{ width: '100%', maxWidth: 360, padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.line}`, fontFamily: sans, fontSize: 13, marginBottom: 16, outline: 'none', color: C.ink, background: C.paper }}
        />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: sans, fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.forestSoft }}>
                {['Name', 'Mobile', 'Email', 'City', 'Offers Sent', 'Joined'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: C.ink2, fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((h: any, i: number) => (
                <tr key={h.id} style={{ background: i % 2 === 0 ? C.paper : C.paper2, borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: '10px 12px', color: C.ink }}>{h.profile?.full_name ?? '—'}</td>
                  <td style={{ padding: '10px 12px', color: C.ink2 }}>{h.profile?.mobile ?? '—'}</td>
                  <td style={{ padding: '10px 12px', color: C.ink2 }}>{h.profile?.email ?? '—'}</td>
                  <td style={{ padding: '10px 12px', color: C.ink2 }}>{h.city ?? '—'}</td>
                  <td style={{ padding: '10px 12px', color: C.ink2, textAlign: 'center' }}>{h.offer_count ?? 0}</td>
                  <td style={{ padding: '10px 12px', color: C.ink3, whiteSpace: 'nowrap' }}>{fmtDate(h.profile?.created_at)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '20px 12px', color: C.ink3, textAlign: 'center' }}>No results.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderKasambahay = () => {
    if (kasambahayLoading) return <div style={{ color: C.ink3, fontFamily: sans }}>Loading kasambahay...</div>

    const provinces = Array.from(new Set(kasambahay.map((k: any) => k.profile?.province ?? k.province ?? '').filter(Boolean))).sort()

    const filtered = kasambahay.filter((k: any) => {
      const name = (k.profile?.full_name ?? k.name ?? '').toLowerCase()
      const mobile = (k.profile?.mobile ?? k.mobile ?? '')
      const prov = (k.profile?.province ?? k.province ?? '')
      const setup = (k.profile?.setup ?? k.setup ?? '')
      const status = (k.status ?? '')
      if (kbSearch && !name.includes(kbSearch.toLowerCase()) && !mobile.includes(kbSearch)) return false
      if (kbProvFilter && prov !== kbProvFilter) return false
      if (kbSetupFilter && setup !== kbSetupFilter) return false
      if (kbStatusFilter && status !== kbStatusFilter) return false
      return true
    })

    const totalCount = kasambahay.length
    const viaPartnersCount = kasambahay.filter((k: any) => k.referred_by).length
    const directCount = totalCount - viaPartnersCount

    const doExport = () => {
      exportCSV('kasambahay.csv',
        filtered.map(k => [
          k.profile?.full_name ?? k.name ?? '—',
          k.profile?.mobile ?? k.mobile ?? '—',
          k.province ?? '—',
          k.setup ?? '—',
          String(k.asking_salary ?? '—'),
          k.has_govt_id ? 'Yes' : 'No',
          k.has_nbi ? 'Yes' : 'No',
          k.referred_by ? (k.partner_referral_code ?? k.referred_by) : 'Direct',
          fmtDate(k.profile?.created_at)
        ]),
        ['Name', 'Mobile', 'Province', 'Setup', 'Salary', 'Govt ID', 'NBI', 'Source', 'Joined']
      )
    }

    const selectStyle: React.CSSProperties = {
      padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.line}`, fontFamily: sans, fontSize: 13, color: C.ink, background: C.paper, outline: 'none'
    }

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: serif, fontSize: 26, color: C.ink, fontWeight: 400 }}>Kasambahay</h2>
          <button onClick={doExport} style={{ background: C.forest, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontFamily: sans, fontSize: 13, cursor: 'pointer' }}>
            Export CSV
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { label: 'Total', value: totalCount, color: C.ink2 },
            { label: 'Via Partners', value: viaPartnersCount, color: C.green },
            { label: 'Direct', value: directCount, color: C.ink3 },
          ].map(s => (
            <div key={s.label} style={{
              background: s.color + '12', border: `1px solid ${s.color}33`,
              borderRadius: 20, padding: '4px 14px', fontFamily: sans, fontSize: 13, color: s.color, display: 'flex', gap: 6, alignItems: 'center'
            }}>
              <span>{s.label}:</span><strong>{s.value}</strong>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <input
            value={kbSearch}
            onChange={e => setKbSearch(e.target.value)}
            placeholder="Search name or mobile..."
            style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.line}`, fontFamily: sans, fontSize: 13, color: C.ink, background: C.paper, outline: 'none', minWidth: 200 }}
          />
          <select value={kbProvFilter} onChange={e => setKbProvFilter(e.target.value)} style={selectStyle}>
            <option value="">All Provinces</option>
            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={kbSetupFilter} onChange={e => setKbSetupFilter(e.target.value)} style={selectStyle}>
            <option value="">All Setups</option>
            <option value="Stay-in">Stay-in</option>
            <option value="Stay-out">Stay-out</option>
            <option value="Kahit alin">Kahit alin</option>
          </select>
          <select value={kbStatusFilter} onChange={e => setKbStatusFilter(e.target.value)} style={selectStyle}>
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="hired">Hired</option>
          </select>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: sans, fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.forestSoft }}>
                {['Name', 'Mobile', 'Province', 'Setup', 'Salary', 'Source', 'Govt ID', 'NBI', 'Status', 'Joined'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: C.ink2, fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((k: any, i: number) => {
                const statusColor = k.status === 'available' ? C.green : k.status === 'hired' ? C.blue : C.ink3
                const sourceCode = k.referred_by ? (k.partner_referral_code ?? k.referred_by) : null
                return (
                  <tr key={k.id} style={{ background: i % 2 === 0 ? C.paper : C.paper2, borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: '10px 12px', color: C.ink }}>{k.profile?.full_name ?? k.name ?? '—'}</td>
                    <td style={{ padding: '10px 12px', color: C.ink2 }}>{k.profile?.mobile ?? k.mobile ?? '—'}</td>
                    <td style={{ padding: '10px 12px', color: C.ink2 }}>{k.province ?? '—'}</td>
                    <td style={{ padding: '10px 12px', color: C.ink2 }}>{k.setup ?? '—'}</td>
                    <td style={{ padding: '10px 12px', color: C.ink }}>₱{(k.asking_salary ?? 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {sourceCode
                        ? <span style={{ background: C.green + '18', color: C.green, border: `1px solid ${C.green}44`, borderRadius: 12, padding: '2px 10px', fontSize: 12, fontFamily: 'monospace' }}>{sourceCode}</span>
                        : <span style={{ background: C.ink3 + '18', color: C.ink3, border: `1px solid ${C.ink3}44`, borderRadius: 12, padding: '2px 10px', fontSize: 12 }}>Direct</span>
                      }
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{k.has_govt_id ? <span style={{ color: C.green }}>✅</span> : <span style={{ color: C.ink3 }}>❌</span>}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{k.has_nbi ? <span style={{ color: C.green }}>✅</span> : <span style={{ color: C.ink3 }}>❌</span>}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: statusColor + '18', color: statusColor, border: `1px solid ${statusColor}44`, borderRadius: 12, padding: '2px 10px', fontSize: 12 }}>
                        {k.status ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: C.ink3, whiteSpace: 'nowrap' }}>{fmtDate(k.profile?.created_at)}</td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={10} style={{ padding: '20px 12px', color: C.ink3, textAlign: 'center' }}>No results.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderJobPosts = () => {
    if (jobPostsLoading) return <div style={{ color: C.ink3, fontFamily: sans }}>Loading job posts...</div>

    return (
      <div>
        <h2 style={{ fontFamily: serif, fontSize: 26, color: C.ink, marginBottom: 20, fontWeight: 400 }}>Job Posts</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: sans, fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.forestSoft }}>
                {['Homeowner', 'Title', 'Setup', 'Salary', 'City', 'Applicants', 'Status', 'Posted'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: C.ink2, fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobPosts.map((j: any, i: number) => {
                const isActive = j.status === 'active'
                const statusColor = isActive ? C.green : C.red
                return (
                  <tr key={j.id} style={{ background: i % 2 === 0 ? C.paper : C.paper2, borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: '10px 12px', color: C.ink }}>{j.homeowner_name ?? j.homeowner?.profile?.full_name ?? '—'}</td>
                    <td style={{ padding: '10px 12px', color: C.ink }}>{j.title ?? '—'}</td>
                    <td style={{ padding: '10px 12px', color: C.ink2 }}>{j.setup ?? '—'}</td>
                    <td style={{ padding: '10px 12px', color: C.ink }}>₱{(j.salary ?? 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', color: C.ink2 }}>{j.city ?? '—'}</td>
                    <td style={{ padding: '10px 12px', color: C.ink2, textAlign: 'center' }}>{j.applicants_count ?? j.applicants ?? 0}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: statusColor + '18', color: statusColor, border: `1px solid ${statusColor}44`, borderRadius: 12, padding: '2px 10px', fontSize: 12 }}>
                        {j.status ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: C.ink3, whiteSpace: 'nowrap' }}>{fmtDate(j.created_at)}</td>
                  </tr>
                )
              })}
              {jobPosts.length === 0 && (
                <tr><td colSpan={8} style={{ padding: '20px 12px', color: C.ink3, textAlign: 'center' }}>No job posts.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderOffers = () => {
    if (offersLoading) return <div style={{ color: C.ink3, fontFamily: sans }}>Loading offers...</div>

    const total = offers.length
    const paid = offers.filter(o => o.status === 'paid' || o.status === 'arrived').length
    const cancelled = offers.filter(o => o.status === 'cancelled').length
    const convRate = total > 0 ? ((paid / total) * 100).toFixed(1) : '0.0'

    const statusColor: Record<string, string> = {
      pending: '#6b7280',
      agreed: C.blue,
      paid: C.green,
      cancelled: C.red,
      arrived: C.purple,
    }

    return (
      <div>
        <h2 style={{ fontFamily: serif, fontSize: 26, color: C.ink, marginBottom: 16, fontWeight: 400 }}>Offers & Hires</h2>

        {actionMsg && (
          <div style={{ background: C.forestSoft, border: `1px solid ${C.forest}44`, borderRadius: 8, padding: '8px 16px', fontFamily: sans, fontSize: 13, color: C.forest, marginBottom: 16 }}>
            {actionMsg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          {[
            { label: 'Total Sent', value: total },
            { label: 'Paid / Hired', value: paid },
            { label: 'Cancelled', value: cancelled },
            { label: 'Conversion Rate', value: `${convRate}%` },
          ].map(s => (
            <div key={s.label} style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: '10px 18px', fontFamily: sans }}>
              <div style={{ fontSize: 22, fontFamily: serif, color: C.forest }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.ink3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: sans, fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.forestSoft }}>
                {['ID', 'Homeowner', '', 'Kasambahay', 'Salary', 'City', 'Transport', 'Status', 'Date', 'Actions'].map((h, i) => (
                  <th key={i} style={{ padding: '10px 12px', textAlign: 'left', color: C.ink2, fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {offers.map((o: any, i: number) => {
                const sc = statusColor[o.status] ?? C.ink3
                const canAct = o.status === 'pending' || o.status === 'agreed'
                return (
                  <tr key={o.id} style={{ background: i % 2 === 0 ? C.paper : C.paper2, borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, color: C.ink3 }}>{(o.id ?? '').slice(0, 8)}</td>
                    <td style={{ padding: '10px 12px', color: C.ink }}>{o.homeowner_name ?? o.homeowner?.profile?.full_name ?? '—'}</td>
                    <td style={{ padding: '10px 12px', color: C.ink3 }}>→</td>
                    <td style={{ padding: '10px 12px', color: C.ink }}>{o.kasambahay_name ?? o.kasambahay?.profile?.full_name ?? '—'}</td>
                    <td style={{ padding: '10px 12px', color: C.ink }}>₱{(o.salary ?? 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', color: C.ink2 }}>{o.city ?? '—'}</td>
                    <td style={{ padding: '10px 12px', color: C.ink2 }}>{o.transport_budget ? `₱${o.transport_budget}` : '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: sc + '18', color: sc, border: `1px solid ${sc}44`, borderRadius: 12, padding: '2px 10px', fontSize: 12 }}>
                        {o.status ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: C.ink3, whiteSpace: 'nowrap' }}>{fmtDate(o.created_at)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {canAct && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={() => handleOfferAction(o.id, 'cancel')}
                            style={{ background: C.red, color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer', fontFamily: sans }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleOfferAction(o.id, 'mark_paid')}
                            style={{ background: C.green, color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer', fontFamily: sans }}
                          >
                            Mark Paid
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              {offers.length === 0 && (
                <tr><td colSpan={10} style={{ padding: '20px 12px', color: C.ink3, textAlign: 'center' }}>No offers.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderAnalytics = () => {
    if (statsLoading || !stats) return <div style={{ color: C.ink3, fontFamily: sans }}>Loading analytics...</div>

    const weeks = Array.from({ length: 8 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - d.getDay() - (7 * (7 - i)))
      return d.toISOString().slice(0, 10)
    })

    const signupChartData = weeks.map(wk => ({
      label: wk.slice(5),
      value: stats.weeklySignups?.[wk] ?? 0
    }))

    const hiresChartData = weeks.map(wk => ({
      label: wk.slice(5),
      value: stats.weeklyHires?.[wk] ?? 0
    }))

    const topProvinces: { label: string; value: number }[] = stats.topProvinces ?? []
    const maxProv = Math.max(...topProvinces.map(p => p.value), 1)

    const funnel = stats.offerFunnel ?? {}
    const sent = funnel.sent ?? 0
    const pct = (n: number) => sent > 0 ? ((n / sent) * 100).toFixed(0) : '0'

    const renderBarChart = (data: { label: string; value: number }[], title: string, color: string) => {
      const maxVal = Math.max(...data.map(d => d.value), 1)
      return (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontFamily: sans, fontSize: 14, color: C.ink2, fontWeight: 600, marginBottom: 12 }}>{title}</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160 }}>
            {data.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: 10, fontFamily: sans, color: C.ink3, marginBottom: 3 }}>{d.value}</div>
                <div style={{
                  width: '100%', background: color, borderRadius: '4px 4px 0 0',
                  height: `${Math.round((d.value / maxVal) * 120)}px`, minHeight: d.value > 0 ? 4 : 0, transition: 'height 0.3s'
                }} />
                <div style={{ fontSize: 10, fontFamily: sans, color: C.ink3, marginTop: 4, transform: 'rotate(-30deg)', transformOrigin: 'top center', whiteSpace: 'nowrap' }}>{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div>
        <h2 style={{ fontFamily: serif, fontSize: 26, color: C.ink, marginBottom: 24, fontWeight: 400 }}>Analytics</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20 }}>
            {renderBarChart(signupChartData, 'Signups by Week', C.forest)}
          </div>
          <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20 }}>
            {renderBarChart(hiresChartData, 'Hires by Week', C.amber)}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontFamily: sans, fontSize: 14, color: C.ink2, fontWeight: 600, marginBottom: 16 }}>Top Provinces for Kasambahay</h3>
            {topProvinces.length === 0
              ? <div style={{ color: C.ink3, fontFamily: sans, fontSize: 13 }}>No data.</div>
              : topProvinces.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 120, fontFamily: sans, fontSize: 12, color: C.ink2, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</div>
                  <div style={{ flex: 1, background: C.line, borderRadius: 10, height: 16, overflow: 'hidden' }}>
                    <div style={{ width: `${(p.value / maxProv) * 100}%`, background: C.forest, height: '100%', borderRadius: 10 }} />
                  </div>
                  <div style={{ width: 32, fontFamily: sans, fontSize: 12, color: C.ink3, textAlign: 'right', flexShrink: 0 }}>{p.value}</div>
                </div>
              ))
            }
          </div>

          <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontFamily: sans, fontSize: 14, color: C.ink2, fontWeight: 600, marginBottom: 16 }}>Offer Funnel</h3>
            <div style={{ fontFamily: sans, fontSize: 13, color: C.ink }}>
              {[
                { label: 'Sent', value: sent, pctStr: '100%', color: C.ink2 },
                { label: 'Agreed', value: funnel.agreed ?? 0, pctStr: `${pct(funnel.agreed ?? 0)}%`, color: C.blue },
                { label: 'Paid', value: funnel.paid ?? 0, pctStr: `${pct(funnel.paid ?? 0)}%`, color: C.green },
                { label: 'Arrived', value: funnel.arrived ?? 0, pctStr: `${pct(funnel.arrived ?? 0)}%`, color: C.purple },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  {i > 0 && <div style={{ color: C.ink3, fontSize: 16, marginLeft: 0 }}>↓</div>}
                  {i === 0 && <div style={{ width: 16 }} />}
                  <div style={{
                    flex: 1, background: step.color + '14', border: `1px solid ${step.color}33`,
                    borderRadius: 10, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <span style={{ color: step.color, fontWeight: 600 }}>{step.label}</span>
                    <span style={{ color: step.color }}>{step.value.toLocaleString()} <span style={{ fontSize: 11, opacity: 0.7 }}>({step.pctStr})</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontFamily: sans, fontSize: 14, color: C.ink2, fontWeight: 600, marginBottom: 12 }}>Partner Performance</h3>
          {partners.length === 0
            ? <div style={{ color: C.ink3, fontFamily: sans, fontSize: 13 }}>Load Partners first (navigate to Partners section).</div>
            : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: sans, fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.forestSoft }}>
                    {['Partner Name', 'Referred', 'Hired', 'Earnings'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: C.ink2, fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {partners.map((p: any, i: number) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? C.paper : C.paper2, borderBottom: `1px solid ${C.line}` }}>
                      <td style={{ padding: '8px 12px', color: C.ink }}>{p.profile?.full_name ?? p.name ?? '—'}</td>
                      <td style={{ padding: '8px 12px', color: C.ink2, textAlign: 'center' }}>{p.referred_count ?? 0}</td>
                      <td style={{ padding: '8px 12px', color: C.ink2, textAlign: 'center' }}>{p.hired_count ?? 0}</td>
                      <td style={{ padding: '8px 12px', color: C.forest }}>₱{((p.hired_count ?? 0) * 500).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      </div>
    )
  }

  const sectionContent = () => {
    switch (section) {
      case 'overview': return renderOverview()
      case 'partners': return renderPartners()
      case 'homeowners': return renderHomeowners()
      case 'kasambahay': return renderKasambahay()
      case 'job-posts': return renderJobPosts()
      case 'offers': return renderOffers()
      case 'analytics': return renderAnalytics()
      default: return null
    }
  }

  const handleSignOut = async () => {
    const { supabase } = await import('../../../lib/supabase')
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: sans }}>
      {/* Header */}
      <header style={{
        height: 56, background: C.forest, display: 'flex', alignItems: 'center',
        padding: '0 24px', flexShrink: 0, gap: 16
      }}>
        <div style={{ fontFamily: serif, fontSize: 20, color: '#fff', letterSpacing: '-0.01em', flex: 1 }}>
          MaidIt Admin
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, flex: 1, textAlign: 'center' }}>
          {today}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, justifyContent: 'flex-end' }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{userEmail}</span>
          <button
            onClick={handleSignOut}
            style={{
              background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 8, padding: '5px 14px', fontSize: 13, cursor: 'pointer', fontFamily: sans
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
        {/* Sidebar */}
        <nav style={{
          width: 220, background: C.forest, overflowY: 'auto', flexShrink: 0,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div style={{ padding: '12px 0' }}>
            {navItems.map(item => {
              const isActive = section === item.id
              const showBadge = item.id === 'partners' && (stats?.partnersPending ?? 0) > 0
              return (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '10px 18px', border: 'none', cursor: 'pointer',
                    background: isActive ? C.amber : 'transparent',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                    fontSize: 14, fontFamily: sans, textAlign: 'left',
                    position: 'relative'
                  }}
                >
                  <span style={{ fontSize: 16 }}>{item.emoji}</span>
                  <span>{item.label}</span>
                  {showBadge && (
                    <span style={{
                      background: C.red, color: '#fff', borderRadius: 10,
                      padding: '1px 6px', fontSize: 10, fontWeight: 700, marginLeft: 'auto'
                    }}>
                      {stats.partnersPending}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <div style={{ padding: '12px 18px 20px' }}>
            <a href="/admin/test" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontFamily: sans, textDecoration: 'none' }}>
              → Old Admin (test)
            </a>
          </div>
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, background: C.paper2, overflowY: 'auto', padding: 24 }}>
          {sectionContent()}
        </main>
      </div>
    </div>
  )
}
