# Quick Start Guide - Order Delivery Management System

## 🚀 Testing the System

### Prerequisites
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- Admin account credentials

---

## 📋 Step-by-Step Testing Guide

### 1. Create a Test Order

**As a Customer:**

1. Go to `http://localhost:3000/products`
2. Add products to cart
3. Go to checkout
4. Complete the order
5. Note the Order ID from the success page

**Expected Result:**
- Order created with status: "Order Placed"
- Automatic status log entry created
- Redirected to order tracking page

---

### 2. View Order in Admin Panel

**As an Admin:**

1. Login to admin panel
2. Navigate to `http://localhost:3000/admin/orders`
3. You should see the new order in the list

**Expected Result:**
- Order appears in the table
- Status shows "Order Placed"
- Customer details visible (Guest/Registered)
- "Assign Shipment" button available

---

### 3. Update Order Status to "Packed"

**In Admin Panel:**

1. Find your test order
2. Use the status dropdown
3. Select "Packed"

**Expected Result:**
- Status updates immediately
- New status log entry created
- Customer can see update in tracking page

---

### 4. Assign Shipment to Bus

**In Admin Panel:**

1. Click "Assign Shipment" button on your order
2. Fill in the form:
   - **Bus Photo:** Upload an image (any image for testing)
   - **Bus Number:** e.g., "RJ14 AB 4521"
   - **Driver Contact:** e.g., "+91 9876543210"
   - **Departure Time:** Select date and time
   - **Expected Arrival:** Select date and time
   - **Dispatch Date:** Auto-filled (can change)
   - **Live Status:** Select "Preparing" or "On the way"
   - **Notes:** Optional, e.g., "Handle with care"
3. Click "Assign Shipment"

**Expected Result:**
- Order status automatically changes to "Assigned to Bus"
- Shipment details saved
- Bus photo uploaded to `backend/uploads/bus-photos/`
- Status log entry created
- Success message displayed

---

### 5. View Customer Tracking Page

**As a Customer:**

1. Go to `http://localhost:3000/orders/[ORDER_ID]`
2. Replace `[ORDER_ID]` with your actual order ID

**Expected Result:**
You should see:
- ✅ Horizontal progress tracker showing current status
- ✅ Status timeline with all updates
- ✅ Shipment details card with:
  - Bus photo
  - Bus number
  - Driver contact
  - Departure and arrival times
  - Live status
  - Dispatch date
- ✅ Order items list
- ✅ Order summary with pricing
- ✅ Download invoice button

---

### 6. Update Shipment Status

**In Admin Panel:**

1. Go back to orders page
2. Click "Update Shipment" on the same order
3. Change the **Live Status** to "On the way"
4. Add a note: "Package is in transit"
5. Click "Assign Shipment"

**Expected Result:**
- Shipment updated
- Customer sees updated live status
- Note visible in admin panel

---

### 7. Mark as Delivered

**In Admin Panel:**

1. Use the status dropdown
2. Select "Delivered"

**Expected Result:**
- Order status changes to "Delivered"
- Progress tracker shows complete
- Status log updated
- Customer sees delivery confirmation

---

## 🧪 API Testing with Postman/Thunder Client

### Get Order Status History

```http
GET http://localhost:5000/api/status/history/[ORDER_ID]
Authorization: Bearer [TOKEN] (optional)
```

**Expected Response:**
```json
{
  "success": true,
  "count": 3,
  "statusHistory": [
    {
      "_id": "...",
      "status": "Order Placed",
      "updatedByName": "Customer (Guest)",
      "timestamp": "2026-01-22T...",
      "notes": "Order created successfully"
    },
    {
      "_id": "...",
      "status": "Packed",
      "updatedByName": "admin",
      "timestamp": "2026-01-22T...",
      "notes": ""
    },
    {
      "_id": "...",
      "status": "Assigned to Bus",
      "updatedByName": "admin",
      "timestamp": "2026-01-22T...",
      "notes": "Assigned to bus RJ14 AB 4521"
    }
  ]
}
```

### Get Shipment Details

```http
GET http://localhost:5000/api/shipments/order/[ORDER_ID]
```

**Expected Response:**
```json
{
  "success": true,
  "shipment": {
    "_id": "...",
    "busNumber": "RJ14 AB 4521",
    "busPhotoUrl": "/uploads/bus-photos/bus-photo-1737544200000-123456789.jpg",
    "driverContact": "+91 9876543210",
    "departureTime": "2026-01-22T15:00:00.000Z",
    "expectedArrival": "2026-01-22T19:30:00.000Z",
    "dispatchDate": "2026-01-22T14:00:00.000Z",
    "liveStatus": "On the way",
    "notes": "Handle with care"
  }
}
```

### Update Order Status (Admin)

```http
POST http://localhost:5000/api/status/update
Authorization: Bearer [ADMIN_TOKEN]
Content-Type: application/json

{
  "orderId": "[ORDER_ID]",
  "status": "Packed",
  "notes": "All items packed and ready"
}
```

### Assign Shipment (Admin)

```http
POST http://localhost:5000/api/shipments/assign
Authorization: Bearer [ADMIN_TOKEN]
Content-Type: multipart/form-data

Form Data:
- orderId: [ORDER_ID]
- busNumber: RJ14 AB 4521
- driverContact: +91 9876543210
- departureTime: 2026-01-22T15:00:00
- expectedArrival: 2026-01-22T19:30:00
- dispatchDate: 2026-01-22T14:00:00
- liveStatus: On the way
- notes: Handle with care
- busPhoto: [FILE]
```

---

## 🎯 Validation Testing

### Test Invalid Scenarios

1. **Missing Bus Photo**
   - Try to assign shipment without uploading photo
   - Expected: Error message "Please upload a bus photo"

2. **Invalid File Type**
   - Try to upload a PDF or text file as bus photo
   - Expected: Error message "Please select an image file"

3. **Large File**
   - Try to upload image > 5MB
   - Expected: Error message "Image size must be less than 5MB"

4. **Missing Required Fields**
   - Leave bus number or driver contact empty
   - Expected: Error message "Please fill all required fields"

5. **Invalid Status Transition**
   - Try to update status to invalid value
   - Expected: Error message "Invalid status"

---

## 📸 Screenshot Checklist

Take screenshots of:

- [ ] Admin orders page showing order list
- [ ] Shipment assignment modal with all fields
- [ ] Customer tracking page with progress tracker
- [ ] Status timeline showing multiple updates
- [ ] Shipment details card with bus photo
- [ ] Order summary section

---

## 🐛 Troubleshooting

### Backend Issues

**Problem:** Routes not found (404)
**Solution:** Check if server restarted after adding new routes

**Problem:** Image upload fails
**Solution:** Check if `backend/uploads/bus-photos/` directory exists

**Problem:** Status not updating
**Solution:** Verify admin authentication token is valid

### Frontend Issues

**Problem:** Images not displaying
**Solution:** Check image URL format: `http://localhost:5000/uploads/bus-photos/...`

**Problem:** Status history empty
**Solution:** Ensure status logs are being created (check database)

**Problem:** Progress tracker not showing
**Solution:** Verify order status matches one of the enum values

---

## ✅ Success Criteria

Your system is working correctly if:

1. ✅ Orders can be created with "Order Placed" status
2. ✅ Admin can update order status via dropdown
3. ✅ Admin can assign shipments with bus photo upload
4. ✅ Shipment details are saved and retrievable
5. ✅ Customer can view complete tracking information
6. ✅ Status history shows all changes with timestamps
7. ✅ Bus photo displays correctly in customer view
8. ✅ Progress tracker animates and shows current status
9. ✅ All validations work (required fields, file types, etc.)
10. ✅ Status logs are created for every status change

---

## 🎉 Next Steps

After successful testing:

1. **Production Deployment:**
   - Update image upload path for production server
   - Configure proper file storage (AWS S3, Cloudinary, etc.)
   - Set up environment variables

2. **Enhancements:**
   - Add email notifications for status changes
   - Implement SMS alerts for shipment updates
   - Add real-time tracking with WebSockets
   - Create printable shipping labels

3. **Analytics:**
   - Track average delivery times
   - Monitor shipment success rates
   - Generate delivery performance reports

---

## 📞 Support

If you encounter any issues:

1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure MongoDB is running
4. Check that all dependencies are installed
5. Review the `ORDER_DELIVERY_SYSTEM_COMPLETE.md` documentation

---

**Happy Testing! 🚀**
