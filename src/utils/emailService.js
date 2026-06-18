const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or use 'outlook', 'yahoo', or SMTP host
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send reset password email
async function sendResetPasswordEmail(to, resetToken) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: 'Password Reset Token - Hostel Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Password Reset Request</h2>
        <p>Hi there,</p>
        <p>We received a request to reset your password for the Hostel Management System.</p>
        <p style="background-color: #F3F4F6; padding: 15px; border-radius: 8px;">
          Your Reset Token: <strong style="color: #1E88E5; font-size: 18px;">${resetToken}</strong>
        </p>
        <p>This token will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <br>
        <p>Best regards,<br>Hostel Management System Team</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

module.exports = {
  sendResetPasswordEmail,
};
