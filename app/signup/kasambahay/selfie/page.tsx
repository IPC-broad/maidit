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
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(() => {
    startCamera()
    return () => { stopCamera() }
  }, [])

  const startCamera = async () => {
    setCameraError(null)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      })
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.setAttribute('muted', '')
        await videoRef.current.play().catch(() => {})
      }
      setStream(mediaStream)
    } catch {
      setCameraError('Hindi ma-access ang camera. Paki-allow ang camera permission sa iyong browser settings.')
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
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    setPhoto(canvas.toDataURL('image/jpeg', 0.85))
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
      const path = `${user.id}/selfie.jpg`

      const { error: uploadError } = await supabase.storage
        .from('Selfies')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('Selfies').getPublicUrl(path)
        await supabase.from('profiles').update({ selfie_url: publicUrl }).eq('id', user.id)
      }
    } catch {
      // best-effort — proceed to dashboard regardless
    }
    router.push('/dashboard/kasambahay')
  }

  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">

        <h1 className="text-xl font-bold text-center mb-2">
          Kumuha ng selfie.
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Ito ay ipapakita sa mga homeowner para makilala ka nila.
        </p>

        {cameraError ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-4 text-center">
            <div className="text-3xl mb-3">📷</div>
            <p className="text-sm text-red-700 mb-4">{cameraError}</p>
            <button
              onClick={startCamera}
              className="bg-[#1a6b3c] text-white px-5 py-2 rounded-xl text-sm font-semibold"
            >
              Subukan Ulit
            </button>
          </div>
        ) : (
          <div className="bg-black rounded-2xl overflow-hidden mb-4">
            {!photo ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
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
        )}

        <canvas ref={canvasRef} className="hidden" />

        {!cameraError && (
          <>
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
                  {uploading ? 'Sine-save...' : 'Gamitin ang picture na ito →'}
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
          </>
        )}

        <p className="text-xs text-gray-400 text-center mt-5">
          Lalagyan ito ng "Selfie Verified" badge sa iyong profile.
        </p>

      </div>
    </div>
  )
}
