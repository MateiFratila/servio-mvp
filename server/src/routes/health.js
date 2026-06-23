const { Router } = require('express')
const { sendBookingConfirmed } = require('../emails')

const router = Router()

router.get('/', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Transient developer diagnostic endpoint to isolate local Brevo dispatcher behavior
router.get('/test-brevo', async (req, res, next) => {
  try {
    const apiKeySet = !!process.env.BREVO_API_KEY
    if (!apiKeySet) {
      return res.status(400).json({ error: 'BREVO_API_KEY is not defined in server env' })
    }

    // Try a dummy invocation
    const resultPayload = await sendBookingConfirmed({
      clientEmail: req.query.email || 'office@servio.ro',
      clientName: 'Test Client',
      consultantName: 'Test Consultant',
      sessionDate: '23 June 2026',
      sessionTime: '12:00',
      bookingUrl: 'http://localhost:5173/sessions/test',
    })

    return res.json({
      status: 'success',
      message: 'Email dispatch request reached Brevo',
      resultPayload,
    })
  } catch (err) {
    return res.status(500).json({
      status: 'failed',
      errorMessage: err.message,
      tip: 'Check that BREVO_API_KEY is valid and the sender address office@servio.ro is verified inside Brevo!',
    })
  }
})

module.exports = router
