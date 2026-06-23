/**
 * Sent to the Client when the Consultant confirms the booking.
 *
 * @param {{ clientName: string, consultantName: string, sessionDate: string, sessionTime: string, bookingUrl: string }} data
 */
function bookingConfirmed({ clientName, consultantName, sessionDate, sessionTime, bookingUrl }) {
  const subject = `Your session with ${consultantName} is confirmed`

  const htmlContent = `
    <p>Hi ${clientName},</p>
    <p>
      Great news — <strong>${consultantName}</strong> has confirmed your session on
      <strong>${sessionDate}</strong> at <strong>${sessionTime}</strong>.
    </p>
    <p>You can view all meeting details, upload documents, and find the video link here:</p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${bookingUrl}" class="btn" style="background-color: #377dff; color: #ffffff !important; font-weight: 600; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Open meeting details</a>
    </p>
  `

  return { subject, htmlContent }
}

module.exports = bookingConfirmed
