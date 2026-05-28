import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import os from 'os'
import ptp from 'pdf-to-printer'

const PORT = 5000
const SECURITY_TIMEOUT_MS = 5 * 60 * 1000

const app = express()

app.use(cors({
  origin: '*'
}))
app.use(express.json())

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
})

let fileBuffer = null
let fileMeta = null
let securityTimeout = null
let paymentSession = { isPaid: false, printStatus: 'waiting', amount: 0 }

function secureWipe(reason) {
  console.log(`[SECURITY] Executing secure memory wipe... (${reason})`)
  fileBuffer = null
  fileMeta = null
  if (securityTimeout) {
    clearTimeout(securityTimeout)
    securityTimeout = null
    console.log('[SECURITY] Security fallback timer disarmed')
  }
  console.log('[SECURITY] RAM allocation cleared — buffer set to null')
}

function armSecurityTimeout() {
  if (securityTimeout) {
    clearTimeout(securityTimeout)
  }

  console.log(
    '[TIMEOUT] Arming 5-minute global fallback — buffer will auto-wipe if no print command',
  )

  securityTimeout = setTimeout(() => {
    if (fileBuffer !== null) {
      console.log(
        '[TIMEOUT] 5-minute limit reached — upload received but print never called',
      )
      secureWipe('global fallback timeout (5 minutes, no /api/print)')
    }
  }, SECURITY_TIMEOUT_MS)
}

function resolveTempExtension(meta) {
  const fromName = path.extname(meta.originalname || '')
  if (fromName) return fromName.toLowerCase()

  const mimeMap = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
  }

  return mimeMap[meta.mimetype] || '.pdf'
}

function shredTempFile(tempFilePath) {
  try {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath)
      console.log(`[PRINT] Temporary spool file removed: ${tempFilePath}`)
    }
  } catch (unlinkErr) {
    console.error(
      '[PRINT] Failed to delete temporary spool file:',
      unlinkErr instanceof Error ? unlinkErr.message : unlinkErr,
    )
      paymentSession.printStatus = 'error' 
  }
}

app.post('/api/upload', upload.single('file'), (req, res) => {
  console.log('[UPLOAD] POST /api/upload')

  if (!req.file) {
    console.log('[UPLOAD] Rejected — no file in request')
    return res.status(400).json({ error: 'No file uploaded. Use field name "file".' })
  }

  paymentSession.isPaid = false
  console.log('[PAYMENT] Session reset — awaiting admin approval')

  if (fileBuffer !== null) {
    console.log('[UPLOAD] Existing RAM buffer detected — wiping before replace')
    secureWipe('replaced by new upload')
  }

  console.log('[UPLOAD] File received in RAM buffer (memoryStorage — not written to disk)')
  fileBuffer = req.file.buffer
  fileMeta = {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    encoding: req.file.encoding,
    uploadedAt: new Date().toISOString(),
  }

  console.log('[UPLOAD] Metadata:', fileMeta)
  console.log(`[UPLOAD] Buffer size in RAM: ${fileBuffer.length} bytes`)

  armSecurityTimeout()

  return res.status(201).json({
    message: 'File held in volatile RAM only',
    file: fileMeta,
  })
})

app.post('/api/print', (req, res) => {
  console.log('[PRINT] POST /api/print')
  console.log('[PRINT] Request body:', req.body)

  if (!paymentSession.isPaid) {
    console.log('[PRINT] Rejected — payment not confirmed')
    return res.status(403).json({ error: 'Payment not confirmed. Await admin approval.' })
  }

  if (fileBuffer === null || fileMeta === null) {
    console.log('[PRINT] Rejected — no file in memory buffer')
    return res.status(404).json({ error: 'No file in memory. Upload first via /api/upload.' })
  }

  const printedSnapshot = { ...fileMeta }
  const bufferSnapshot = fileBuffer
  const byteCount = bufferSnapshot.length
  const ext = resolveTempExtension(printedSnapshot)
  const tempFilePath = path.join(os.tmpdir(), `kiosk-print-${Date.now()}${ext}`)

  console.log('[PRINT] File metadata:', printedSnapshot)
  console.log(`[PRINT] Preparing ${byteCount} bytes for hardware spool...`)

  try {
    fs.writeFileSync(tempFilePath, bufferSnapshot)
    console.log(`[PRINT] Temporary spool file written: ${tempFilePath}`)
    console.log('[PRINT] Dispatching to OS default printer via pdf-to-printer...')
  } catch (writeErr) {
    const message =
      writeErr instanceof Error ? writeErr.message : 'Failed to write temporary spool file'
    console.error('[PRINT] Could not create temporary spool file:', message)
    return res.status(500).json({ error: message })
  }
paymentSession.printStatus = 'printing'
  ptp
    .print(tempFilePath)
    .then(() => {
      console.log(
        '🔒 Hardware Spool Complete: Temporary file shredded, memory cleared.',
      )
      paymentSession.printStatus = 'success'
      shredTempFile(tempFilePath)
      secureWipe('post-print hardware spool complete')
      paymentSession.isPaid = false
      console.log('[PRINT] Job complete — RAM buffer null, payment session reset')

      res.json({
        success: true,
        message: 'Document sent to default printer; memory wiped',
        memoryCleared: fileBuffer === null,
        printed: printedSnapshot,
      })
    })
    .catch((printErr) => {
      const message =
        printErr instanceof Error
          ? printErr.message
          : 'Unknown printer error (offline, out of paper, or driver issue)'

      console.error('[PRINT] Printer hardware error:', message)
      paymentSession.printStatus = 'error'
      if (printErr instanceof Error && printErr.stack) {
        console.error('[PRINT] Stack trace:', printErr.stack)
      }

      shredTempFile(tempFilePath)

      res.status(500).json({
        error: message,
        hint: 'Check that the default printer is online and has paper, then try again.',
      })
    })
})

app.post('/api/cancel', (_req, res) => {
  console.log('[CANCEL] User cancelled session — wiping RAM buffer')
  paymentSession.isPaid = false
  secureWipe('user cancelled from kiosk')
  res.json({ success: true, message: 'Session cancelled and memory cleared' })
})

app.get('/api/payment-status', (_req, res) => {
  res.json({ isPaid: paymentSession.isPaid })
})

app.post('/api/admin-approve', (_req, res) => {
  console.log('[ADMIN] Remote payment approval received')
  paymentSession.isPaid = true
  res.json({ success: true, message: 'Payment approved for current kiosk session' })
})

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    fileInMemory: fileBuffer !== null,
    meta: fileMeta,
  })
})// Print status endpoint
app.get('/api/print-status', (_req, res) => {
  res.json({
    status: paymentSession.printStatus || 'waiting',
    fileName: fileMeta ? fileMeta.originalName : null,
    amount: paymentSession.amount || 0,
    isPaid: paymentSession.isPaid
  })
})

app.listen(PORT, () => {
  console.log(`[SERVER] Print kiosk API listening on http://localhost:${PORT}`)
  console.log(
    '[SERVER] Endpoints: POST /api/upload, POST /api/print, GET /api/payment-status, POST /api/admin-approve',
  )
  console.log('[SERVER] Upload: multer.memoryStorage() — volatile RAM only')
  console.log('[SERVER] Print: pdf-to-printer → OS default printer (Windows)')
})
