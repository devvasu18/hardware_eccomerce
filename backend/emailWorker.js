const EmailQueue = require('./models/EmailQueue');
const sendEmail = require('./utils/sendEmail');
const logger = require('./utils/logger');

class EmailWorker {
    constructor() {
        this.isProcessing = false;
        this.MAX_DAILY_EMAILS = 500; // Configurable limit
        this.currentDailyCount = 0;
        this.lastReset = new Date().setHours(0, 0, 0, 0);
        this.isSmtpHealthy = true;
        this.lastHealthCheck = 0;
    }

    async verifySmtp() {
        // If Brevo API is configured, we consider it healthy by default (API will report error during send)
        if (process.env.BREVO_API_KEY) {
            this.isSmtpHealthy = true;
            return true;
        }

        const nodemailer = require('nodemailer');
        const now = Date.now();

        // Only check every 5 minutes
        if (now - this.lastHealthCheck < 5 * 60 * 1000) return this.isSmtpHealthy;

        this.lastHealthCheck = now;

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

            await transporter.verify();
            this.isSmtpHealthy = true;
            return true;
        } catch (error) {
            logger.error('[EmailWorker] SMTP Verification Failed: %s', error.message);
            this.isSmtpHealthy = false;
            return false;
        }
    }

    async start() {
        logger.info('Email background worker started...');
        this.runLoop();
    }

    async runLoop() {
        try {
            await this.processQueue();
        } catch (error) {
            logger.error('[EmailWorker] Error in loop: %O', error);
        }

        // Delay between processing attempts (30 seconds)
        setTimeout(() => this.runLoop(), 30000);
    }

    async processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            // Check daily limit and reset count at midnight
            const today = new Date().setHours(0, 0, 0, 0);
            if (today > this.lastReset) {
                this.currentDailyCount = 0;
                this.lastReset = today;
            }

            // Loop until no more pending emails OR limit reached
            while (this.currentDailyCount < this.MAX_DAILY_EMAILS) {
                // Verify SMTP health before picking up each message
                const isHealthy = await this.verifySmtp();
                if (!isHealthy) {
                    logger.warn('[EmailWorker] SMTP is down, skipping queue processing');
                    break;
                }

                // Atomic Lock & Fetch: Find a pending email
                const email = await EmailQueue.findOneAndUpdate(
                    {
                        status: 'pending',
                        scheduledAt: { $lte: new Date() }
                    },
                    {
                        $set: {
                            status: 'processing',
                            updatedAt: new Date()
                        }
                    },
                    { sort: { scheduledAt: 1 }, new: true }
                );

                if (!email) break; // No more emails to process

                logger.info('[EmailWorker] Processing email to %s: %s...', email.to, email.subject);

                try {
                    // Use the existing utility to actually send the email (queue: false for direct send)
                    const result = await sendEmail({
                        email: email.to,
                        subject: email.subject,
                        message: email.message,
                        html: email.html,
                        queue: false
                    });

                    if (result) {
                        email.status = 'sent';
                        this.currentDailyCount++;
                        logger.info('[EmailWorker] Sent! Daily count: %d', this.currentDailyCount);
                    } else {
                        throw new Error('sendEmail utility returned false');
                    }

                } catch (err) {
                    logger.error('[EmailWorker] Failed to send email to %s: %s', email.to, err.message);

                    email.error = err.message;
                    email.attempts = (email.attempts || 0) + 1;
                    email.lastAttemptAt = new Date();

                    // Exponential backoff strategy (minutes)
                    const retryDelays = [5, 15, 30, 60, 120];
                    const maxAttempts = 5;

                    if (email.attempts < maxAttempts) {
                        const delayMinutes = retryDelays[email.attempts - 1] || 120;
                        email.status = 'pending';
                        email.scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);
                        logger.info('[EmailWorker] Retry %d/%d scheduled in %d mins', email.attempts, maxAttempts, delayMinutes);
                    } else {
                        email.status = 'failed';
                        email.failedAt = new Date();
                        logger.error('[EmailWorker] Email PERMANENTLY FAILED after %d attempts', maxAttempts);
                    }
                }

                await email.save();

                // Small delay between emails to avoid spamming the SMTP server too hard
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            if (this.currentDailyCount >= this.MAX_DAILY_EMAILS) {
                logger.warn('[EmailWorker] Daily email limit reached');
            }

        } catch (error) {
            logger.error('[EmailWorker] Critical error: %O', error);
        } finally {
            this.isProcessing = false;
        }
    }
}

module.exports = new EmailWorker();
