/**
 * Sent to both parties as a reminder before the session starts.
 * Typically fired 30 minutes (or 24 hours) before the scheduled time.
 *
 * @param {{ recipientName: string, otherPartyName: string, sessionDate: string, sessionTime: string, bookingUrl: string, minutesBefore: number }} data
 */
function sessionReminder({ recipientName, otherPartyName, sessionDate, sessionTime, bookingUrl, minutesBefore }) {
  const timeLabel = minutesBefore >= 60
    ? `${minutesBefore / 60} hour${minutesBefore / 60 !== 1 ? 's' : ''}`
    : `${minutesBefore} minute${minutesBefore !== 1 ? 's' : ''}`

  const subject = `Reminder: your session starts in ${timeLabel}`

  const htmlContent = `
    <p>Hi ${recipientName},</p>
    <p>
      This is a reminder that your session with <strong>${otherPartyName}</strong> starts in
      <strong>${timeLabel}</strong> on <strong>${sessionDate}</strong> at <strong>${sessionTime}</strong>.
    </p>
    <p>Access your meeting room and session notes here:</p>
    <p><a href="${bookingUrl}">Join session</a></p>
  `

  return { subject, htmlContent }
}

module.exports = sessionReminder
