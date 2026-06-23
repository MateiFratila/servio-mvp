const APP_URL = process.env.APP_URL || 'http://localhost:5173'

/**
 * Wraps HTML email content with a responsive, professional container, featuring
 * SERVIO's logo inside the header and its favicon inside the footer.
 *
 * @param {string} subject - The subject of the email (used in head title / alt text)
 * @param {string} htmlContent - The inner HTML body content of the email
 * @returns {string} Fully wrapped HTML content
 */
function renderEmailWithLayout(subject, htmlContent) {
  const logoUrl = `${APP_URL}/logo-long.jpg`
  const faviconUrl = `${APP_URL}/favicon.png`

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    table {
      border-collapse: collapse;
      border-spacing: 0;
    }
    img {
      border: 0;
      display: block;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 40px 10px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      border: 1px solid #e2e8f0;
    }
    .header {
      background-color: #101a28;
      padding: 24px;
      text-align: center;
    }
    .header-logo {
      margin: 0 auto;
      height: 40px;
      width: auto;
    }
    .content {
      padding: 40px 32px;
      color: #1e293b;
      font-size: 16px;
      line-height: 1.6;
    }
    .content p {
      margin-top: 0;
      margin-bottom: 20px;
    }
    .content p:last-child {
      margin-bottom: 0;
    }
    .content a {
      color: #377dff;
      text-decoration: none;
      font-weight: 500;
    }
    .content a:hover {
      text-decoration: underline;
    }
    .btn {
      display: inline-block;
      background-color: #377dff;
      color: #ffffff !important;
      font-weight: 600;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none !important;
      margin: 10px 0 20px 0;
    }
    .btn:hover {
      background-color: #1d63e0 !important;
    }
    .divider {
      border-top: 1px solid #e2e8f0;
      margin: 32px 0;
    }
    .footer {
      text-align: center;
      padding: 32px;
      color: #64748b;
      font-size: 13px;
      line-height: 1.5;
    }
    .footer-logo-container {
      margin-bottom: 12px;
      display: inline-block;
    }
    .footer-logo {
      display: inline-block;
      vertical-align: middle;
      height: 18px;
      width: 18px;
    }
    .footer p {
      margin: 0 0 8px 0;
    }
    .footer p:last-child {
      margin-bottom: 0;
    }
    .footer-links a {
      color: #64748b;
      text-decoration: underline;
      margin: 0 6px;
    }
  </style>
</head>
<body>
  <table role="presentation" width="100%" class="wrapper">
    <tr>
      <td align="center">
        <table role="presentation" class="container">
          <!-- HEADER -->
          <tr>
            <td class="header" align="center">
              <a href="${APP_URL}" target="_blank">
                <img src="${logoUrl}" alt="SERVIO" class="header-logo" style="max-height: 48px; border:0;">
              </a>
            </td>
          </tr>
          <!-- CONTENT -->
          <tr>
            <td class="content" align="left">
              ${htmlContent}
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td class="footer" align="center">
              <div class="footer-logo-container">
                <img src="${faviconUrl}" alt="S" class="footer-logo">
                <strong style="color: #1e293b; vertical-align: middle; margin-left: 4px;">SERVIO</strong>
              </div>
              <p>Acest e-mail a fost trimis automat de pe platforma SERVIO.</p>
              <p class="footer-links">
                <a href="${APP_URL}" target="_blank">Acasă</a> &bull; 
                <a href="${APP_URL}/acasa?tab=catalog" target="_blank">Catalog</a> &bull; 
                <a href="${APP_URL}/acasa?tab=contul-meu" target="_blank">Contul meu</a>
              </p>
              <p>&copy; ${new Date().getFullYear()} SERVIO. Toate drepturile rezervate.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

module.exports = renderEmailWithLayout
