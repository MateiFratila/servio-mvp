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

module.exports = app
