import { loadStripe } from '@stripe/stripe-js'

// Fetch the publishable key from the server so this works in all environments
// (local dev and cloud) without needing a VITE_ build-time variable.
async function getStripeKeyWithRetry(retries = 5, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch('/api/config')
      if (!r.ok) {
        throw new Error(`HTTP error! status: ${r.status}`)
      }
      const text = await r.text()
      if (!text || text.trim() === '') {
        throw new Error('Empty response body')
      }
      const cfg = JSON.parse(text)
      if (!cfg.stripePublishableKey) {
        throw new Error('stripePublishableKey is missing in config')
      }
      return cfg.stripePublishableKey
    } catch (err) {
      console.warn(`Attempt ${i + 1} to fetch /api/config failed: ${err.message}. Retrying in ${delay}ms...`)
      if (i === retries - 1) {
        throw err
      }
      await new Promise((res) => setTimeout(res, delay))
      delay *= 1.5 // Exponential backoff
    }
  }
}

const stripePromise = getStripeKeyWithRetry()
  .then((key) => loadStripe(key))
  .catch((err) => {
    console.error('Failed to initialize Stripe:', err)
    return null
  })

export default stripePromise
