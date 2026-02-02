const cron = require('node-cron');
const Order = require('../models/Order');
const Product = require('../models/Product');
const StatusLog = require('../models/StatusLog');

// @desc    Restore stock for abandoned pending orders older than 1 hour
// @schedule Every 30 minutes
const runStockCleanup = () => {
    cron.schedule('*/30 * * * *', async () => {
        console.log('⏰ Cron Job Started: Checking for abandoned pending orders...');

        try {
            // Cutoff time: 1 hour ago
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

            // Find orders that are:
            // 1. Pending Payment or Order Placed (but payment check failed/abandoned if using strict flow, but mainly 'Pending' payment status)
            // Note: If your logic sets 'Order Placed' immediately without payment confirmation for COD, skipping those.
            // Focusing on Online orders that are stuck in 'Pending' payment status (if exists) or 'Processing' where stock was deducted but user left.

            // Adjusting based on current orderController logic: 
            // - Online: paymentStatus='Pending', status='Order Placed' (or transient state). 
            // - Check orderController: paymentStatus is 'Pending' for Online initially. 
            // If they don't pay within 1 hour, we cancel.

            const abandonedOrders = await Order.find({
                createdAt: { $lt: oneHourAgo },
                paymentMethod: 'Online',
                paymentStatus: 'Pending',
                status: { $ne: 'Cancelled' }
            });

            if (abandonedOrders.length === 0) {
                console.log('✅ No abandoned orders found.');
                return;
            }

            console.log(`⚠️ Found ${abandonedOrders.length} abandoned orders. Restoring stock...`);

            for (const order of abandonedOrders) {
                // Restore stock for each item
                for (const item of order.items) {
                    await Product.findByIdAndUpdate(item.product, {
                        $inc: { stock: item.quantity }
                    });
                }

                // Update Order Status
                order.status = 'Cancelled';
                order.paymentStatus = 'Failed'; // Or 'Expired'
                await order.save();

                // Log the system action
                await StatusLog.create({
                    order: order._id,
                    status: 'Cancelled',
                    updatedByName: 'System Cron',
                    updatedByRole: 'system',
                    notes: 'Order cancelled automatically due to payment timeout (1 hour). Stock restored.',
                    isSystemGenerated: true
                });

                console.log(`Resource recovered from Order #${order.orderNumber || order._id}`);
            }

            console.log('✅ Stock cleanup completed.');

        } catch (error) {
            console.error('❌ Cron Job Error:', error);
        }
    });
};

module.exports = runStockCleanup;
