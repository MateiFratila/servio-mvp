const { Router } = require('express')
const multer = require('multer')
const prisma = require('../db')
const { authenticate } = require('../middleware/authenticate')
const { uploadBlob, getDownloadUrl, deleteBlob } = require('../lib/azureStorage')

const router = Router({ mergeParams: true })

// All document routes require authentication
router.use(authenticate)

// Multer: memory storage, 10 MB limit, 5 files max, strict MIME allowlist
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
])

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true)
    } else {
      cb(Object.assign(new Error('File type not allowed'), { status: 415 }))
    }
  },
})

// Promisify multer so errors are catchable inside async route handlers
function runMulter(req, res) {
  return new Promise((resolve, reject) => {
    upload.single('file')(req, res, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

// ---------------------------------------------------------------------------
// Access control helper
// Returns the session if the current user may access it, null if not found,
// or false if the user is authenticated but not authorised.
// ---------------------------------------------------------------------------
async function resolveSession(sessionId, user) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { consultant: { select: { userId: true } } },
  })
  if (!session) return null
  if (user.role === 'admin') return session
  if (user.role === 'client' && session.clientId === user.id) return session
  if (user.role === 'consultant' && session.consultant.userId === user.id) return session
  return false
}

// ---------------------------------------------------------------------------
// POST /api/sessions/:sessionId/documents
// Accepts a single file field named "file". Uploads to Azure, records in DB.
// ---------------------------------------------------------------------------
router.post('/', async (req, res, next) => {
  try {
    await runMulter(req, res)
    const sessionId = parseInt(req.params.sessionId)
    if (isNaN(sessionId)) return res.status(400).json({ error: 'Invalid sessionId' })

    const session = await resolveSession(sessionId, req.user)
    if (session === null) return res.status(404).json({ error: 'Session not found' })
    if (session === false) return res.status(403).json({ error: 'Forbidden' })

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const blobName = await uploadBlob(sessionId, req.file.buffer, req.file.mimetype)

    const doc = await prisma.sessionDocument.create({
      data: {
        sessionId,
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        blobName,
        sizeBytes: req.file.size,
        uploadedBy: req.user.id,
      },
      select: {
        id: true,
        filename: true,
        contentType: true,
        sizeBytes: true,
        uploadedBy: true,
        createdAt: true,
      },
    })

    res.status(201).json(doc)
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message })
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large (max 10 MB)' })
    if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ error: 'Too many files (max 5)' })
    next(err)
  }
})

// ---------------------------------------------------------------------------
// GET /api/sessions/:sessionId/documents
// Lists all documents for the session (metadata only, no blob URLs).
// ---------------------------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const sessionId = parseInt(req.params.sessionId)
    if (isNaN(sessionId)) return res.status(400).json({ error: 'Invalid sessionId' })

    const session = await resolveSession(sessionId, req.user)
    if (session === null) return res.status(404).json({ error: 'Session not found' })
    if (session === false) return res.status(403).json({ error: 'Forbidden' })

    const docs = await prisma.sessionDocument.findMany({
      where: { sessionId },
      select: {
        id: true,
        filename: true,
        contentType: true,
        sizeBytes: true,
        uploadedBy: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    res.json(docs)
  } catch (err) {
    next(err)
  }
})

// ---------------------------------------------------------------------------
// GET /api/sessions/:sessionId/documents/:docId/download
// Generates a short-lived (5-min) SAS URL and redirects the client to it.
// ---------------------------------------------------------------------------
router.get('/:docId/download', async (req, res, next) => {
  try {
    const sessionId = parseInt(req.params.sessionId)
    const docId = parseInt(req.params.docId)
    if (isNaN(sessionId) || isNaN(docId)) return res.status(400).json({ error: 'Invalid id' })

    const session = await resolveSession(sessionId, req.user)
    if (session === null) return res.status(404).json({ error: 'Session not found' })
    if (session === false) return res.status(403).json({ error: 'Forbidden' })

    const doc = await prisma.sessionDocument.findUnique({ where: { id: docId } })
    if (!doc || doc.sessionId !== sessionId) return res.status(404).json({ error: 'Document not found' })

    const url = await getDownloadUrl(doc.blobName)
    res.redirect(url)
  } catch (err) {
    next(err)
  }
})

// ---------------------------------------------------------------------------
// DELETE /api/sessions/:sessionId/documents/:docId
// Only the uploader or an admin may delete a document.
// ---------------------------------------------------------------------------
router.delete('/:docId', async (req, res, next) => {
  try {
    const sessionId = parseInt(req.params.sessionId)
    const docId = parseInt(req.params.docId)
    if (isNaN(sessionId) || isNaN(docId)) return res.status(400).json({ error: 'Invalid id' })

    const session = await resolveSession(sessionId, req.user)
    if (session === null) return res.status(404).json({ error: 'Session not found' })
    if (session === false) return res.status(403).json({ error: 'Forbidden' })

    const doc = await prisma.sessionDocument.findUnique({ where: { id: docId } })
    if (!doc || doc.sessionId !== sessionId) return res.status(404).json({ error: 'Document not found' })

    if (req.user.role !== 'admin' && doc.uploadedBy !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await Promise.all([
      deleteBlob(doc.blobName),
      prisma.sessionDocument.delete({ where: { id: docId } }),
    ])

    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

module.exports = router
