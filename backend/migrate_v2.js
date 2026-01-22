const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('./models/Order');
const StatusLog = require('./models/StatusLog');

dotenv.config();

/**
 * Migration Script v2
 * 
 * 1. Updates old statuses (Pending, Processing) -> Order Placed
 * 2. Updates old statuses (Shipped) -> Assigned to Bus
 * 3. Creates missing StatusLogs for transparency
 */
async function migrateData() {
    try {
        console.log('🔄 Starting Data Migration...');

        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system');
        console.log('✅ Connected to Database');

        const orders = await Order.find({});
        console.log(`📊 Found ${orders.length} orders to check`);

        let updatedCount = 0;
        let logCount = 0;

        for (const order of orders) {
            let needsSave = false;
            const originalStatus = order.status;

            // Map old statuses to new flow
            if (['Pending', 'Processing'].includes(order.status)) {
                order.status = 'Order Placed';
                needsSave = true;
                console.log(`  📝 Updating Order ${order.invoiceNumber || order._id}: ${originalStatus} -> Order Placed`);
            }
            else if (order.status === 'Shipped') {
                order.status = 'Assigned to Bus';
                needsSave = true;
                console.log(`  📝 Updating Order ${order.invoiceNumber || order._id}: Shipped -> Assigned to Bus`);
            }

            // Save if status changed
            if (needsSave) {
                // Bypass validation for other fields if necessary, but try standard save first
                try {
                    await order.save();
                    updatedCount++;
                } catch (err) {
                    console.warn(`  ⚠️ Failed to save order ${order._id} validation:`, err.message);
                    // Try update directly to bypass full document validation if strictly needed
                    await Order.findByIdAndUpdate(order._id, { status: order.status });
                }
            }

            // Ensure Status Log exists
            const existingLog = await StatusLog.findOne({ order: order._id });
            if (!existingLog) {
                await new StatusLog({
                    order: order._id,
                    status: order.status, // use current (possibly updated) status
                    updatedBy: order.user || order._id, // best effort fallback
                    updatedByName: 'System Migration',
                    updatedByRole: 'system',
                    timestamp: order.createdAt,
                    notes: `Status auto-migrated from ${originalStatus}`,
                    isSystemGenerated: true
                }).save();
                logCount++;
            }
        }

        console.log('\n✅ Migration Complete!');
        console.log(`   - Orders Updated: ${updatedCount}`);
        console.log(`   - Status Logs Created: ${logCount}`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Migration Failed:', err);
        process.exit(1);
    }
}

migrateData();
