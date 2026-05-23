import { useState } from 'react'

const API_BASE = 'https://print-kiosk-server.onrender.com'

export default function AdminPage() {
  const [signalSent, setSignalSent] = useState(false)
  const [authorizing, setAuthorizing] = useState(false)
  const [error, setError] = useState(null)

  const handleAuthorize = async () => {
    setAuthorizing(true)
    setError(null)
    setSignalSent(false)

    try {
      const response = await fetch(`${API_BASE}/api/admin-approve`, {
        method: 'POST',
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || `Approval failed (${response.status})`)
      }

      setSignalSent(true)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not reach the kiosk server on port 5000.'
      setError(message)
    } finally {
      setAuthorizing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-8 px-6 py-10">
        <header className="space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            Operator only
          </p>
          <h1 className="text-3xl font-bold text-white">Kiosk Admin Portal</h1>
          <p className="text-lg text-slate-400">
            Authorize print after UPI payment is confirmed on your bank app.
          </p>
        </header>

        <button
          type="button"
          onClick={handleAuthorize}
          disabled={authorizing}
          className="min-h-[8rem] w-full rounded-3xl border-4 border-emerald-400 bg-emerald-500 px-6 py-8 text-2xl font-bold leading-tight text-slate-950 shadow-xl shadow-emerald-500/40 transition-all hover:bg-emerald-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:text-3xl"
        >
          {authorizing ? 'Sending signal…' : '🟢 AUTHORIZE PRINT JOB'}
        </button>

        {signalSent && (
          <div
            role="status"
            className="flex items-center justify-center gap-3 rounded-2xl border-2 border-emerald-500 bg-emerald-500/15 px-6 py-4"
          >
            <span className="inline-flex h-3 w-3 rounded-full bg-emerald-400" aria-hidden="true" />
            <span className="text-xl font-bold text-emerald-300">
              Signal Sent to Kiosk
            </span>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-center text-lg text-red-300"
          >
            {error}
          </p>
        )}

        <p className="mt-auto text-center text-sm text-slate-600">
          Open this page only on the operator phone — not on the public kiosk screen.
        </p>
      </div>
    </div>
  )
}
