# Wishlist Feature - Quick Testing Guide

## 🚀 Servers Running

✅ **Frontend**: http://localhost:3001
✅ **Backend**: http://localhost:5000 (MongoDB Connected)

---

## 🧪 How to Test the Wishlist Feature

### Test 1: Add Products to Wishlist (Guest User)

1. **Open the app**: Navigate to http://localhost:3001
2. **Browse products**: Go to the homepage or products page
3. **Look for the heart icon**: You'll see a heart button in the top-right corner of each product card
4. **Click the heart**: 
   - The heart should fill with a red gradient
   - The wishlist count badge should appear in the navbar
5. **Add multiple products**: Click hearts on different products
6. **Check the navbar**: The wishlist badge number should increase

### Test 2: View Wishlist Sidebar

1. **Click the wishlist icon** in the navbar (heart icon with badge)
2. **Sidebar should slide in** from the right
3. **Verify the display**:
   - Product images
   - Product names
   - Categories
   - Prices (with discounts if applicable)
   - "Add to Cart" button
   - Remove (trash) button

### Test 3: Manage Wishlist Items

1. **Remove an item**: Click the trash icon on any wishlist item
   - Item should disappear
   - Count should decrease
2. **Add to cart**: Click "Add to Cart" button
   - Item should move to cart
   - Item should be removed from wishlist
   - Cart sidebar should open

### Test 4: Guest to User Sync

1. **Add items as guest** (without logging in)
2. **Login to your account**:
   - Go to login page
   - Enter credentials
3. **Verify sync**:
   - Your wishlist items should still be there
   - They're now saved to the database
4. **Logout and login again**:
   - Wishlist should persist

### Test 5: Authenticated User

1. **Login first**
2. **Add products to wishlist**
3. **Refresh the page**:
   - Wishlist should persist
4. **Open in another browser**:
   - Login with same account
   - Wishlist should be there

### Test 6: Empty State

1. **Remove all items** from wishlist
2. **Open wishlist sidebar**:
   - Should show empty state message
   - "Your wishlist is empty"
   - "Start Shopping" button

### Test 7: Visual & Interaction Tests

1. **Hover effects**:
   - Hover over heart button (should scale up)
   - Hover over wishlist icon in navbar
   - Hover over items in sidebar

2. **Animations**:
   - Heart fill animation when adding
   - Badge appearance animation
   - Sidebar slide-in animation

3. **Responsive design**:
   - Resize browser window
   - Test on mobile view (DevTools)

---

## 🎯 Expected Behavior

### Product Card Heart Button:
- **Inactive**: Outline heart, gray color
- **Hover**: Scales up, red color
- **Active**: Filled heart, red gradient background
- **Click**: Toggles between active/inactive

### Navbar Wishlist Icon:
- **No items**: Just the heart icon
- **With items**: Heart icon + badge with count
- **Click**: Opens wishlist sidebar

### Wishlist Sidebar:
- **Slide-in**: Smooth animation from right
- **Header**: Red gradient with heart icon and count
- **Items**: Product cards with image, name, price
- **Actions**: Add to cart, remove buttons
- **Empty**: Shows empty state message

---

## 🐛 Common Issues & Solutions

### Issue: Wishlist not persisting
**Solution**: Check if backend is running and MongoDB is connected

### Issue: Badge not showing
**Solution**: Refresh the page, check browser console for errors

### Issue: Can't add to wishlist
**Solution**: 
- Check network tab for API errors
- Verify backend routes are registered
- Check MongoDB connection

### Issue: Sidebar not opening
**Solution**: 
- Check browser console for errors
- Verify WishlistProvider is wrapping the app

---

## 📱 Mobile Testing

1. Open DevTools (F12)
2. Click device toolbar (Ctrl+Shift+M)
3. Select mobile device
4. Test all features:
   - Heart button (touch-friendly size)
   - Sidebar (full width on mobile)
   - Scrolling in sidebar

---

## ✅ Production Checklist

Before deploying to production, verify:

- [ ] All animations are smooth
- [ ] No console errors
- [ ] Guest sync works correctly
- [ ] Database persistence works
- [ ] Mobile responsive
- [ ] Accessibility (keyboard navigation)
- [ ] Error handling works
- [ ] Loading states display correctly

---

## 🎨 Visual Reference

### Heart Button States:
```
Inactive:  ♡ (outline, gray)
Hover:     ♡ (outline, red, scaled)
Active:    ♥ (filled, red gradient)
```

### Navbar Badge:
```
No items:  ♡
1 item:    ♡ ①
5 items:   ♡ ⑤
```

---

## 🔗 Quick Links

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5000/api/wishlist
- **Documentation**: See WISHLIST_FEATURE_SUMMARY.md

---

## 💡 Tips

1. **Clear localStorage**: If testing guest mode, clear localStorage between tests
2. **Check Network tab**: Monitor API calls in DevTools
3. **Use React DevTools**: Inspect WishlistContext state
4. **Test edge cases**: Try adding same product twice, removing while sidebar is open

---

Happy Testing! 🎉
