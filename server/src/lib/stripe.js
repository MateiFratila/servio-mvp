const Stripe = require('stripe')

const key = process.env.STRIPE_SECRET_KEY

if (!key) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}


if (process.env.NODE_ENV !== 'production' && key.startsWith('sk_live_')) {
  throw new Error('Live Stripe key used outside production!')
}

module.exports = new Stripe(key, { apiVersion: '2024-04-10' })
