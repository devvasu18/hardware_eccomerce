const nodemailer = require('nodemailer');

/**
 * Send email utility
 * Now supports queuing for zero-failure delivery
 */
const sendEmail = async (options) => {
    // If we want to queue it (default behavior for high reliability)
    if (options.queue !== false) {
        try {
            const EmailQueue = require('../models/EmailQueue');
            await EmailQueue.create({
                to: options.email,
                subject: options.subject,
                message: options.message,
                html: options.html,
                scheduledAt: options.scheduledAt || new Date()
            });
            return true;
        } catch (error) {
            console.error('Email queuing failed, falling back to direct send:', error);
            // Fall through to direct send if queuing fails
        }
    }

    // Priority 1: Brevo API (Very reliable)
    if (process.env.BREVO_API_KEY) {
        try {
            const axios = require('axios');

            // Dynamic Sender info from System Settings
            let senderName = process.env.FROM_NAME || 'Hardware Store';
            let senderEmail = process.env.FROM_EMAIL || process.env.ADMIN_EMAIL;

            try {
                const SystemSettings = require('../models/SystemSettings');
                const settings = await SystemSettings.findById('system_settings');
                if (settings) {
                    senderName = settings.companyName || senderName;
                    senderEmail = settings.supportEmail || senderEmail;
                }
            } catch (sdErr) {
                // Ignore DB error, use fallbacks
            }

            const data = {
                sender: {
                    name: senderName,
                    email: senderEmail
                },
                to: [{ email: options.email }],
                subject: options.subject,
                textContent: options.message,
                htmlContent: options.html
            };

            const response = await axios.post('https://api.brevo.com/v3/smtp/email', data, {
                headers: {
                    'api-key': process.env.BREVO_API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 201 || response.status === 200) {
                console.log('Brevo API Email sent:', response.data.messageId);
                return true;
            }
        } catch (error) {
            console.error('Brevo API failed:', error.response?.data || error.message);
            // Fall through to SMTP if API fails
        }
    }

    // Priority 2: Direct Send Logic (SMTP)
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD
            }
        });

        // Dynamic Sender info from System Settings (Reuse logic or fetch again if Brevo failed)
        let senderName = process.env.FROM_NAME || 'Hardware Store';
        let senderEmail = process.env.FROM_EMAIL || process.env.SMTP_EMAIL || process.env.ADMIN_EMAIL;

        try {
            const SystemSettings = require('../models/SystemSettings');
            const settings = await SystemSettings.findById('system_settings');
            if (settings) {
                senderName = settings.companyName || senderName;
                senderEmail = settings.supportEmail || senderEmail;
            }
        } catch (sdErr) {
            // Ignore DB error, use fallbacks
        }

        const message = {
            from: `${senderName} <${senderEmail}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.html
        };

        const info = await transporter.sendMail(message);
        console.log('Direct SMTP Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Direct SMTP Email send failed:', error.message);
        return false;
    }
};

module.exports = sendEmail;
