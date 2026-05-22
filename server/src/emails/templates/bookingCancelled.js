/**
 * Sent to both parties when a booking is cancelled.
 *
 * @param {{ recipientName: string, otherPartyName: string, sessionDate: string, sessionTime: string, refunded: boolean }} data
 */
function bookingCancelled({ recipientName, otherPartyName, sessionDate, sessionTime, refunded }) {
  const subject = `Booking on ${sessionDate} has been cancelled`

  const refundNote = refunded
    ? `<p>Your payment has been refunded. Please allow a few business days for it to appear on your statement.</p>`
    : ''

  const htmlContent = `
    <p>Hi ${recipientName},</p>
    <p>
      Unfortunately, your session with <strong>${otherPartyName}</strong> scheduled for
      <strong>${sessionDate}</strong> at <strong>${sessionTime}</strong> has been cancelled.
    </p>
    ${refundNote}
    <p>If you have any questions, please reach out to our support team.</p>
  `

  return { subject, htmlContent }
}

module.exports = bookingCancelled
