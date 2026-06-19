/**
 * Sent to a consultant upon registration for account activation and guide onboarding.
 *
 * @param {{ activationUrl: string, guidesUrl: string, recipientName: string }} data
 */
function consultantActivation({ activationUrl, guidesUrl, recipientName }) {
  const subject = 'Activează contul tău de consultant pe SERVIO'

  const htmlContent = `
    <p>Salut ${recipientName || 'bărbat/femeie'},</p>
    <p>
      Îți mulțumim că te-ai înregistrat ca consultant pe platforma SERVIO! Suntem încântați să te avem alături.
    </p>
    <p>Pentru a începe, te rugăm să îți activezi contul dând click pe link-ul de mai jos:</p>
    <p style="margin: 20px 0;">
      <a href="${activationUrl}" style="background: #377DFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Activează contul
      </a>
    </p>
    
    <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 30px 0;" />
    
    <h3 style="color: #101A28; margin-bottom: 12px;">Ghid rapid de completare a profilului</h3>
    <p>Platforma noastră necesită satisfacerea a 5 condiții esențiale înainte ca profilul tău să devină public pentru clienți:</p>
    <ol style="line-height: 1.8; margin-bottom: 20px; padding-left: 20px;">
      <li><strong>Confirmarea adresei de email:</strong> Dă click pe butonul de activare de mai sus.</li>
      <li><strong>Setarea tarifului orar:</strong> Intră în contul tău și configurează prețul orar dorit pentru sesiuni.</li>
      <li><strong>Definirea disponibilității:</strong> Adaugă cel puțin un interval orar în calendarul tău în care clienții pot rezerva sesiuni.</li>
      <li><strong>Finalizarea configurării Stripe:</strong> Conectează-ți contul bancar prin Stripe Connect pentru a primi plățile direct și securizat.</li>
      <li><strong>Completarea datelor de profil:</strong> Completează descrierea profesională, alege specializările și categoriile potrivite.</li>
    </ol>

    <p>
      Am pregătit un ghid detaliat cu sfaturi și recomandări utile pentru a-ți maximiza șansele de atragere a clienților.
    </p>
    <p>Poți accesa ghidul complet aici:</p>
    <p><a href="${guidesUrl}" style="color: #377DFF; font-weight: 600; text-decoration: underline;">Pagina de Ghiduri pentru Consultanți</a></p>
    
    <p style="margin-top: 30px;">Odată ce ai îndeplinit toate aceste condiții, vei putea solicita publicarea profilului direct de pe prima pagină (Acasă) a platformei.</p>
    <p>Mult succes,<br>Echipa SERVIO</p>
  `

  return { subject, htmlContent }
}

module.exports = consultantActivation
