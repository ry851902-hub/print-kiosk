import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useLocation, useNavigate } from 'react-router-dom'

const API_BASE = 'https://paternal-disorder-viper.ngrok-free.dev'
const SESSION_SECONDS = 120
const DEFAULT_AMOUNT = 20
const PAYMENT_POLL_MS = 2000
const UPI_PAYEE_ID = 'ry851902@ibl'
const DELETED_REDIRECT_MS = 1500

function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export default function PaymentPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const totalAmount = location.state?.amount ?? DEFAULT_AMOUNT
  const sessionEnded = useRef(false)

  const [secondsLeft, setSecondsLeft] = useState(SESSION_SECONDS)
  const [timedOut, setTimedOut] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [fileDeletedNotice, setFileDeletedNotice] = useState(false)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)

  const upiString = `upi://pay?pa=ry851902@ibl&pn=Print%20Kiosk&cu=INR&am=${Number(totalAmount).toFixed(2)}`

  const jobSummary = (() => {
    const { fileName, colorMode, sided, copies } = location.state ?? {}
    const parts = []
    if (fileName) parts.push(fileName)
    if (colorMode) parts.push(colorMode === 'color' ? 'Color' : 'B&W')
    if (sided) parts.push(sided === 'double' ? 'Double-sided' : 'Single-sided')
    if (copies) parts.push(`${copies} cop${copies === 1 ? 'y' : 'ies'}`)
    return parts.length > 0 ? parts.join(' · ') : 'Print job ready'
  })()

  const sessionLocked =
    timedOut || fileDeletedNotice || paymentConfirmed || sessionEnded.current

  useEffect(() => {
    if (sessionLocked) return undefined

    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [sessionLocked])

  useEffect(() => {
    if (secondsLeft !== 0 || timedOut || sessionLocked) return

    setTimedOut(true)
    sessionEnded.current = true
    window.alert(
      'Session timed out for security. Your files have been deleted from memory!',
    )
    navigate('/upload', { replace: true })
  }, [secondsLeft, timedOut, sessionLocked, navigate])

  useEffect(() => {
    if (sessionLocked) return undefined

    const pollPaymentStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/payment-status`)
        if (!response.ok) return

        const data = await response.json()
        if (data.isPaid) {
          sessionEnded.current = true
          setPaymentConfirmed(true)
          navigate('/confirm', { state: location.state, replace: true })
        }
      } catch {
        // Server unreachable — keep polling until session timeout
      }
    }

    const interval = setInterval(pollPaymentStatus, PAYMENT_POLL_MS)
    pollPaymentStatus()

    return () => clearInterval(interval)
  }, [sessionLocked, navigate, location.state])

  const handleCancelConfirm = async () => {
    setShowCancelModal(false)
    sessionEnded.current = true

    try {
      await fetch(`${API_BASE}/api/cancel`, { method: 'POST' })
    } catch {
      // Still return user home if server is unreachable
    }

    setFileDeletedNotice(true)

    setTimeout(() => {
      navigate('/', { replace: true })
    }, DELETED_REDIRECT_MS)
  }

  const timerUrgent = secondsLeft <= 30

  if (fileDeletedNotice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 px-6">
        <p className="text-center text-3xl font-bold text-white">
          File deleted ✓
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center gap-8 px-6 py-10">
        <header className="w-full space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Scan QR to Pay
          </h1>
          <p className="text-xl text-slate-400">{jobSummary}</p>
          <p className="text-3xl font-bold text-emerald-400">
            Amount Due: ₹{totalAmount}
          </p>
        </header>

        <div
          className={`rounded-2xl border-4 px-8 py-4 tabular-nums ${
            timerUrgent
              ? 'border-red-500 bg-red-500/15 text-red-300'
              : 'border-cyan-500/50 bg-slate-800 text-cyan-300'
          }`}
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="text-center text-lg font-medium uppercase tracking-widest text-slate-400">
            Session expires in
          </p>
          <p className="text-center text-6xl font-bold leading-none sm:text-7xl">
            {formatTimer(secondsLeft)}
          </p>
        </div>

        <div className="w-full rounded-3xl bg-white p-8 shadow-2xl shadow-black/40">
          <div className="mx-auto flex max-w-[min(100%,20rem)] flex-col items-center gap-4">
            <QRCodeSVG
              value={upiString}
              size={280}
              level="M"
              includeMargin
              className="h-auto w-full max-w-[280px]"
            />
            <p className="text-center text-lg font-semibold text-slate-700">
              UPI · Kiosk Payment
            </p>
            <p className="break-all text-center text-sm text-slate-500">
              {UPI_PAYEE_ID}
            </p>
            <p className="text-center text-base font-medium leading-snug text-slate-600">
              Demo Mode: Scan with any UPI App (GPay/PhonePe) to pay real amount
              of ₹{totalAmount} directly to bank.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCancelModal(true)}
          className="w-full min-h-[3.5rem] rounded-2xl border-2 border-red-500 bg-transparent px-6 py-4 text-xl font-semibold text-white transition-colors hover:bg-red-500/10 active:scale-[0.99]"
        >
          Cancel
        </button>

        <p className="text-center text-xl text-slate-400">
          Waiting for payment confirmation…
        </p>
      </div>

      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-2xl">
            <h2
              id="cancel-dialog-title"
              className="text-2xl font-bold leading-snug text-white"
            >
              Are you sure you want to cancel? Your uploaded file will be
              permanently deleted.
            </h2>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleCancelConfirm}
                className="min-h-[3.25rem] flex-1 rounded-xl bg-red-600 px-4 py-3 text-lg font-semibold text-white hover:bg-red-500 active:scale-[0.98]"
              >
                Yes, Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="min-h-[3.25rem] flex-1 rounded-xl border-2 border-slate-500 bg-transparent px-4 py-3 text-lg font-semibold text-white hover:bg-slate-800 active:scale-[0.98]"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
