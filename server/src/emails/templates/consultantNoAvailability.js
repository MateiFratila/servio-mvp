/**
 * Sent to the Consultant and Admins when a client tried to book but didn't find any availability slots.
 *
 * @param {{ consultantName: string, isForAdmin: boolean }} data
 */
function consultantNoAvailability({ consultantName, isForAdmin }) {
  const subject = isForAdmin
    ? `Lipsește disponibilitate consultant: ${consultantName}`
    : `Ai o solicitare de programare fără intervale disponibile`

  const messageText = isForAdmin
    ? `Un client a încercat să rezerve o ședință cu consultantul <strong>${consultantName}</strong>, dar din păcate acest consultant nu are niciun interval orar disponibil definit.`
    : `Salut <strong>${consultantName}</strong>,<br><br>Un client a încercat să rezerve o ședință cu tine, dar din păcate nu a găsit niciun interval de disponibilitate activ.<br><br>Te rugăm să îți actualizezi calendarul din contul tău pentru a nu pierde potențiali clienți.`

  const htmlContent = `
    <p>Salut,</p>
    <p>
      ${messageText}
    </p>
    <p>Te rugăm să iei măsurile necesare în panoul de control.</p>
    <br>
    <p>O zi excelentă,<br>Sistemul de notificări SERVIO</p>
  `

  return { subject, htmlContent }
}

module.exports = consultantNoAvailability
