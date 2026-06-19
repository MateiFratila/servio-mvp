/**
 * Sent to administrators when a consultant requests publication.
 *
 * @param {{ consultantName: string, consultantEmail: string, adminUrl: string }} data
 */
function requestPublication({ consultantName, consultantEmail, adminUrl }) {
  const subject = `Cerere nouă de publicare profil: ${consultantName}`

  const htmlContent = `
    <p>Salut,</p>
    <p>
      Consultantul <strong>${consultantName}</strong> (${consultantEmail}) a îndeplinit toate cerințele obligatorii și a solicitat publicarea profilului pe platforma SERVIO!
    </p>
    <p>Vă rugăm să revizuiți profilul consultantului în panoul administrativ și să-l activați (isActive: true) dacă totul este în regulă:</p>
    <p style="margin: 20px 0;">
      <a href="${adminUrl}" style="background: #377DFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Accesează Panou Administrare
      </a>
    </p>
    <p>Toate cele 5 verificări esențiale au fost Bifate automat de către sistem:</p>
    <ul style="line-height: 1.8; padding-left: 20px;">
      <li>Email Confirmat: Da</li>
      <li>Tarif Orar Setat: Da</li>
      <li>Disponibilitate configurată: Da</li>
      <li>Stripe Conectat: Da</li>
      <li>Profil Complet (Descriere/Categorii): Da</li>
    </ul>
    <br>
    <p>O zi excelentă,<br>Sistemul de notificări SERVIO</p>
  `

  return { subject, htmlContent }
}

module.exports = requestPublication
