const { Router } = require('express')
const prisma = require('../db')
const stripe = require('../lib/stripe')
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/authenticate')

const router = Router()

const CONSULTANT_SELECT = {
  id: true,
  displayName: true,
  description: true,
  specialisation: true,
  hourlyRate: true,
  avatarUrl: true,
  isActive: true,
  userId: true,
  platformFeePct: true,
  stripeAccountId: true,
  stripeOnboardingComplete: true,
}

// GET /api/consultants — paginated + filtered list (public catalogue)
router.get('/', optionalAuthenticate, async (req, res, next) => {
  try {
    const {
      specialisation,
      maxRate,
      availableToday,
      sortBy = 'displayName',
      order = 'asc',
      page = 1,
      limit = 12,
    } = req.query

    const pageNum = Math.max(1, parseInt(page))
    const pageSize = Math.min(50, Math.max(1, parseInt(limit)))

    const where = { isActive: true }
    if (specialisation) {
      where.specialisation = { in: specialisation.split(',') }
    }
    if (maxRate) {
      where.hourlyRate = { lte: parseFloat(maxRate) }
    }
    if (availableToday === 'true') {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)
      where.availabilitySlots = {
        some: { isBooked: false, startTime: { gte: todayStart, lte: todayEnd } },
      }
    }

    const allowedSort = ['displayName', 'hourlyRate']
    const orderField = allowedSort.includes(sortBy) ? sortBy : 'displayName'
    const orderDir = order === 'desc' ? 'desc' : 'asc'

    const [consultants, total] = await Promise.all([
      prisma.consultantProfile.findMany({
        where,
        select: CONSULTANT_SELECT,
        orderBy: { [orderField]: orderDir },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      prisma.consultantProfile.count({ where }),
    ])

    res.json({ data: consultants, total, page: pageNum, pageSize })
  } catch (err) {
    next(err)
  }
})

// GET /api/consultants/me — consultant's own profile
router.get('/me', authenticate, authorize('consultant', 'admin'), async (req, res, next) => {
  try {
    const profile = await prisma.consultantProfile.findUnique({
      where: { userId: req.user.id },
      select: CONSULTANT_SELECT,
    })
    if (!profile) return res.status(404).json({ error: 'Consultant profile not found' })
    res.json(profile)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/consultants/me — consultant updates their own profile
router.patch('/me', authenticate, authorize('consultant', 'admin'), async (req, res, next) => {
  try {
    const profile = await prisma.consultantProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    })
    if (!profile) return res.status(404).json({ error: 'Consultant profile not found' })

    const { displayName, description, specialisation, hourlyRate } = req.body
    const data = {}
    if (displayName !== undefined) data.displayName = displayName
    if (description !== undefined) data.description = description
    if (specialisation !== undefined) data.specialisation = specialisation
    if (hourlyRate !== undefined) data.hourlyRate = parseFloat(hourlyRate)

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' })
    }

    const updated = await prisma.consultantProfile.update({
      where: { id: profile.id },
      data,
      select: CONSULTANT_SELECT,
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// GET /api/consultants/me/slots — all upcoming slots for the logged-in consultant
router.get('/me/slots', authenticate, authorize('consultant', 'admin'), async (req, res, next) => {
  try {
    const profile = await prisma.consultantProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    })
    if (!profile) return res.status(404).json({ error: 'Consultant profile not found' })

    const slots = await prisma.availabilitySlot.findMany({
      where: {
        consultantId: profile.id,
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: 'asc' },
    })
    res.json(slots)
  } catch (err) {
    next(err)
  }
})

// PUT /api/consultants/me/slots — replace all unbooked future slots
// Body: { slots: [{ startTime: ISO, endTime: ISO }] }
router.put('/me/slots', authenticate, authorize('consultant', 'admin'), async (req, res, next) => {
  try {
    const profile = await prisma.consultantProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    })
    if (!profile) return res.status(404).json({ error: 'Consultant profile not found' })

    const { slots } = req.body
    if (!Array.isArray(slots)) return res.status(400).json({ error: 'slots must be an array' })

    await prisma.$transaction([
      // Delete all unbooked future slots for this consultant
      prisma.availabilitySlot.deleteMany({
        where: { consultantId: profile.id, isBooked: false, startTime: { gte: new Date() } },
      }),
      // Recreate from the submitted list
      prisma.availabilitySlot.createMany({
        data: slots.map(({ startTime, endTime }) => ({
          consultantId: profile.id,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          isBooked: false,
        })),
      }),
    ])

    const updated = await prisma.availabilitySlot.findMany({
      where: { consultantId: profile.id, startTime: { gte: new Date() } },
      orderBy: { startTime: 'asc' },
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// GET /api/consultants/:id/slots?date=YYYY-MM-DD[&duration=1|2]
// Returns available start slots for the given duration:
//   duration=1 (default) — any available 1h slot
//   duration=2 — only slots where the immediately consecutive 1h slot is also available
router.get('/:id/slots', authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

    const { date, duration = '1' } = req.query
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'date query param required (YYYY-MM-DD)' })
    }
    const durationHours = parseInt(duration) === 2 ? 2 : 1

    const dayStart = new Date(`${date}T00:00:00.000Z`)
    const dayEnd = new Date(`${date}T23:59:59.999Z`)

    const slots = await prisma.availabilitySlot.findMany({
      where: {
        consultantId: id,
        isBooked: false,
        startTime: { gte: dayStart, lte: dayEnd },
      },
      orderBy: { startTime: 'asc' },
    })

    if (durationHours === 2) {
      // Only return start slots where the consecutive next 1h slot is also available
      const availableStartMs = new Set(slots.map((s) => s.startTime.getTime()))
      return res.json(slots.filter((slot) => availableStartMs.has(slot.endTime.getTime())))
    }

    res.json(slots)
  } catch (err) {
    next(err)
  }
})

// GET /api/consultants/:id — single consultant profile
router.get('/:id', optionalAuthenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

    const consultant = await prisma.consultantProfile.findUnique({
      where: { id },
      select: CONSULTANT_SELECT,
    })
    if (!consultant) return res.status(404).json({ error: 'Consultant not found' })

    res.json(consultant)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/consultants/:id — admin only: update consultant profile
router.patch('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

    const { displayName, description, specialisation, hourlyRate, isActive, platformFeePct } = req.body
    const data = {}

    if (displayName !== undefined) data.displayName = displayName
    if (description !== undefined) data.description = description
    if (specialisation !== undefined) data.specialisation = specialisation
    if (hourlyRate !== undefined) data.hourlyRate = parseFloat(hourlyRate)
    if (isActive !== undefined) data.isActive = Boolean(isActive)
    if (platformFeePct !== undefined) {
      const pct = parseFloat(platformFeePct)
      if (isNaN(pct) || pct < 0 || pct > 100) {
        return res.status(400).json({ error: 'platformFeePct must be a number between 0 and 100' })
      }
      data.platformFeePct = pct
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' })
    }

    const updated = await prisma.consultantProfile.update({
      where: { id },
      data,
      select: CONSULTANT_SELECT,
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// POST /api/consultants/me/connect/onboard
// Creates a Stripe Express account (if needed) and returns a hosted onboarding URL.
// The consultant visits the URL to enter their bank details; Stripe handles KYC.
// On return, Stripe sends an `account.updated` webhook to complete the flow.
router.post('/me/connect/onboard', authenticate, authorize('consultant'), async (req, res, next) => {
  try {
    const profile = await prisma.consultantProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true, stripeAccountId: true, stripeOnboardingComplete: true },
    })
    if (!profile) return res.status(404).json({ error: 'Consultant profile not found' })

    if (profile.stripeOnboardingComplete) {
      return res.status(400).json({ error: 'Stripe Connect onboarding already complete' })
    }

    let accountId = profile.stripeAccountId
    if (!accountId) {
      const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { email: true } })
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: { transfers: { requested: true } },
        business_type: 'individual',
      })
      accountId = account.id
      await prisma.consultantProfile.update({
        where: { id: profile.id },
        data: { stripeAccountId: accountId },
      })
    }

    const appUrl = process.env.APP_URL || 'http://localhost:5173'
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/acasa?tab=contul-meu&connect=refresh`,
      return_url: `${appUrl}/acasa?tab=contul-meu&connect=success`,
      type: 'account_onboarding',
    })

    res.json({ url: accountLink.url })
  } catch (err) {
    next(err)
  }
})

// GET /api/consultants/me/connect/status
// Returns whether the consultant has completed Stripe Connect onboarding.
router.get('/me/connect/status', authenticate, authorize('consultant'), async (req, res, next) => {
  try {
    const profile = await prisma.consultantProfile.findUnique({
      where: { userId: req.user.id },
      select: { stripeAccountId: true, stripeOnboardingComplete: true },
    })
    if (!profile) return res.status(404).json({ error: 'Consultant profile not found' })
    res.json({
      stripeAccountId: profile.stripeAccountId,
      onboardingComplete: profile.stripeOnboardingComplete,
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
