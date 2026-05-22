const { Router } = require('express')
const multer = require('multer')
const prisma = require('../db')
const { authenticate, authorize } = require('../middleware/authenticate')
const { uploadBlob, getDownloadUrl } = require('../lib/azureStorage')

const router = Router({ mergeParams: true })

router.use(authenticate)

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
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) cb(null, true)
    else cb(Object.assign(new Error('File type not allowed'), { status: 415 }))
  },
})

function runMulter(req, res) {
  return new Promise((resolve, reject) => {
    upload.single('file')(req, res, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

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
// GET /api/sessions/:sessionId/messages
// ---------------------------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const sessionId = parseInt(req.params.sessionId)
    if (isNaN(sessionId)) return res.status(400).json({ error: 'Invalid sessionId' })

    const session = await resolveSession(sessionId, req.user)
    if (session === null) return res.status(404).json({ error: 'Session not found' })
    if (session === false) return res.status(403).json({ error: 'Forbidden' })

    const messages = await prisma.sessionMessage.findMany({
      where: { sessionId },
      include: { author: { select: { id: true, email: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    })

    res.json(messages)
  } catch (err) {
    next(err)
  }
})

// ---------------------------------------------------------------------------
// POST /api/sessions/:sessionId/messages — consultant contacts the client
// Accepts multipart/form-data: content (text, required) + file (optional)
// Transitions session → ping_pong
// ---------------------------------------------------------------------------
router.post('/', authorize('consultant', 'admin', 'client'), async (req, res, next) => {
  try {
    await runMulter(req, res)

    const sessionId = parseInt(req.params.sessionId)
    if (isNaN(sessionId)) return res.status(400).json({ error: 'Invalid sessionId' })

    const session = await resolveSession(sessionId, req.user)
    if (session === null) return res.status(404).json({ error: 'Session not found' })
    if (session === false) return res.status(403).json({ error: 'Forbidden' })

    const content = (req.body.content || '').trim() || null
    if (!content && !req.file) return res.status(400).json({ error: 'A message or file attachment is required' })

    const CONTACTABLE = ['pending_confirmation', 'ping_pong', 'confirmed']
    if (!CONTACTABLE.includes(session.status)) {
      return res.status(409).json({ error: 'Session cannot be contacted in its current state' })
    }

    let attachmentFilename = null
    let attachmentBlobName = null
    let attachmentSizeBytes = null

    if (req.file) {
      attachmentBlobName = await uploadBlob(sessionId, req.file.buffer, req.file.mimetype)
      attachmentFilename = req.file.originalname
      attachmentSizeBytes = req.file.size
    }

    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.sessionMessage.create({
        data: {
          session:  { connect: { id: sessionId } },
          author:   { connect: { id: req.user.id } },
          content,
          attachmentFilename,
          attachmentBlobName,
          attachmentSizeBytes,
        },
        include: { author: { select: { id: true, email: true, role: true } } },
      })

      if (session.status !== 'confirmed') {
        await tx.session.update({
          where: { id: sessionId },
          data: { status: 'ping_pong' },
        })
      }

      return msg
    })

    res.status(201).json(message)
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message })
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large (max 10 MB)' })
    next(err)
  }
})

// ---------------------------------------------------------------------------
// GET /api/sessions/:sessionId/messages/:messageId/download
// ---------------------------------------------------------------------------
router.get('/:messageId/download', async (req, res, next) => {
  try {
    const sessionId = parseInt(req.params.sessionId)
    const messageId = parseInt(req.params.messageId)
    if (isNaN(sessionId) || isNaN(messageId)) return res.status(400).json({ error: 'Invalid id' })

    const session = await resolveSession(sessionId, req.user)
    if (session === null) return res.status(404).json({ error: 'Session not found' })
    if (session === false) return res.status(403).json({ error: 'Forbidden' })

    const message = await prisma.sessionMessage.findUnique({ where: { id: messageId } })
    if (!message || message.sessionId !== sessionId) return res.status(404).json({ error: 'Message not found' })
    if (!message.attachmentBlobName) return res.status(404).json({ error: 'No attachment on this message' })

    const url = await getDownloadUrl(message.attachmentBlobName)
    res.redirect(url)
  } catch (err) {
    next(err)
  }
})

module.exports = router
