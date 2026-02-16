const express = require('express');
const router = express.Router();
const SystemSettings = require('../models/SystemSettings');

// @desc    Get public system settings (no auth required)
// @route   GET /api/public/settings
// @access  Public
router.get('/settings', async (req, res) => {
    try {
        let settings = await SystemSettings.findById('system_settings');

        // Create default if not exists
        if (!settings) {
            settings = await SystemSettings.create({ _id: 'system_settings' });
        }

        // Return only public fields
        const publicSettings = {
            companyName: settings.companyName,
            companyWebsite: settings.companyWebsite,
            supportEmail: settings.supportEmail,
            supportContactNumber: settings.supportContactNumber,
            whatsappSupportNumber: settings.whatsappSupportNumber,
            companyAddress: settings.companyAddress,
            companyGstNumber: settings.companyGstNumber,
            onlinePaymentEnabled: settings.onlinePaymentEnabled,
            codEnabled: settings.codEnabled,
            notificationSoundEnabled: settings.notificationSoundEnabled,
            notificationSound: settings.notificationSound
        };

        res.json(publicSettings);
    } catch (error) {
        console.error('Get public settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
