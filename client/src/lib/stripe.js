import { loadStripe } from '@stripe/stripe-js'

// Fetch the publishable key from the server so this works in all environments
// (local dev and cloud) without needing a VITE_ build-time variable.
const stripePromise = fetch('/api/config')
  .then((r) => r.json())
  .then((cfg) => loadStripe(cfg.stripePublishableKey))

export default stripePromise
