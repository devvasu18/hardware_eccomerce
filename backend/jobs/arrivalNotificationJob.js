const cron = require('node-cron');
const Shipment = require('../models/Shipment');
const Order = require('../models/Order');
const User = require('../models/User');
const SystemSettings = require('../models/SystemSettings');
const { sendArrivalSoonNotification } = require('../utils/orderNotifications');
const { sendNotification: sendAppNotification } = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * Job to check for shipments arriving in 15 minutes and send notifications
 * Runs every minute
 */
const initArrivalNotificationJob = () => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        try {
            // 1. Get system settings to check if enabled
            const settings = await SystemSettings.findById('system_settings');
            if (!settings || settings.arrivalNotificationEnabled === false) {
                return;
            }

            const now = new Date();
            const fifteenMinsFromNow = new Date(now.getTime() + 15 * 60 * 1000);
            const sixteenMinsFromNow = new Date(now.getTime() + 16 * 60 * 1000);

            // 2. Find shipments arriving in approx 15 minutes
            // We use a small window (15-16 mins) to ensure we pick it up once
            const shipments = await Shipment.find({
                expectedArrival: {
                    $lte: fifteenMinsFromNow,
                    $gt: now
                },
                arrivalNotificationSent: false,
                liveStatus: { $ne: 'Delivered' }
            }).populate({
                path: 'order',
                populate: { path: 'user' }
            });

            if (shipments.length > 0) {
                logger.info(`⏰ Found ${shipments.length} shipments arriving soon. Sending notifications...`);
            }

            for (const shipment of shipments) {
                try {
                    const order = shipment.order;
                    if (!order) continue;

                    const customer = order.user;

                    // Prepare customer data for notification utility
                    // If order was placed by guest, we use guest info from order
                    const recipientInfo = customer ? {
                        name: customer.username || customer.email,
                        email: customer.email,
                        mobile: customer.mobile,
                        settings: customer.settings
                    } : {
                        name: order.shippingAddress?.firstName || 'Customer',
                        email: order.contactEmail,
                        mobile: order.contactMobile,
                        settings: {}
                    };

                    // 1. Send Email/WhatsApp notification
                    await sendArrivalSoonNotification(order, recipientInfo);

                    // 2. Send Push Notification & In-app notification if user is registered
                    if (customer) {
                        await sendAppNotification({
                            userId: customer._id,
                            role: 'USER',
                            title: 'Order Arriving Soon! 🚚',
                            message: `Your order #${order.invoiceNumber || order._id} will reach you in approx 15 minutes.`,
                            type: 'ORDER_ARRIVING',
                            entityId: order._id,
                            redirectUrl: `/orders/${order._id}`,
                            priority: 'high'
                        });
                    }

                    // 3. Mark as sent
                    shipment.arrivalNotificationSent = true;
                    await shipment.save();

                    logger.info(`✅ Arrival notification sent for Order: ${order.invoiceNumber || order._id}`);
                } catch (shipmentErr) {
                    logger.error(`❌ Failed to send arrival notification for shipment ${shipment._id}:`, shipmentErr);
                }
            }
        } catch (error) {
            logger.error('CRON: Arrival Notification Job Error:', error);
        }
    });

    logger.info('🚀 Arrival Notification Cron Job Initialized (Every minute)');
};

module.exports = initArrivalNotificationJob;
