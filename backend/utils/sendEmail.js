const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a transporter object for Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Specify 'gmail' service
    auth: {
      user: process.env.EMAIL_USER, // Your email address from .env
      pass: process.env.EMAIL_PASS  // Your App password from .env
    },
    // The 'tls' option is often used in development to bypass certificate issues,
    // but in production, ensure your certificates are valid.
    tls: {
      rejectUnauthorized: false
    }
  });

  // Define email options
  const mailOptions = {
    from: process.env.EMAIL_FROM, // Sender address (from .env)
    to: options.email,            // Recipient's email
    subject: options.subject,     // Email subject
    html: options.message,        // HTML body content
  };

  // Send the email
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.email}`);
  } catch (error) {
    console.error(`Error sending email to ${options.email}:`, error);
    // In a real application, you might want to log this error more formally
    // or rethrow to handle it upstream
    throw new Error('Email sending failed.');
  }
};

module.exports = sendEmail;