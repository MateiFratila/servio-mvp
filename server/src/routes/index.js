const { Router } = require('express')
const healthRouter = require('./health')
const authRouter = require('./auth')
const usersRouter = require('./users')
const consultantsRouter = require('./consultants')
const sessionsRouter = require('./sessions')
const adminRouter = require('./admin')
const paymentsRouter = require('./payments')

const router = Router()

router.use('/health', healthRouter)
router.use('/auth', authRouter)
router.use('/users', usersRouter)
router.use('/consultants', consultantsRouter)
router.use('/sessions', sessionsRouter)
router.use('/admin', adminRouter)
router.use('/payments', paymentsRouter)

// Public config endpoint — safe to expose publishable key to the browser
router.get('/config', async (_req, res) => {
  // Check DB override first, fall back to env var
  try {
    const prisma = require('../db')
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'stripe_publishable_key' } })
    const key = setting?.value ?? process.env.STRIPE_PUBLISHABLE_KEY
    return res.json({ stripePublishableKey: key })
  } catch {
    return res.json({ stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY })
  }
})

module.exports = router
