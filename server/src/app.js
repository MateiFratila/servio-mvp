const express = require('express')
const cors = require('cors')
const path = require('path')
const apiRoutes = require('./routes')

const app = express()

// Stripe webhook needs the raw body — must be registered before express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))

app.use(express.json())

// CORS is only needed in local dev — in production, client and server share the same origin.
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
    credentials: true,
  })
)

// API routes
app.use('/api', apiRoutes)

// Serve the React SPA in production
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '../../client/dist')
  app.use(express.static(clientBuild))
  // SPA fallback — any non-API route returns index.html
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'))
  })
}

// Global error handler — always return JSON for API errors
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500
  // Surface Stripe API errors clearly (they contain no sensitive user data)
  const isStripeError = err.type && err.type.startsWith('Stripe')
  const message = (process.env.NODE_ENV !== 'production' || isStripeError)
    ? (err.message || 'Internal server error')
    : 'Internal server error'
  res.status(status).json({ error: message, ...(isStripeError && { stripeCode: err.code, stripeParam: err.param }) })
})

module.exports = app
