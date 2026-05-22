/**
 * Sent to the Consultant when a Client's payment succeeds.
 * Booking is now in PendingConfirmation — consultant must confirm or decline.
 *
 * @param {{ consultantName: string, clientName: string, sessionDate: string, sessionTime: string, bookingUrl: string }} data
 */
function bookingPendingConfirmation({ consultantName, clientName, sessionDate, sessionTime, bookingUrl }) {
  const subject = `New booking request from ${clientName}`

  const htmlContent = `
    <p>Hi ${consultantName},</p>
    <p>
      <strong>${clientName}</strong> has just paid and requested a session with you on
      <strong>${sessionDate}</strong> at <strong>${sessionTime}</strong>.
    </p>
    <p>Please review the details and confirm or decline the booking:</p>
    <p><a href="${bookingUrl}">View booking</a></p>
    <p>If you take no action, the booking will be auto-confirmed 6 hours before the session.</p>
  `

  return { subject, htmlContent }
}

module.exports = bookingPendingConfirmation
