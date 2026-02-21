const CustomPushCampaign = require('../models/CustomPushCampaign');
const CampaignInteraction = require('../models/CampaignInteraction');
const notificationService = require('../services/notificationService');
const User = require('../models/User');
const Device = require('../models/Device');
const mongoose = require('mongoose');

exports.createCampaign = async (req, res) => {
    try {
        const campaign = new CustomPushCampaign(req.body);
        await campaign.save();
        res.status(201).json({ success: true, data: campaign });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getCampaigns = async (req, res) => {
    try {
        const campaigns = await CustomPushCampaign.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: campaigns });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCampaignStrats = async (req, res) => {
    try {
        const campaign = await CustomPushCampaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }
        res.status(200).json({ success: true, data: campaign });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.sendCampaign = async (req, res) => {
    try {
        const campaign = await CustomPushCampaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }

        // Identify target tokens based on audience
        let userIds = [];
        let tokens = [];

        if (campaign.targetAudience === 'ALL') {
            const allUsers = await User.find({}).select('_id');
            userIds = allUsers.map(u => u._id);
        } else if (campaign.targetAudience === 'LOGGED_IN') {
            // In this system all Device tokens with a user ref are basically logged in or were. 
            // We can just get all tokens that have a user attached.
            const allDevices = await Device.find({ user: { $exists: true } });
            tokens = allDevices.map(d => d.token);
            userIds = allDevices.map(d => d.user);
        } else if (campaign.targetAudience === 'SEGMENT') {
            // Implement basic segment filtering
            if (campaign.segment === 'NEW_USER') {
                const recentUsers = await User.find({
                    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                }).select('_id');
                userIds = recentUsers.map(u => u._id);
            } else if (campaign.segment === 'RETURNING_USER' || campaign.segment === 'PREVIOUS_BUYERS') {
                // For demo purposes, we will fetch users who have orders
                const usersWithOrders = await mongoose.model('Order').find().distinct('user');
                userIds = usersWithOrders;
            }
        }

        if (userIds.length > 0 && tokens.length === 0) {
            const devices = await Device.find({ user: { $in: userIds } });
            tokens = devices.map(d => d.token);
            // removing duplicate tokens
            tokens = [...new Set(tokens)];
        }

        if (tokens.length === 0) {
            return res.status(400).json({ success: false, message: 'No reachable devices found for target audience' });
        }

        // Avoid sending identical campaign to user multiple times
        // In real system, we'd filter out recent interactions, but we send it via FCM multicast
        // so we just record "sent" now. Note: proper spam prevention requires filtering tokens
        const previousDeliveries = await CampaignInteraction.find({
            campaignId: campaign._id,
            event: 'DELIVERED',
            deviceToken: { $in: tokens }
        });
        const deliveredTokens = previousDeliveries.map(d => d.deviceToken);
        const filteredTokens = tokens.filter(t => !deliveredTokens.includes(t));

        if (filteredTokens.length === 0) {
            return res.status(400).json({ success: false, message: 'All users in segment already received this campaign (spam prevention)' });
        }


        // Generate redirect URL based on targetScreen
        let baseRedirect = '/';
        if (campaign.targetScreen === 'PRODUCT') {
            baseRedirect = `/products/${campaign.targetId}`;
        } else if (campaign.targetScreen === 'OFFER') {
            baseRedirect = `/offers/${campaign.targetId}`;
        } else if (campaign.targetScreen === 'DEAL') {
            baseRedirect = `/deals/${campaign.targetId}`;
        }
        const redirectUrl = `${baseRedirect}?from_push=true&campaignId=${campaign._id}`;

        // Create the push payload
        const payloadData = {
            type: 'CAMPAIGN',
            campaignId: campaign._id.toString(),
            url: redirectUrl,
            route: baseRedirect,
            imageUrl: campaign.imageUrl || '',
            ctaText: campaign.ctaText || 'View Deal',
            click_action: 'FLUTTER_NOTIFICATION_CLICK' // required for background opening depending on native app
        };

        // Call the notification service's internal push method
        await notificationService.sendPushNotificationToTokens(
            filteredTokens,
            campaign.title,
            campaign.description,
            payloadData,
            campaign.sound || 'default', // Dynamic sound picked by admin
            campaign.imageUrl
        );

        // Update stats
        campaign.stats.delivered += filteredTokens.length;
        campaign.status = 'SENT';
        campaign.sentAt = new Date();
        await campaign.save();

        // Save delivery interactions
        const interactions = filteredTokens.map(token => ({
            campaignId: campaign._id,
            deviceToken: token,
            event: 'DELIVERED'
        }));
        await CampaignInteraction.insertMany(interactions, { ordered: false }).catch(e => console.log('Dup ignored', e.message));

        res.status(200).json({ success: true, message: `Campaign sent to ${filteredTokens.length} devices` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.trackInteraction = async (req, res) => {
    try {
        const { campaignId, event, token } = req.body;
        // event: OPENED or CONVERTED

        if (!campaignId || !event) return res.status(400).json({ success: false, message: "Missing params" });

        const userId = req.user ? req.user._id : null;

        await CampaignInteraction.updateOne(
            { campaignId, event, $or: [{ userId }, { deviceToken: token }] },
            { $setOnInsert: { campaignId, event, userId, deviceToken: token } },
            { upsert: true }
        );

        // Update campaign stats
        const updateField = event === 'OPENED' ? 'stats.opened' : 'stats.converted';
        await CustomPushCampaign.findByIdAndUpdate(campaignId, { $inc: { [updateField]: 1 } });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Track error', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
