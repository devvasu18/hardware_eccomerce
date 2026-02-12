# Offers Master - Testing Guide

## 🧪 Quick Testing Steps

### Prerequisites
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- Logged in as admin user

---

## Test 1: Create New Offer ✅

1. Navigate to `/admin/masters/offers`
2. Click **"Create New Offer"** button
3. Fill in the form:
   - **Title**: "Summer Sale 2026"
   - **Percentage**: 25
   - **Slug**: (auto-generated as "summer-sale-2026")
   - **Active**: ✓ (checked)
   - **Banner Image**: Upload a valid image (JPEG/PNG/WebP, < 5MB)
4. Click **"Add Offer"**
5. **Expected**: Success message, modal closes, new offer appears in table

---

## Test 2: Validation - Invalid Percentage ❌

1. Click **"Create New Offer"**
2. Fill in:
   - **Title**: "Invalid Offer"
   - **Percentage**: 150 (invalid - over 100)
   - Upload an image
3. Click **"Add Offer"**
4. **Expected**: Red border on percentage field, error message: "Percentage must be between 0 and 100"

---

## Test 3: Validation - Duplicate Slug ❌

1. Click **"Create New Offer"**
2. Fill in:
   - **Title**: "Summer Sale 2026" (same as Test 1)
   - **Percentage**: 30
   - Upload an image
3. Click **"Add Offer"**
4. **Expected**: Error modal: "An offer with this slug already exists. Please use a different title."

---

## Test 4: Validation - Invalid Image Type ❌

1. Click **"Create New Offer"**
2. Fill in:
   - **Title**: "Test Offer"
   - **Percentage**: 20
   - **Image**: Try to upload a PDF or TXT file
3. **Expected**: Error message: "Only JPEG, PNG, and WebP images are allowed"

---

## Test 5: Edit Existing Offer ✏️

1. Find the "Summer Sale 2026" offer in the table
2. Click the **Edit** button (blue pencil icon)
3. Modify:
   - **Percentage**: Change to 30
   - **Title**: "Summer Mega Sale 2026"
4. Click **"Update Offer"**
5. **Expected**: Success message, offer updated in table with new values

---

## Test 6: Status Toggle 🔄

1. Find any offer in the table
2. Click the **Status badge** (green "Active" or red "Inactive")
3. **Expected**: 
   - Badge color changes
   - Success message appears
   - Table refreshes with new status

---

## Test 7: Filter by Status 🔍

1. At the top of the table, find the **"All Status"** dropdown
2. Select **"Active Only"**
3. **Expected**: Only active offers shown
4. Select **"Inactive Only"**
5. **Expected**: Only inactive offers shown
6. Select **"All Status"**
7. **Expected**: All offers shown

---

## Test 8: Filter by Percentage Range 📊

1. Find the **"All Percentages"** dropdown
2. Select **"26% - 50%"**
3. **Expected**: Only offers with percentage between 26-50 shown
4. Try other ranges
5. **Expected**: Filtering works correctly

---

## Test 9: Combined Filters 🎯

1. Set **Status Filter**: "Active Only"
2. Set **Percentage Filter**: "0% - 25%"
3. **Expected**: Only active offers with 0-25% discount shown

---

## Test 10: Edit Without Changing Image 🖼️

1. Click **Edit** on any offer
2. Change only the **Percentage** (e.g., from 25 to 27)
3. **Do NOT** upload a new image
4. Click **"Update Offer"**
5. **Expected**: Offer updates successfully, old image retained

---

## Test 11: Replace Image 🔄

1. Click **Edit** on any offer
2. Upload a **new image**
3. Click **"Update Offer"**
4. **Expected**: 
   - New image appears in table
   - Old image deleted from server (check `/backend/uploads/` folder)

---

## Test 12: Delete Offer 🗑️

1. Click the **Delete** button (red trash icon) on any offer
2. **Expected**: Confirmation modal appears
3. Click **"Yes, Delete"**
4. **Expected**: 
   - Success message
   - Offer removed from table
   - Image deleted from server

---

## Test 13: Search Functionality 🔎

1. In the search box, type part of an offer title
2. **Expected**: Table filters to show matching offers
3. Clear search
4. **Expected**: All offers shown again

---

## Test 14: Export Functionality 📥

1. Navigate to the export button (if visible)
2. Click **Export to CSV** or **Export to Excel**
3. **Expected**: File downloads with all offer data including:
   - ID
   - Title
   - Slug
   - Percentage
   - Status (Active/Inactive)

---

## Test 15: Audit Logging 📝

1. Perform any create/update/delete operation
2. Check the backend logs or audit log database
3. **Expected**: Log entry with:
   - Action type (CREATE_OFFER, UPDATE_OFFER, DELETE_OFFER)
   - User who performed action
   - Timestamp
   - Relevant details

---

## 🐛 Common Issues & Solutions

### Issue: "Offer not updating"
- **Solution**: Check browser console for errors, verify backend is running

### Issue: "Image not uploading"
- **Solution**: Ensure image is < 5MB and valid format (JPEG/PNG/WebP)

### Issue: "Filters not working"
- **Solution**: Refresh the page, check if backend is returning correct data

### Issue: "Duplicate slug error even with unique title"
- **Solution**: The slug is generated from title - try a completely different title

---

## ✅ Success Criteria

All tests should pass with:
- ✅ No console errors
- ✅ Proper validation messages
- ✅ Smooth UI transitions
- ✅ Data persistence
- ✅ Audit logs created

---

## 📸 Visual Checklist

When testing, verify:
- [ ] Form fields have proper labels with asterisks for required fields
- [ ] Validation errors show red borders and error text
- [ ] Status badges are color-coded (green/red)
- [ ] Filter dropdowns are styled consistently
- [ ] Loading states show "Saving..." text
- [ ] Success/error modals appear and are readable
- [ ] Table pagination works correctly
- [ ] Edit button appears in actions column
- [ ] Image previews display correctly

---

## 🎯 Next Steps After Testing

If all tests pass:
1. ✅ Mark feature as production-ready
2. ✅ Update documentation
3. ✅ Deploy to staging environment
4. ✅ Perform UAT (User Acceptance Testing)

If issues found:
1. Document the issue
2. Check browser console for errors
3. Check backend logs
4. Report to development team
