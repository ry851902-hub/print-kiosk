import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'

const API_BASE = 'https://print-kiosk-server.onrender.com'
const BW_PRICE = 2
const COLOR_PRICE = 10
const DEFAULT_PAGE_COUNT = 1

export default function UploadPage() {
  const navigate = useNavigate()
  const [colorMode, setColorMode] = useState('bw')
  const [sided, setSided] = useState('single')
  const [copies, setCopies] = useState(1)
  const [fileReceived, setFileReceived] = useState(false)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [uploading, setUploading] = useState(false)

  const pricePerPage = colorMode === 'bw' ? BW_PRICE : COLOR_PRICE
  const total = useMemo(() => pageCount * copies * pricePerPage, [pageCount, copies, pricePerPage])

  // Poll server every 3 seconds to check if mobile uploaded a file
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`)
        const data = await res.json()
        if (data.fileInMemory && data.meta) {
          setFileReceived(true)
        setFileName(data.meta.originalname || 'Unknown file')
setFileSize(data.meta.size || 0)
setPageCount(data.meta.pageCount || 1)
        } else {
          setFileReceived(false)
          setFileName('')
          setFileSize(0)
        }
      } catch (err) {
        // server unreachable
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleProceed = async () => {
    setUploading(true)
    setTimeout(() => {
      navigate('/payment', {
        state: {
          fileName,
          fileSize,
          colorMode,
          sided,
          copies,
          amount: total,
          pageCount,
          backendFile: { originalname: fileName, size: fileSize },
        },
      })
    }, 500)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b3e 50%, #0a0a1a 100%)',
      fontFamily: "'Segoe UI', sans-serif",
      padding: '2rem 1rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'fixed', top: '-20%', left: '-10%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
        animation: 'pulse1 6s ease-in-out infinite',
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', right: '-10%',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
        animation: 'pulse2 8s ease-in-out infinite',
      }} />

      <style>{`
        @keyframes pulse1 { 0%,100%{transform:scale(1) translate(0,0)} 50%{transform:scale(1.1) translate(20px,20px)} }
        @keyframes pulse2 { 0%,100%{transform:scale(1) translate(0,0)} 50%{transform:scale(1.15) translate(-20px,-20px)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes ping { 0%{transform:scale(1);opacity:1} 75%,100%{transform:scale(2);opacity:0} }
        .btn-primary {
          background: linear-gradient(135deg, #00d4ff, #8b5cf6);
          border: none; border-radius: 14px;
          color: white; font-size: 1.1rem; font-weight: 600;
          padding: 1rem 2rem; cursor: pointer; width: 100%;
          transition: all 0.3s ease;
        }
        .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,212,255,0.3); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .option-btn {
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 10px; color: rgba(255,255,255,0.7);
          font-size: 0.9rem; font-weight: 500;
          padding: 0.7rem 1rem; cursor: pointer; flex: 1;
          transition: all 0.2s ease;
        }
        .option-btn.active {
          background: linear-gradient(135deg, rgba(0,212,255,0.2), rgba(139,92,246,0.2));
          border-color: #00d4ff; color: white;
          box-shadow: 0 0 15px rgba(0,212,255,0.2);
        }
        .option-btn:hover { border-color: rgba(0,212,255,0.5); color: white; }
        .glass-card {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
        }
      `}</style>

      <div style={{ maxWidth: '520px', margin: '0 auto', animation: 'fadeInUp 0.6s ease' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)',
            borderRadius: '50px', padding: '6px 16px', marginBottom: '1rem',
          }}>
            <span style={{ fontSize: '10px', color: '#00d4ff', fontWeight: 600, letterSpacing: '2px' }}>
              SELF-SERVICE PRINT KIOSK
            </span>
          </div>
          <h1 style={{
            fontSize: '2.8rem', fontWeight: 800, margin: 0,
            background: 'linear-gradient(135deg, #ffffff 0%, #00d4ff 50%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px', lineHeight: 1.1,
          }}>
            Upload & Print
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', marginTop: '6px' }}>
            Fast, secure, zero data retention
          </p>
        </div>

        {/* QR Code Section */}
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.2rem', textAlign: 'center' }}>
          <p style={{
            color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem',
            fontWeight: 600, letterSpacing: '1px',
            marginBottom: '1rem', marginTop: 0
          }}>
            📱 SEND FILE FROM YOUR PHONE
          </p>
          <div style={{
            display: 'inline-block', padding: '12px',
            background: 'white', borderRadius: '16px',
          }}>
            <QRCodeSVG
              value={`${window.location.origin}/mobile-upload`}
              size={150}
            />
          </div>
          <p style={{
            color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem',
            marginTop: '0.75rem', marginBottom: 0
          }}>
            Scan QR → choose your file → it will appear on kiosk automatically
          </p>
        </div>

        {/* File Received Status */}
        {!fileReceived ? (
          <div className="glass-card" style={{
            padding: '1.5rem', marginBottom: '1.2rem', textAlign: 'center'
          }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%',
                background: '#f59e0b', margin: '0 auto',
              }} />
              <div style={{
                position: 'absolute', top: 0, left: 0,
                width: '16px', height: '16px', borderRadius: '50%',
                background: '#f59e0b', animation: 'ping 1.5s ease-in-out infinite',
              }} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: 0 }}>
              Waiting for file from phone...
            </p>
          </div>
        ) : (
          <div className="glass-card" style={{
            padding: '1.5rem', marginBottom: '1.2rem',
            border: '1px solid rgba(34,197,94,0.4)',
            animation: 'fadeInUp 0.4s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(0,212,255,0.2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '26px',
              }}>
                📄
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{ color: 'white', fontWeight: 600, margin: '0 0 4px', fontSize: '0.95rem' }}>
                  {fileName}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: 0 }}>
                  {formatFileSize(fileSize)} • Ready to print
                </p>
              </div>
              <div style={{
                background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)',
                borderRadius: '8px', padding: '4px 10px',
              }}>
                <span style={{ color: 'rgba(34,197,94,0.9)', fontSize: '0.75rem', fontWeight: 600 }}>
                  ✅ Received
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Print Config */}
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.2rem' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px', marginBottom: '1rem', marginTop: 0 }}>
            PRINT CONFIGURATION
          </p>

          {/* Color Mode */}
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '6px', marginTop: 0 }}>Color</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className={`option-btn ${colorMode === 'bw' ? 'active' : ''}`} onClick={() => setColorMode('bw')}>
                ⬛ Black & White — ₹{BW_PRICE}/page
              </button>
              <button className={`option-btn ${colorMode === 'color' ? 'active' : ''}`} onClick={() => setColorMode('color')}>
                🎨 Color — ₹{COLOR_PRICE}/page
              </button>
            </div>
          </div>

          {/* Sides */}
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '6px', marginTop: 0 }}>Sides</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className={`option-btn ${sided === 'single' ? 'active' : ''}`} onClick={() => setSided('single')}>
                Single-sided
              </button>
              <button className={`option-btn ${sided === 'double' ? 'active' : ''}`} onClick={() => setSided('double')}>
                Double-sided
              </button>
            </div>
          </div>

          {/* Copies */}
          <div style={{ marginBottom: '1.2rem' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '6px', marginTop: 0 }}>Copies</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={() => setCopies(c => Math.max(1, c - 1))} style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: 'white', fontSize: '1.4rem', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>−</button>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '1.3rem', minWidth: '30px', textAlign: 'center' }}>{copies}</span>
              <button onClick={() => setCopies(c => Math.min(99, c + 1))} style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(0,212,255,0.3), rgba(139,92,246,0.3))',
                border: '1px solid rgba(0,212,255,0.4)',
                color: 'white', fontSize: '1.4rem', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>+</button>
            </div>
          </div>

          {/* Price */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(139,92,246,0.1))',
            border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: '12px', padding: '1rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: '0 0 2px' }}>Estimated Total</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', margin: 0 }}>
                  {pageCount} page × ₹{pricePerPage} × {copies} {copies === 1 ? 'copy' : 'copies'} • {sided}-sided
                </p>
              </div>
              <div style={{
                fontSize: '1.8rem', fontWeight: 700,
                background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                ₹{total}
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: '12px', padding: '12px 16px', marginBottom: '1.2rem',
        }}>
          <span style={{ fontSize: '18px' }}>🔒</span>
          <p style={{ color: 'rgba(34,197,94,0.9)', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>
            <strong>Zero Data Retention</strong> — Your file is processed in RAM only and permanently deleted immediately after printing.
          </p>
        </div>

        {/* CTA Button */}
        <button
          className="btn-primary"
          onClick={handleProceed}
          disabled={!fileReceived || uploading}
        >
          {uploading
            ? '⏳ Please wait...'
            : fileReceived
              ? '💳 Proceed to Payment'
              : '📱 Waiting for file from phone...'}
        </button>

        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textAlign: 'center', marginTop: '1rem' }}>
          By proceeding you agree to our zero-retention privacy policy
        </p>
      </div>
    </div>
  )
}
