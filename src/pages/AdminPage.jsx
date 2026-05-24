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
      // Step 1 - Approve payment
      const approveRes = await fetch(`${API_BASE}/api/admin-approve`, {
        method: 'POST',
      })

      if (!approveRes.ok) {
        const body = await approveRes.json().catch(() => ({}))
        throw new Error(body.error || `Approval failed (${approveRes.status})`)
      }

      setPrintStatus('authorized')

      // Step 2 - Trigger print
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

      // Auto refresh after 3 seconds
      setTimeout(() => {
        window.location.reload()
      }, 3000)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      setPrintStatus('error')

      // Auto refresh after 3 seconds on error too
      setTimeout(() => {
        window.location.reload()
      }, 3000)
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

      {/* Status Messages */}
      {printStatus === 'authorized' && (
        <div style={{
          background: '#1e3a5f',
          border: '1px solid #3b82f6',
          borderRadius: '12px',
          padding: '1rem 2rem',
          marginBottom: '1.5rem',
          color: '#93c5fd',
          textAlign: 'center',
          width: '100%',
          maxWidth: '400px'
        }}>
          🖨️ Print job authorized! Printing...
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
          textAlign: 'center',
          width: '100%',
          maxWidth: '400px'
        }}>
          ✅ Print successful! File permanently deleted. Refreshing in 3 seconds...
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
          textAlign: 'center',
          width: '100%',
          maxWidth: '400px'
        }}>
          ❌ Print failed! Check printer connection. Refreshing in 3 seconds...
        </div>
      )}

      {/* Authorize Button */}
      <button
        onClick={handleAuthorize}
        disabled={authorizing || printStatus === 'success'}
        style={{
          background: printStatus === 'success' ? '#166534' :
                      authorizing ? '#1e40af' : '#16a34a',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          padding: '1.2rem 3rem',
          borderRadius: '16px',
          border: 'none',
          cursor: authorizing || printStatus === 'success' ? 'not-allowed' : 'pointer',
          width: '100%',
          maxWidth: '400px',
          marginBottom: '1rem'
        }}
      >
        {authorizing ? '⏳ Printing...' :
         printStatus === 'success' ? '✅ Print Done!' :
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
          textAlign: 'center',
          marginTop: '1rem'
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
