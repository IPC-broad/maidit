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

      const ADMIN_EMAILS = ['ruffa_eugenio@yahoo.com', 'ruffa.erodriguez@gmail.com', 'test@maidit.com', 'admin@maidit.com']
      if (ADMIN_EMAILS.includes(user.email ?? '')) {
        router.push('/admin/dashboard')
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
        const { data: partnerRecord } = await supabase
          .from('partners')
          .select('id, approved')
          .eq('profile_id', user.id)
          .maybeSingle()
        if (partnerRecord && !partnerRecord.approved) {
          router.push('/partner/pending')
          return
        }
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
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: '#1877f2',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fbpulse 1.4s ease-in-out infinite',
        boxShadow: '0 0 0 0 rgba(24,119,242,0.4)',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </div>
      <div style={{ fontFamily: serif, fontSize: 18, color: '#1877f2', letterSpacing: '-0.01em' }}>
        Kinokonekta ang Facebook...
      </div>
      <div style={{ fontSize: 14, color: C.ink3 }}>
        Sandali lang. Kinukuha ang iyong impormasyon.
      </div>
      <style>{`@keyframes fbpulse { 0%,100% { box-shadow: 0 0 0 0 rgba(24,119,242,0.4); } 50% { box-shadow: 0 0 0 12px rgba(24,119,242,0); } }`}</style>
    </div>
  )
}
