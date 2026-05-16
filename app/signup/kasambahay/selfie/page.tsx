'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SelfieCapture() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [photo, setPhoto] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [uploading, setUploading] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(true)
  const [validating, setValidating] = useState(false)
  const [faceValid, setFaceValid] = useState<boolean | null>(null)
  const [faceError, setFaceError] = useState<string | null>(null)

  // Pre-load the tiny face detector model as soon as the component mounts so
  // it is ready by the time the user takes a photo.
  useEffect(() => {
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    setIsMobile(mobile)
    if (mobile) startCamera()

    import('face-api.js').then(faceapi => {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights'
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL).catch(() => {})
    }).catch(() => {})

    return () => stopCamera()
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
    validateFace(canvas)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const canvas = canvasRef.current
    if (!canvas) return
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      setPhoto(canvas.toDataURL('image/jpeg', 0.85))
      URL.revokeObjectURL(url)
      validateFace(canvas)
    }
    img.src = url
  }

  const validateFace = async (canvas: HTMLCanvasElement) => {
    setValidating(true)
    setFaceError(null)
    setFaceValid(null)
    try {
      const faceapi = await import('face-api.js')
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights'
      if (!faceapi.nets.tinyFaceDetector.isLoaded) {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
      }
      const detections = await faceapi.detectAllFaces(
        canvas,
        new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 })
      )
      const found = detections.length > 0
      setFaceValid(found)
      if (!found) setFaceError('Hindi malinaw ang mukha. Subukan ulit.')
    } catch {
      // On unexpected error let the user proceed rather than blocking them
      setFaceValid(true)
    }
    setValidating(false)
  }

  const retake = () => {
    setPhoto(null)
    setFaceValid(null)
    setFaceError(null)
    if (isMobile) startCamera()
  }

  const savePhoto = async () => {
    if (!photo) return
    setUploading(true)
    try {
      const { supabase } = await import('../../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('[selfie] No user session — redirecting to login')
        setUploading(false)
        router.push('/login')
        return
      }
      console.log('[selfie] Uploading selfie for user:', user.id)

      const blob = await fetch(photo).then(r => r.blob())
      const path = `${user.id}/selfie.png`

      const { error: uploadError } = await supabase.storage
        .from('Selfies')
        .upload(path, blob, { upsert: true, contentType: 'image/png' })

      console.log('[selfie] Upload result:', uploadError ?? 'success')

      const { data: { publicUrl } } = supabase.storage.from('Selfies').getPublicUrl(path)
      console.log('[selfie] Public URL:', publicUrl)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ selfie_url: publicUrl })
        .eq('id', user.id)
      console.log('[selfie] Profile update result:', updateError ?? 'success')
    } catch (err) {
      console.error('[selfie] Unexpected error:', err)
    }
    setUploading(false)
    router.push('/signup/kasambahay/success')
  }

  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">

        <h1 className="text-xl font-bold text-center mb-2">
          {isMobile ? 'Kumuha ng selfie.' : 'Mag-upload ng litrato.'}
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Ito ay ipapakita sa mga homeowner para makilala ka nila.
        </p>

        <canvas ref={canvasRef} className="hidden" />

        {/* MOBILE: camera flow */}
        {isMobile && (
          <>
            {cameraError ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-4 text-center">
                <div className="text-3xl mb-3">📷</div>
                <p className="text-sm text-red-700 mb-4">{cameraError}</p>
                <button onClick={startCamera} className="bg-[#1a6b3c] text-white px-5 py-2 rounded-xl text-sm font-semibold">
                  Subukan Ulit
                </button>
              </div>
            ) : (
              <div className="bg-black rounded-2xl overflow-hidden mb-4">
                {!photo ? (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-[320px] object-cover" />
                ) : (
                  <img src={photo} alt="Selfie" className="w-full h-[320px] object-cover" />
                )}
              </div>
            )}

            {!cameraError && (
              <>
                {!photo ? (
                  <button onClick={capturePhoto} className="w-full bg-[#1a6b3c] text-white py-3 rounded-xl font-semibold">
                    Kunan ng Selfie
                  </button>
                ) : (
                  <div className="space-y-2">
                    {validating && (
                      <div className="text-center text-sm text-gray-500 py-2">Sinusuri ang mukha...</div>
                    )}
                    {faceError && (
                      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 text-center">
                        {faceError}
                      </div>
                    )}
                    {faceValid && (
                      <button onClick={savePhoto} disabled={uploading} className="w-full bg-[#1a6b3c] text-white py-3 rounded-xl font-semibold disabled:opacity-60">
                        {uploading ? 'Sine-save...' : 'Gamitin ang picture na ito →'}
                      </button>
                    )}
                    <button onClick={retake} disabled={uploading || validating} className="w-full text-sm text-gray-500 py-2 disabled:opacity-60">
                      Ulitin
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* DESKTOP: file upload flow */}
        {!isMobile && (
          <>
            {!photo ? (
              <>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-[#1a6b3c] rounded-2xl p-10 mb-4 text-center cursor-pointer bg-white hover:bg-green-50 transition-colors"
                >
                  <div className="text-4xl mb-3">📷</div>
                  <div className="font-bold text-sm text-[#1a6b3c] mb-1">I-click para pumili ng litrato</div>
                  <div className="text-xs text-gray-400">JPG, PNG o HEIC · Max 10MB</div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              </>
            ) : (
              <>
                <div className="rounded-2xl overflow-hidden mb-4">
                  <img src={photo} alt="Preview" className="w-full h-[320px] object-cover" />
                </div>
                <div className="space-y-2">
                  {validating && (
                    <div className="text-center text-sm text-gray-500 py-2">Sinusuri ang mukha...</div>
                  )}
                  {faceError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 text-center">
                      {faceError}
                    </div>
                  )}
                  {faceValid && (
                    <button onClick={savePhoto} disabled={uploading} className="w-full bg-[#1a6b3c] text-white py-3 rounded-xl font-semibold disabled:opacity-60">
                      {uploading ? 'Sine-save...' : 'Gamitin ang litratong ito →'}
                    </button>
                  )}
                  <button onClick={retake} disabled={uploading || validating} className="w-full text-sm text-gray-500 py-2 disabled:opacity-60">
                    Pumili ng ibang litrato
                  </button>
                </div>
              </>
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
