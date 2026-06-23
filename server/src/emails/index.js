const { brevo } = require('../lib/brevo')
const renderEmailWithLayout = require('./layout')

const bookingPendingConfirmation = require('./templates/bookingPendingConfirmation')
const bookingConfirmed = require('./templates/bookingConfirmed')
const bookingCancelled = require('./templates/bookingCancelled')
const sessionReminder = require('./templates/sessionReminder')
const reviewRequest = require('./templates/reviewRequest')
const pingPongMessage = require('./templates/pingPongMessage')
const forgotPassword = require('./templates/forgotPassword')
const consultantActivation = require('./templates/consultantActivation')
const requestPublication = require('./templates/requestPublication')
const consultantNoAvailability = require('./templates/consultantNoAvailability')

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
 * @param {{ to: string, toName?: string, subject: string, htmlContent: string, scheduledAt?: string }} params
 */
async function sendEmail({ to, toName, subject, htmlContent, scheduledAt }) {
  const formattedHtml = renderEmailWithLayout(subject, htmlContent)

  const data = await brevo.transactionalEmails.sendTransacEmail({
    sender: DEFAULT_SENDER,
    to: [{ email: to, name: toName }],
    subject,
    htmlContent: formattedHtml,
    ...(scheduledAt ? { scheduledAt } : {}),
  })
  return data
}

/**
 * Cancel a scheduled email in Brevo.
 *
 * @param {string} messageId
 */
async function cancelScheduledEmail(messageId) {
  if (!messageId) return
  try {
    await brevo.transactionalEmails.deleteScheduledSmtpEmail({ messageId })
  } catch (err) {
    console.error(`[brevo] Failed to delete scheduled email ${messageId}:`, err.message)
  }
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

async function sendSessionReminder({ recipientEmail, recipientName, otherPartyName, sessionDate, sessionTime, bookingUrl, minutesBefore, scheduledAt }) {
  const { subject, htmlContent } = sessionReminder({ recipientName, otherPartyName, sessionDate, sessionTime, bookingUrl, minutesBefore })
  return await sendEmail({ to: recipientEmail, toName: recipientName, subject, htmlContent, scheduledAt })
}

async function sendReviewRequest({ clientEmail, clientName, consultantName, sessionDate, bookingUrl, scheduledAt }) {
  const { subject, htmlContent } = reviewRequest({ clientName, consultantName, sessionDate, bookingUrl })
  return await sendEmail({ to: clientEmail, toName: clientName, subject, htmlContent, scheduledAt })
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

async function sendForgotPasswordEmail({ recipientEmail, recipientName, resetUrl }) {
  const { subject, htmlContent } = forgotPassword({ recipientName, resetUrl })
  await sendEmail({ to: recipientEmail, toName: recipientName, subject, htmlContent })
}

async function sendConsultantActivationEmail({ recipientEmail, recipientName, activationUrl, guidesUrl }) {
  const { subject, htmlContent } = consultantActivation({ activationUrl, guidesUrl, recipientName })
  await sendEmail({ to: recipientEmail, toName: recipientName, subject, htmlContent })
}

async function sendPublicationRequestEmail({ adminEmail, consultantName, consultantEmail, adminUrl }) {
  const { subject, htmlContent } = requestPublication({ consultantName, consultantEmail, adminUrl })
  await sendEmail({ to: adminEmail, subject, htmlContent })
}

async function sendNoAvailabilityNotification({ consultantEmail, consultantName, adminEmails = [] }) {
  // Send to consultant
  try {
    const { subject, htmlContent } = consultantNoAvailability({ consultantName, isForAdmin: false })
    await sendEmail({ to: consultantEmail, toName: consultantName, subject, htmlContent })
  } catch (err) {
    console.error(`[brevo] Failed sending no availability email to consultant ${consultantEmail}:`, err.message)
  }

  // Send to admins
  for (const adminEmail of adminEmails) {
    try {
      const { subject, htmlContent } = consultantNoAvailability({ consultantName, isForAdmin: true })
      await sendEmail({ to: adminEmail, subject, htmlContent })
    } catch (err) {
      console.error(`[brevo] Failed sending no availability email to admin ${adminEmail}:`, err.message)
    }
  }
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
  sendForgotPasswordEmail,
  sendConsultantActivationEmail,
  sendPublicationRequestEmail,
  sendNoAvailabilityNotification,
  cancelScheduledEmail,
}
