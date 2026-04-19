'use client'

export default function HomeownerEntry() {

  const handleBrowse = () => {
    window.location.href = '/browse'
  }

  const handlePostJob = () => {
    window.location.href = '/dashboard/homeowner/post-job'
  }

  return (
    <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center px-6">
      <div className="w-full max-w-md">

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          How would you like to hire?
        </h1>

        {/* Sub guidance */}
        <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
          Most homeowners choose one of the following.
        </p>

        {/* Options */}
        <div className="space-y-4">

          {/* OPTION 1 */}
          <button
            onClick={handleBrowse}
            className="w-full text-left bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition"
          >
            <div className="text-base font-semibold text-gray-900 mb-1">
              🔍 Choose from Kasambahay Profiles.
            </div>
            <div className="text-sm text-gray-500 leading-relaxed">
              Browse and contact helpers directly. Pay only when you send a job offer.
            </div>
          </button>

          {/* OPTION 2 */}
          <button
            onClick={handlePostJob}
            className="w-full text-left bg-[#1a6b3c] text-white rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition"
          >
            <div className="text-base font-semibold mb-1">
              📝 Post a Job and Receive Applicants.
            </div>
            <div className="text-sm text-white/80 leading-relaxed">
              ₱499 to activate. Includes 1 job listing and up to 10 job offers.
            </div>
          </button>

        </div>

        {/* Guidance bullets */}
        <div className="mt-6 text-sm text-gray-600 space-y-1">
          <p>• Browse if you want more control.</p>
          <p>• Post a job to get applicants faster.</p>
        </div>

        {/* Reassurance */}
        <div className="mt-6 text-center text-sm text-gray-700 font-medium">
          ✔ Pay only when you're ready to hire.
        </div>

      </div>
    </div>
  )
}