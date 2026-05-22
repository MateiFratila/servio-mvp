const { brevo } = require('../lib/brevo')

const bookingPendingConfirmation = require('./templates/bookingPendingConfirmation')
const bookingConfirmed = require('./templates/bookingConfirmed')
const bookingCancelled = require('./templates/bookingCancelled')
const sessionReminder = require('./templates/sessionReminder')
const reviewRequest = require('./templates/reviewRequest')

const DEFAULT_SENDER = {
  name: process.env.EMAIL_SENDER_NAME || 'Servio',
  email: process.env.EMAIL_SENDER_ADDRESS || 'office@servio.ro',
}

/**
 * Low-level send. All other helpers call this.
 *
 * @param {{ to: string, toName?: string, subject: string, htmlContent: string }} params
 */
async function sendEmail({ to, toName, subject, htmlContent }) {
  await brevo.transactionalEmails.sendTransacEmail({
    sender: DEFAULT_SENDER,
    to: [{ email: to, name: toName }],
    subject,
    htmlContent,
  })
}

// ---------------------------------------------------------------------------
// Per-event helpers — each one builds the template and calls sendEmail
// ---------------------------------------------------------------------------

async function sendBookingPendingConfirmation({ consultantEmail, consultantName, clientName, sessionDate, sessionTime, bookingUrl }) {
  const { subject, htmlContent } = bookingPendingConfirmation({ consultantName, clientName, sessionDate, sessionTime, bookingUrl })
  await sendEmail({ to: consultantEmail, toName: consultantName, subject, htmlContent })
}

async function sendBookingConfirmed({ clientEmail, clientName, consultantName, sessionDate, sessionTime, bookingUrl }) {
  const { subject, htmlContent } = bookingConfirmed({ clientName, consultantName, sessionDate, sessionTime, bookingUrl })
  await sendEmail({ to: clientEmail, toName: clientName, subject, htmlContent })
}

async function sendBookingCancelled({ recipientEmail, recipientName, otherPartyName, sessionDate, sessionTime, refunded }) {
  const { subject, htmlContent } = bookingCancelled({ recipientName, otherPartyName, sessionDate, sessionTime, refunded })
  await sendEmail({ to: recipientEmail, toName: recipientName, subject, htmlContent })
}

async function sendSessionReminder({ recipientEmail, recipientName, otherPartyName, sessionDate, sessionTime, bookingUrl, minutesBefore }) {
  const { subject, htmlContent } = sessionReminder({ recipientName, otherPartyName, sessionDate, sessionTime, bookingUrl, minutesBefore })
  await sendEmail({ to: recipientEmail, toName: recipientName, subject, htmlContent })
}

async function sendReviewRequest({ clientEmail, clientName, consultantName, sessionDate, bookingUrl }) {
  const { subject, htmlContent } = reviewRequest({ clientName, consultantName, sessionDate, bookingUrl })
  await sendEmail({ to: clientEmail, toName: clientName, subject, htmlContent })
}

module.exports = {
  sendEmail,
  sendBookingPendingConfirmation,
  sendBookingConfirmed,
  sendBookingCancelled,
  sendSessionReminder,
  sendReviewRequest,
}
