# Wishlist Error Troubleshooting Guide

## Current Error: "Failed to add to wishlist"

### What I've Done to Fix It:

1. **Added Comprehensive Logging** 
   - Updated `WishlistContext.tsx` with detailed console logs
   - Each step now logs with emoji indicators for easy identification

2. **Improved Error Handling**
   - Better error parsing for API responses
   - Guest users won't see errors (they use localStorage only)
   - Authenticated users get detailed error messages

### How to Debug:

1. **Open Browser Console** (F12)
2. **Click the heart icon** on any product
3. **Look for these logs**:
   ```
   🎯 Adding to wishlist: { productId: "...", hasUser: true/false, userObj: {...} }
   ```

### Expected Behavior:

#### For Guest Users (Not Logged In):
```
🎯 Adding to wishlist: { productId: "xxx", hasUser: false, userObj: null }
👤 Guest user, saving to localStorage...
✅ Successfully added to wishlist (guest), total items: 1
```

#### For Authenticated Users (Logged In):
```
🎯 Adding to wishlist: { productId: "xxx", hasUser: true, userObj: {...} }
✅ User authenticated, making API call with token: eyJhbGciOiJIUzI1NiIsInR...
📡 API Response status: 200
✅ Successfully added to wishlist (authenticated)
```

### Common Issues & Solutions:

#### Issue 1: User shows as `null` but you're logged in
**Symptoms:**
- You see "hasUser: false" even though you logged in
- User object is null

**Solution:**
1. Check if token exists: `localStorage.getItem('token')`
2. Check if user exists: `localStorage.getItem('user')`
3. Try logging out and logging in again
4. Refresh the page

**Fix:**
```javascript
// In browser console:
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));
```

#### Issue 2: API returns 401 Unauthorized
**Symptoms:**
- `📡 API Response status: 401`
- Error message about authentication

**Solution:**
1. Token might be expired - logout and login again
2. Check if backend is running on port 5000
3. Verify authMiddleware is working

**Fix:**
```bash
# Restart backend
cd c:\vasu\hardware_system\backend
node server.js
```

#### Issue 3: API returns 404 Not Found
**Symptoms:**
- `📡 API Response status: 404`
- Product not found error

**Solution:**
1. Product ID might be invalid
2. Product might have been deleted
3. Database might not have the product

**Check:**
```javascript
// In browser console:
console.log('Product ID:', productId);
```

#### Issue 4: Network Error
**Symptoms:**
- `❌ Error adding to wishlist: TypeError: Failed to fetch`
- No API response status

**Solution:**
1. Backend server is not running
2. CORS issue
3. Wrong API URL

**Fix:**
```bash
# Check if backend is running
# Should see: "Server running on port 5000"
# Should see: "MongoDB Connected"

# If not running:
cd c:\vasu\hardware_system\backend
node server.js
```

### Testing Steps:

1. **Test as Guest User:**
   ```
   1. Make sure you're NOT logged in
   2. Click heart on a product
   3. Check console for: "👤 Guest user, saving to localStorage..."
   4. Check localStorage: localStorage.getItem('guestWishlist')
   5. Click wishlist icon in navbar - should show the item
   ```

2. **Test as Authenticated User:**
   ```
   1. Login to your account
   2. Click heart on a product
   3. Check console for: "✅ User authenticated, making API call..."
   4. Check for: "📡 API Response status: 200"
   5. Check for: "✅ Successfully added to wishlist (authenticated)"
   6. Click wishlist icon in navbar - should show the item
   ```

3. **Test Guest to User Sync:**
   ```
   1. Logout (if logged in)
   2. Add 2-3 products to wishlist as guest
   3. Login to your account
   4. Check console for sync logs
   5. Wishlist should still have your items
   6. Check localStorage - 'guestWishlist' should be removed
   ```

### Quick Fixes:

#### Clear Everything and Start Fresh:
```javascript
// Run in browser console:
localStorage.clear();
location.reload();
```

#### Check Current Wishlist State:
```javascript
// Run in browser console:
console.log('Guest Wishlist:', localStorage.getItem('guestWishlist'));
console.log('User:', localStorage.getItem('user'));
console.log('Token:', localStorage.getItem('token'));
```

#### Force Guest Mode:
```javascript
// Run in browser console:
localStorage.removeItem('token');
localStorage.removeItem('user');
location.reload();
```

### Backend Checks:

1. **Verify Routes are Registered:**
   ```javascript
   // In backend/server.js, should have:
   app.use('/api/wishlist', require('./routes/wishlistRoutes'));
   ```

2. **Check MongoDB Connection:**
   ```
   // Backend console should show:
   MongoDB Connected
   ```

3. **Test API Directly:**
   ```bash
   # Test if API is accessible
   curl http://localhost:5000/api/wishlist
   # Should return 401 or authentication error (which is correct)
   ```

### What to Share if Still Having Issues:

Please share:
1. **Console logs** (all the emoji logs)
2. **Network tab** (the API request/response)
3. **Are you logged in or guest?**
4. **Backend console output**
5. **localStorage contents:**
   ```javascript
   console.log({
     token: localStorage.getItem('token'),
     user: localStorage.getItem('user'),
     guestWishlist: localStorage.getItem('guestWishlist')
   });
   ```

---

## Current Status:

✅ **Logging Added** - Comprehensive logs to track the issue
✅ **Error Handling Improved** - Better error messages
✅ **Guest Mode Fixed** - Won't throw errors for guests
🔍 **Next Step** - Check browser console for the detailed logs

---

## Quick Test:

1. Open http://localhost:3001
2. Open browser console (F12)
3. Click any heart icon
4. Look for the emoji logs
5. Share the logs if you still see errors

The logs will tell us exactly what's happening! 🎯
