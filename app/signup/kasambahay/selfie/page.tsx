'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SelfieCapture() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [photo, setPhoto] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    startCamera()
    return () => { stopCamera() }
  }, [])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      })
      if (videoRef.current) videoRef.current.srcObject = mediaStream
      setStream(mediaStream)
    } catch {
      alert('Hindi ma-access ang camera. Paki-allow ang camera permission.')
    }
  }

  const stopCamera = () => {
    stream?.getTracks().forEach(track => track.stop())
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    setPhoto(canvas.toDataURL('image/png'))
    stopCamera()
  }

  const retake = () => {
    setPhoto(null)
    startCamera()
  }

  const savePhoto = async () => {
    if (!photo) return
    setUploading(true)
    try {
      const { supabase } = await import('../../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const blob = await fetch(photo).then(r => r.blob())
      const path = `${user.id}/selfie.png`

      const { error: uploadError } = await supabase.storage
        .from('selfies')
        .upload(path, blob, { upsert: true, contentType: 'image/png' })

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('selfies').getPublicUrl(path)
        await supabase.from('profiles').update({ selfie_url: publicUrl }).eq('id', user.id)
      }
    } catch {
      // selfie upload is best-effort — proceed to dashboard regardless
    }
    router.push('/dashboard/kasambahay')
  }

  const skip = () => router.push('/dashboard/kasambahay')

  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">

        <h1 className="text-xl font-bold text-center mb-2">
          Kumuha ng selfie.
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Nakatutulong ito para maverify ang pagkakilanlan mo.
        </p>

        <div className="bg-black rounded-2xl overflow-hidden mb-4">
          {!photo ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-[320px] object-cover"
            />
          ) : (
            <img
              src={photo}
              alt="Selfie"
              className="w-full h-[320px] object-cover"
            />
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {!photo ? (
          <button
            onClick={capturePhoto}
            className="w-full bg-[#1a6b3c] text-white py-3 rounded-xl font-semibold"
          >
            Kunan ng Selfie
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={savePhoto}
              disabled={uploading}
              className="w-full bg-[#1a6b3c] text-white py-3 rounded-xl font-semibold disabled:opacity-60"
            >
              {uploading ? 'Sine-save...' : 'Gamitin ang picture na to.'}
            </button>
            <button
              onClick={retake}
              disabled={uploading}
              className="w-full text-sm text-gray-500 py-2"
            >
              Ulitin
            </button>
          </div>
        )}

        <button
          onClick={skip}
          className="w-full text-xs text-gray-400 text-center mt-4 py-2"
        >
          Laktawan — gagawin ko mamaya
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          Lalagyan ito ng "Selfie Verified" badge.
        </p>

      </div>
    </div>
  )
}
