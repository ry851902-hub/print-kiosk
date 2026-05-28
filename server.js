import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import os from 'os'
import ptp from 'pdf-to-printer'
import pdfParse from 'pdf-parse'

const PORT = 5000
const SECURITY_TIMEOUT_MS = 5 * 60 * 1000

const app = express()

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
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
  console.log('[TIMEOUT] Arming 5-minute global fallback')
  securityTimeout = setTimeout(() => {
    if (fileBuffer !== null) {
      console.log('[TIMEOUT] 5-minute limit reached')
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
    console.error('[PRINT] Failed to delete temporary spool file:', unlinkErr instanceof Error ? unlinkErr.message : unlinkErr)
    paymentSession.printStatus = 'error'
  }
}

app.post('/api/upload', upload.single('file'), async (req, res) => {
  console.log('[UPLOAD] POST /api/upload')

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Use field name "file".' })
  }

  paymentSession.isPaid = false

  if (fileBuffer !== null) {
    secureWipe('replaced by new upload')
  }

  fileBuffer = req.file.buffer

  let pageCount = 1
  try {
    if (req.file.mimetype === 'application/pdf') {
      const pdfData = await pdfParse(fileBuffer)
      pageCount = pdfData.numpages || 1
    }
  } catch (e) {
    pageCount = 1
  }

  fileMeta = {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    encoding: req.file.encoding,
    uploadedAt: new Date().toISOString(),
    pageCount,
  }

  console.log('[UPLOAD] Metadata:', fileMeta)
  armSecurityTimeout()

  return res.status(201).json({
    message: 'File held in volatile RAM only',
    file: fileMeta,
  })
})

app.post('/api/print', (req, res) => {
  console.log('[PRINT] POST /api/print')

  if (!paymentSession.isPaid) {
    return res.status(403).json({ error: 'Payment not confirmed. Await admin approval.' })
  }

  if (fileBuffer === null || fileMeta === null) {
    return res.status(404).json({ error: 'No file in memory. Upload first via /api/upload.' })
  }

  const printedSnapshot = { ...fileMeta }
  const bufferSnapshot = fileBuffer
  const ext = resolveTempExtension(printedSnapshot)
  const tempFilePath = path.join(os.tmpdir(), `kiosk-print-${Date.now()}${ext}`)

  try {
    fs.writeFileSync(tempFilePath, bufferSnapshot)
  } catch (writeErr) {
    const message = writeErr instanceof Error ? writeErr.message : 'Failed to write temporary spool file'
    return res.status(500).json({ error: message })
  }

  paymentSession.printStatus = 'printing'

  ptp.print(tempFilePath)
    .then(() => {
      paymentSession.printStatus = 'success'
      shredTempFile(tempFilePath)
      secureWipe('post-print hardware spool complete')
      paymentSession.isPaid = false

      res.json({
        success: true,
        message: 'Document sent to default printer; memory wiped',
        memoryCleared: fileBuffer === null,
        printed: printedSnapshot,
      })
    })
    .catch((printErr) => {
      const message = printErr instanceof Error ? printErr.message : 'Unknown printer error'
      paymentSession.printStatus = 'error'
      shredTempFile(tempFilePath)
      res.status(500).json({
        error: message,
        hint: 'Check that the default printer is online and has paper, then try again.',
      })
    })
})

app.post('/api/cancel', (_req, res) => {
  paymentSession.isPaid = false
  secureWipe('user cancelled from kiosk')
  res.json({ success: true, message: 'Session cancelled and memory cleared' })
})

app.get('/api/payment-status', (_req, res) => {
  res.json({ isPaid: paymentSession.isPaid })
})

app.post('/api/admin-approve', (_req, res) => {
  paymentSession.isPaid = true
  res.json({ success: true, message: 'Payment approved for current kiosk session' })
})

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    fileInMemory: fileBuffer !== null,
    meta: fileMeta,
  })
})

app.get('/api/print-status', (_req, res) => {
  res.json({
    status: paymentSession.printStatus || 'waiting',
    fileName: fileMeta ? fileMeta.originalname : null,
    amount: paymentSession.amount || 0,
    isPaid: paymentSession.isPaid
  })
})

app.listen(PORT, () => {
  console.log(`[SERVER] Print kiosk API listening on http://localhost:${PORT}`)
})
