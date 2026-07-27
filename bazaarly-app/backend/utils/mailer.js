// backend/utils/mailer.js
// Sends OTP emails using Resend API — works reliably on Railway (HTTPS-based, no SMTP blocking).

async function sendOtpEmail(to, code, purpose) {
  const subject = purpose === 'login' ? 'Your Dostivox login OTP' : 'Your Dostivox password reset OTP';

  const html = `
    <div style="font-family: Arial, sans-serif; font-size: 15px; color: #222;">
      <p>Hi,</p>
      <p>Your one-time password (OTP) is:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 16px 0;">${code}</p>
      <p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      <p>— Dostivox</p>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Dostivox <noreply@dostivox.com>'
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Resend send failed: ${response.status} ${errText}`);
  }
}

module.exports = { sendOtpEmail };
