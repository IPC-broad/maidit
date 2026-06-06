'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type FaceStatus = 'loading' | 'no_face' | 'face_ok' | 'multi_face' | 'unavailable'

export default function SelfieCapture() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const detectionInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const [photo, setPhoto] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [uploading, setUploading] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(true)
  const [faceStatus, setFaceStatus] = useState<FaceStatus>('loading')
  const [faceApiReady, setFaceApiReady] = useState(false)
  const [debugLogs, setDebugLogs] = useState<string[]>([])

  const showDebug = typeof window !== 'undefined' && window.location.search.includes('debug=1')

  const log = (msg: string) => {
    console.log(msg)
    setDebugLogs(prev => [...prev.slice(-10), msg])
  }

  // Load face-api.js locally and initialise the tiny face detector model
  useEffect(() => {
    const script = document.createElement('script')
    script.src = '/face-api.min.js'
    script.onload = async () => {
      try {
        const faceapi = (window as any).faceapi
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
        setFaceApiReady(true)
      } catch (e) {
        log(`[face-api] model load error: ${e}`)
        setFaceStatus('unavailable')
      }
    }
    script.onerror = () => {
      log('[face-api] script failed to load')
      setFaceStatus('unavailable')
    }
    document.head.appendChild(script)
    return () => { try { document.head.removeChild(script) } catch {} }
  }, [])

  // Run face detection every second once both camera stream and model are ready
  useEffect(() => {
    if (!faceApiReady || !stream || photo) {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current)
        detectionInterval.current = null
      }
      return
    }

    const faceapi = (window as any).faceapi

    detectionInterval.current = setInterval(async () => {
      const video = videoRef.current
      if (!video || video.readyState < 2) return
      try {
        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions()
        )
        if (detections.length === 0) setFaceStatus('no_face')
        else if (detections.length === 1) setFaceStatus('face_ok')
        else setFaceStatus('multi_face')
      } catch (e) {
        log(`[face-api] detection error: ${e}`)
      }
    }, 1000)

    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current)
        detectionInterval.current = null
      }
    }
  }, [faceApiReady, stream, photo])

  useEffect(() => {
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    setIsMobile(mobile)
    if (mobile) startCamera()
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
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current)
      detectionInterval.current = null
    }
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
    }
    img.src = url
  }

  const retake = () => {
    setPhoto(null)
    if (isMobile) {
      setFaceStatus(faceApiReady ? 'no_face' : 'loading')
      startCamera()
    }
  }

  const savePhoto = async () => {
    if (!photo) return
    setUploading(true)
    try {
      const { supabase } = await import('../../../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        log('[selfie] No user session — redirecting to login')
        setUploading(false)
        router.push('/login')
        return
      }
      log(`[selfie] Uploading selfie for user: ${user.id}`)

      const blob = await fetch(photo).then(r => r.blob())
      const path = `${user.id}/selfie.png`

      const { error: uploadError } = await supabase.storage
        .from('Selfies')
        .upload(path, blob, { upsert: true, contentType: 'image/png' })

      log(`[selfie] Upload result: ${uploadError ?? 'success'}`)

      const { data: { publicUrl } } = supabase.storage.from('Selfies').getPublicUrl(path)
      log(`[selfie] Public URL: ${publicUrl}`)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ selfie_url: publicUrl })
        .eq('id', user.id)
      log(`[selfie] Profile update result: ${updateError ?? 'success'}`)
    } catch (err) {
      console.error('[selfie] Unexpected error:', err)
    }
    setUploading(false)
    router.push('/signup/kasambahay/success')
  }

  // Capture is allowed when exactly 1 face detected, or when face-api unavailable (fallback)
  const captureAllowed = faceStatus === 'face_ok' || faceStatus === 'unavailable'

  const faceStatusUI: Record<FaceStatus, { bg: string; text: string; msg: string }> = {
    loading:     { bg: 'bg-gray-50',   text: 'text-gray-500',   msg: 'Naglo-load ng face detection…' },
    no_face:     { bg: 'bg-red-50',    text: 'text-red-700',    msg: 'Hindi nakita ang mukha mo. Siguraduhing nakaharap ka sa camera.' },
    face_ok:     { bg: 'bg-green-50',  text: 'text-green-700',  msg: 'Nakita ang mukha mo ✓ Handa na para kumuha ng litrato.' },
    multi_face:  { bg: 'bg-amber-50',  text: 'text-amber-700',  msg: 'Isa lang dapat makita sa camera.' },
    unavailable: { bg: 'bg-gray-50',   text: 'text-gray-500',   msg: 'Face verification unavailable. Admin will review manually.' },
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
              <div className="bg-black rounded-2xl overflow-hidden mb-3">
                {!photo ? (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-[320px] object-cover" />
                ) : (
                  <img src={photo} alt="Selfie" className="w-full h-[320px] object-cover" />
                )}
              </div>
            )}

            {/* Face detection status — shown only when camera is live */}
            {!cameraError && !photo && (
              <div className={`text-center text-sm font-semibold py-2 px-4 rounded-xl mb-3 ${faceStatusUI[faceStatus].bg} ${faceStatusUI[faceStatus].text}`}>
                {faceStatusUI[faceStatus].msg}
              </div>
            )}

            {(process.env.NODE_ENV === 'development' || showDebug) && (
              <div style={{background:'#111',color:'#0f0',padding:'8px',fontSize:'10px',fontFamily:'monospace',marginTop:'8px',borderRadius:'8px',maxHeight:'100px',overflow:'auto'}}>
                {debugLogs.map((l, i) => <div key={i}>{l}</div>)}
              </div>
            )}

            {!cameraError && (
              <>
                {!photo ? (
                  <button
                    onClick={capturePhoto}
                    disabled={!captureAllowed}
                    className="w-full bg-[#1a6b3c] text-white py-3 rounded-xl font-semibold disabled:opacity-40"
                  >
                    Kunan ng Selfie
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button onClick={savePhoto} disabled={uploading} className="w-full bg-[#1a6b3c] text-white py-3 rounded-xl font-semibold disabled:opacity-60">
                      {uploading ? 'Sine-save...' : 'Gamitin ang picture na ito →'}
                    </button>
                    <button onClick={retake} disabled={uploading} className="w-full text-sm text-gray-500 py-2 disabled:opacity-60">
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
                  <button onClick={savePhoto} disabled={uploading} className="w-full bg-[#1a6b3c] text-white py-3 rounded-xl font-semibold disabled:opacity-60">
                    {uploading ? 'Sine-save...' : 'Gamitin ang litratong ito →'}
                  </button>
                  <button onClick={retake} disabled={uploading} className="w-full text-sm text-gray-500 py-2 disabled:opacity-60">
                    Pumili ng ibang litrato
                  </button>
                </div>
              </>
            )}
          </>
        )}

        <p className="text-xs text-gray-400 text-center mt-5">
          Ang iyong selfie ay nai-upload na. Ire-review ng MaidIt team sa loob ng 24 oras.
        </p>

      </div>
    </div>
  )
}
