const { Router } = require('express')
const prisma = require('../db')
const { authenticate, authorize } = require('../middleware/authenticate')

const router = Router()

// All session routes require authentication
router.use(authenticate)

const SESSION_INCLUDE = {
  client: { select: { id: true, email: true } },
  consultant: { select: { id: true, displayName: true, specialisation: true } },
  slot: { select: { id: true, startTime: true, endTime: true } },
}

// GET /api/sessions — list sessions scoped by role
// client      → sessions where client_id = me
// consultant  → sessions where consultant_id = my profile
// admin       → all sessions (with optional filters)
router.get('/', async (req, res, next) => {
  try {
    const { status, consultantId, page = 1, limit = 20 } = req.query
    const pageNum = Math.max(1, parseInt(page))
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)))

    const where = {}

    if (req.user.role === 'client') {
      where.clientId = req.user.id
    } else if (req.user.role === 'consultant') {
      const profile = await prisma.consultantProfile.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
      })
      if (!profile) return res.status(404).json({ error: 'Consultant profile not found' })
      where.consultantId = profile.id
    }
    // admin: no scope restriction, falls through

    if (status) where.status = status
    if (consultantId && req.user.role === 'admin') {
      where.consultantId = parseInt(consultantId)
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        include: SESSION_INCLUDE,
        orderBy: { slot: { startTime: 'asc' } },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      prisma.session.count({ where }),
    ])

    res.json({ data: sessions, total, page: pageNum, pageSize })
  } catch (err) {
    next(err)
  }
})

// POST /api/sessions — book a session (client only)
router.post('/', authorize('client', 'consultant'), async (req, res, next) => {
  try {
    const { consultantId, slotId, notes } = req.body
    if (!consultantId || !slotId) {
      return res.status(400).json({ error: 'consultantId and slotId are required' })
    }

    const session = await prisma.$transaction(async (tx) => {
      const slot = await tx.availabilitySlot.findUnique({ where: { id: parseInt(slotId) } })
      if (!slot) return { error: 'Slot not found', status: 404 }
      if (slot.isBooked) return { error: 'Slot is no longer available', status: 409 }
      if (slot.consultantId !== parseInt(consultantId)) {
        return { error: 'Slot does not belong to this consultant', status: 400 }
      }

      await tx.availabilitySlot.update({
        where: { id: slot.id },
        data: { isBooked: true },
      })

      return tx.session.create({
        data: {
          clientId: req.user.id,
          consultantId: parseInt(consultantId),
          slotId: slot.id,
          notes: notes || null,
          status: 'pending',
        },
        include: SESSION_INCLUDE,
      })
    })

    if (session.error) return res.status(session.status).json({ error: session.error })
    res.status(201).json(session)
  } catch (err) {
    next(err)
  }
})

// GET /api/sessions/:id — session detail
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

    const session = await prisma.session.findUnique({
      where: { id },
      include: SESSION_INCLUDE,
    })
    if (!session) return res.status(404).json({ error: 'Session not found' })

    // Clients can only see their own sessions
    if (req.user.role === 'client' && session.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    // Consultants can only see sessions on their profile
    if (req.user.role === 'consultant') {
      const profile = await prisma.consultantProfile.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
      })
      if (!profile || session.consultantId !== profile.id) {
        return res.status(403).json({ error: 'Forbidden' })
      }
    }

    res.json(session)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/sessions/:id — update status (consultant or admin)
router.patch('/:id', authorize('consultant', 'admin'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

    const { status } = req.body
    const ALLOWED_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled']
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` })
    }

    const existing = await prisma.session.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Session not found' })

    if (req.user.role === 'consultant') {
      const profile = await prisma.consultantProfile.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
      })
      if (!profile || existing.consultantId !== profile.id) {
        return res.status(403).json({ error: 'Forbidden' })
      }
    }

    const updated = await prisma.session.update({
      where: { id },
      data: { status },
      include: SESSION_INCLUDE,
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/sessions/:id — cancel session (client cancels own; admin cancels any)
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

    const existing = await prisma.session.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Session not found' })

    if (req.user.role === 'client' && existing.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    if (req.user.role === 'consultant') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Free the availability slot so it can be rebooked
    await prisma.$transaction([
      prisma.session.update({ where: { id }, data: { status: 'cancelled' } }),
      prisma.availabilitySlot.update({ where: { id: existing.slotId }, data: { isBooked: false } }),
    ])

    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

module.exports = router
