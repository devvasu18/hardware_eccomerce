/**
 * COMPREHENSIVE NOTIFICATION TEST SUITE
 * Purpose: Test all email and WhatsApp notification scenarios (Auth, Orders, Shipment)
 * Recipient: Vasu (9256687043 / vasudevsharma9413@gmail.com)
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const {
    sendOrderConfirmation,
    sendOnDemandRequestConfirmation,
    sendMixedOrderConfirmation,
    sendShipmentDispatchNotification
} = require('./utils/orderNotifications');
const {
    sendPasswordResetRequestNotification,
    sendPasswordResetSuccessNotification
} = require('./utils/authNotifications');
const SystemSettings = require('./models/SystemSettings');

// Load env vars
dotenv.config();

// Configuration for Tester
const TEST_USER = {
    username: 'Vasu',
    name: 'Vasu',
    mobile: '9256687043',
    email: 'vasudevsharma9413@gmail.com'
};

async function runTests() {
    try {
        console.log('🚀 Starting Notification Tests...');

        // 1. Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system');
        console.log('✅ Connected to MongoDB');

        // 2. Ensure Notifications are enabled in System Settings
        let settings = await SystemSettings.findById('system_settings');
        if (!settings) {
            settings = await SystemSettings.create({
                _id: 'system_settings',
                emailNotificationsEnabled: true,
                whatsappNotificationsEnabled: true,
                passwordResetNotificationsEnabled: true
            });
        }

        console.log('🛠  Current Settings:', {
            email: settings.emailNotificationsEnabled,
            whatsapp: settings.whatsappNotificationsEnabled,
            pwdReset: settings.passwordResetNotificationsEnabled
        });

        // --- TEST SCENARIOS ---

        // SCENARIO 1: Password Reset Request (Forgot Password)
        console.log('\n--- Scenario 1: Password Reset Request ---');
        const resetUrl = 'http://localhost:3000/reset-password/test-token-123';
        await sendPasswordResetRequestNotification(TEST_USER, resetUrl);
        console.log('✅ Sent Password Reset Request Notification');

        // SCENARIO 2: Password Reset Success
        console.log('\n--- Scenario 2: Password Reset Success ---');
        await sendPasswordResetSuccessNotification(TEST_USER);
        console.log('✅ Sent Password Reset Success Notification');

        // SCENARIO 3: Order Confirmation (Paid Items)
        console.log('\n--- Scenario 3: Order Confirmation (Paid) ---');
        const mockPaidOrder = {
            _id: new mongoose.Types.ObjectId(),
            invoiceNumber: 'INV-TEST-001',
            createdAt: new Date(),
            items: [
                { productTitle: 'Premium Hammer', modelName: 'PH-200', variationText: 'Steel Head', quantity: 2, priceAtBooking: 450 },
                { productTitle: 'Safety Goggles', modelName: 'SG-50', variationText: 'Clear', quantity: 1, priceAtBooking: 150 }
            ]
        };
        await sendOrderConfirmation(mockPaidOrder, TEST_USER);
        console.log('✅ Sent Order Confirmation Notification');

        // SCENARIO 4: On-Demand Request Received
        console.log('\n--- Scenario 4: On-Demand Request ---');
        const mockOnDemandRequest = {
            _id: new mongoose.Types.ObjectId(),
            items: [
                { productTitle: 'Custom Sheet Metal', modelName: 'SM-X', variationText: '2mm Thick' }
            ]
        };
        await sendOnDemandRequestConfirmation(mockOnDemandRequest, TEST_USER);
        console.log('✅ Sent On-Demand Request Notification');

        // SCENARIO 5: Mixed Order (Paid + On-Demand)
        console.log('\n--- Scenario 5: Mixed Order ---');
        const mockMixedOrder = {
            _id: new mongoose.Types.ObjectId(),
            invoiceNumber: 'INV-MIX-999',
            createdAt: new Date()
        };
        const paidItems = [{ productTitle: 'Nails 10kg', modelName: 'N-10', variationText: 'Galvanized' }];
        const onDemandItems = [{ productTitle: 'Industrial Drill', modelName: 'ID-400', variationText: 'Heavy Duty' }];
        await sendMixedOrderConfirmation(mockMixedOrder, TEST_USER, paidItems, onDemandItems);
        console.log('✅ Sent Mixed Order Notification');

        // SCENARIO 6: Shipment Dispatched (Bus Assigned)
        console.log('\n--- Scenario 6: Shipment Dispatch ---');
        const mockShippedOrder = {
            _id: new mongoose.Types.ObjectId(),
            invoiceNumber: 'INV-SHIP-777',
            items: [{ productTitle: 'Wrenches Set', modelName: 'WS-12', variationText: 'Metric' }],
            busDetails: {
                busNumber: 'GJ-05-XY-1234',
                driverContact: '9876543210 (Rajesh)',
                departureTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours later
                expectedArrival: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours later
            }
        };
        await sendShipmentDispatchNotification(mockShippedOrder, TEST_USER);
        console.log('✅ Sent Shipment Dispatch Notification');

        console.log('\n✨ All test cases queued successfully!');
        console.log('NOTE: Since these are queue-based, check the terminal logs or your device to see them being processed by the worker.');

        // Wait a few seconds for workers to potentially start processing if running in this script (though they are usually separate)
        console.log('\nWaiting 5 seconds before closing...');
        setTimeout(() => {
            mongoose.connection.close();
            console.log('👋 Database connection closed.');
            process.exit(0);
        }, 5000);

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

runTests();
