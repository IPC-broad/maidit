'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const C = {
  forest: '#27500A', forestDeep: '#1c3b07',
  amber: '#c9943a', amberSoft: '#fef3e2', amberLine: '#fde8c0',
  ink: '#1a1d18', ink3: '#8a8f88',
  paper: '#ffffff', paper2: '#faf9f5', line: '#ede8e0',
}
const serif = "'Instrument Serif', Georgia, serif"
const sans  = "'Geist', ui-sans-serif, sans-serif"

export default function PartnerPendingPage() {
  const router = useRouter()
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600;700&display=swap'
    document.head.appendChild(link)
    return () => { try { document.head.removeChild(link) } catch {} }
  }, [])

  useEffect(() => {
    const init = async () => {
      const { supabase } = await import('../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: partnerData } = await supabase
        .from('partners').select('approved, referral_code').eq('profile_id', user.id).single()
      if (!partnerData) { router.push('/login'); return }
      if (partnerData.approved === true) { router.push('/dashboard/partner'); return }
      setReferralCode(partnerData.referral_code || null)
      setLoading(false)
    }
    init()
  }, [])

  const handleSignOut = async () => {
    const { supabase } = await import('../../../lib/supabase')
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sans }}>
        <div style={{ fontFamily: serif, fontSize: 28, color: C.forest }}>Maid<span style={{ color: C.amber }}>It</span></div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.paper2, fontFamily: sans }}>
      {/* Header */}
      <div style={{ background: C.forest, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: serif, fontSize: 26, color: '#fff', letterSpacing: '-0.3px' }}>
          Maid<span style={{ color: C.amber }}>It</span>
        </div>
        <button
          onClick={handleSignOut}
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '6px 14px', color: '#fff', fontFamily: sans, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          Sign out
        </button>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 20px' }}>
        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>⏳</div>
          <div style={{ fontFamily: serif, fontSize: 26, color: C.forest, letterSpacing: '-0.3px', marginBottom: 10 }}>
            Salamat sa pag-sign up!
          </div>
          <div style={{ fontSize: 14, color: C.ink3, lineHeight: 1.6, maxWidth: 340, margin: '0 auto' }}>
            Ang iyong application bilang Community Partner ay kasalukuyang nire-review ng aming team.
            Aabisuhan ka namin sa loob ng <strong style={{ color: C.ink }}>24 na oras</strong>.
          </div>
        </div>

        {/* Amber info card */}
        <div style={{ background: C.amberSoft, border: `1px solid ${C.amberLine}`, borderRadius: 16, padding: '18px 20px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#92400e', marginBottom: 6 }}>
            Habang hinihintay…
          </div>
          <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.65 }}>
            Maaari mong ibahagi ang iyong referral link sa mga kakilala mong kasambahay. Kapag nag-sign up sila gamit ang iyong code at na-hire, matatanggap mo ang referral fee pagkatapos ma-approve ang iyong account.
          </div>
        </div>

        {/* Referral code card */}
        {referralCode && (
          <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 16, padding: '18px 20px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: C.ink3, marginBottom: 8 }}>
              Ang iyong referral code
            </div>
            <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, color: C.forest, letterSpacing: '2px', marginBottom: 12 }}>
              {referralCode.toUpperCase()}
            </div>
            <div style={{ fontSize: 12, color: C.ink3, lineHeight: 1.5, marginBottom: 12 }}>
              Link: <span style={{ color: C.ink, fontWeight: 600, wordBreak: 'break-all' as const }}>maidit.vercel.app/signup/kasambahay?ref={referralCode}</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`https://maidit.vercel.app/signup/kasambahay?ref=${referralCode}`).catch(() => {})
              }}
              style={{ padding: '10px 18px', borderRadius: 10, background: C.forest, border: 'none', color: '#fff', fontFamily: sans, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              📋 Kopyahin ang Link
            </button>
          </div>
        )}

        {/* Status note */}
        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.amber, flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: C.ink3, lineHeight: 1.5 }}>
            Status: <strong style={{ color: C.amber }}>Pending Review</strong> — ikaw ay aabisuhan sa email kapag na-approve na ang iyong account.
          </div>
        </div>
      </div>
    </div>
  )
}
