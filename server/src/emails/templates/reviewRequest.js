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
    <p style="text-align: center; margin: 24px 0;">
      <a href="${bookingUrl}" class="btn" style="background-color: #377dff; color: #ffffff !important; font-weight: 600; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Leave a review</a>
    </p>
    <p>Thank you for using SERVIO.</p>
  `

  return { subject, htmlContent }
}

module.exports = reviewRequest
