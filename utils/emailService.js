// backend/emailService.js
const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");

const FROM = process.env.EMAIL_FROM;
const USE_SENDGRID = process.env.USE_SENDGRID === "true";

if (USE_SENDGRID) {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error("SENDGRID_API_KEY required when USE_SENDGRID=true");
  }
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

async function sendEmail({ to, subject, html, text }) {
  if (USE_SENDGRID) {
    const msg = { to, from: FROM, subject, html, text };
    await sgMail.send(msg);
    return;
  }

  // Nodemailer SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: FROM,
    to,
    subject,
    html,
    text,
  });
}

module.exports = { sendEmail };
