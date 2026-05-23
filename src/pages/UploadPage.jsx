import { useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'

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

function OptionButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[4.5rem] flex-1 rounded-2xl border-2 px-4 py-4 text-xl font-semibold transition-all active:scale-[0.98] ${
        active
          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-50 shadow-lg shadow-cyan-500/20'
          : 'border-slate-600 bg-slate-800/80 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  )
}

export default function UploadPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [colorMode, setColorMode] = useState('bw')
  const [sided, setSided] = useState('single')
  const [copies, setCopies] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxFiles: 1,
    multiple: false,
  })

  const ratePerPage = colorMode === 'color' ? COLOR_PRICE : BW_PRICE
  const pageCount = DEFAULT_PAGE_COUNT
  const estimatedTotal = pageCount * ratePerPage * copies

  const canProceed = file !== null && !uploading

  const handleProceed = async () => {
    if (!file) return

    setUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(
          errorBody.error || `Upload failed with status ${response.status}`,
        )
      }

      const data = await response.json()

      navigate('/payment', {
        state: {
          amount: estimatedTotal,
          fileName: file.name,
          colorMode,
          sided,
          copies,
          backendFile: data.file,
          backendMessage: data.message,
        },
      })
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not reach the print server. Is it running on port 5000?'
      setUploadError(message)
    } finally {
      setUploading(false)
    }
  }

  const dropzoneLabel = useMemo(() => {
    if (isDragActive) return 'Drop your file here'
    if (file) return 'Tap to replace file'
    return 'Tap or drag PDF / image here'
  }, [isDragActive, file])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-10">
        <header className="space-y-3 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Self-Service Print Kiosk
          </h1>
          <p className="text-2xl text-slate-400">
            Upload your documents securely
          </p>
        </header>

        <section className="space-y-4">
          <div
            {...getRootProps()}
            className={`flex min-h-[14rem] cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-4 border-dashed px-6 py-10 transition-colors ${
              isDragActive
                ? 'border-cyan-400 bg-cyan-500/10'
                : file
                  ? 'border-emerald-500/60 bg-emerald-500/5'
                  : 'border-slate-600 bg-slate-900/60 hover:border-slate-500 hover:bg-slate-900'
            }`}
          >
            <input {...getInputProps()} />
            <span className="text-6xl" aria-hidden="true">
              {file ? '📄' : '📤'}
            </span>
            <p className="text-center text-2xl font-medium text-slate-200">
              {dropzoneLabel}
            </p>
            <p className="text-lg text-slate-500">PDF, JPG, PNG, GIF, WEBP</p>
          </div>

          {file && (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-900 px-6 py-5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xl font-semibold text-white">
                  {file.name}
                </p>
                <p className="mt-1 text-lg text-slate-400">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="shrink-0 rounded-xl border-2 border-red-500/60 bg-red-500/10 px-6 py-3 text-lg font-semibold text-red-300 transition-colors hover:bg-red-500/20 active:scale-[0.98]"
              >
                Remove
              </button>
            </div>
          )}
        </section>

        <section className="space-y-6 rounded-3xl border border-slate-700 bg-slate-900/80 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-white">Print configuration</h2>

          <div className="space-y-3">
            <p className="text-lg font-medium text-slate-400">Color</p>
            <div className="flex gap-3">
              <OptionButton
                active={colorMode === 'bw'}
                onClick={() => setColorMode('bw')}
              >
                Black &amp; White
                <span className="mt-1 block text-base font-normal text-slate-400">
                  ₹{BW_PRICE}/page
                </span>
              </OptionButton>
              <OptionButton
                active={colorMode === 'color'}
                onClick={() => setColorMode('color')}
              >
                Color
                <span className="mt-1 block text-base font-normal text-slate-400">
                  ₹{COLOR_PRICE}/page
                </span>
              </OptionButton>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-lg font-medium text-slate-400">Sides</p>
            <div className="flex gap-3">
              <OptionButton
                active={sided === 'single'}
                onClick={() => setSided('single')}
              >
                Single-sided
              </OptionButton>
              <OptionButton
                active={sided === 'double'}
                onClick={() => setSided('double')}
              >
                Double-sided
              </OptionButton>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-lg font-medium text-slate-400">Copies</p>
            <div className="flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={() => setCopies((c) => Math.max(1, c - 1))}
                disabled={copies <= 1}
                className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-slate-600 bg-slate-800 text-3xl font-bold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98]"
                aria-label="Decrease copies"
              >
                −
              </button>
              <span className="min-w-[4rem] text-center text-4xl font-bold tabular-nums text-white">
                {copies}
              </span>
              <button
                type="button"
                onClick={() => setCopies((c) => c + 1)}
                className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-cyan-500/60 bg-cyan-500/20 text-3xl font-bold text-cyan-50 transition-colors hover:bg-cyan-500/30 active:scale-[0.98]"
                aria-label="Increase copies"
              >
                +
              </button>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 px-6 py-5">
            <p className="text-lg text-emerald-200/80">Estimated total</p>
            <p className="mt-1 text-4xl font-bold text-emerald-300">
              ₹{estimatedTotal}
            </p>
            <p className="mt-2 text-base text-slate-500">
              {pageCount} page × ₹{ratePerPage} × {copies} cop
              {copies === 1 ? 'y' : 'ies'}
              {sided === 'double' ? ' · double-sided' : ' · single-sided'}
            </p>
          </div>
        </section>

        <aside
          role="note"
          className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 px-6 py-5"
        >
          <p className="text-xl font-semibold leading-relaxed text-amber-100">
            🔒 Zero Data Retention: Your files are processed entirely in memory
            and permanently deleted immediately after printing.
          </p>
        </aside>

        {uploadError && (
          <p
            role="alert"
            className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-lg text-red-300"
          >
            {uploadError}
          </p>
        )}

        <button
          type="button"
          disabled={!canProceed}
          onClick={handleProceed}
          className="mt-auto min-h-[4.5rem] w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-8 py-5 text-2xl font-bold text-slate-950 shadow-lg shadow-cyan-500/30 transition-all hover:from-cyan-300 hover:to-emerald-300 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:shadow-none active:scale-[0.99]"
        >
          {uploading ? 'Uploading to secure memory…' : 'Proceed to Payment'}
        </button>
      </div>
    </div>
  )
}
