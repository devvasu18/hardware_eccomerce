const express = require('express');
const router = express.Router();
const SystemSettings = require('../models/SystemSettings');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Get system settings
// @route   GET /api/admin/settings/system
// @access  Admin
router.get('/system', protect, admin, async (req, res) => {
    try {
        let settings = await SystemSettings.findById('system_settings');

        // Create default if not exists
        if (!settings) {
            settings = await SystemSettings.create({ _id: 'system_settings' });
        }

        res.json(settings);
    } catch (error) {
        console.error('Get system settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Update system settings
// @route   PUT /api/admin/settings/system
// @access  Admin
router.put('/system', protect, admin, async (req, res) => {
    try {
        const {
            companyName,
            companyWebsite,
            supportEmail,
            supportContactNumber,
            whatsappSupportNumber,
            emailNotificationsEnabled,
            whatsappNotificationsEnabled,
            passwordResetNotificationsEnabled,
            shipmentAssetExpiryDays,
            onDemandResponseTime,
            companyAddress,
            companyGstNumber,
            lowStockThreshold,
            lowStockAlertsEnabled
        } = req.body;

        let settings = await SystemSettings.findById('system_settings');

        if (!settings) {
            settings = new SystemSettings({ _id: 'system_settings' });
        }

        // Update fields
        if (companyName !== undefined) settings.companyName = companyName;
        if (companyWebsite !== undefined) settings.companyWebsite = companyWebsite;
        if (supportEmail !== undefined) settings.supportEmail = supportEmail;
        if (supportContactNumber !== undefined) settings.supportContactNumber = supportContactNumber;
        if (whatsappSupportNumber !== undefined) settings.whatsappSupportNumber = whatsappSupportNumber;
        if (emailNotificationsEnabled !== undefined) settings.emailNotificationsEnabled = emailNotificationsEnabled;
        if (whatsappNotificationsEnabled !== undefined) settings.whatsappNotificationsEnabled = whatsappNotificationsEnabled;
        if (passwordResetNotificationsEnabled !== undefined) settings.passwordResetNotificationsEnabled = passwordResetNotificationsEnabled;
        if (shipmentAssetExpiryDays !== undefined) settings.shipmentAssetExpiryDays = shipmentAssetExpiryDays;
        if (onDemandResponseTime !== undefined) settings.onDemandResponseTime = onDemandResponseTime;
        if (companyAddress !== undefined) settings.companyAddress = companyAddress;
        if (companyGstNumber !== undefined) settings.companyGstNumber = companyGstNumber;
        if (lowStockThreshold !== undefined) settings.lowStockThreshold = lowStockThreshold;
        if (lowStockAlertsEnabled !== undefined) settings.lowStockAlertsEnabled = lowStockAlertsEnabled;

        await settings.save();

        res.json({ success: true, message: 'Settings updated successfully', settings });
    } catch (error) {
        console.error('Update system settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
