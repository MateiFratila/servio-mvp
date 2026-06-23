/**
 * Sent to the User when they request a password reset.
 *
 * @param {{ recipientName: string, resetUrl: string }} data
 */
function forgotPassword({ recipientName, resetUrl }) {
  const subject = 'Reset your SERVIO password'

  const htmlContent = `
    <p>Hi ${recipientName || 'there'},</p>
    <p>
      You are receiving this email because you (or someone else) requested a password reset for your SERVIO account.
    </p>
    <p>Please click on the link below to complete the process. This link is valid for 1 hour:</p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${resetUrl}" class="btn" style="background-color: #377dff; color: #ffffff !important; font-weight: 600; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Reset Password</a>
    </p>
    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    <p>Best regards,<br>The SERVIO Team</p>
  `

  return { subject, htmlContent }
}

module.exports = forgotPassword
