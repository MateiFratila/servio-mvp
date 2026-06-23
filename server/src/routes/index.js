const { Router } = require('express')
const healthRouter = require('./health')
const authRouter = require('./auth')
const usersRouter = require('./users')
const consultantsRouter = require('./consultants')
const sessionsRouter = require('./sessions')
const documentsRouter = require('./documents')
const messagesRouter = require('./messages')
const adminRouter = require('./admin')
const paymentsRouter = require('./payments')
const feedbackRouter = require('./feedback')
const companiesRouter = require('./companies')

const router = Router()

router.use('/health', healthRouter)
router.use('/auth', authRouter)
router.use('/users', usersRouter)
router.use('/consultants', consultantsRouter)
router.use('/sessions', sessionsRouter)
router.use('/sessions/:sessionId/documents', documentsRouter)
router.use('/sessions/:sessionId/messages', messagesRouter)
router.use('/admin', adminRouter)
router.use('/payments', paymentsRouter)
router.use('/feedbacks', feedbackRouter)
router.use('/companies', companiesRouter)

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

// Public legal endpoints
router.get('/public-settings/legal/:key', async (req, res, next) => {
  try {
    const { key } = req.params
    const allowedKeys = ['legal_terms', 'legal_privacy', 'legal_cookies']
    if (!allowedKeys.includes(key)) {
      return res.status(400).json({ error: 'Sectiunea legala solicitata nu este valida.' })
    }

    const prisma = require('../db')
    const setting = await prisma.systemSetting.findUnique({ where: { key } })
    return res.json({ key, value: setting?.value ?? '' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
