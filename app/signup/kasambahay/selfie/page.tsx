'use client'

import { useRef, useState, useEffect } from 'react'

export default function SelfieCapture() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [photo, setPhoto] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    startCamera()

    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }

      setStream(mediaStream)
    } catch (err) {
      console.error('Camera error:', err)
      alert('Hindi ma-access ang camera. Paki-allow ang camera permission.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas) return

    const context = canvas.getContext('2d')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    if (context) context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = canvas.toDataURL('image/png')
    setPhoto(imageData)

    stopCamera()
  }

  const retake = () => {
    setPhoto(null)
    startCamera()
  }

  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">

        {/* Title */}
        <h1 className="text-xl font-bold text-center mb-2">
          Kumuha ng selfie.
        </h1>

        <p className="text-sm text-gray-500 text-center mb-6">
          Nakatutulong ito para maverify ang pagkakilanlan mo.
        </p>

        {/* Camera / Preview */}
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

        {/* Hidden canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Actions */}
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
              className="w-full bg-[#1a6b3c] text-white py-3 rounded-xl font-semibold"
            >
              Gamitin ang picture na to.
            </button>

            <button
              onClick={retake}
              className="w-full text-sm text-gray-500"
            >
              Ulitin
            </button>
          </div>
        )}

        {/* Trust note */}
        <p className="text-xs text-gray-400 text-center mt-6">
          Lalagyan ito ng “Selfie Verified” badge.
        </p>

      </div>
    </div>
  )
}
