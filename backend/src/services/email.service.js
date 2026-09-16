// Email Gateway - mirrors ai.service.js's philosophy: fully functional with
// ZERO configuration (useful for local dev/demo before you've set up a real
// mailbox), and upgrades to actually sending mail once SMTP_* env vars are
// set. Nothing else in the app should import nodemailer directly.
const nodemailer = require('nodemailer');

function isConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

// Returns { sent: true } if a real email went out, or { sent: false, previewLink }
// if there's no SMTP configured - the caller (auth.controller.js) uses that
// to decide whether it's safe to also hand the link back in the API
// response (only when nothing was actually emailed, so a configured
// production deployment never leaks reset links over the API).
async function sendPasswordResetEmail(toEmail, resetLink) {
  if (!isConfigured()) {
    console.log(`\n[email.service] SMTP not configured - password reset link for ${toEmail}:\n${resetLink}\n`);
    return { sent: false, previewLink: resetLink };
  }

  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: 'Reset your Forever Fit password',
      text: `We received a request to reset your Forever Fit password. Use this link within 1 hour:\n\n${resetLink}\n\nIf you didn't request this, you can safely ignore this email.`,
      html: `<p>We received a request to reset your Forever Fit password.</p><p><a href="${resetLink}">Reset your password</a> (valid for 1 hour).</p><p>If you didn't request this, you can safely ignore this email.</p>`,
    });
    return { sent: true };
  } catch (err) {
    console.error('email.service sendMail failed:', err.message);
    console.log(`[email.service] Falling back to link for ${toEmail}:\n${resetLink}\n`);
    return { sent: false, previewLink: resetLink };
  }
}

module.exports = { sendPasswordResetEmail, isConfigured };
