/**
 * Sent to the Client after a session completes, asking for a review.
 *
 * @param {{ clientName: string, consultantName: string, sessionDate: string, bookingUrl: string }} data
 */
function reviewRequest({ clientName, consultantName, sessionDate, bookingUrl }) {
  const subject = `How was your session with ${consultantName}?`

  const htmlContent = `
    <p>Hi ${clientName},</p>
    <p>
      Your session with <strong>${consultantName}</strong> on <strong>${sessionDate}</strong> is now complete.
      We'd love to hear your feedback!
    </p>
    <p>Leaving a review helps others find the right consultant and only takes a minute:</p>
    <p><a href="${bookingUrl}">Leave a review</a></p>
    <p>Thank you for using SERVO.</p>
  `

  return { subject, htmlContent }
}

module.exports = reviewRequest
