'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const C = {
  forest: '#27500A', forestSoft: '#f0f5ec',
  amber: '#c9943a',
  ink: '#1a1d18', ink3: '#8a8f88',
  paper2: '#faf9f5',
}
const serif = "'Instrument Serif', Georgia, serif"
const sans  = "'Geist', ui-sans-serif, sans-serif"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Completing sign-in…')

  useEffect(() => {
    const handle = async () => {
      const { supabase } = await import('../../../lib/supabase')

      // Exchange code for session (PKCE flow)
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setStatus('Sign-in failed. Redirecting…')
          setTimeout(() => router.push('/login'), 1500)
          return
        }
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      // Save facebook_url to kasambahay row if applicable
      const facebookUrl = user.user_metadata?.full_name
        ? `https://facebook.com/${user.user_metadata?.provider_id}`
        : null

      if (profile?.role === 'kasambahay' && facebookUrl) {
        await supabase
          .from('kasambahay')
          .update({ facebook_url: facebookUrl })
          .eq('profile_id', user.id)
      }

      if (!profile?.role) {
        // New user — send to role chooser
        // Pass facebook data via query params so signup pages can pre-fill
        const fbName = encodeURIComponent(user.user_metadata?.full_name || '')
        const fbEmail = encodeURIComponent(user.email || '')
        const fbUrl = facebookUrl ? encodeURIComponent(facebookUrl) : ''
        router.push(`/signup/choose-role?name=${fbName}&email=${fbEmail}&fb=${fbUrl}`)
        return
      }

      if (profile.role === 'homeowner') {
        const intent = localStorage.getItem('maidit_intent')
        if (intent === 'post_job') {
          localStorage.removeItem('maidit_intent')
          router.push('/dashboard/homeowner/post-job')
          return
        }
        router.push('/dashboard/homeowner')
      } else if (profile.role === 'kasambahay') {
        router.push('/dashboard/kasambahay')
      } else if (profile.role === 'partner') {
        router.push('/dashboard/partner')
      } else {
        router.push('/dashboard/homeowner')
      }
    }

    handle()
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: C.paper2,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: sans, gap: 16,
    }}>
      <div style={{ fontFamily: serif, fontSize: 32, color: C.forest, letterSpacing: '-0.5px' }}>
        Maid<span style={{ color: C.amber }}>It</span>
      </div>
      <div style={{ fontSize: 14, color: C.ink3 }}>{status}</div>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: `3px solid ${C.forestSoft}`,
        borderTopColor: C.forest,
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
