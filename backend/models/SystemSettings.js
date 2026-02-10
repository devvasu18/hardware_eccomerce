const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    // Company Information
    companyName: {
        type: String,
        default: 'CHAMUNDA HARDWARE'
    },
    companyWebsite: {
        type: String,
        default: 'https://chamundahardware.com'
    },
    supportEmail: {
        type: String,
        default: 'support@chamundahardware.com'
    },
    supportContactNumber: {
        type: String,
        default: '+91 1234567890'
    },
    whatsappSupportNumber: {
        type: String,
        default: '+91 1234567890'
    },
    companyAddress: {
        type: String,
        default: '123, GIDC Industrial Estate, Vapi, Gujarat - 396195'
    },
    companyGstNumber: {
        type: String,
        default: '24ABCDE1234F1Z5'
    },

    // Notification Settings
    emailNotificationsEnabled: {
        type: Boolean,
        default: true
    },
    whatsappNotificationsEnabled: {
        type: Boolean,
        default: true
    },
    passwordResetNotificationsEnabled: {
        type: Boolean,
        default: true
    },

    // WhatsApp Multi-Channel Settings
    whatsappPrimarySession: {
        type: String,
        default: 'primary'
    },
    whatsappSecondarySession: {
        type: String,
        default: 'secondary'
    },

    // Shipment Settings
    shipmentAssetExpiryDays: {
        type: Number,
        default: 7
    },

    // Inventory Settings
    lowStockThreshold: {
        type: Number,
        default: 10
    },
    lowStockAlertsEnabled: {
        type: Boolean,
        default: true
    },

    // On-Demand Settings
    onDemandResponseTime: {
        type: String,
        default: '48 hours'
    },

    // Single Document Pattern (Only one settings document)
    _id: {
        type: String,
        default: 'system_settings'
    }

}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
