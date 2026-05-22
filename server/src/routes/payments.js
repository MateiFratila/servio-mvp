const { Router } = require('express')
const prisma = require('../db')
const stripe = require('../lib/stripe')
const { createRoom } = require('../lib/daily')
const { authenticate } = require('../middleware/authenticate')
const { sendBookingPendingConfirmation } = require('../emails')

const router = Router()

// POST /api/payments/create-intent
// Creates a PaymentIntent and a pending session row.
// Body: { consultantId, slotId, notes? }
router.post('/create-intent', authenticate, async (req, res, next) => {
  try {
    const { consultantId, slotId, notes } = req.body
    if (!consultantId || !slotId) {
      return res.status(400).json({ error: 'consultantId and slotId are required' })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Validate slot
      const slot = await tx.availabilitySlot.findUnique({ where: { id: parseInt(slotId) } })
      if (!slot) return { error: 'Slot not found', status: 404 }
      if (slot.consultantId !== parseInt(consultantId)) {
        return { error: 'Slot does not belong to this consultant', status: 400 }
      }

      // Check for an existing session on this slot
      const existingSession = await tx.session.findUnique({ where: { slotId: slot.id } })

      // If there's already an unpaid session belonging to this client, reuse it
      if (existingSession && existingSession.paymentStatus === 'unpaid' && existingSession.clientId === req.user.id) {
        const intent = await stripe.paymentIntents.retrieve(existingSession.stripePaymentIntentId)
        return { clientSecret: intent.client_secret, sessionId: existingSession.id }
      }

      // If there's a cancelled/failed session, delete it so we can start fresh
      if (existingSession && ['cancelled', 'failed'].includes(existingSession.paymentStatus)) {
        await tx.session.delete({ where: { id: existingSession.id } })
      } else if (existingSession) {
        // Slot is genuinely taken by another client or a confirmed session
        return { error: 'Slot is no longer available', status: 409 }
      }

      // Slot must be free at this point — also double-check isBooked for concurrent requests
      if (slot.isBooked) return { error: 'Slot is no longer available', status: 409 }

      // Get hourly rate from consultant profile
      const profile = await tx.consultantProfile.findUnique({
        where: { id: parseInt(consultantId) },
        select: { id: true, displayName: true, hourlyRate: true },
      })
      if (!profile) return { error: 'Consultant not found', status: 404 }

      // Reserve slot
      await tx.availabilitySlot.update({ where: { id: slot.id }, data: { isBooked: true } })

      // Calculate amount in smallest unit (bani: 1 RON = 100 bani)
      const slotDurationMs = new Date(slot.endTime) - new Date(slot.startTime)
      const slotDurationHours = slotDurationMs / (1000 * 60 * 60)
      const amountInBani = Math.round(Number(profile.hourlyRate) * slotDurationHours * 100)

      // Create Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInBani,
        currency: 'ron',
        metadata: {
          consultantId: String(profile.id),
          slotId: String(slot.id),
          clientId: String(req.user.id),
        },
      })

      // Create session row with unpaid status
      const session = await tx.session.create({
        data: {
          clientId: req.user.id,
          consultantId: profile.id,
          slotId: slot.id,
          notes: notes ?? null,
          status: 'pending',
          paymentStatus: 'unpaid',
          stripePaymentIntentId: paymentIntent.id,
        },
      })

      return { clientSecret: paymentIntent.client_secret, sessionId: session.id }
    })

    if (result.error) {
      return res.status(result.status).json({ error: result.error })
    }

    res.json(result)
  } catch (err) {
    next(err)
  }
})

// POST /api/payments/webhook
// Receives Stripe events. Must receive raw body (registered before express.json()).
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` })
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object

    // Mark session as confirmed + paid
    await prisma.session.updateMany({
      where: { stripePaymentIntentId: intent.id },
      data: { paymentStatus: 'paid', status: 'confirmed' },
    })

    // Fetch session with slot, client and consultant so we can create the room and send notifications
    const session = await prisma.session.findFirst({
      where: { stripePaymentIntentId: intent.id },
      include: {
        slot: true,
        client: true,
        consultant: { include: { user: true } },
      },
    })

    if (session) {
      try {
        const expMs = new Date(session.slot.endTime).getTime() + 30 * 60 * 1000
        const room = await createRoom({
          name: `servio-session-${session.id}`,
          exp: expMs,
        })
        await prisma.session.update({
          where: { id: session.id },
          data: { meetingUrl: room.url, dailyRoomName: room.name },
        })
      } catch (err) {
        // Room creation failure must not fail the webhook — session is still confirmed
        console.error('[daily] room creation failed for session', session.id, err.message)
      }

      try {
        const appUrl = process.env.APP_URL || 'http://localhost:5173'
        const bookingUrl = ` `
        const startTime = new Date(session.slot.startTime)
        const sessionDate = startTime.toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })
        const sessionTime = startTime.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })

        await sendBookingPendingConfirmation({
          consultantEmail: session.consultant.user.email,
          consultantName: session.consultant.displayName,
          clientName: session.client.email,
          sessionDate,
          sessionTime,
          bookingUrl,
        })
      } catch (err) {
        // Email failure must not fail the webhook
        console.error('[email] sendBookingPendingConfirmation failed for session', session.id, err.message)
      }
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object
    // Release the slot and mark session cancelled
    const session = await prisma.session.findFirst({
      where: { stripePaymentIntentId: intent.id },
      select: { id: true, slotId: true },
    })
    if (session) {
      await prisma.$transaction([
        prisma.session.update({
          where: { id: session.id },
          data: { paymentStatus: 'failed', status: 'cancelled' },
        }),
        prisma.availabilitySlot.update({
          where: { id: session.slotId },
          data: { isBooked: false },
        }),
      ])
    }
  }

  res.json({ received: true })
})

module.exports = router
