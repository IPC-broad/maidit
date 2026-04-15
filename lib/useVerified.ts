'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useRouter } from 'next/navigation'

export function useVerified() {
  const router = useRouter()
  const [verified, setVerified] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const emailVerified = !!user.email_confirmed_at
      const { data: profile } = await supabase
        .from('profiles')
        .select('verified')
        .eq('id', user.id)
        .single()

      const isVerified = emailVerified || profile?.verified === true
      setVerified(isVerified)
      setLoading(false)

      if (!isVerified) router.push('/verify')
    }
    check()
  }, [])

  return { verified, loading }
}
