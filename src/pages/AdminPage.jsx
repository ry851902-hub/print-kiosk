import { useState, useEffect } from 'react'

const API_BASE = 'https://print-kiosk-server.onrender.com'
const POLL_INTERVAL = 3000

export default function AdminPage() {
  const [signalSent, setSignalSent] = useState(false)
  const [authorizing, setAuthorizing] = useState(false)
  const [error, setError] = useState(null)
  const [printStatus, setPrintStatus] = useState(null)
  const [sessionInfo, setSessionInfo] = useState(null)

  // Auto poll print status every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/print-status`)
        const data = await res.json()
        setPrintStatus(data.status)
        setSessionInfo(data)

        // Auto refresh when print completes or fails
        if (data.status === 'success' || data.status === 'error') {
          clearInterval(interval)
          setTimeout(() => {
            window.location.reload()
          }, 3000)
        }
      } catch (err) {
        console.log('Polling error:', err)
      }
    }, POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [])

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
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'sans-serif'
    }}>
      <p style={{ color: '#94a3b8', letterSpacing: '0.2em', fontSize: '12px', marginBottom: '1rem' }}>
        OPERATOR ONLY
      </p>

      <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        Kiosk Admin Portal
      </h1>

      <p style={{ color: '#94a3b8', marginBottom: '2rem', textAlign: 'center' }}>
        Authorize print after UPI payment is confirmed on your bank app.
      </p>

      {/* Session Info */}
      {sessionInfo && (
        <div style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '1rem 2rem',
          marginBottom: '1.5rem',
          color: '#94a3b8',
          fontSize: '14px',
          textAlign: 'center',
          width: '100%',
          maxWidth: '400px'
        }}>
          <p>📄 File: <span style={{color:'white'}}>{sessionInfo.fileName || 'No file uploaded'}</span></p>
          <p>💰 Amount: <span style={{color:'white'}}>₹{sessionInfo.amount || '0'}</span></p>
          <p>🖨️ Print Status: <span style={{
            color: sessionInfo.status === 'success' ? '#22c55e' :
                   sessionInfo.status === 'error' ? '#ef4444' :
                   sessionInfo.status === 'printing' ? '#f59e0b' : '#94a3b8'
          }}>{sessionInfo.status || 'waiting'}</span></p>
        </div>
      )}

      {/* Print Status Messages */}
      {printStatus === 'printing' && (
        <div style={{
          background: '#1e3a5f',
          border: '1px solid #3b82f6',
          borderRadius: '12px',
          padding: '1rem 2rem',
          marginBottom: '1.5rem',
          color: '#93c5fd',
          textAlign: 'center'
        }}>
          🖨️ Printing in progress...
        </div>
      )}

      {printStatus === 'success' && (
        <div style={{
          background: '#14532d',
          border: '1px solid #22c55e',
          borderRadius: '12px',
          padding: '1rem 2rem',
          marginBottom: '1.5rem',
          color: '#86efac',
          textAlign: 'center'
        }}>
          ✅ Print successful! File deleted. Page refreshing...
        </div>
      )}

      {printStatus === 'error' && (
        <div style={{
          background: '#450a0a',
          border: '1px solid #ef4444',
          borderRadius: '12px',
          padding: '1rem 2rem',
          marginBottom: '1.5rem',
          color: '#fca5a5',
          textAlign: 'center'
        }}>
          ❌ Print failed! Check printer connection. Page refreshing...
        </div>
      )}

      {/* Authorize Button */}
      <button
        onClick={handleAuthorize}
        disabled={authorizing || signalSent}
        style={{
          background: signalSent ? '#166534' : '#16a34a',
          color: 'black',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          padding: '1.2rem 3rem',
          borderRadius: '16px',
          border: 'none',
          cursor: authorizing || signalSent ? 'not-allowed' : 'pointer',
          width: '100%',
          maxWidth: '400px',
          marginBottom: '1rem'
        }}
      >
        {authorizing ? '⏳ Authorizing...' :
         signalSent ? '✅ Print Authorized!' :
         '🖨️ AUTHORIZE PRINT JOB'}
      </button>

      {/* Error Message */}
      {error && (
        <div style={{
          background: '#450a0a',
          border: '1px solid #ef4444',
          borderRadius: '12px',
          padding: '1rem 2rem',
          color: '#fca5a5',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <p style={{ color: '#475569', fontSize: '12px', marginTop: '2rem', textAlign: 'center' }}>
        Open this page only on the operator phone — not on the public kiosk screen.
      </p>
    </div>
  )
}
