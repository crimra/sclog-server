import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function testEmailConfig() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    // Verify connection configuration
    await transporter.verify();
    console.log('Server is ready to take our messages');

    // Send test email
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.RECIPIENT_EMAIL,
      subject: 'Test Email Configuration',
      text: 'If you receive this email, it means your email configuration is working correctly.'
    });

    console.log('Test email sent:', info.messageId);
  } catch (error) {
    console.error('Error:', error);
  }
}

testEmailConfig();