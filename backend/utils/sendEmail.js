const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com', // Default to Gmail if not set
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_EMAIL || 'your_email@gmail.com', // Replace with valid defaults or env
                pass: process.env.SMTP_PASSWORD || 'your_app_password'
            }
        });

        const message = {
            from: `${process.env.FROM_NAME || 'Hardware Store'} <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.html // Optional HTML content
        };

        const info = await transporter.sendMail(message);
        console.log('Message sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Email send failed:', error);
        // We don't want to crash the request if email fails, just log it
        return false;
    }
};

module.exports = sendEmail;
