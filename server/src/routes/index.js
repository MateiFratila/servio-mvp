const { Router } = require('express')
const healthRouter = require('./health')
const authRouter = require('./auth')
const usersRouter = require('./users')
const consultantsRouter = require('./consultants')
const sessionsRouter = require('./sessions')
const adminRouter = require('./admin')

const router = Router()

router.use('/health', healthRouter)
router.use('/auth', authRouter)
router.use('/users', usersRouter)
router.use('/consultants', consultantsRouter)
router.use('/sessions', sessionsRouter)
router.use('/admin', adminRouter)

module.exports = router
