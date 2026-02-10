# Multi-Channel Customer Notification System - Integration Guide

## Overview
This system provides automated Email + WhatsApp notifications for:
1. Order Confirmation (Paid Products)
2. On-Demand Request Confirmation
3. Mixed Orders (Paid + On-Demand)
4. Shipment Dispatch Notifications

## Files Created

### Backend
- `models/SystemSettings.js` - Dynamic company settings
- `utils/notificationService.js` - Core notification engine with template rendering
- `utils/orderNotifications.js` - Order-specific notification templates
- `routes/shipmentRoutes.js` - Added public tracking endpoint

### Frontend
- `app/shipment/[token]/page.tsx` - Time-bound shipment tracking page

## Integration Steps

### Step 1: Add Notification Imports to Order Controller

Add these imports at the top of `backend/controllers/orderController.js`:

```javascript
const {
    sendOrderConfirmation,
    sendOnDemandRequestConfirmation,
    sendMixedOrderConfirmation,
    sendShipmentDispatchNotification
} = require('../utils/orderNotifications');
```

### Step 2: Integrate Order Confirmation in createOrder Function

Add this code AFTER the order is successfully created and saved (around line 350-360):

```javascript
// After: await order.save();

// Send Order Confirmation Notification
if (!order.notifications.orderConfirmationSent) {
    try {
        const customer = {
            name: order.isGuestOrder ? order.guestCustomer.name : req.user?.username || 'Customer',
            email: order.isGuestOrder ? order.guestCustomer.email : req.user?.email,
            mobile: order.isGuestOrder ? order.guestCustomer.phone : req.user?.mobile
        };

        // Determine order type and send appropriate notification
        const hasPaidItems = order.paymentStatus === 'Paid';
        const hasOnDemandItems = order.items.some(item => item.requestId); // Assuming on-demand items have requestId

        if (hasPaidItems && !hasOnDemandItems) {
            // Scenario 1: Paid products only
            await sendOrderConfirmation(order, customer);
        } else if (!hasPaidItems && hasOnDemandItems) {
            // Scenario 2: On-demand only
            await sendOnDemandRequestConfirmation(order, customer);
        } else if (hasPaidItems && hasOnDemandItems) {
            // Scenario 3: Mixed order
            const paidItems = order.items.filter(item => !item.requestId);
            const onDemandItems = order.items.filter(item => item.requestId);
            await sendMixedOrderConfirmation(order, customer, paidItems, onDemandItems);
        }

        // Mark notification as sent
        order.notifications.orderConfirmationSent = true;
        order.notifications.orderConfirmationSentAt = new Date();
        await order.save();

    } catch (notifError) {
        console.error('Order notification error:', notifError);
        // Don't fail the order creation if notification fails
        order.notifications.notificationErrors.push({
            type: 'order_confirmation',
            error: notifError.message,
            timestamp: new Date()
        });
        await order.save();
    }
}
```

### Step 3: Integrate Shipment Dispatch Notification in updateOrderStatus Function

Add this code when order status changes to "Assigned to Bus" (around line 550-560):

```javascript
// After: await order.save();
// When: order.status === 'Assigned to Bus'

// Send Shipment Dispatch Notification
if (order.status === 'Assigned to Bus' && !order.notifications.shipmentDispatchSent) {
    try {
        const customer = {
            name: order.isGuestOrder ? order.guestCustomer.name : order.user?.username || 'Customer',
            email: order.isGuestOrder ? order.guestCustomer.email : order.user?.email,
            mobile: order.isGuestOrder ? order.guestCustomer.phone : order.user?.mobile
        };

        await sendShipmentDispatchNotification(order, customer);

        // Mark notification as sent
        order.notifications.shipmentDispatchSent = true;
        order.notifications.shipmentDispatchSentAt = new Date();
        await order.save();

    } catch (notifError) {
        console.error('Shipment notification error:', notifError);
        order.notifications.notificationErrors.push({
            type: 'shipment_dispatch',
            error: notifError.message,
            timestamp: new Date()
        });
        await order.save();
    }
}
```

### Step 4: Initialize System Settings

Create a migration script or admin endpoint to initialize system settings:

```javascript
// backend/scripts/initSystemSettings.js
const mongoose = require('mongoose');
const SystemSettings = require('../models/SystemSettings');

async function initSettings() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const settings = await SystemSettings.findById('system_settings');
    if (!settings) {
        await SystemSettings.create({
            _id: 'system_settings',
            companyName: 'CHAMUNDA HARDWARE',
            companyWebsite: 'https://chamundahardware.com',
            supportEmail: 'support@chamundahardware.com',
            supportContactNumber: '+91 1234567890',
            whatsappSupportNumber: '+91 1234567890'
        });
        console.log('System settings initialized');
    }
    
    await mongoose.disconnect();
}

initSettings();
```

### Step 5: WhatsApp Multi-Channel Prevention

The system already handles multi-channel WhatsApp properly:
- `sendWhatsApp()` uses `sessionId: 'default'`
- `WhatsAppWorker` atomically assigns messages to available sessions
- No duplicate sends will occur

## Testing

### 1. Test Order Confirmation
```bash
# Create an order via API
POST http://localhost:5000/api/orders/create
{
  "items": [...],
  "shippingAddress": "...",
  "paymentMethod": "Online",
  "guestCustomer": {
    "name": "Test User",
    "email": "test@example.com",
    "phone": "9876543210"
  }
}

# Check: Email and WhatsApp should be sent
# Check: order.notifications.orderConfirmationSent should be true
```

### 2. Test Shipment Dispatch
```bash
# Update order status to "Assigned to Bus"
PUT http://localhost:5000/api/orders/:orderId/status
{
  "status": "Assigned to Bus",
  "busNumber": "GJ01AB1234",
  "driverContact": "9876543210",
  "departureTime": "2026-02-11T10:00:00",
  "expectedArrival": "2026-02-11T18:00:00"
}

# Check: Email and WhatsApp with tracking link should be sent
# Check: order.notifications.shipmentDispatchSent should be true
```

### 3. Test Shipment Tracking
```bash
# Click the link from the notification
# Should show shipment details
# After 7 days, link should show "Expired" message
```

## Admin Panel Integration (Optional)

Create a System Settings page in the admin panel:

```tsx
// frontend/src/app/admin/settings/system/page.tsx
'use client';

import { useState, useEffect } from 'react';
import api from '../../../utils/api';

export default function SystemSettingsPage() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings/system');
            setSettings(res.data);
        } catch (error) {
            console.error('Failed to fetch settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await api.put('/admin/settings/system', settings);
            alert('Settings saved successfully');
        } catch (error) {
            alert('Failed to save settings');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container">
            <h1>System Settings</h1>
            <form onSubmit={handleSave}>
                <div>
                    <label>Company Name</label>
                    <input
                        type="text"
                        value={settings.companyName}
                        onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                    />
                </div>
                {/* Add more fields */}
                <button type="submit">Save Settings</button>
            </form>
        </div>
    );
}
```

## Environment Variables

Ensure these are set in `.env`:

```env
FRONTEND_URL=http://127.0.0.1:3000
JWT_SECRET=your_secret
MONGO_URI=mongodb://localhost:27017/hardware_system

# Email (Already configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your@email.com
SMTP_PASSWORD=your_password

# WhatsApp (Already configured via wppconnect)
```

## Troubleshooting

### Notifications not sending
1. Check `MessageQueue` collection for pending messages
2. Check WhatsApp worker logs
3. Verify system settings are initialized

### Duplicate WhatsApp messages
- Should NOT happen - worker uses atomic locking
- Check `MessageQueue` for duplicate entries

### Tracking link expired immediately
- Check `SystemSettings.shipmentAssetExpiryDays` value
- Verify timestamp in token is correct

## Summary

✅ Dynamic company information from database
✅ Email + WhatsApp multi-channel
✅ Template-based messaging
✅ Time-bound secure tracking links
✅ Prevents duplicate WhatsApp sends
✅ Handles paid, on-demand, and mixed orders
✅ Production-ready error handling
