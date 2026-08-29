// ============================================================
// services/emailService.js - Nodemailer Email Service
// ============================================================

const nodemailer = require('nodemailer');

// ─── Transporter Setup ────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// ─── Email Templates ──────────────────────────────────────
const getEmailTemplate = (template, data) => {
  const baseStyle = `
    font-family: 'Segoe UI', Arial, sans-serif;
    max-width: 600px; margin: 0 auto;
    background: #f8f9fa; padding: 20px;
  `;
  const headerStyle = `
    background: linear-gradient(135deg, #1a3c34, #2d6a4f);
    color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;
  `;
  const bodyStyle = `background: white; padding: 30px; border-radius: 0 0 8px 8px;`;
  const btnStyle = `
    display: inline-block; background: #e63946; color: white;
    padding: 12px 30px; text-decoration: none; border-radius: 6px;
    font-weight: bold; margin: 20px 0;
  `;

  const templates = {
    welcome: `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1>🏔️ Welcome to Banjare!</h1>
          <p>Your Uttarakhand Adventure Begins</p>
        </div>
        <div style="${bodyStyle}">
          <h2>Hello, ${data.name}! 🙏</h2>
          <p>Thank you for joining <strong>Banjare</strong> – Uttarakhand's trusted travel and vehicle booking platform.</p>
          <p>You can now:</p>
          <ul>
            <li>🚗 Search and book verified vehicles</li>
            <li>🏕️ Explore curated tour packages</li>
            <li>⭐ Review your travel experiences</li>
          </ul>
          <p>Happy Travels! 🏔️</p>
          <p><em>Team Banjare</em></p>
        </div>
      </div>`,

    bookingConfirmation: `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1>✅ Booking Confirmed!</h1>
        </div>
        <div style="${bodyStyle}">
          <h2>Dear ${data.name},</h2>
          <p>Your booking has been <strong>confirmed</strong>!</p>
          <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background:#f8f9fa"><td style="padding:10px;"><strong>Booking ID</strong></td><td style="padding:10px;">${data.bookingId}</td></tr>
            <tr><td style="padding:10px;"><strong>Vehicle/Tour</strong></td><td style="padding:10px;">${data.vehicleName}</td></tr>
            <tr style="background:#f8f9fa"><td style="padding:10px;"><strong>Start Date</strong></td><td style="padding:10px;">${data.startDate}</td></tr>
            <tr><td style="padding:10px;"><strong>End Date</strong></td><td style="padding:10px;">${data.endDate}</td></tr>
            <tr style="background:#f8f9fa"><td style="padding:10px;"><strong>Total Paid</strong></td><td style="padding:10px;"><strong>₹${data.totalPrice?.toLocaleString()}</strong></td></tr>
            <tr><td style="padding:10px;"><strong>Payment ID</strong></td><td style="padding:10px;">${data.paymentId}</td></tr>
          </table>
          <p>Please keep this email for your records.</p>
          <p><em>Safe Travels! – Team Banjare 🏔️</em></p>
        </div>
      </div>`,

    resetPassword: `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1>🔑 Password Reset</h1>
        </div>
        <div style="${bodyStyle}">
          <h2>Hello ${data.name},</h2>
          <p>We received a request to reset your password. Click the button below:</p>
          <div style="text-align: center;">
            <a href="${data.resetUrl}" style="${btnStyle}">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 14px;">This link expires in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      </div>`
  };

  return templates[template] || `<p>${data.message || 'Notification from Banjare'}</p>`;
};

// ─── Main sendEmail function ──────────────────────────────
const sendEmail = async ({ to, subject, template, data, html }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`📧 Email (dev): To=${to}, Subject=${subject}`);
      return; // Skip in dev if not configured
    }

    const transporter = createTransporter();
    const emailHtml = html || getEmailTemplate(template, data || {});

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Banjare <noreply@banjare.in>',
      to,
      subject,
      html: emailHtml
    });

    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error(`❌ Email failed to ${to}:`, err.message);
    throw err;
  }
};

module.exports = { sendEmail };
