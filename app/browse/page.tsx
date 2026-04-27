'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function BrowsePage() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/homeowner') }, [])
  return null
}
