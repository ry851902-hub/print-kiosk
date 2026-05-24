import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import QRCodeSVG from 'qrcode.react'

const API_BASE = 'https://print-kiosk-server.onrender.com'
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
  const [pulseQR, setPulseQR] = useState(false)

  const upiString = `upi://pay?pa=${UPI_PAYEE_ID}&pn=Print%20Kiosk&cu=INR&am=${Number(totalAmount).toFixed(2)}`

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timer)
          if (!sessionEnded.current) {
            sessionEnded.current = true
            setTimedOut(true)
            fetch(`${API_BASE}/api/cancel`, { method: 'POST' }).catch(() => {})
            setTimeout(() => navigate('/'), DELETED_REDIRECT_MS + 2000)
          }
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [navigate])

  useEffect(() => {
    const poll = setInterval(async () => {
      if (sessionEnded.current) { clearInterval(poll); return }
      try {
        const res = await fetch(`${API_BASE}/api/payment-status`)
        const data = await res.json()
        if (data.isPaid) {
          clearInterval(poll)
          sessionEnded.current = true
          setPaymentConfirmed(true)
          setTimeout(() => navigate('/confirm', { state: location.state }), 2000)
        }
      } catch {}
    }, PAYMENT_POLL_MS)
    return () => clearInterval(poll)
  }, [navigate, location.state])

  useEffect(() => {
    const qrPulse = setInterval(() => setPulseQR(p => !p), 2000)
    return () => clearInterval(qrPulse)
  }, [])

  const handleCancel = async () => {
    setShowCancelModal(false)
    sessionEnded.current = true
    try { await fetch(`${API_BASE}/api/cancel`, { method: 'POST' }) } catch {}
    setFileDeletedNotice(true)
    setTimeout(() => navigate('/'), DELETED_REDIRECT_MS)
  }

  const urgentTimer = secondsLeft <= 30

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b3e 50%, #0a0a1a 100%)',
      fontFamily: "'Segoe UI', sans-serif",
      padding: '2rem 1rem',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>

      {/* Background orbs */}
      <div style={{
        position: 'fixed', top: '-20%', right: '-10%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', left: '-10%',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes timerPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 12px rgba(239,68,68,0)} }
        @keyframes qrGlow { 0%,100%{box-shadow:0 0 20px rgba(0,212,255,0.2)} 50%{box-shadow:0 0 40px rgba(0,212,255,0.5), 0 0 60px rgba(139,92,246,0.3)} }
        @keyframes successPop { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes scanLine { 0%{top:0%} 100%{top:100%} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .glass-card {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
        }
        .cancel-btn {
          background: transparent;
          border: 1.5px solid rgba(239,68,68,0.4);
          border-radius: 12px;
          color: rgba(239,68,68,0.8);
          font-size: 0.95rem;
          font-weight: 500;
          padding: 0.8rem 2rem;
          cursor: pointer;
          width: 100%;
          transition: all 0.3s ease;
          margin-top: 1rem;
        }
        .cancel-btn:hover {
          background: rgba(239,68,68,0.1);
          border-color: rgba(239,68,68,0.8);
          color: #ef4444;
        }
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
          animation: fadeInUp 0.2s ease;
        }
      `}</style>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="modal-overlay">
          <div className="glass-card" style={{ padding: '2rem', maxWidth: '360px', width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ color: 'white', margin: '0 0 8px', fontSize: '1.2rem' }}>Cancel Print Job?</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
              Your uploaded file will be <strong style={{ color: '#ef4444' }}>permanently deleted</strong> from our system.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowCancelModal(false)} style={{
                flex: 1, padding: '0.8rem', borderRadius: '10px',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: 'white', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500,
              }}>
                Go Back
              </button>
              <button onClick={handleCancel} style={{
                flex: 1, padding: '0.8rem', borderRadius: '10px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: 'none', color: 'white', cursor: 'pointer',
                fontSize: '0.95rem', fontWeight: 600,
              }}>
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File deleted notice */}
      {fileDeletedNotice && (
        <div className="modal-overlay">
          <div className="glass-card" style={{ padding: '2rem', maxWidth: '320px', width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '1rem', animation: 'successPop 0.5s ease' }}>🗑️</div>
            <p style={{ color: '#22c55e', fontWeight: 600, fontSize: '1.1rem', margin: 0 }}>File Deleted!</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: '6px' }}>Returning to home...</p>
          </div>
        </div>
      )}

      {/* Payment confirmed overlay */}
      {paymentConfirmed && (
        <div className="modal-overlay">
          <div className="glass-card" style={{ padding: '2.5rem', maxWidth: '320px', width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '1rem', animation: 'successPop 0.6s ease' }}>✅</div>
            <h3 style={{ color: '#22c55e', fontSize: '1.3rem', margin: '0 0 8px' }}>Payment Confirmed!</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: 0 }}>Preparing your print job...</p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '440px', width: '100%', animation: 'fadeInUp 0.6s ease' }}>

        {/* Timer */}
        <div style={{
          textAlign: 'center', marginBottom: '1.5rem',
          animation: urgentTimer ? 'timerPulse 1s infinite' : 'none',
        }}>
          <div style={{
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
            background: urgentTimer ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${urgentTimer ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '16px', padding: '12px 24px',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', letterSpacing: '2px', marginBottom: '2px' }}>
              SESSION EXPIRES IN
            </span>
            <span style={{
              fontSize: '2rem', fontWeight: 700,
              color: urgentTimer ? '#ef4444' : '#00d4ff',
              fontFamily: 'monospace',
            }}>
              {timedOut ? '00:00' : formatTimer(secondsLeft)}
            </span>
          </div>
        </div>

        {timedOut ? (
          <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '56px', marginBottom: '1rem' }}>⏰</div>
            <h2 style={{ color: '#ef4444', margin: '0 0 8px' }}>Session Expired</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 1.5rem' }}>
              Your file has been permanently deleted for security.
            </p>
            <button onClick={() => navigate('/')} style={{
              background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
              border: 'none', borderRadius: '12px', color: 'white',
              padding: '0.9rem 2rem', cursor: 'pointer', fontWeight: 600, fontSize: '1rem',
            }}>
              Start Over
            </button>
          </div>
        ) : (
          <>
            {/* Order Summary */}
            <div className="glass-card" style={{ padding: '1.2rem 1.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', margin: '0 0 2px', letterSpacing: '1px' }}>ORDER SUMMARY</p>
                  <p style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>
                    {location.state?.fileName || 'document.pdf'}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: '2px 0 0' }}>
                    {location.state?.colorMode === 'bw' ? 'Black & White' : 'Color'} • {location.state?.copies || 1} {(location.state?.copies || 1) === 1 ? 'copy' : 'copies'} • {location.state?.sided || 'single'}-sided
                  </p>
                </div>
                <div style={{
                  fontSize: '1.6rem', fontWeight: 700,
                  background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  ₹{totalAmount}
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="glass-card" style={{
              padding: '1.5rem',
              marginBottom: '1rem',
              textAlign: 'center',
              animation: 'qrGlow 3s ease-in-out infinite',
            }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', letterSpacing: '2px', margin: '0 0 1rem' }}>
                SCAN TO PAY
              </p>

              {/* QR with scan line effect */}
              <div style={{
                position: 'relative', display: 'inline-block',
                padding: '16px', background: 'white',
                borderRadius: '16px', marginBottom: '1rem',
              }}>
                <QRCodeSVG value={upiString} size={180} />
                <div style={{
                  position: 'absolute', left: '16px', right: '16px',
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
                  animation: 'scanLine 2s linear infinite',
                  opacity: 0.8,
                }} />
              </div>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)',
                borderRadius: '50px', padding: '6px 16px', marginBottom: '8px',
              }}>
                <span style={{ fontSize: '18px' }}>💳</span>
                <span style={{ color: '#00d4ff', fontWeight: 700, fontSize: '1.2rem' }}>Pay ₹{totalAmount}</span>
              </div>

              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: '4px 0 0' }}>
                {UPI_PAYEE_ID}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', margin: '4px 0 0' }}>
                Open GPay, PhonePe or any UPI app
              </p>
            </div>

            {/* Cancel Button */}
            <button className="cancel-btn" onClick={() => setShowCancelModal(true)}>
              ✕ Cancel & Delete File
            </button>
          </>
        )}
      </div>
    </div>
  )
}
