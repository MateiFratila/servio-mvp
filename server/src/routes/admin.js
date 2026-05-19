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

module.exports = router
