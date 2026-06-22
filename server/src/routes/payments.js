const { Router } = require('express')
const prisma = require('../db')
const stripe = require('../lib/stripe')
const { getEurToRonRate } = require('../lib/bnr')
const { createRoom } = require('../lib/daily')
const { authenticate } = require('../middleware/authenticate')
const { sendBookingPendingConfirmation } = require('../emails')

const router = Router()

function isMissingStripeAccountError(err) {
  return err?.type === 'StripeInvalidRequestError' && err?.code === 'resource_missing' && err?.param === 'account'
}

// POST /api/payments/create-intent
// Creates a PaymentIntent and a pending session row.
// Body: { consultantId, slotId, notes?, duration? }  duration in hours (e.g., 0.5, 1, 1.5, 2)
router.post('/create-intent', authenticate, async (req, res, next) => {
  try {
    const { consultantId, slotId, notes, duration = 1, billingInfo } = req.body
    const durationMinutes = Math.round(parseFloat(duration) * 60)
    const ALLOWED_DURATIONS = [30, 60, 90, 120]
    if (!ALLOWED_DURATIONS.includes(durationMinutes)) {
      return res.status(400).json({ error: 'Durata sesiunii este invalidă. Trebuie să fie de 30, 60, 90 sau 120 de minute.' })
    }
    if (!consultantId || !slotId) {
      return res.status(400).json({ error: 'consultantId and slotId are required' })
    }
    if (!notes || typeof notes !== 'string' || notes.trim() === '') {
      return res.status(400).json({ error: 'Descrierea problemei este obligatorie' })
    }
    if (!billingInfo || !billingInfo.billingType) {
      return res.status(400).json({ error: 'Informațiile de facturare sunt obligatorii' })
    }
    if (billingInfo.billingType === 'fizica') {
      if (!billingInfo.name || !billingInfo.localitate || !billingInfo.judet) {
        return res.status(400).json({ error: 'Numele, localitatea și județul sunt obligatorii pentru persoana fizică' })
      }
    } else if (billingInfo.billingType === 'juridica') {
      if (!billingInfo.companyName || !billingInfo.cui || !billingInfo.regCom || !billingInfo.companyAddress) {
        return res.status(400).json({ error: 'Toate câmpurile companiei sunt obligatorii pentru persoana juridică' })
      }
    } else {
      return res.status(400).json({ error: 'Tipul de facturare selectat este invalid' })
    }

    const billingData = {
      billingType: billingInfo.billingType,
      name: billingInfo.billingType === 'fizica' ? billingInfo.name : null,
      cnp: billingInfo.billingType === 'fizica' ? billingInfo.cnp || null : null,
      localitate: billingInfo.billingType === 'fizica' ? billingInfo.localitate : null,
      judet: billingInfo.billingType === 'fizica' ? billingInfo.judet : null,
      companyName: billingInfo.billingType === 'juridica' ? billingInfo.companyName : null,
      cui: billingInfo.billingType === 'juridica' ? billingInfo.cui : null,
      regCom: billingInfo.billingType === 'juridica' ? billingInfo.regCom : null,
      companyAddress: billingInfo.billingType === 'juridica' ? billingInfo.companyAddress : null,
    }

    const result = await prisma.$transaction(async (tx) => {
      // Validate slot
      const slot = await tx.availabilitySlot.findUnique({ where: { id: parseInt(slotId) } })
      if (!slot) return { error: 'Slot not found', status: 404 }
      if (slot.consultantId !== parseInt(consultantId)) {
        return { error: 'Slot does not belong to this consultant', status: 400 }
      }

      // Check for an existing session on this slot
      const existingSession = await tx.session.findUnique({
        where: { slotId: slot.id },
        include: { slot: true },
      })

      // If there's already an unpaid session belonging to this client, reuse it
      if (existingSession && existingSession.paymentStatus === 'unpaid' && existingSession.clientId === req.user.id) {
        // Release previous slots of this specific unpaid session first so they can be re-resolved
        const endTimeLimit = new Date(existingSession.slot.startTime.getTime() + existingSession.durationMinutes * 60000)
        await tx.availabilitySlot.updateMany({
          where: {
            consultantId: parseInt(consultantId),
            startTime: { gte: existingSession.slot.startTime, lt: endTimeLimit },
          },
          data: { isBooked: false },
        })

        // Reserve slots for the new duration
        let currentSlot = slot
        const totalSlotsToBook = durationMinutes / 30
        for (let i = 0; i < totalSlotsToBook; i++) {
          const targetSlot = await tx.availabilitySlot.findFirst({
            where: {
              id: i === 0 ? slot.id : undefined,
              consultantId: slot.consultantId,
              isBooked: false,
              startTime: i === 0 ? undefined : currentSlot.endTime,
            },
          })
          if (!targetSlot) {
            const hoursNeeded = durationMinutes / 60
            return { error: `Nu există intervale consecutive suficiente pentru o sesiune de ${hoursNeeded} ore.`, status: 409 }
          }
          await tx.availabilitySlot.update({ where: { id: targetSlot.id }, data: { isBooked: true } })
          currentSlot = targetSlot
        }

        const intent = await stripe.paymentIntents.retrieve(existingSession.stripePaymentIntentId)

        // Update the session's notes and duration, and upsert the billing info
        await tx.session.update({
          where: { id: existingSession.id },
          data: {
            notes: notes || null,
            durationMinutes,
            billing: {
              upsert: {
                create: billingData,
                update: billingData,
              }
            }
          }
        })

        // Also update Stripe payment intent if amount/duration changes
        const profile = await tx.consultantProfile.findUnique({
          where: { id: parseInt(consultantId) },
          select: { hourlyRate: true },
        })
        const eurToRon = await getEurToRonRate()
        const amountInBani = Math.round(Number(profile.hourlyRate) * (durationMinutes / 60) * eurToRon * 1.21 * 100)

        const updatedIntent = await stripe.paymentIntents.update(existingSession.stripePaymentIntentId, {
          amount: amountInBani
        })

        return { clientSecret: updatedIntent.client_secret, sessionId: existingSession.id }
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

      // Get hourly rate and Stripe Connect info from consultant profile
      const profile = await tx.consultantProfile.findUnique({
        where: { id: parseInt(consultantId) },
        select: { id: true, displayName: true, hourlyRate: true, stripeAccountId: true, stripeOnboardingComplete: true, platformFeePct: true },
      })
      if (!profile) return { error: 'Consultant not found', status: 404 }

      let destinationAccountId = null
      if (profile.stripeAccountId && profile.stripeOnboardingComplete) {
        try {
          const account = await stripe.accounts.retrieve(profile.stripeAccountId)
          if (account.details_submitted) {
            destinationAccountId = account.id
          } else {
            await tx.consultantProfile.update({
              where: { id: profile.id },
              data: { stripeOnboardingComplete: false },
            })
          }
        } catch (stripeErr) {
          if (!isMissingStripeAccountError(stripeErr)) throw stripeErr

          await tx.consultantProfile.update({
            where: { id: profile.id },
            data: { stripeAccountId: null, stripeOnboardingComplete: false },
          })
        }
      }

      // Reserve slots for the session
      let currentSlot = slot
      const totalSlotsToBook = durationMinutes / 30
      for (let i = 0; i < totalSlotsToBook; i++) {
        const targetSlot = await tx.availabilitySlot.findFirst({
          where: {
            id: i === 0 ? slot.id : undefined,
            consultantId: slot.consultantId,
            isBooked: false,
            startTime: i === 0 ? undefined : currentSlot.endTime,
          },
        })
        if (!targetSlot) {
          const hoursNeeded = durationMinutes / 60
          return { error: `Nu există intervale consecutive suficiente pentru o sesiune de ${hoursNeeded} ore.`, status: 409 }
        }
        await tx.availabilitySlot.update({ where: { id: targetSlot.id }, data: { isBooked: true } })
        currentSlot = targetSlot
      }

      // Convert hourly rate from EUR to RON using BNR exchange rate, apply 21% VAT, then to bani (1 RON = 100 bani)
      const eurToRon = await getEurToRonRate()
      const amountInBani = Math.round(Number(profile.hourlyRate) * (durationMinutes / 60) * eurToRon * 1.21 * 100)

      // Create Stripe PaymentIntent
      // If the consultant has completed Connect onboarding, split automatically using
      // the consultant's individual platform fee rate:
      //   (100 - platformFeePct)% → consultant's connected account (via transfer_data)
      //   platformFeePct%         → platform (application_fee_amount)
      const intentParams = {
        amount: amountInBani,
        currency: 'ron',
        metadata: {
          consultantId: String(profile.id),
          slotId: String(slot.id),
          clientId: String(req.user.id),
        },
      }
      if (destinationAccountId) {
        const feePct = Number(profile.platformFeePct)
        intentParams.transfer_data = { destination: destinationAccountId }
        intentParams.application_fee_amount = Math.round(amountInBani * feePct / 100)
      }
      const paymentIntent = await stripe.paymentIntents.create(intentParams)

      // Create session row with unpaid status and its billing info
      const session = await tx.session.create({
        data: {
          clientId: req.user.id,
          consultantId: profile.id,
          slotId: slot.id,
          durationMinutes,
          notes: notes ?? null,
          status: 'pending',
          paymentStatus: 'unpaid',
          stripePaymentIntentId: paymentIntent.id,
          billing: {
            create: billingData,
          },
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

    // Mark session as paid + pending consultant confirmation
    await prisma.session.updateMany({
      where: { stripePaymentIntentId: intent.id },
      data: { paymentStatus: 'paid', status: 'pending_confirmation' },
    })

    // Fetch session with slot, client, consultant and billing so we can create the room, send notifications, and emit FGO invoice
    const session = await prisma.session.findFirst({
      where: { stripePaymentIntentId: intent.id },
      include: {
        slot: true,
        client: true,
        consultant: { include: { user: true } },
        billing: true,
      },
    })

    if (session) {
      // Emit FGO invoice
      try {
        const { emitInvoice } = require('../lib/fgo')
        const amountRon = intent.amount / 100
        await emitInvoice(session, amountRon)
      } catch (err) {
        console.error('[FGO] Invoice emission failed for session', session.id, err.message)
      }

      try {
        const expMs = new Date(session.slot.startTime).getTime() + session.durationMinutes * 60 * 1000 + 30 * 60 * 1000
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
        const bookingUrl = `${appUrl}/sessions/${session.id}`
        const startTime = new Date(session.slot.startTime)
        const sessionDate = startTime.toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Bucharest' })
        const sessionTime = startTime.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Bucharest' })

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
    // Release the slots and mark session cancelled
    const session = await prisma.session.findFirst({
      where: { stripePaymentIntentId: intent.id },
      include: { slot: true },
    })
    if (session) {
      const endTimeLimit = new Date(session.slot.startTime.getTime() + session.durationMinutes * 60000)
      await prisma.$transaction([
        prisma.session.update({
          where: { id: session.id },
          data: { paymentStatus: 'failed', status: 'cancelled' },
        }),
        prisma.availabilitySlot.updateMany({
          where: {
            consultantId: session.consultantId,
            startTime: { gte: session.slot.startTime, lt: endTimeLimit },
          },
          data: { isBooked: false },
        }),
      ])
    }
  }

  if (event.type === 'account.updated') {
    const account = event.data.object
    // Mark onboarding complete once the consultant has submitted all required details
    if (account.details_submitted) {
      await prisma.consultantProfile.updateMany({
        where: { stripeAccountId: account.id },
        data: { stripeOnboardingComplete: true },
      })
    }
  }

  res.json({ received: true })
})

module.exports = router
