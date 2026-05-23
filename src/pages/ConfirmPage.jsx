import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const API_BASE = 'https://print-kiosk-server.onrender.com'
const HOME_REDIRECT_MS = 10000

export default function ConfirmPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const printRequested = useRef(false)

  const [phase, setPhase] = useState('printing')
  const [printError, setPrintError] = useState(null)

  useEffect(() => {
    if (printRequested.current) return undefined
    printRequested.current = true

    const runPrintJob = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/print`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: location.state?.amount,
            fileName: location.state?.fileName,
            colorMode: location.state?.colorMode,
            sided: location.state?.sided,
            copies: location.state?.copies,
            backendFile: location.state?.backendFile,
          }),
        })

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}))
          throw new Error(
            errorBody.error || `Print failed with status ${response.status}`,
          )
        }

        setPhase('success')
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Could not complete print job. Check printer and server.'
        setPrintError(message)
        setPhase('error')
      }
    }

    runPrintJob()
  }, [location.state])

  useEffect(() => {
    if (phase !== 'success') return undefined

    const redirectTimer = setTimeout(() => {
      navigate('/', { replace: true })
    }, HOME_REDIRECT_MS)

    return () => clearTimeout(redirectTimer)
  }, [phase, navigate])

  if (phase === 'printing') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-900 px-6 text-center text-slate-100">
        <div
          className="h-20 w-20 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400"
          aria-hidden="true"
        />
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          Printing your document…
        </h1>
        <p className="max-w-md text-xl text-slate-400">
          Sending your file to the printer. Please wait.
        </p>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-900 px-6 text-center">
        <p className="text-3xl font-bold text-red-400">Print failed</p>
        <p className="max-w-md text-lg text-slate-300" role="alert">
          {printError}
        </p>
        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          className="min-h-[3.5rem] rounded-2xl border-2 border-slate-500 px-8 py-3 text-lg font-semibold text-white hover:bg-slate-800"
        >
          Return to home
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-900 px-6 text-center text-slate-100">
      <div className="flex h-28 w-28 items-center justify-center rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/50">
        <svg
          className="h-16 w-16 text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <p className="max-w-xl text-2xl font-semibold leading-relaxed text-white sm:text-3xl">
        Your document has been printed successfully! Your file has been
        permanently deleted from our system.
      </p>

      <p className="text-lg text-slate-400">Returning to home in 10 seconds…</p>
    </div>
  )
}
