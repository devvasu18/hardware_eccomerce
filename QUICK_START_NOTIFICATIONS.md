# 🚀 Quick Start Guide - Multi-Channel Notifications

## ⚡ 5-Minute Setup

### Step 1: Configure System Settings (2 minutes)

1. **Login as Super Admin**
2. **Navigate to:** Admin Panel → System Settings → System Settings
3. **Fill in the form:**
   ```
   Company Name: CHAMUNDA HARDWARE
   Support Email: support@chamundahardware.com
   Support Contact: +91 1234567890
   WhatsApp Support: +91 1234567890
   ```
4. **Click "Save Settings"**

✅ **Done!** Your company information is now configured.

---

### Step 2: Integrate Notifications (3 minutes)

Open `backend/controllers/orderController.js` and add these code snippets:

#### A. Add Imports (Top of file)
```javascript
const {
    sendOrderConfirmation,
    sendOnDemandRequestConfirmation,
    sendMixedOrderConfirmation,
    sendShipmentDispatchNotification
} = require('../utils/orderNotifications');
```

#### B. Add to `createOrder` function (After `await order.save()`)
```javascript
// Send Order Confirmation Notification
if (!order.notifications.orderConfirmationSent) {
    try {
        const customer = {
            name: order.isGuestOrder ? order.guestCustomer.name : req.user?.username || 'Customer',
            email: order.isGuestOrder ? order.guestCustomer.email : req.user?.email,
            mobile: order.isGuestOrder ? order.guestCustomer.phone : req.user?.mobile
        };

        const hasPaidItems = order.paymentStatus === 'Paid';
        const hasOnDemandItems = order.items.some(item => item.requestId);

        if (hasPaidItems && !hasOnDemandItems) {
            await sendOrderConfirmation(order, customer);
        } else if (!hasPaidItems && hasOnDemandItems) {
            await sendOnDemandRequestConfirmation(order, customer);
        } else if (hasPaidItems && hasOnDemandItems) {
            const paidItems = order.items.filter(item => !item.requestId);
            const onDemandItems = order.items.filter(item => item.requestId);
            await sendMixedOrderConfirmation(order, customer, paidItems, onDemandItems);
        }

        order.notifications.orderConfirmationSent = true;
        order.notifications.orderConfirmationSentAt = new Date();
        await order.save();
    } catch (notifError) {
        console.error('Order notification error:', notifError);
    }
}
```

#### C. Add to `updateOrderStatus` function (When status = "Assigned to Bus")
```javascript
// Send Shipment Dispatch Notification
if (order.status === 'Assigned to Bus' && !order.notifications.shipmentDispatchSent) {
    try {
        const customer = {
            name: order.isGuestOrder ? order.guestCustomer.name : order.user?.username || 'Customer',
            email: order.isGuestOrder ? order.guestCustomer.email : order.user?.email,
            mobile: order.isGuestOrder ? order.guestCustomer.phone : order.user?.mobile
        };

        await sendShipmentDispatchNotification(order, customer);

        order.notifications.shipmentDispatchSent = true;
        order.notifications.shipmentDispatchSentAt = new Date();
        await order.save();
    } catch (notifError) {
        console.error('Shipment notification error:', notifError);
    }
}
```

✅ **Done!** Notifications are now integrated.

---

## 🧪 Testing (5 minutes)

### Test 1: Order Confirmation

1. **Create a test order** via your frontend or API:
   ```bash
   POST http://localhost:5000/api/orders/create
   {
     "items": [...],
     "shippingAddress": "Test Address",
     "paymentMethod": "Online",
     "guestCustomer": {
       "name": "Test User",
       "email": "test@example.com",
       "phone": "9876543210"
     }
   }
   ```

2. **Check your email** - You should receive order confirmation
3. **Check WhatsApp** - You should receive WhatsApp message
4. **Verify in database:**
   ```javascript
   order.notifications.orderConfirmationSent === true
   ```

✅ **Expected Result:** Email + WhatsApp sent with company name from settings

---

### Test 2: Shipment Dispatch

1. **Assign order to bus** via admin panel or API:
   ```bash
   PUT http://localhost:5000/api/orders/:orderId/status
   {
     "status": "Assigned to Bus",
     "busNumber": "GJ01AB1234",
     "driverContact": "9876543210",
     "departureTime": "2026-02-11T10:00:00",
     "expectedArrival": "2026-02-11T18:00:00"
   }
   ```

2. **Check email** - Should contain tracking link
3. **Check WhatsApp** - Should contain tracking link
4. **Click tracking link** - Should show shipment details

✅ **Expected Result:** Tracking page shows bus details and items

---

### Test 3: Link Expiry

1. **In System Settings**, set expiry to 1 day
2. **Create order and assign to bus**
3. **Wait 24+ hours** (or manually change timestamp in token)
4. **Click tracking link**

✅ **Expected Result:** "Link Expired" message

---

## 📱 WhatsApp Setup

### Ensure WhatsApp Sessions Are Connected

1. **Navigate to:** Admin Panel → System Settings → WhatsApp Integration
2. **Check status** of Primary and Secondary sessions
3. **If disconnected:**
   - Click "Restart Session"
   - Scan QR code with WhatsApp
   - Wait for "Connected" status

✅ **Expected Result:** Both sessions show "Connected" with phone numbers

---

## 🎯 What Happens When?

| Event | Notification Sent | Channels | Template Used |
|-------|------------------|----------|---------------|
| Order Created (Paid) | ✅ Immediately | Email + WhatsApp | Order Confirmation |
| Order Created (On-Demand) | ✅ Immediately | Email + WhatsApp | On-Demand Request |
| Order Created (Mixed) | ✅ Immediately | Email + WhatsApp | Mixed Order |
| Status → Assigned to Bus | ✅ Immediately | Email + WhatsApp | Shipment Dispatch |

---

## 🔧 Troubleshooting

### Notifications Not Sending?

1. **Check System Settings:**
   - Email Notifications Enabled? ✅
   - WhatsApp Notifications Enabled? ✅

2. **Check WhatsApp Sessions:**
   - Both sessions connected? ✅
   - Check `/admin/settings/whatsapp`

3. **Check Message Queue:**
   ```javascript
   // In MongoDB
   db.messagequeues.find({ status: 'pending' })
   ```

4. **Check Backend Logs:**
   ```bash
   # Look for errors
   [Worker] Error in loop
   [Notification] Failed to send
   ```

### Email Not Received?

1. **Check SMTP settings** in `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_EMAIL=your@email.com
   SMTP_PASSWORD=your_app_password
   ```

2. **Check spam folder**

3. **Verify email in System Settings** matches SMTP sender

### WhatsApp Not Received?

1. **Check session status** in admin panel
2. **Verify phone number format:** `+91XXXXXXXXXX` or `91XXXXXXXXXX`
3. **Check message queue:**
   ```javascript
   db.messagequeues.find({ recipient: '919876543210' })
   ```

4. **Check daily limit:** Max 300 messages per session

---

## 📊 Monitoring

### Check Queue Health

**Backend logs on startup:**
```
[Queue Health] {
  pending: 0,
  processing: 0,
  sent: 45,
  failed: 0,
  total: 45,
  oldestPendingAge: 0
}
```

### Check Notification Status

**In Order document:**
```javascript
{
  notifications: {
    orderConfirmationSent: true,
    orderConfirmationSentAt: ISODate("2026-02-10T09:00:00Z"),
    shipmentDispatchSent: true,
    shipmentDispatchSentAt: ISODate("2026-02-10T14:00:00Z"),
    notificationErrors: []
  }
}
```

---

## 🎉 You're All Set!

Your multi-channel notification system is now:
- ✅ Configured with company settings
- ✅ Integrated with order flow
- ✅ Tested and working
- ✅ Monitored and healthy

### Next Steps:
1. Customize email/WhatsApp templates in `backend/utils/orderNotifications.js`
2. Add more notification scenarios as needed
3. Monitor queue health regularly
4. Adjust settings as business grows

---

## 📚 Need More Help?

- **Full Integration Guide:** `NOTIFICATION_INTEGRATION_GUIDE.md`
- **System Settings Guide:** `SYSTEM_SETTINGS_GUIDE.md`
- **Architecture Overview:** `NOTIFICATION_ARCHITECTURE.md`

---

**Questions?** Check the documentation or review the code comments! 🚀
