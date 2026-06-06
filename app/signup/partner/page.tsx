'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { provinces } from '../../../lib/ph-locations'

const C = {
  forest: '#27500A', forestDeep: '#1c3b07', forestSoft: '#f0f5ec', forestLine: '#e2ecdb',
  amber: '#c9943a', amberSoft: '#fbf3e2', amberLine: '#efe1bf', amberDeep: '#8a6418',
  ink: '#1a1d18', ink2: '#4a504a', ink3: '#8a8f88', ink4: '#b8bcb5',
  paper: '#ffffff', paper2: '#faf9f5', line: '#ebe9e2',
}
const serif = "'Instrument Serif', Georgia, serif"
const sans  = "'Geist', ui-sans-serif, sans-serif"

const FacebookIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

export default function PartnerSignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fbLoading, setFbLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPass, setShowPass] = useState(false)

  // Selfie camera
  const [selfieData, setSelfieData] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [faceApiReady, setFaceApiReady] = useState(false)
  const [faceStatus, setFaceStatus] = useState<'loading' | 'no_face' | 'face_ok' | 'multi_face' | 'unavailable'>('loading')
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const detectionInterval = useRef<NodeJS.Timeout | null>(null)
  const [referringPartnerCode, setReferringPartnerCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const ref = new URLSearchParams(window.location.search).get('ref')
      return ref ? ref.toUpperCase() : ''
    }
    return ''
  })
  const isGoldReferral = referringPartnerCode.length > 0

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    mobile: '',
    password: '',
    province: '',
    city: '',
    barangay: '',
    estimated_referrals: '1-5',
  })

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Geist:wght@400;500;600;700&display=swap'
    document.head.appendChild(link)
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref) setReferringPartnerCode(ref.toUpperCase())
    return () => { document.head.removeChild(link) }
  }, [])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = '/face-api.min.js'
    script.onload = async () => {
      try {
        const faceapi = (window as any).faceapi
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
        setFaceApiReady(true)
      } catch {
        setFaceStatus('unavailable')
      }
    }
    script.onerror = () => setFaceStatus('unavailable')
    document.head.appendChild(script)
    return () => { try { document.head.removeChild(script) } catch {} }
  }, [])

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    }
  }, [stream, cameraActive])

  useEffect(() => {
    if (!faceApiReady || !stream || selfieData) {
      if (detectionInterval.current) clearInterval(detectionInterval.current)
      return
    }
    const faceapi = (window as any).faceapi
    detectionInterval.current = setInterval(async () => {
      const video = videoRef.current
      if (!video || video.readyState < 2) return
      try {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        if (detections.length === 0) setFaceStatus('no_face')
        else if (detections.length === 1) setFaceStatus('face_ok')
        else setFaceStatus('multi_face')
      } catch {}
    }, 1000)
    return () => { if (detectionInterval.current) clearInterval(detectionInterval.current) }
  }, [faceApiReady, stream, selfieData])

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      setStream(s)
      setCameraActive(true)
    } catch {
      setFaceStatus('unavailable')
    }
  }

  const capturePhoto = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    setSelfieData(canvas.toDataURL('image/jpeg', 0.8))
    stream?.getTracks().forEach(t => t.stop())
    setStream(null)
  }

  const handleProvinceChange = (prov: string) => {
    const cities = (provinces as Record<string, string[]>)[prov] || []
    setForm(f => ({ ...f, province: prov, city: cities[0] || '', barangay: '' }))
  }

  const handleSignup = async () => {
    if (!form.first_name || !form.last_name || !form.mobile || !form.password) {
      setError('Punan ang lahat ng required fields.')
      return
    }
    if (form.mobile.length < 10) { setError('Ilagay ang tamang cellphone number.'); return }
    if (form.password.length < 8) { setError('Ang password ay dapat hindi bababa sa 8 characters.'); return }
    if (!form.province || !form.city) { setError('Piliin ang iyong probinsya at lungsod.'); return }
    if (!selfieData) { setError('Kailangan ang selfie bago mag-sign up.'); return }

    setLoading(true)
    setError('')

    const { supabase } = await import('../../../lib/supabase')

    const mobile = form.mobile.replace(/\D/g, '').slice(0, 11)
    const partnerEmail = `partner_${mobile}@maidit.app`

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: partnerEmail,
      password: form.password,
    })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    const userId = data.user?.id
    const fullName = `${form.first_name.trim()} ${form.last_name.trim()}`

    const refCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    await supabase.from('profiles').insert({
      id: userId,
      role: 'partner',
      full_name: fullName,
      mobile: mobile,
      city: form.city,
    })

    const { data: newPartner } = await supabase.from('partners').insert({
      profile_id: userId,
      referral_code: refCode,
      province: form.province,
      city: form.city,
      barangay: form.barangay,
      estimated_referrals: form.estimated_referrals,
    }).select('id').single()

    if (referringPartnerCode && newPartner) {
      const { data: referrer } = await supabase
        .from('partners').select('id').eq('referral_code', referringPartnerCode).single()
      if (referrer) {
        await supabase.from('partners').update({ referred_by_partner_id: referrer.id }).eq('id', newPartner.id)
      }
    }

    if (selfieData && userId) {
      try {
        const blob = await fetch(selfieData).then(r => r.blob())
        const { data: upload } = await supabase.storage
          .from('uploads')
          .upload(`partner-selfies/${userId}.jpg`, blob, { contentType: 'image/jpeg', upsert: true })
        if (upload) {
          const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(`partner-selfies/${userId}.jpg`)
          await supabase.from('profiles').update({ selfie_url: publicUrl }).eq('id', userId)
        }
      } catch {}
    }

    setLoading(false)
    setSuccess(true)
  }

  const handleFacebookSignup = async () => {
    setFbLoading(true)
    setError('')
    const { supabase } = await import('../../../lib/supabase')
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (oauthError) { setError(oauthError.message); setFbLoading(false) }
  }

  const inputStyle: React.CSSProperties = {
    height: 48,
    border: `1.5px solid ${C.line}`,
    borderRadius: 12,
    padding: '0 14px',
    fontSize: 15,
    fontFamily: sans,
    color: C.ink,
    background: C.paper,
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
    color: C.ink3,
    marginBottom: 6,
    display: 'block',
    fontFamily: sans,
  }

  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column' as const,
    marginBottom: 14,
  }

  if (success) {
    router.push('/partner/pending')
    return null
  }

  const provinceList = Object.keys(provinces as Record<string, string[]>).sort()
  const cityList = (provinces as Record<string, string[]>)[form.province] || []

  return (
    <div style={{ minHeight: '100vh', background: C.paper2, fontFamily: sans, color: C.ink }}>
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: `1px solid ${C.line}`, background: C.paper }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.ink, padding: '0 4px 0 0', lineHeight: 1 }}
          aria-label="Back"
        >
          ←
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, fontFamily: sans, color: C.ink }}>Partner Sign Up</span>
      </div>

      {/* Content */}
      <div style={{ padding: '0 18px 40px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', padding: '28px 0 18px' }}>
          <span style={{ fontFamily: serif, fontSize: 32, color: C.forestDeep, letterSpacing: '-0.01em' }}>
            Maid<span style={{ color: C.amber }}>It</span>
          </span>
        </div>

        {/* Earning Cards — hidden when signing up via a gold referral link */}
        {!isGoldReferral && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              {/* Card 1 — White */}
              <div style={{ flex: 1, background: C.paper, border: `1.5px solid ${C.line}`, borderRadius: 16, padding: '16px 14px' }}>
                <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.ink3, fontFamily: sans, marginBottom: 4 }}>
                  REFERRAL FEE
                </div>
                <div style={{ fontFamily: serif, fontSize: 36, color: C.forestDeep, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 4 }}>
                  ₱500
                </div>
                <div style={{ fontSize: 11, color: C.ink3, fontFamily: sans, marginBottom: 2 }}>per kasambahay hired</div>
                <div style={{ fontSize: 11, color: C.ink3, fontFamily: sans }}>Per each successful hire</div>
              </div>

              {/* Card 2 — Amber */}
              <div style={{ flex: 1, background: C.amberSoft, border: `1.5px solid ${C.amberLine}`, borderRadius: 16, padding: '16px 14px' }}>
                <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.amberDeep, fontFamily: sans, marginBottom: 4 }}>
                  + BONUS
                </div>
                <div style={{ fontFamily: serif, fontSize: 36, color: C.amberDeep, lineHeight: 1.1, marginBottom: 4 }}>
                  +₱500
                </div>
                <div style={{ fontSize: 11, color: C.amberDeep, fontFamily: sans, fontWeight: 700, marginBottom: 2 }}>Transport Bonus</div>
                <div style={{ fontSize: 11, color: C.amberDeep, fontFamily: sans, opacity: 0.75 }}>Leyte / Samar / Bicol only</div>
              </div>
            </div>

            <div style={{ fontSize: 11, color: C.ink3, textAlign: 'center', marginTop: 8, marginBottom: 20, fontFamily: sans }}>
              Referral code shown on your dashboard after signup.
            </div>
          </>
        )}

        {/* Form Card */}
        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 18, padding: '20px 18px' }}>
          {/* Pangalan + Apelyido */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle}>Pangalan</label>
              <input
                style={inputStyle}
                type="text"
                value={form.first_name}
                onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                placeholder="Juan"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle}>Apelyido</label>
              <input
                style={inputStyle}
                type="text"
                value={form.last_name}
                onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                placeholder="dela Cruz"
              />
            </div>
          </div>

          {/* Cellphone */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Cellphone</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                borderRight: `1.5px solid ${C.line}`,
                fontSize: 14,
                color: C.ink2,
                fontFamily: sans,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}>
                🇵🇭 +63
              </div>
              <input
                style={{ ...inputStyle, paddingLeft: 82 }}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.mobile}
                onChange={e => setForm(f => ({ ...f, mobile: e.target.value.replace(/\D/g, '') }))}
                placeholder="9XX XXX XXXX"
              />
            </div>
          </div>

          {/* Password */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                style={{ ...inputStyle, paddingRight: 60 }}
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Minimum 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute',
                  right: 14,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: C.ink3,
                  fontFamily: sans,
                  padding: 0,
                }}
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Province */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Probinsya</label>
            <select
              style={{ ...inputStyle, appearance: 'none' as const, cursor: 'pointer' }}
              value={form.province}
              onChange={e => handleProvinceChange(e.target.value)}
            >
              <option value="">Piliin ang probinsya</option>
              {provinceList.map(prov => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>

          {/* City */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Lungsod / Munisipalidad</label>
            <select
              style={{ ...inputStyle, appearance: 'none' as const, cursor: form.province ? 'pointer' : 'not-allowed', opacity: form.province ? 1 : 0.5 }}
              value={form.city}
              onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              disabled={!form.province}
            >
              <option value="">Piliin ang lungsod</option>
              {cityList.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Barangay */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Barangay</label>
            <input
              style={inputStyle}
              type="text"
              value={form.barangay}
              onChange={e => setForm(f => ({ ...f, barangay: e.target.value }))}
              placeholder="Ilagay ang iyong barangay"
            />
          </div>

          {/* Estimated Referrals */}
          <div style={{ ...fieldStyle, marginBottom: 0 }}>
            <label style={labelStyle}>Ilan ang maari mong i-refer per month?</label>
            <select
              style={{ ...inputStyle, appearance: 'none' as const, cursor: 'pointer' }}
              value={form.estimated_referrals}
              onChange={e => setForm(f => ({ ...f, estimated_referrals: e.target.value }))}
            >
              <option value="1-5">1-5</option>
              <option value="6-10">6-10</option>
              <option value="11-20">11-20</option>
              <option value="21-50">21-50</option>
              <option value="51+">51+</option>
            </select>
          </div>
        </div>

        {/* Selfie section */}
        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 18, padding: '16px 18px', marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: C.ink3, marginBottom: 4, fontFamily: sans }}>
            Selfie <span style={{ color: '#dc2626' }}>(Required)</span>
          </div>
          <p style={{ fontSize: 13, color: C.ink3, marginBottom: 12, fontFamily: sans }}>
            Para ma-verify ang iyong pagkakakilanlan.
          </p>

          {!cameraActive && !selfieData && (
            <button onClick={startCamera}
              style={{ width: '100%', padding: '13px', background: C.forest, color: C.paper, borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 700, fontFamily: sans, cursor: 'pointer' }}>
              📷 Buksan ang Camera
            </button>
          )}

          {cameraActive && !selfieData && (
            <div>
              <video ref={videoRef} autoPlay playsInline muted
                style={{ width: '100%', borderRadius: 12, background: '#000', maxHeight: 280, objectFit: 'cover' as const }} />
              <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 12, fontWeight: 600, fontFamily: sans,
                color: faceStatus === 'face_ok' ? '#27a040' : faceStatus === 'no_face' ? '#cc3333' : faceStatus === 'multi_face' ? C.amber : C.ink3 }}>
                {faceStatus === 'loading' && '⏳ Ino-load ang face detection...'}
                {faceStatus === 'no_face' && '❌ Hindi nakita ang mukha mo. Harapin ang camera.'}
                {faceStatus === 'face_ok' && '✓ Nakita ang mukha mo — handa na!'}
                {faceStatus === 'multi_face' && '⚠️ Isa lang dapat makita sa camera.'}
                {faceStatus === 'unavailable' && '📷 Maaaring kumuha ng litrato'}
              </div>
              <button
                onClick={capturePhoto}
                disabled={faceStatus !== 'face_ok' && faceStatus !== 'unavailable'}
                style={{ width: '100%', padding: '13px',
                  background: (faceStatus === 'face_ok' || faceStatus === 'unavailable') ? C.forest : '#ccc',
                  color: C.paper, borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 700, fontFamily: sans,
                  cursor: (faceStatus === 'face_ok' || faceStatus === 'unavailable') ? 'pointer' : 'not-allowed',
                  marginTop: 8 }}>
                📸 Kumuha ng Selfie
              </button>
            </div>
          )}

          {selfieData && (
            <div style={{ textAlign: 'center' as const }}>
              <img src={selfieData} alt="selfie"
                style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover' as const, border: `3px solid ${C.forest}` }} />
              <div style={{ color: '#27a040', fontWeight: 600, marginTop: 8, fontSize: 13, fontFamily: sans }}>✓ Selfie na-kuha!</div>
              <button
                onClick={() => { setSelfieData(null); setCameraActive(false); setFaceStatus('loading') }}
                style={{ marginTop: 6, background: 'none', border: 'none', color: C.amber, fontSize: 12, cursor: 'pointer', fontWeight: 600, fontFamily: sans }}>
                Ulitin
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error ? (
          <div style={{ marginTop: 14, padding: '12px 14px', background: '#fff0f0', border: '1px solid #ffc4c4', borderRadius: 10, fontSize: 13, color: '#c0392b', fontFamily: sans }}>
            {error}
          </div>
        ) : null}

        {/* Primary Button */}
        <button
          onClick={handleSignup}
          disabled={loading}
          style={{
            width: '100%',
            height: 52,
            background: loading ? C.ink4 : C.forest,
            color: C.paper,
            border: 'none',
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 700,
            fontFamily: sans,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: 18,
          }}
        >
          {loading ? 'Sandali lang...' : 'Mag-sign up →'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0', color: C.ink4, fontSize: 13, fontFamily: sans }}>
          <div style={{ flex: 1, height: 1, background: C.line }} />
          <span>— o kaya —</span>
          <div style={{ flex: 1, height: 1, background: C.line }} />
        </div>

        {/* Facebook Button */}
        <button
          onClick={handleFacebookSignup}
          disabled={fbLoading}
          style={{
            width: '100%',
            height: 48,
            background: fbLoading ? '#5a9fd8' : '#1877f2',
            color: C.paper,
            border: 'none',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 600,
            fontFamily: sans,
            cursor: fbLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <FacebookIcon />
          {fbLoading ? 'Sandali lang...' : 'Mag-sign up gamit ang Facebook'}
        </button>

        {/* Login Link */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: C.ink3, fontFamily: sans }}>
          Mayroon nang account?{' '}
          <span
            onClick={() => router.push('/login')}
            style={{ color: C.forest, fontWeight: 600, cursor: 'pointer' }}
          >
            Mag-sign in
          </span>
        </div>
      </div>
    </div>
  )
}
