const { Router } = require('express')
const healthRouter = require('./health')

const router = Router()

router.use('/health', healthRouter)

module.exports = router
