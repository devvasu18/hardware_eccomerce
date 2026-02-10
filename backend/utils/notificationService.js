const sendEmail = require('./sendEmail');
const sendWhatsApp = require('./sendWhatsApp');
const SystemSettings = require('../models/SystemSettings');

/**
 * Get system settings with caching
 */
let cachedSettings = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getSystemSettings() {
    const now = Date.now();
    if (cachedSettings && (now - lastFetch) < CACHE_DURATION) {
        return cachedSettings;
    }

    let settings = await SystemSettings.findById('system_settings');

    // Create default settings if not exists
    if (!settings) {
        settings = await SystemSettings.create({ _id: 'system_settings' });
    }

    cachedSettings = settings;
    lastFetch = now;
    return settings;
}

/**
 * Render template with variables
 */
function renderTemplate(template, variables) {
    let rendered = template;

    // Replace {{variable}} patterns
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        rendered = rendered.replace(regex, value || '');
    }

    // Handle {{#each}} blocks
    const eachRegex = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g;
    rendered = rendered.replace(eachRegex, (match, arrayName, blockContent) => {
        const array = variables[arrayName];
        if (!Array.isArray(array) || array.length === 0) {
            return '';
        }

        return array.map(item => {
            let itemContent = blockContent;
            for (const [key, value] of Object.entries(item)) {
                const regex = new RegExp(`{{${key}}}`, 'g');
                itemContent = itemContent.replace(regex, value || '');
            }
            return itemContent;
        }).join('\n');
    });

    return rendered;
}

/**
 * Send notification via both Email and WhatsApp
 * Handles multi-channel WhatsApp to prevent duplicate sends
 */
async function sendNotification({ recipient, email, mobile, subject, emailBody, whatsappBody, variables = {} }) {
    const settings = await getSystemSettings();

    // Add system settings to variables
    const allVariables = {
        ...variables,
        company_name: settings.companyName,
        support_contact_number: settings.supportContactNumber,
        support_email: settings.supportEmail,
        company_website: settings.companyWebsite,
        whatsapp_support_number: settings.whatsappSupportNumber
    };

    const promises = [];

    // Send Email
    if (settings.emailNotificationsEnabled && email) {
        const renderedSubject = renderTemplate(subject, allVariables);
        const renderedBody = renderTemplate(emailBody, allVariables);

        promises.push(
            sendEmail({
                email: email,
                subject: renderedSubject,
                message: renderedBody,
                html: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">${renderedBody.replace(/\n/g, '<br>')}</div>`
            }).catch(err => {
                console.error('Email notification error:', err);
                return { status: 'failed', channel: 'email', error: err.message };
            })
        );
    }

    // Send WhatsApp (Only once, using default sessionId)
    // The WhatsAppWorker will handle multi-session distribution
    if (settings.whatsappNotificationsEnabled && mobile) {
        const renderedWhatsApp = renderTemplate(whatsappBody, allVariables);

        promises.push(
            sendWhatsApp(mobile, renderedWhatsApp, 'default') // Use 'default' - worker will assign to available session
                .catch(err => {
                    console.error('WhatsApp notification error:', err);
                    return { status: 'failed', channel: 'whatsapp', error: err.message };
                })
        );
    }

    const results = await Promise.allSettled(promises);
    return results;
}

module.exports = {
    getSystemSettings,
    renderTemplate,
    sendNotification
};
