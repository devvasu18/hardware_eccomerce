const express = require('express');
const router = express.Router();
const SystemSettings = require('../models/SystemSettings');
const { protect, admin } = require('../middleware/authMiddleware');
const notificationService = require('../services/notificationService');

const upload = require('../middleware/uploadMiddleware');

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

// @desc    Upload notification sound
// @route   POST /api/admin/settings/upload-sound
// @access  Admin
router.post('/upload-sound', protect, admin, upload.single('sound'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Return the Cloudinary URL
        res.json({
            success: true,
            message: 'Sound uploaded successfully',
            url: req.file.path
        });
    } catch (error) {
        console.error('Upload sound error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
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
            whatsappIntegrationEnabled,
            tallyIntegrationEnabled,
            shipmentAssetExpiryDays,
            onDemandResponseTime,
            companyAddress,
            companyGstNumber,
            lowStockThreshold,
            lowStockAlertsEnabled,
            onlinePaymentEnabled,
            codEnabled,
            arrivalNotificationEnabled,
            arrivalNotificationSound,
            notificationSoundEnabled,
            notificationSound,
            orderNotificationSound,
            paymentSuccessSound,
            orderUpdateSound,
            adminNotificationSound
        } = req.body;

        // Security Check: Only Super Admin can change system settings
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Not authorized to change system settings' });
        }

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
        if (whatsappIntegrationEnabled !== undefined) settings.whatsappIntegrationEnabled = whatsappIntegrationEnabled;
        if (tallyIntegrationEnabled !== undefined) settings.tallyIntegrationEnabled = tallyIntegrationEnabled;
        if (shipmentAssetExpiryDays !== undefined) settings.shipmentAssetExpiryDays = shipmentAssetExpiryDays;
        if (onDemandResponseTime !== undefined) settings.onDemandResponseTime = onDemandResponseTime;
        if (companyAddress !== undefined) settings.companyAddress = companyAddress;
        if (companyGstNumber !== undefined) settings.companyGstNumber = companyGstNumber;
        if (lowStockThreshold !== undefined) settings.lowStockThreshold = lowStockThreshold;
        if (lowStockAlertsEnabled !== undefined) settings.lowStockAlertsEnabled = lowStockAlertsEnabled;
        if (onlinePaymentEnabled !== undefined) settings.onlinePaymentEnabled = onlinePaymentEnabled;
        if (codEnabled !== undefined) settings.codEnabled = codEnabled;
        if (arrivalNotificationEnabled !== undefined) settings.arrivalNotificationEnabled = arrivalNotificationEnabled;
        if (arrivalNotificationSound !== undefined) settings.arrivalNotificationSound = arrivalNotificationSound;
        if (notificationSoundEnabled !== undefined) settings.notificationSoundEnabled = notificationSoundEnabled;
        if (notificationSound !== undefined) settings.notificationSound = notificationSound;
        if (orderNotificationSound !== undefined) settings.orderNotificationSound = orderNotificationSound;
        if (paymentSuccessSound !== undefined) settings.paymentSuccessSound = paymentSuccessSound;
        if (orderUpdateSound !== undefined) settings.orderUpdateSound = orderUpdateSound;
        if (adminNotificationSound !== undefined) settings.adminNotificationSound = adminNotificationSound;

        await settings.save();

        // Clear cached settings so new notifications use the updated sounds immediately
        notificationService.clearSettingsCache();

        res.json({ success: true, message: 'Settings updated successfully', settings });
    } catch (error) {
        console.error('Update system settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
