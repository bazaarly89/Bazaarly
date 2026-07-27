// backend/utils/mailer.js
// Sends OTP emails using Gmail SMTP (free — up to ~500 emails/day on a normal Gmail account).
//
// SETUP (one-time, free):
// 1. Use (or create) a Gmail account for the store, e.g. dostivox.noreply@gmail.com
// 2. Turn on 2-Step Verification on that Google account (Google Account -> Security)
// 3. Go to https://myaccount.google.com/apppasswords and generate an "App Password"
//    (choose app: Mail, device: Other -> "Dostivox Backend")
// 4. Google gives you a 16-character password. Add these to your backend .env (and Railway variables):
//      GMAIL_USER=dostivox.noreply@gmail.com
//      GMAIL_APP_PASSWORD=the16charapppassword
//
// Nothing else to configure — this file reads those two env vars.

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});
async function sendOtpEmail(to, code, purpose) {
  const subject =
    purpose === 'login' ? 'Your Dostivox login OTP' : 'Your Dostivox password reset OTP';

  const html = `
    <div style="font-family: Arial, sans-serif; font-size: 15px; color: #222;">
      <p>Hi,</p>
      <p>Your one-time password (OTP) is:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 16px 0;">${code}</p>
      <p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      <p>— Dostivox</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Dostivox" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = { sendOtpEmail };

