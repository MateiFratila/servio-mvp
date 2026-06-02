const { Router } = require('express')
const prisma = require('../db')
const { authenticate, authorize } = require('../middleware/authenticate')
const { createMeetingToken, createRoom } = require('../lib/daily')
const { sendBookingConfirmed, sendBookingCancelled } = require('../emails')

const router = Router()

// All session routes require authentication
router.use(authenticate)

const SESSION_INCLUDE = {
  client: { select: { id: true, email: true } },
  consultant: {
    select: {
      id: true,
      userId: true,
      displayName: true,
      user: { select: { email: true } },
      specialisations: {
        select: { specialisation: { select: { id: true, name: true, slug: true } } },
      },
    },
  },
  slot: { select: { id: true, startTime: true, endTime: true } },
  review: {
    select: {
      id: true,
      rating: true,
      testimonial: true,
      displayName: true,
      privateNotes: true,
      createdAt: true,
      replies: {
        select: { id: true, index: true, content: true, authorId: true, createdAt: true },
        orderBy: { index: 'asc' },
      },
    },
  },
}

function sanitizeSession(session, userRole) {
  if (!session) return session
  if (session.review && userRole !== 'admin') {
    const sanitizedReview = { ...session.review }
    delete sanitizedReview.privateNotes
    return { ...session, review: sanitizedReview }
  }
  return session
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

    const sanitizedSessions = sessions.map((s) => sanitizeSession(s, req.user.role))
    res.json({ data: sanitizedSessions, total, page: pageNum, pageSize })
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

    res.json(sanitizeSession(session, req.user.role))
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
    const ALLOWED_STATUSES = ['pending', 'pending_confirmation', 'ping_pong', 'confirmed', 'completed', 'cancelled']
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

    let updateData = { status }

    // If the consultant is confirming and the room was never created (e.g. Daily failed during payment webhook), create it now
    if (status === 'confirmed' && !existing.meetingUrl) {
      const sessionWithSlot = await prisma.session.findUnique({
        where: { id },
        include: { slot: true },
      })
      try {
        const expMs = new Date(sessionWithSlot.slot.startTime).getTime() + (sessionWithSlot.durationMinutes ?? 60) * 60 * 1000 + 30 * 60 * 1000
        const room = await createRoom({
          name: `servio-session-${id}`,
          exp: expMs,
        })
        updateData.meetingUrl = room.url
        updateData.dailyRoomName = room.name
      } catch (err) {
        console.error('[daily] room creation failed on confirm for session', id, err.message)
      }
    }

    const updated = await prisma.session.update({
      where: { id },
      data: updateData,
      include: SESSION_INCLUDE,
    })

    // Send email when consultant confirms
    if (status === 'confirmed') {
      try {
        const appUrl = process.env.APP_URL || 'http://localhost:5173'
        const startTime = new Date(updated.slot.startTime)
        await sendBookingConfirmed({
          clientEmail: updated.client.email,
          clientName: updated.client.email,
          consultantName: updated.consultant.displayName,
          sessionDate: startTime.toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' }),
          sessionTime: startTime.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
          bookingUrl: `${appUrl}/sessions/${updated.id}`,
        })
      } catch (err) {
        console.error('[email] sendBookingConfirmed failed for session', id, err.message)
      }
    }

    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// GET /api/sessions/:id/meeting-token — generate a Daily.co token for a session participant
router.get('/:id/meeting-token', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

    const session = await prisma.session.findUnique({
      where: { id },
      include: { slot: true, client: { select: { email: true } }, consultant: { select: { displayName: true, userId: true } } },
    })
    if (!session) return res.status(404).json({ error: 'Session not found' })
    if (!session.dailyRoomName) return res.status(409).json({ error: 'Meeting room is not ready yet' })

    // Only the client or the consultant of this session may get a token
    const isClient = session.clientId === req.user.id
    const isConsultant = session.consultant.userId === req.user.id
    if (!isClient && !isConsultant && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const userName = isConsultant ? session.consultant.displayName : session.client.email
    const expMs = new Date(session.slot.startTime).getTime() + (session.durationMinutes ?? 60) * 60 * 1000 + 30 * 60 * 1000

    const { token } = await createMeetingToken({
      roomName: session.dailyRoomName,
      userName,
      exp: expMs,
    })

    res.json({ token })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/sessions/:id — cancel session (client cancels own; admin cancels any)
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

    const existing = await prisma.session.findUnique({
      where: { id },
      include: SESSION_INCLUDE,
    })
    if (!existing) return res.status(404).json({ error: 'Session not found' })

    if (req.user.role === 'client' && existing.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    if (req.user.role === 'consultant') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Free the availability slot(s) so they can be rebooked
    const cancelOps = [
      prisma.session.update({ where: { id }, data: { status: 'cancelled' } }),
      prisma.availabilitySlot.update({ where: { id: existing.slotId }, data: { isBooked: false } }),
    ]

    // For 2h sessions, also release the consecutive second slot
    if (existing.durationMinutes === 120) {
      const primarySlot = await prisma.availabilitySlot.findUnique({ where: { id: existing.slotId } })
      if (primarySlot) {
        const nextSlot = await prisma.availabilitySlot.findFirst({
          where: { consultantId: primarySlot.consultantId, startTime: primarySlot.endTime, isBooked: true },
        })
        if (nextSlot) {
          cancelOps.push(prisma.availabilitySlot.update({ where: { id: nextSlot.id }, data: { isBooked: false } }))
        }
      }
    }

    await prisma.$transaction(cancelOps)

    // Notify both parties of the cancellation — only if the session was paid
    if (existing.paymentStatus === 'paid') {
      const startTime = new Date(existing.slot.startTime)
      const sessionDate = startTime.toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })
      const sessionTime = startTime.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
      const refunded = true

      try {
        await sendBookingCancelled({
          recipientEmail: existing.client.email,
          recipientName: existing.client.email,
          otherPartyName: existing.consultant.displayName,
          sessionDate,
          sessionTime,
          refunded,
        })
      } catch (err) {
        console.error('[email] sendBookingCancelled (client) failed for session', id, err.message)
      }

      if (existing.consultant.user?.email) {
        try {
          await sendBookingCancelled({
            recipientEmail: existing.consultant.user.email,
            recipientName: existing.consultant.displayName,
            otherPartyName: existing.client.email,
            sessionDate,
            sessionTime,
            refunded: false,
          })
        } catch (err) {
          console.error('[email] sendBookingCancelled (consultant) failed for session', id, err.message)
        }
      }
    }

    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

// POST /api/sessions/:id/reviews (and /review) — Client submits a review for a session
router.post(['/:id/reviews', '/:id/review'], authorize('client', 'consultant'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

    const { rating, testimonial, displayName, privateNotes } = req.body

    const parsedRating = parseInt(rating)
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'Rating-ul trebuie să fie un număr între 1 și 5.' })
    }

    if (!testimonial || typeof testimonial !== 'string' || !testimonial.trim()) {
      return res.status(400).json({ error: 'Mărturia publică este obligatorie.' })
    }

    // Find session
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        slot: true,
        review: true,
      }
    })

    if (!session) return res.status(404).json({ error: 'Session not found' })

    // Only the client (or consultant acting as client) booking the session can leave a review
    if (session.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Doar persoana care a rezervat ședința poate lăsa o recenzie.' })
    }

    // Check if review already exists
    if (session.review) {
      return res.status(400).json({ error: 'Sesiunea are deja o recenzie înregistrată.' })
    }

    // Check conditions:
    // This feedback form component should only render on screen if the current time (now()) is greater than the Session Start Time OR the Client already left a review for this session.
    // So we validate that now() > slot.startTime (only check this if there was no review already left, which we just checked above anyway)
    if (new Date() <= new Date(session.slot.startTime)) {
      return res.status(400).json({ error: 'Nu poți lăsa o recenzie înainte de începerea ședinței.' })
    }

    // Use a transaction to perform create review, update session status, and average rating recalculation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create review
      const review = await tx.review.create({
        data: {
          sessionId: id,
          clientId: req.user.id,
          consultantId: session.consultantId,
          rating: parsedRating,
          testimonial: testimonial.trim(),
          displayName: displayName ? displayName.trim() : null,
          privateNotes: privateNotes ? privateNotes.trim() : null,
        }
      })

      // 2. "leaving a review should advance the Session status to completed"
      await tx.session.update({
        where: { id },
        data: { status: 'completed' }
      })

      // 3. Recalculate average star rating for consultant
      const allReviews = await tx.review.findMany({
        where: { consultantId: session.consultantId },
        select: { rating: true }
      })

      // Calculate new average
      const ratingsCount = allReviews.length
      const ratingSum = allReviews.reduce((sum, r) => sum + r.rating, 0)
      const avg = ratingsCount > 0 ? (ratingSum / ratingsCount) : 0

      await tx.consultantProfile.update({
        where: { id: session.consultantId },
        data: { averageRating: avg }
      })

      return review
    })

    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
})

// POST /api/sessions/:id/reviews/reply — client, consultant or admin posts a reply to a review
router.post('/:id/reviews/reply', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

    const { content } = req.body
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required.' })
    }

    const session = await prisma.session.findUnique({
      where: { id },
      select: { clientId: true, consultantId: true, review: { select: { id: true } } },
    })
    if (!session) return res.status(404).json({ error: 'Session not found' })
    if (!session.review) return res.status(404).json({ error: 'No review found for this session.' })

    if (req.user.role === 'client') {
      if (session.clientId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' })
      }
    } else if (req.user.role === 'consultant') {
      const profile = await prisma.consultantProfile.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
      })
      if (!profile || session.consultantId !== profile.id) {
        return res.status(403).json({ error: 'Forbidden' })
      }
    }

    const reply = await prisma.$transaction(async (tx) => {
      const count = await tx.reviewReply.count({ where: { reviewId: session.review.id } })
      return tx.reviewReply.create({
        data: {
          reviewId: session.review.id,
          authorId: req.user.id,
          index: count + 1,
          content: content.trim(),
        },
      })
    })

    res.status(201).json(reply)
  } catch (err) {
    next(err)
  }
})

module.exports = router
