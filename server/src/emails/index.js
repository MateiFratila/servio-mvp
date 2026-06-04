const { brevo } = require('../lib/brevo')

const bookingPendingConfirmation = require('./templates/bookingPendingConfirmation')
const bookingConfirmed = require('./templates/bookingConfirmed')
const bookingCancelled = require('./templates/bookingCancelled')
const sessionReminder = require('./templates/sessionReminder')
const reviewRequest = require('./templates/reviewRequest')
const pingPongMessage = require('./templates/pingPongMessage')

const DEFAULT_SENDER = {
  name: process.env.EMAIL_SENDER_NAME || 'SERVIO',
  email: process.env.EMAIL_SENDER_ADDRESS || 'office@servio.ro',
}

// Brevo list IDs
const LIST_IDS = {
  CLIENTS: 60,      // "Conturi Clienti"
  CONSULTANTS: 61,  // "Conturi Consultanți"
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

/**
 * Add (or update) a contact in Brevo and subscribe them to a list.
 * Uses updateEnabled so the call is idempotent.
 *
 * @param {string} email
 * @param {number} listId  - one of LIST_IDS values
 * @param {Record<string,string>} [attributes] - optional Brevo contact attributes
 */
async function subscribeToList(email, listId, attributes = {}) {
  await brevo.contacts.createContact({
    email,
    listIds: [listId],
    updateEnabled: true,
    ...(Object.keys(attributes).length ? { attributes } : {}),
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

/**
 * @param {{
 *   recipientEmail: string,
 *   recipientName: string,
 *   senderRole: 'consultant' | 'client',
 *   senderName: string,
 *   eventType: 'message' | 'document' | 'message_with_document',
 *   bookingUrl: string,
 * }} params
 */
async function sendPingPongMessage({ recipientEmail, recipientName, senderRole, senderName, eventType, bookingUrl }) {
  const { subject, htmlContent } = pingPongMessage({ recipientName, senderRole, senderName, eventType, bookingUrl })
  await sendEmail({ to: recipientEmail, toName: recipientName, subject, htmlContent })
}

module.exports = {
  sendEmail,
  subscribeToList,
  LIST_IDS,
  sendBookingPendingConfirmation,
  sendBookingConfirmed,
  sendBookingCancelled,
  sendSessionReminder,
  sendReviewRequest,
  sendPingPongMessage,
}
