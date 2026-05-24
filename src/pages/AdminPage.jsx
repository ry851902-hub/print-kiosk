import { useState } from 'react'

const API_BASE = 'https://print-kiosk-server.onrender.com'

export default function AdminPage() {
  const [authorizing, setAuthorizing] = useState(false)
  const [error, setError] = useState(null)
  const [printStatus, setPrintStatus] = useState(null)

  const handleAuthorize = async () => {
    setAuthorizing(true)
    setError(null)
    setPrintStatus(null)

    try {
      const approveRes = await fetch(`${API_BASE}/api/admin-approve`, {
        method: 'POST',
      })
      if (!approveRes.ok) {
        const body = await approveRes.json().catch(() => ({}))
        throw new Error(body.error || `Approval failed (${approveRes.status})`)
      }
      setPrintStatus('authorized')

      const printRes = await fetch(`${API_BASE}/api/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!printRes.ok) {
        const body = await printRes.json().catch(() => ({}))
        throw new Error(body.error || `Print failed (${printRes.status})`)
      }

      setPrintStatus('success')
      setTimeout(() => window.location.reload(), 3000)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      setPrintStatus('error')
      setTimeout(() => window.location.reload(), 3000)
    } finally {
      setAuthorizing(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b3e 50%, #0a0a1a 100%)',
      fontFamily: "'Segoe UI', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background orbs */}
      <div style={{
        position: 'fixed', top: '-20%', left: '-10%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', right: '-10%',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes successPop { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(34,197,94,0.3)} 50%{box-shadow:0 0 40px rgba(34,197,94,0.6), 0 0 60px rgba(34,197,94,0.2)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes printAnim {
          0%{transform:translateY(-20px);opacity:0}
          50%{transform:translateY(0);opacity:1}
          100%{transform:translateY(20px);opacity:0}
        }
        .glass-card {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
        }
        .authorize-btn {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border: none;
          border-radius: 16px;
          color: white;
          font-size: 1.2rem;
          font-weight: 700;
          padding: 1.2rem 2rem;
          cursor: pointer;
          width: 100%;
          max-width: 400px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          letter-spacing: 1px;
        }
        .authorize-btn:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(34,197,94,0.4);
          animation: glow 2s infinite;
        }
        .authorize-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .authorize-btn::before {
          content: '';
          position: absolute;
          top: -50%; left: -50%;
          width: 200%; height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
          transform: rotate(45deg);
          transition: all 0.5s;
        }
        .authorize-btn:hover::before {
          left: 100%;
        }
      `}</style>

      <div style={{ maxWidth: '420px', width: '100%', animation: 'fadeInUp 0.6s ease' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '50px', padding: '5px 14px', marginBottom: '1rem',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
            <span style={{ color: '#ef4444', fontSize: '10px', fontWeight: 700, letterSpacing: '2px' }}>
              OPERATOR ONLY
            </span>
          </div>

          <div style={{
            fontSize: '56px', marginBottom: '1rem',
            animation: 'float 3s ease-in-out infinite',
            display: 'block',
          }}>🖨️</div>

          <h1 style={{
            fontSize: '2rem', fontWeight: 700, margin: '0 0 8px',
            background: 'linear-gradient(135deg, #ffffff, #22c55e)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Kiosk Admin Portal
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
            Authorize print after UPI payment is confirmed on your bank app.
          </p>
        </div>

        {/* Instructions */}
        <div className="glass-card" style={{ padding: '1.2rem 1.5rem', marginBottom: '1.5rem' }}>
          {[
            { icon: '💰', text: 'Check UPI payment notification in GPay/PhonePe' },
            { icon: '✅', text: 'Confirm payment amount matches order' },
            { icon: '🖨️', text: 'Click Authorize to start printing' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '8px 0',
              borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>

        {/* Status Messages */}
        {printStatus === 'authorized' && (
          <div style={{
            background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)',
            borderRadius: '14px', padding: '1rem 1.5rem', marginBottom: '1rem',
            display: 'flex', alignItems: 'center', gap: '12px',
            animation: 'fadeInUp 0.3s ease',
          }}>
            <div style={{
              width: '24px', height: '24px', border: '3px solid #00d4ff',
              borderTopColor: 'transparent', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', flexShrink: 0,
            }} />
            <div>
              <p style={{ color: '#00d4ff', fontWeight: 600, margin: '0 0 2px', fontSize: '0.95rem' }}>
                Print Job Authorized!
              </p>
              <p style={{ color: 'rgba(0,212,255,0.6)', fontSize: '0.8rem', margin: 0 }}>
                Sending to printer...
              </p>
            </div>
          </div>
        )}

        {printStatus === 'success' && (
          <div style={{
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.4)',
            borderRadius: '14px', padding: '1.2rem 1.5rem', marginBottom: '1rem',
            textAlign: 'center', animation: 'fadeInUp 0.3s ease',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '8px', animation: 'successPop 0.6s ease' }}>✅</div>
            <p style={{ color: '#22c55e', fontWeight: 700, margin: '0 0 4px', fontSize: '1rem' }}>
              Print Successful!
            </p>
            <p style={{ color: 'rgba(34,197,94,0.7)', fontSize: '0.8rem', margin: '0 0 4px' }}>
              File permanently deleted from memory
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', margin: 0 }}>
              Page refreshing in 3 seconds...
            </p>
          </div>
        )}

        {printStatus === 'error' && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '14px', padding: '1.2rem 1.5rem', marginBottom: '1rem',
            textAlign: 'center', animation: 'fadeInUp 0.3s ease',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '8px', animation: 'successPop 0.6s ease' }}>❌</div>
            <p style={{ color: '#ef4444', fontWeight: 700, margin: '0 0 4px', fontSize: '1rem' }}>
              Print Failed!
            </p>
            <p style={{ color: 'rgba(239,68,68,0.7)', fontSize: '0.8rem', margin: '0 0 4px' }}>
              {error || 'Check printer connection and try again'}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', margin: 0 }}>
              Page refreshing in 3 seconds...
            </p>
          </div>
        )}

        {/* Authorize Button */}
        <button
          className="authorize-btn"
          onClick={handleAuthorize}
          disabled={authorizing || printStatus === 'success'}
        >
          {authorizing
            ? '⏳ Processing...'
            : printStatus === 'success'
            ? '✅ Print Done!'
            : '🖨️ AUTHORIZE PRINT JOB'}
        </button>

        <p style={{
          color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem',
          textAlign: 'center', marginTop: '1.5rem', lineHeight: 1.6,
        }}>
          Open this page only on the operator phone — not on the public kiosk screen.
        </p>
      </div>
    </div>
  )
}
