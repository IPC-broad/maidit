'use client'

import { useState } from 'react'

export default function BrowsePage() {

  const [showPaywall, setShowPaywall] = useState(false)

  const profiles = [
    {
      name: 'Ana Santos',
      location: 'Quezon City',
      family: 'Single · 2 kids',
      source: 'selfie',
      photo: 'https://randomuser.me/api/portraits/women/44.jpg',
      skills: ['Cleaning', 'Cooking', 'Laundry'],
      exp: '5 years',
      salary: '₱9,000'
    },
    {
      name: 'Rosa Dela Cruz',
      location: 'Batangas',
      family: 'Married · 1 child',
      source: 'partner',
      photo: 'https://randomuser.me/api/portraits/women/68.jpg',
      skills: ['Cleaning', 'Yaya'],
      exp: '8 years',
      salary: '₱8,500'
    }
  ]

  return (
    <div className="min-h-screen bg-[#faf7f2] px-6 py-6">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <h1 className="text-xl font-bold mb-1">
          Browse Kasambahay
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          View profiles for free. Pay only when you send a job offer.
        </p>

        <p className="text-xs text-gray-400 mb-4">
          Showing available helpers near you.
        </p>

        {/* Cards */}
        <div className="space-y-4">

          {profiles.map((p, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border">

              <div className="flex gap-3 mb-3">

                {/* Profile Photo */}
                <div className="relative">
                  <img
                    src={p.photo}
                    alt={p.name}
                    className="w-14 h-14 rounded-full object-cover border"
                  />
                  <div className="absolute -bottom-1 -right-1 text-[10px] px-1.5 py-[2px] rounded bg-white border">
                    {p.source === 'selfie' ? '✔' : '🤝'}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.location}</div>
                  <div className="text-xs text-gray-400">{p.family}</div>

                  <div className={`text-xs font-medium mt-1 ${p.source === 'selfie' ? 'text-green-600' : 'text-blue-600'}`}>
                    {p.source === 'selfie'
                      ? '✔ Selfie Verified'
                      : '✔ Partner Submitted'}
                  </div>
                </div>

                <div className="font-bold text-[#1a6b3c] text-sm">
                  {p.salary}
                </div>

              </div>

              <div className="text-xs text-gray-600 mb-2">
                {p.exp} experience.
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {p.skills.map((s, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {s}
                  </span>
                ))}
              </div>

              <button
                onClick={() => setShowPaywall(true)}
                className="w-full bg-[#1a6b3c] text-white py-2 rounded-lg text-sm font-semibold"
              >
                Send Job Offer
              </button>

            </div>
          ))}

        </div>

        {/* PAYWALL MODAL */}
        {showPaywall && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">

              <h2 className="text-lg font-bold mb-2">
                Start sending job offers.
              </h2>

              <p className="text-sm text-gray-600 mb-4">
                Activate your account for ₱499.
              </p>

              <div className="text-sm text-gray-700 mb-4 space-y-1">
                <p>• Up to 10 job offers.</p>
                <p>• Contact helpers directly.</p>
                <p>• Priority visibility.</p>
              </div>

              <div className="text-xs text-gray-500 mb-4">
                Your ₱499 will be deducted from your final hiring fee.
              </div>

              <div className="text-xs text-gray-600 mb-4">
                ✔ Real-time selfie verification required for all helpers.
              </div>

              <button
                className="w-full bg-[#1a6b3c] text-white py-3 rounded-lg font-semibold mb-2"
              >
                Pay ₱499 and Send Job Offer
              </button>

              <button
                onClick={() => setShowPaywall(false)}
                className="w-full text-sm text-gray-500"
              >
                Cancel
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
