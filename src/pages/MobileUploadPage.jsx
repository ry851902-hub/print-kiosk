import { useState, useRef } from 'react'

const API_BASE = 'https://print-kiosk-server.onrender.com'

export default function MobileUploadPage() {
  const [status, setStatus] = useState('idle')
  const [fileName, setFileName] = useState('')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setFileName(file.name)
    setStatus('uploading')
    setProgress(0)
    setErrorMsg('')

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) { clearInterval(interval); return 90 }
        return prev + 10
      })
    }, 150)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(interval)

      if (!res.ok) throw new Error('Upload failed')

      setProgress(100)
      setStatus('done')

    } catch (err) {
      clearInterval(interval)
      setProgress(0)
      setStatus('error')
      setErrorMsg(err.message || 'Something went wrong, please try again')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b3e 50%, #0a0a1a 100%)',
      fontFamily: "'Segoe UI', sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{
        maxWidth: '360px', width: '100%', textAlign: 'center',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        padding: '2.5rem 1.5rem',
        animation: 'fadeInUp 0.5s ease',
      }}>

        {/* Icon */}
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
          {status === 'idle' && '📱'}
          {status === 'uploading' && '⏳'}
          {status === 'done' && '✅'}
          {status === 'error' && '❌'}
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem',
          background: 'linear-gradient(135deg, #ffffff, #00d4ff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {status === 'idle' && 'Send File to Kiosk'}
          {status === 'uploading' && 'Uploading...'}
          {status === 'done' && 'File Sent!'}
          {status === 'error' && 'Something Went Wrong'}
        </h2>

        {/* Subtitle */}
        <p style={{
          color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem',
          lineHeight: 1.6, marginBottom: '1.8rem',
        }}>
          {status === 'idle' && 'Choose any file from your phone — PDF, photo, anything'}
          {status === 'uploading' && `"${fileName}" is being uploaded to the kiosk...`}
          {status === 'done' && `"${fileName}" successfully sent to the kiosk! Now set print settings on the kiosk screen.`}
          {status === 'error' && errorMsg}
        </p>

        {/* Progress Bar */}
        {status === 'uploading' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '8px', height: '8px', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: '8px',
                background: 'linear-gradient(90deg, #00d4ff, #8b5cf6)',
                width: `${progress}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>
            <p style={{ color: '#00d4ff', fontSize: '0.8rem', marginTop: '6px' }}>
              {progress}%
            </p>
          </div>
        )}

        {/* Button — idle */}
        {status === 'idle' && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current.click()}
              style={{
                background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
                border: 'none', borderRadius: '14px',
                color: 'white', fontSize: '1rem', fontWeight: 600,
                padding: '0.9rem 2rem', cursor: 'pointer', width: '100%',
                marginBottom: '0.75rem',
              }}>
              📁 Choose File
            </button>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', margin: 0 }}>
              PDF, JPG, PNG supported • Max 50MB
            </p>
          </>
        )}

        {/* Success message */}
        {status === 'done' && (
          <div style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: '12px', padding: '12px',
            color: 'rgba(34,197,94,0.9)', fontSize: '0.85rem',
          }}>
            🖨️ Go to the kiosk screen and print!
          </div>
        )}

        {/* Retry button — error */}
        {status === 'error' && (
          <button
            onClick={() => { setStatus('idle'); setErrorMsg('') }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '14px', color: 'white',
              fontSize: '1rem', fontWeight: 600,
              padding: '0.9rem 2rem', cursor: 'pointer', width: '100%',
            }}>
            🔄 Try Again
          </button>
        )}

      </div>
    </div>
  )
}
