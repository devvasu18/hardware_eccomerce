const wppconnect = require('@wppconnect-team/wppconnect');
const MessageQueue = require('../models/MessageQueue');
const SystemSettings = require('../models/SystemSettings');
const fs = require('fs');

class WhatsAppSessionManager {
    constructor() {
        if (WhatsAppSessionManager.instance) {
            return WhatsAppSessionManager.instance;
        }
        this.sessions = new Map(); // sessionId -> client
        this.qrCodes = new Map(); // sessionId -> base64 qr
        this.status = new Map(); // sessionId -> status
        this.dailyCounters = new Map(); // sessionId -> count
        this.connectedNumbers = new Map(); // sessionId -> phoneNumber
        this.sessionDataPath = './tokens';

        WhatsAppSessionManager.instance = this;
    }

    async isIntegrationEnabled() {
        try {
            const settings = await SystemSettings.findById('system_settings');
            return settings ? settings.whatsappIntegrationEnabled : true;
        } catch (error) {
            console.error('Error checking WhatsApp integration setting:', error);
            return true; // Default to enabled if error
        }
    }

    async fetchConnectedNumber(sessionId, client) {
        try {
            // Retry a few times if info not immediately available
            for (let i = 0; i < 3; i++) {
                if (!client) break;

                try {
                    // Try multiple methods to get the phone number
                    let myNumber = null;

                    // Method 1: getConnectionState
                    const state = await client.getConnectionState();
                    if (state && state.me && state.me.user) {
                        myNumber = state.me.user;
                    }

                    // Method 2: getHostDevice (fallback)
                    if (!myNumber) {
                        const device = await client.getHostDevice();
                        if (device && device.wid) {
                            myNumber = device.wid.user || device.wid._serialized.split('@')[0];
                        }
                    }

                    if (myNumber) {
                        // Check if this number is already used by another session
                        for (const [otherSessionId, otherNumber] of this.connectedNumbers.entries()) {
                            if (otherNumber === myNumber && otherSessionId !== sessionId) {
                                console.error(`[DUPLICATE] Number ${myNumber} is already active on ${otherSessionId}. Closing ${sessionId}.`);
                                await this.stopSession(sessionId);
                                this.status.set(sessionId, 'error_duplicate_number');
                                return null;
                            }
                        }

                        this.connectedNumbers.set(sessionId, myNumber);
                        return myNumber;
                    }
                } catch (methodError) {
                    // Fail silently for retry
                }

                await new Promise(r => setTimeout(r, 2000)); // Wait 2s
            }
            console.warn(`[WARN] Could not fetch number for ${sessionId} after 3 attempts`);
        } catch (error) {
            console.error(`Error fetching number for ${sessionId}:`, error.message);
        }
        return null;
    }

    async startSession(sessionId = 'default') {
        if (this.sessions.has(sessionId)) {
            return this.sessions.get(sessionId);
        }

        const isEnabled = await this.isIntegrationEnabled();
        if (!isEnabled) {
            this.status.set(sessionId, 'disabled');
            return null;
        }

        this.status.set(sessionId, 'initializing');

        try {
            const client = await wppconnect.create({
                session: sessionId,
                catchQR: (base64Qr, asciiQR) => {
                    this.qrCodes.set(sessionId, base64Qr);
                    this.status.set(sessionId, 'qr_ready');
                },
                statusFind: (statusSession, session) => {
                    this.status.set(sessionId, statusSession);
                    if (statusSession === 'inChat' || statusSession === 'isLogged') {
                        this.qrCodes.delete(sessionId);
                        // Fetch number when connected
                        const client = this.sessions.get(sessionId);
                        if (client && !this.connectedNumbers.has(sessionId)) {
                            this.fetchConnectedNumber(sessionId, client);
                        }
                    }
                },
                headless: true,
                devtools: false,
                useChrome: true,
                debug: false,
                logQR: true,
                browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
                autoClose: 0, // Never close automatically
                tokenStore: 'file',
                folderNameToken: `${this.sessionDataPath}/${sessionId}`,
                puppeteerOptions: {
                    userDataDir: `${this.sessionDataPath}/${sessionId}/userDataDir`, // Unique user data dir for each session
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                }
            });

            this.sessions.set(sessionId, client);
            this.status.set(sessionId, 'connected');
            this.qrCodes.delete(sessionId);

            // Get connected number (Async, with retry)
            this.fetchConnectedNumber(sessionId, client);

            return client;

        } catch (error) {
            console.error(`Error starting session ${sessionId}:`, error);
            this.status.set(sessionId, 'error');
            throw error;
        }
    }

    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }

    getStatus(sessionId) {
        // If session is connected but we don't have the number yet, try to fetch it
        const currentStatus = this.status.get(sessionId) || 'disconnected';
        if (['connected', 'inChat', 'isLogged'].includes(currentStatus) && !this.connectedNumbers.has(sessionId)) {
            const client = this.sessions.get(sessionId);
            if (client) {
                // Trigger async fetch (don't await)
                this.fetchConnectedNumber(sessionId, client).catch(err =>
                    console.error(`Failed to fetch number in getStatus for ${sessionId}:`, err)
                );
            }
        }

        return {
            status: currentStatus,
            qr: this.qrCodes.get(sessionId) || null,
            number: this.connectedNumbers.get(sessionId) || null
        };
    }

    async sendMessage(sessionId, number, message) {
        const isEnabled = await this.isIntegrationEnabled();
        if (!isEnabled) {
            throw new Error('WhatsApp integration is disabled in system settings');
        }

        const client = this.sessions.get(sessionId);
        if (!client) {
            throw new Error('Session not active');
        }
        // Ensure number format (append @c.us if missing and remove +)
        const formattedNumber = number.includes('@c.us') ? number : `${number.replace(/\D/g, '')}@c.us`;

        // Enabling linkPreview helps some clients recognize and activate links
        return await client.sendText(formattedNumber, message, {
            linkPreview: true
        });
    }

    async stopSession(sessionId) {
        if (this.sessions.has(sessionId)) {
            const client = this.sessions.get(sessionId);
            try {
                await client.close();
            } catch (error) {
                console.error(`Error closing session ${sessionId}:`, error);
            }
            this.sessions.delete(sessionId);
        }
        this.status.set(sessionId, 'disconnected');
        this.qrCodes.delete(sessionId);
        this.connectedNumbers.delete(sessionId);
    }

    async deleteSession(sessionId) {
        await this.stopSession(sessionId);

        const tokenPath = `${this.sessionDataPath}/${sessionId}`;
        try {
            if (fs.existsSync(tokenPath)) {
                fs.rmSync(tokenPath, { recursive: true, force: true });
            }
        } catch (error) {
            console.error(`Error deleting token path ${tokenPath}:`, error);
        }

        this.status.set(sessionId, 'initializing');
        this.connectedNumbers.delete(sessionId);
        // We set to initializing because usually a delete is followed by a re-init or we want the UI to show it's reset
    }
}

module.exports = new WhatsAppSessionManager();
