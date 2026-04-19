'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PostJobPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'review'>('form')

  const [form, setForm] = useState({
    salary: '',
    start_date: '',
    urgency: '1-7 days',
    custom_date: '',
    setup: 'Stay-in',
    day_off: 'Every Sunday',
    city: 'Quezon City',
    area: '',
    scope: [] as string[],
    household: { adults: 2, kids: 0 },
    pets: 'No'
  })

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const toggleScope = (s: string) => setForm(f => ({
    ...f,
    scope: f.scope.includes(s)
      ? f.scope.filter(x => x !== s)
      : [...f.scope, s]
  }))

  const handlePost = async () => {
    setLoading(true)
    setError('')

    const { supabase } = await import('../.../../../lib/supabase')
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: hw } = await supabase
      .from('homeowners')
      .select('id')
      .eq('profile_id', user.id)
      .single()

    if (!hw) {
      setError('Homeowner profile not found.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('jobs').insert({
      homeowner_id: hw.id,
      salary: parseInt(form.salary),
      start_date: form.start_date,
      urgency: form.urgency,
      custom_date: form.custom_date,
      setup: form.setup,
      day_off: form.day_off,
      city: form.city,
      area: form.area,
      scope: form.scope,
      household: form.household,
      pets: form.pets,
      active: true
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess(true)
  }

  const inp = {
    width: '100%',
    padding: '11px 13px',
    border: '1.5px solid #e5e7eb',
    borderRadius: '11px',
    fontSize: '.88rem',
    marginBottom: '13px'
  }

  const lbl = {
    fontSize: '.63rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    color: '#6b7280',
    marginBottom: '4px'
  }

  const scopeItems = [
    '🧹 Housekeeping',
    '👶 Yaya',
    '🍳 Cooking',
    '🧺 Laundry',
    '🚗 Driver',
    '👴 Elder Care',
    '🐕 Pet Care',
    '🛒 Pamimili'
  ]

  if (success) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h1>🎉 Job Posted!</h1>
        <button onClick={() => router.push('/dashboard/homeowner')}>
          Back to Dashboard
        </button>
      </div>
    )
  }

  // ✅ REVIEW SCREEN
  if (step === 'review') {
    return (
      <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto' }}>

        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '16px' }}>
          Review your job
        </h1>

        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          background: '#fff'
        }}>

          <div style={{ marginBottom: '10px', fontWeight: 700 }}>
            You’re hiring:
          </div>

          <div style={{ fontSize: '.9rem', lineHeight: 1.6 }}>

            <b>{form.setup}</b> helper in <b>{form.city}</b>
            {form.area && ` (${form.area})`}

            <br /><br />

            <b>Scope:</b><br />
            {form.scope.join(' · ')}

            <br /><br />

            <b>Household:</b><br />
            {form.household.adults} adults · {form.household.kids} kids · {form.pets}

            <br /><br />

            <b>Start:</b><br />
            {form.urgency === 'Custom'
              ? form.custom_date
              : form.urgency}

            <br /><br />

            <b>Salary:</b><br />
            ₱{form.salary}/month

          </div>
        </div>

        <div style={{ fontSize: '.75rem', color: '#6b7280', marginBottom: '12px' }}>
          ✔ Free to post · You only pay when you hire
        </div>

        <button
          onClick={handlePost}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '10px',
            background: '#1a6b3c',
            color: '#fff',
            fontWeight: 700,
            marginBottom: '10px'
          }}
        >
          {loading ? 'Posting...' : 'Post Job & Get Applicants'}
        </button>

        <button
          onClick={() => setStep('form')}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            background: '#fff',
            border: '1.5px solid #e5e7eb',
            color: '#6b7280',
            fontWeight: 600
          }}
        >
          Back to Edit
        </button>

      </div>
    )
  }

  // ✅ FORM SCREEN
  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto' }}>

      <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
        Find a trusted kasambahay
      </h1>

      <p style={{ fontSize: '.8rem', color: '#6b7280', marginBottom: '20px' }}>
        Post in 2 minutes · Get applicants within the day
      </p>

      {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}

      {/* SCOPE */}
      <label style={lbl}>What help do you need?</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {scopeItems.map(s => (
          <button key={s} onClick={() => toggleScope(s)}
            style={{
              padding: '10px',
              borderRadius: '10px',
              border: form.scope.includes(s)
                ? '1.5px solid #1a6b3c'
                : '1.5px solid #e5e7eb',
              background: form.scope.includes(s)
                ? '#e8f5ee'
                : '#fff'
            }}>
            {s}
          </button>
        ))}
      </div>

      {/* HOUSEHOLD */}
      <label style={lbl}>Your home</label>
      <input
        style={inp}
        type="number"
        placeholder="Adults"
        value={form.household.adults}
        onChange={e => setForm(f => ({
          ...f,
          household: { ...f.household, adults: parseInt(e.target.value) }
        }))}
      />

      <input
        style={inp}
        type="number"
        placeholder="Kids"
        value={form.household.kids}
        onChange={e => setForm(f => ({
          ...f,
          household: { ...f.household, kids: parseInt(e.target.value) }
        }))}
      />

      {/* PETS */}
      <label style={lbl}>Pets?</label>
      <select style={inp} value={form.pets} onChange={e => update('pets', e.target.value)}>
        <option>No</option>
        <option>Dog</option>
        <option>Cat</option>
        <option>Multiple</option>
      </select>

      {/* SETUP */}
      <label style={lbl}>Setup</label>
      <select style={inp} value={form.setup} onChange={e => update('setup', e.target.value)}>
        <option>Stay-in</option>
        <option>Stay-out</option>
        <option>Either</option>
      </select>

      {/* LOCATION */}
      <label style={lbl}>City</label>
      <select style={inp} value={form.city} onChange={e => update('city', e.target.value)}>
        <option>Quezon City</option>
        <option>Makati</option>
        <option>Pasig</option>
        <option>Taguig</option>
      </select>

      <label style={lbl}>Area / Barangay</label>
      <input
        style={inp}
        placeholder="e.g. Teachers Village"
        onChange={e => update('area', e.target.value)}
      />

      {/* URGENCY */}
      <label style={lbl}>When do you need help?</label>
      <select style={inp} value={form.urgency} onChange={e => update('urgency', e.target.value)}>
        <option>Now</option>
        <option>1-7 days</option>
        <option>2 weeks</option>
        <option>Flexible</option>
        <option>Custom</option>
      </select>

      {form.urgency === 'Custom' && (
        <input type="date" style={inp} onChange={e => update('custom_date', e.target.value)} />
      )}

      {/* SALARY */}
      <label style={lbl}>Salary</label>
      <input
        style={inp}
        type="number"
        placeholder="₱9000"
        value={form.salary}
        onChange={e => update('salary', e.target.value)}
      />

      <div style={{ fontSize: '.7rem', color: '#9ca3af', marginBottom: '10px' }}>
        Typical: ₱8,000 – ₱15,000
      </div>

      <button
        onClick={() => {
          if (!form.salary) return setError('Please enter salary')
          if (form.scope.length === 0) return setError('Select at least one scope')
          setError('')
          setStep('review')
        }}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '10px',
          background: '#1a6b3c',
          color: '#fff',
          fontWeight: 700
        }}
      >
        Continue
      </button>

    </div>
  )
}