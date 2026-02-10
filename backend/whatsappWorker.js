const MessageQueue = require('./models/MessageQueue');
const whatsappManager = require('./services/whatsappSessionManager');

// Anti-Ban & Rate Limiting Config
const MAX_DAILY_MESSAGES = 300;
const MIN_DELAY_MS = 25000; // 25s
const MAX_DELAY_MS = 40000; // 40s
const START_HOUR = 9;
const END_HOUR = 20;

class WhatsAppWorker {
    constructor() {
        // Configuration for multiple sessions
        this.sessions = ['primary', 'secondary'];

        // Tracking stats for each session independently
        this.sessionStats = {
            primary: { count: 0, lastReset: 0, isProcessing: false },
            secondary: { count: 0, lastReset: 0, isProcessing: false }
        };

        this.MAX_DAILY_MESSAGES_PER_SESSION = 300;

        // Health monitoring
        this.lastHealthCheck = {};
        this.reconnectionAttempts = {};
        this.MAX_RECONNECTION_ATTEMPTS = 3;
    }

    resetSessionAttempts(sessionId) {
        this.reconnectionAttempts[sessionId] = 0;
        this.lastHealthCheck[sessionId] = 0;
        // Also reset session stats if needed
        if (this.sessionStats[sessionId]) {
            this.sessionStats[sessionId].isProcessing = false;
        }
    }

    async start() {
        console.log('WhatsApp Multi-Session Worker Started...');

        // Initialize all sessions
        for (const sessionId of this.sessions) {
            this.initSession(sessionId);
        }
    }

    async initSession(sessionId) {
        try {
            console.log(`[Worker] Initializing session: ${sessionId}`);
            await whatsappManager.startSession(sessionId);

            // initialize stats for this session if needed
            this.sessionStats[sessionId].lastReset = new Date().setHours(0, 0, 0, 0);

            // Success! Reset attempts
            this.reconnectionAttempts[sessionId] = 0;

            // Start independent processing loop for this session
            // Using recursive setTimeout instead of setInterval to prevent overlap
            this.runSessionLoop(sessionId);

        } catch (error) {
            console.error(`[Worker] Failed to init session ${sessionId}:`, error);

            // Track reconnection attempts
            this.reconnectionAttempts[sessionId] = (this.reconnectionAttempts[sessionId] || 0) + 1;

            if (this.reconnectionAttempts[sessionId] < this.MAX_RECONNECTION_ATTEMPTS) {
                const retryDelay = Math.min(20000 * this.reconnectionAttempts[sessionId], 60000); // Reduce delay for faster feedback
                console.log(`[Worker] Retry ${this.reconnectionAttempts[sessionId]}/${this.MAX_RECONNECTION_ATTEMPTS} for ${sessionId} in ${retryDelay / 1000}s`);
                setTimeout(() => this.initSession(sessionId), retryDelay);
            } else {
                console.error(`[Worker] Max reconnection attempts (${this.MAX_RECONNECTION_ATTEMPTS}) reached for ${sessionId}. Waiting for manual trigger.`);
                // Set status to indicate manual intervention is needed
                whatsappManager.status.set(sessionId, 'max_retries_reached');
            }
        }
    }

    /**
     * Health check for session - ensures session stays alive
     */
    async checkSessionHealth(sessionId) {
        try {
            const status = whatsappManager.getStatus(sessionId);
            const now = Date.now();

            // If session is disconnected and last check was > 5 mins ago, try to reconnect
            if (status.status !== 'connected' && status.status !== 'inChat' && status.status !== 'isLogged' && status.status !== 'qr_ready') {
                const lastCheck = this.lastHealthCheck[sessionId] || 0;
                if (now - lastCheck > 5 * 60 * 1000) { // 5 minutes
                    console.warn(`[Health] Session ${sessionId} is ${status.status}. Attempting reconnection...`);
                    this.lastHealthCheck[sessionId] = now;
                    await this.initSession(sessionId);
                }
            } else {
                // Reset reconnection counter on successful connection
                this.reconnectionAttempts[sessionId] = 0;
                this.lastHealthCheck[sessionId] = now;
            }
        } catch (error) {
            console.error(`[Health] Check failed for ${sessionId}:`, error.message);
        }
    }

    async runSessionLoop(sessionId) {
        const randomDelay = Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1) + MIN_DELAY_MS);

        try {
            // Health check every loop
            await this.checkSessionHealth(sessionId);

            await this.processQueueForSession(sessionId);
        } catch (error) {
            console.error(`[Worker] Error in loop for ${sessionId}:`, error);
        }

        // Schedule next run with random delay (creates natural "jitter" between sessions)
        setTimeout(() => this.runSessionLoop(sessionId), randomDelay);
    }

    async processQueueForSession(sessionId) {
        const stats = this.sessionStats[sessionId];
        if (stats.isProcessing) return; // Should not happen with revised loop, but safety first
        stats.isProcessing = true;

        try {
            const now = new Date();
            const currentHour = now.getHours();

            // 1. Time Window Check
            // if (currentHour < START_HOUR || currentHour >= END_HOUR) {
            //     // Silent return, just wait for next loop
            //     return;
            // }

            // 2. Daily Limit Check
            const today = new Date().setHours(0, 0, 0, 0);
            if (today > stats.lastReset) {
                stats.count = 0;
                stats.lastReset = today;
            }

            if (stats.count >= this.MAX_DAILY_MESSAGES_PER_SESSION) {
                // Limit reached for this specific session
                return;
            }

            // 3. ATOMIC LOCK & FETCH
            // Find a pending message that is EITHER unassigned ('default') OR assigned to this session specifically
            // And atomically lock it by setting status='processing' and sessionId=sessionId
            const message = await MessageQueue.findOneAndUpdate(
                {
                    status: 'pending',
                    scheduledAt: { $lte: new Date() },
                    $or: [
                        { sessionId: 'default' },        // Unassigned
                        { sessionId: sessionId }         // Assigned to me
                    ]
                },
                {
                    $set: {
                        status: 'processing',
                        sessionId: sessionId, // Lock ownership
                        updatedAt: new Date()
                    }
                },
                { sort: { scheduledAt: 1 }, new: true } // Get the oldest one first
            );

            if (!message) {
                // No messages to process
                return;
            }

            console.log(`[Worker-${sessionId}] Processing message for ${message.recipient}...`);

            // 4. Send Message
            const sessionStatus = whatsappManager.getStatus(sessionId);
            if (sessionStatus.status !== 'connected') {
                console.log(`[Worker-${sessionId}] Session not connected. Releasing message.`);
                // Release message back to queue so other session might pick it up
                message.status = 'pending';
                message.sessionId = 'default'; // Make it available for anyone again
                await message.save();
                return;
            }

            try {
                const result = await whatsappManager.sendMessage(sessionId, message.recipient, message.messageBody);

                message.status = 'sent';
                message.rawResponse = result;
                stats.count++;
                console.log(`[Worker-${sessionId}] Sent! Daily Count: ${stats.count}`);

            } catch (err) {
                console.error(`[Worker-${sessionId}] Failed:`, err.message);

                message.error = err.message;
                message.attempts = (message.attempts || 0) + 1;
                message.lastAttemptAt = new Date();

                // Exponential backoff: 5min, 15min, 30min, 1hr, 2hr
                const retryDelays = [5, 15, 30, 60, 120]; // minutes
                const maxAttempts = 5; // Increased from 3 to 5

                if (message.attempts < maxAttempts) {
                    const delayMinutes = retryDelays[message.attempts - 1] || 120;
                    message.status = 'pending';
                    message.scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);
                    message.sessionId = 'default'; // Release for any session to retry
                    console.log(`[Worker-${sessionId}] Retry ${message.attempts}/${maxAttempts} scheduled in ${delayMinutes} mins`);
                } else {
                    message.status = 'failed';
                    message.failedAt = new Date();
                    console.error(`[Worker-${sessionId}] Message PERMANENTLY FAILED after ${maxAttempts} attempts`);

                    // TODO: Send admin notification for permanently failed message
                }
            }

            await message.save();

        } catch (error) {
            console.error(`[Worker-${sessionId}] Critical Error:`, error);
        } finally {
            stats.isProcessing = false;
        }
    }
}

module.exports = new WhatsAppWorker();
