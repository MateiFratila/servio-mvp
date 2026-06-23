/**
 * Sent to the counterpart when a message/document is posted during the ping-pong phase.
 * Does NOT include the actual message content or file — just the event type and a link.
 *
 * @param {{
 *   recipientName: string,
 *   senderRole: 'consultant' | 'client',
 *   senderName: string,
 *   eventType: 'message' | 'document' | 'message_with_document',
 *   bookingUrl: string,
 * }} data
 */
function pingPongMessage({ recipientName, senderRole, senderName, eventType, bookingUrl }) {
  const eventDescriptions = {
    message: 'a trimis un mesaj',
    document: 'a încărcat un document',
    message_with_document: 'a trimis un mesaj cu un document atașat',
  }

  const senderLabel = senderRole === 'consultant' ? 'Consultantul tău' : 'Clientul tău'
  const eventText = eventDescriptions[eventType] || 'a trimis un mesaj'

  const subject = `${senderLabel} ${eventText} — ${senderName}`

  const htmlContent = `
    <p>Bună ${recipientName},</p>
    <p>
      <strong>${senderName}</strong> (${senderRole === 'consultant' ? 'consultant' : 'client'})
      ${eventText} legat de sesiunea ta.
    </p>
    <p>Deschide pagina sesiunii pentru a vedea detaliile și a răspunde:</p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${bookingUrl}" class="btn" style="background-color: #377dff; color: #ffffff !important; font-weight: 600; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Deschide sesiunea</a>
    </p>
  `

  return { subject, htmlContent }
}

module.exports = pingPongMessage
