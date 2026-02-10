# System Settings Admin Panel - Complete Setup

## ✅ What's Been Created

### Frontend Admin Page
**Location:** `frontend/src/app/admin/settings/system/page.tsx`

**Features:**
- ✅ Company Information Management
  - Company Name
  - Company Website
  - Support Email
  - Support Contact Number
  - WhatsApp Support Number

- ✅ Notification Preferences
  - Email Notifications Toggle
  - WhatsApp Notifications Toggle

- ✅ Advanced Settings
  - Shipment Asset Expiry Days (1-30 days)
  - On-Demand Response Time

- ✅ UI/UX Features
  - Beautiful, modern interface
  - Real-time form validation
  - Success/Error modals
  - Loading states
  - Responsive design
  - Toggle switches for boolean settings

### Backend API
**Location:** `backend/routes/settingsRoutes.js`

**Endpoints:**
- `GET /api/admin/settings/system` - Fetch current settings
- `PUT /api/admin/settings/system` - Update settings

**Features:**
- Auto-creates default settings if not exists
- Admin-only access (protected routes)
- Validates and sanitizes input
- Returns updated settings after save

### Navigation
**Updated:** `frontend/src/app/admin/components/AdminSidebar.tsx`

**Added Link:**
- System Settings → `/admin/settings/system`
- Located under "System Settings" dropdown
- Super Admin only access

## 🚀 How to Use

### 1. Access the Settings Page

1. Login as Super Admin
2. Navigate to **Admin Panel**
3. Click **System Settings** in sidebar
4. Click **System Settings** (first option)

### 2. Configure Company Information

Fill in all required fields marked with `*`:
- Company Name (e.g., "CHAMUNDA HARDWARE")
- Support Email
- Support Contact Number (e.g., "+91 1234567890")
- WhatsApp Support Number

Optional fields:
- Company Website

### 3. Configure Notifications

Toggle notifications on/off:
- **Email Notifications** - Enable/disable email alerts
- **WhatsApp Notifications** - Enable/disable WhatsApp messages

### 4. Configure Advanced Settings

- **Shipment Asset Expiry Days**: How long tracking links remain valid (default: 7 days)
- **On-Demand Response Time**: Expected response time shown to customers (default: "48 hours")

### 5. Save Settings

Click **Save Settings** button. You'll see:
- Success message on successful save
- Error message if save fails
- Loading state while saving

## 🔄 How Settings Are Used

### In Order Notifications

When an order is placed, the system uses these settings:

**Email Template:**
```
Hi {{customer_name}},

Thank you for shopping with {{company_name}} 🎉
...
📞 {{support_contact_number}}
📧 {{support_email}}

Warm regards,  
{{company_name}}
```

**WhatsApp Template:**
```
Hello {{customer_name}} 👋

Your order has been successfully placed with *{{company_name}}* ✅
...
For any help, contact us:
📞 {{support_contact_number}}

Thank you for choosing {{company_name}} 🙏
```

### In Shipment Tracking

- **Expiry Days**: Determines how long tracking links work
- **Company Info**: Displayed on tracking page

### Dynamic Updates

- Settings are cached for 5 minutes for performance
- Changes take effect immediately after cache refresh
- No server restart required

## 📊 Default Values

If settings don't exist, these defaults are used:

```javascript
{
  companyName: 'CHAMUNDA HARDWARE',
  companyWebsite: 'https://chamundahardware.com',
  supportEmail: 'support@chamundahardware.com',
  supportContactNumber: '+91 1234567890',
  whatsappSupportNumber: '+91 1234567890',
  emailNotificationsEnabled: true,
  whatsappNotificationsEnabled: true,
  shipmentAssetExpiryDays: 7,
  onDemandResponseTime: '48 hours'
}
```

## 🔒 Security

- **Admin Only**: Only Super Admins can access
- **Protected Routes**: JWT authentication required
- **Validation**: Server-side validation on all inputs
- **Single Document**: Only one settings document exists (ID: 'system_settings')

## 🧪 Testing

### Test Settings Page

1. Navigate to `/admin/settings/system`
2. Verify all fields load correctly
3. Change company name
4. Click Save
5. Refresh page
6. Verify changes persisted

### Test Notification Integration

1. Update company name to "TEST COMPANY"
2. Save settings
3. Create a test order
4. Check email/WhatsApp notifications
5. Verify "TEST COMPANY" appears in messages

### Test Shipment Tracking

1. Set expiry days to 1
2. Save settings
3. Create order and assign to bus
4. Click tracking link
5. Wait 24+ hours
6. Verify link shows "Expired" message

## 🎨 UI Preview

The settings page features:
- Clean, modern card-based layout
- Organized sections with icons
- Helpful descriptions under each field
- Toggle switches for boolean settings
- Responsive grid layout
- Professional color scheme
- Loading and saving states

## 📝 Notes

- All fields with `*` are required
- Phone numbers should include country code (e.g., +91)
- Email must be valid format
- Expiry days must be between 1-30
- Changes are saved to MongoDB
- Settings are shared across all notification types

## 🔗 Related Files

**Models:**
- `backend/models/SystemSettings.js`

**Services:**
- `backend/utils/notificationService.js`
- `backend/utils/orderNotifications.js`

**Routes:**
- `backend/routes/settingsRoutes.js`

**Frontend:**
- `frontend/src/app/admin/settings/system/page.tsx`
- `frontend/src/app/admin/components/AdminSidebar.tsx`

## ✨ Summary

You now have a complete, production-ready System Settings admin panel that:
- ✅ Manages all company information dynamically
- ✅ Controls notification preferences
- ✅ Configures advanced settings
- ✅ Integrates seamlessly with notification system
- ✅ Provides excellent UX with modern UI
- ✅ Is secure and admin-only
- ✅ Requires no server restart for changes

All settings are now configurable from the frontend admin panel! 🎉
