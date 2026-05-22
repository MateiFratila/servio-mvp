const { BrevoClient } = require('@getbrevo/brevo')

const apiKey = process.env.BREVO_API_KEY

if (!apiKey) {
  throw new Error('BREVO_API_KEY is not set')
}

const brevo = new BrevoClient({ apiKey })

module.exports = { brevo }
