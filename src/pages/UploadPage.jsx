import { useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'

const API_BASE = 'https://print-kiosk-server.onrender.com'
const BW_PRICE = 2
const COLOR_PRICE = 10
const DEFAULT_PAGE_COUNT = 1

const ACCEPT = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [colorMode, setColorMode] = useState('bw')
  const [sided, setSided] = useState('single')
  const [copies, setCopies] = useState(1)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploaded, setUploaded] = useState(false)

  const pageCount = file ? DEFAULT_PAGE_COUNT : 0
  const pricePerPage = colorMode === 'bw' ? BW_PRICE : COLOR_PRICE
  const total = useMemo(() => pageCount * copies * pricePerPage, [pageCount, copies, pricePerPage])

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) {
      setFile(accepted[0])
      setUploaded(false)
      setUploadProgress(0)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  })

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setUploadProgress(0)

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) { clearInterval(interval); return 90 }
        return prev + 10
      })
    }, 150)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      clearInterval(interval)
      setUploadProgress(100)
      setUploaded(true)

      setTimeout(() => {
        navigate('/payment', {
          state: {
            fileName: file.name,
            fileSize: file.size,
            colorMode,
            sided,
            copies,
            amount: total,
            pageCount,
            backendFile: data.file,
          },
        })
      }, 800)
    } catch (err) {
      clearInterval(interval)
      setUploadProgress(0)
      setUploading(false)
      alert('Upload failed. Please try again.')
    }
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
      {/* Animated background orbs */}
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
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes checkPop { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .upload-zone { transition: all 0.3s ease; }
        .upload-zone:hover { transform: translateY(-2px); }
        .btn-primary {
          background: linear-gradient(135deg, #00d4ff, #8b5cf6);
          border: none; border-radius: 14px;
          color: white; font-size: 1.1rem; font-weight: 600;
          padding: 1rem 2rem; cursor: pointer; width: 100%;
          transition: all 0.3s ease; position: relative; overflow: hidden;
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
            fontSize: '2rem', fontWeight: 700, margin: 0,
            background: 'linear-gradient(135deg, #ffffff, #00d4ff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Upload & Print
         <h1 style={{
  fontSize: '2.8rem', fontWeight: 800, margin: 0,
  background: 'linear-gradient(135deg, #ffffff 0%, #00d4ff 50%, #8b5cf6 100%)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  letterSpacing: '-1px', lineHeight: 1.1,
}}>
  Upload & Print
</h1>

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
            display: 'inline-block',
            padding: '12px',
            background: 'white',
            borderRadius: '16px',
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

        {/* Upload Zone */}
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.2rem' }}>
          <div
            {...getRootProps()}
            className="upload-zone"
            style={{
              border: `2px dashed ${isDragActive ? '#00d4ff' : file ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.2)'}`,
              borderRadius: '14px',
              padding: '2.5rem 1rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragActive ? 'rgba(0,212,255,0.05)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.3s ease',
            }}
          >
            <input {...getInputProps()} />
            {file ? (
              <div style={{ animation: 'fadeInUp 0.4s ease' }}>
                <div style={{
                  width: '60px', height: '60px', margin: '0 auto 1rem',
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(139,92,246,0.2))',
                  borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px',
                }}>
                  {file.type === 'application/pdf' ? '📄' : '🖼️'}
                </div>
                <p style={{ color: 'white', fontWeight: 600, margin: '0 0 4px' }}>{file.name}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', margin: 0 }}>
                  {formatFileSize(file.size)} • Tap to change
                </p>
              </div>
            ) : (
              <div>
                <div style={{
                  fontSize: '48px', marginBottom: '1rem',
                  animation: 'float 3s ease-in-out infinite',
                  display: 'block',
                }}>📤</div>
                <p style={{ color: 'white', fontWeight: 600, fontSize: '1.1rem', margin: '0 0 6px' }}>
                  {isDragActive ? 'Drop it here!' : 'Tap or drag your file here'}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: 0 }}>
                  PDF, JPG, PNG, GIF, WEBP • Max 50MB
                </p>
              </div>
            )}
          </div>
        </div>

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
                alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
              }}>−</button>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '1.3rem', minWidth: '30px', textAlign: 'center' }}>{copies}</span>
              <button onClick={() => setCopies(c => Math.min(99, c + 1))} style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(0,212,255,0.3), rgba(139,92,246,0.3))',
                border: '1px solid rgba(0,212,255,0.4)',
                color: 'white', fontSize: '1.4rem', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
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

        {/* Upload progress */}
        {uploading && (
          <div style={{ marginBottom: '1rem', animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                {uploaded ? '✅ Upload complete!' : 'Uploading securely...'}
              </span>
              <span style={{ color: '#00d4ff', fontSize: '0.8rem', fontWeight: 600 }}>{uploadProgress}%</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '8px', height: '6px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '8px',
                background: 'linear-gradient(90deg, #00d4ff, #8b5cf6)',
                width: `${uploadProgress}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {/* CTA Button */}
        <button
          className="btn-primary"
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading
            ? uploaded ? '✅ Redirecting to Payment...' : '⏳ Uploading...'
            : file ? '💳 Proceed to Payment' : '📁 Select a File First'}
        </button>

        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textAlign: 'center', marginTop: '1rem' }}>
          By proceeding you agree to our zero-retention privacy policy
        </p>
      </div>
    </div>
  )
}
