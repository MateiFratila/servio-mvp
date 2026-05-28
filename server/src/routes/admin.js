const { Router } = require('express')
const prisma = require('../db')
const { authenticate, authorize } = require('../middleware/authenticate')

const router = Router()

router.use(authenticate, authorize('admin'))

// GET /api/admin/stats — platform KPI summary
router.get('/stats', async (_req, res, next) => {
  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalUsers, activeConsultants, sessionsThisMonth] = await Promise.all([
      prisma.user.count(),
      prisma.consultantProfile.count({ where: { isActive: true } }),
      prisma.session.count({
        where: { createdAt: { gte: monthStart }, status: { not: 'cancelled' } },
      }),
    ])

    // Revenue estimate: sum of hourly rates for completed sessions this month
    const completedSessions = await prisma.session.findMany({
      where: { status: 'completed', createdAt: { gte: monthStart } },
      include: { consultant: { select: { hourlyRate: true } } },
    })
    const revenueEst = completedSessions.reduce(
      (sum, s) => sum + parseFloat(s.consultant.hourlyRate),
      0
    )

    res.json({ totalUsers, activeConsultants, sessionsThisMonth, revenueEst })
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/settings — current system settings
// Secrets are NEVER sent to the client — only boolean configured status
router.get('/settings', async (_req, res, next) => {
  try {
    const rows = await prisma.systemSetting.findMany()
    const db = Object.fromEntries(rows.map((r) => [r.key, r.value]))

    const secretKey = process.env.STRIPE_SECRET_KEY ?? ''
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''
    const publishableKey = db['stripe_publishable_key'] ?? process.env.STRIPE_PUBLISHABLE_KEY ?? ''

    const mode = secretKey.startsWith('sk_live_') ? 'live' : 'test'

    res.json({
      stripe: {
        mode,
        publishableKey,
        secretKeyConfigured: secretKey.length > 0,
        webhookSecretConfigured: webhookSecret.length > 0,
      },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/consultants — all profiles regardless of isActive (admin only)
router.get('/consultants', async (_req, res, next) => {
  try {
    const consultants = await prisma.consultantProfile.findMany({
      select: {
        id: true,
        displayName: true,
        specialisations: {
          select: { specialisation: { select: { id: true, name: true, slug: true } } },
        },
        hourlyRate: true,
        avatarUrl: true,
        isActive: true,
        userId: true,
        platformFeePct: true,
        stripeAccountId: true,
        stripeOnboardingComplete: true,
        user: { select: { email: true, phone: true } },
      },
      orderBy: { displayName: 'asc' },
    })
    res.json({ data: consultants, total: consultants.length })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/admin/settings/:key — update an editable setting
// Only whitelisted keys can be updated from the UI
const EDITABLE_KEYS = new Set(['stripe_publishable_key'])

router.patch('/settings/:key', async (req, res, next) => {
  try {
    const { key } = req.params
    const { value } = req.body

    if (!EDITABLE_KEYS.has(key)) {
      return res.status(403).json({ error: 'This setting cannot be updated via the API. Use environment variables.' })
    }
    if (typeof value !== 'string' || !value.trim()) {
      return res.status(400).json({ error: 'value is required' })
    }

    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: value.trim() },
      create: { key, value: value.trim() },
    })

    res.json({ key, updated: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
