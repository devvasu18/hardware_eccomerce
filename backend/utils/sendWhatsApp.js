const MessageQueue = require('../models/MessageQueue');

const sendWhatsApp = async (recipient, message, sessionId = 'default') => {
    try {
        if (!recipient || !message) return false;

        // Basic normalization
        let formattedRecipient = String(recipient).replace(/\D/g, '');
        if (formattedRecipient.length === 10) {
            formattedRecipient = '91' + formattedRecipient;
        }

        await MessageQueue.create({
            recipient: formattedRecipient,
            messageBody: message,
            sessionId,
            status: 'pending'
        });
        return true;
    } catch (error) {
        console.error('WhatsApp Queue Error:', error);
        return false;
    }
};

module.exports = sendWhatsApp;
