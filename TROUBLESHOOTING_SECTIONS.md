# 🔧 Troubleshooting - Sections Not Showing

## Issue
The "Shop by Category" and "Special Deals" sections are not showing on the homepage.

## ✅ Quick Fix Steps

### Step 1: Restart Backend Server
The new routes were added but the server needs to restart to load them.

**In your backend terminal (currently running npm start):**
1. Press `Ctrl+C` to stop the server
2. Run `npm start` again
3. Wait for "MongoDB Connected" message

### Step 2: Clear Next.js Cache & Restart Frontend
**In your frontend terminal:**
1. Press `Ctrl+C` to stop
2. Delete `.next` folder: `Remove-Item -Recurse -Force .next`
3. Run `npm run dev` again

### Step 3: Hard Refresh Browser
1. Open `http://localhost:3000`
2. Press `Ctrl+Shift+R` (hard refresh)
3. Or `Ctrl+F5`

---

## 🧪 Test the APIs Directly

Open these URLs in your browser:

1. **Categories API**: http://localhost:5000/api/categories
   - Should show 8 categories with product counts

2. **Special Offers API**: http://localhost:5000/api/special-offers
   - Should show 6 offers with countdown timers

3. **Features API**: http://localhost:5000/api/homepage/features
   - Should show 6 features

If these URLs show data, the backend is working!

---

## 📋 Checklist

- [ ] Backend server restarted (shows "MongoDB Connected")
- [ ] Frontend `.next` folder deleted
- [ ] Frontend server restarted
- [ ] Browser hard refreshed
- [ ] APIs return data (test URLs above)

---

## 🔍 If Still Not Showing

### Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors (red text)
4. Common errors:
   - "Failed to fetch" = Backend not running
   - "CORS error" = CORS not configured
   - "404" = Route not found

### Check Network Tab
1. Open DevTools → Network tab
2. Refresh page
3. Look for requests to:
   - `/api/categories`
   - `/api/special-offers`
   - `/api/homepage/features`
4. Click on each request to see response

---

## 🚀 Manual Restart Commands

### Backend:
```powershell
cd c:\vasu\hardware_system\backend
# Stop any running node processes
Get-Process -Name node | Stop-Process -Force
# Start fresh
npm start
```

### Frontend:
```powershell
cd c:\vasu\hardware_system\frontend
# Stop server (Ctrl+C)
# Delete cache
Remove-Item -Recurse -Force .next
# Start fresh
npm run dev
```

---

## ✅ Expected Result

After following these steps, you should see on `http://localhost:3000`:

1. **Hero Slider** (existing)
2. **Featured Products** (existing)
3. **Shop by Category** ← 8 colorful category cards
4. **Special Deals This Week** ← 6 offers with timers
5. **Why Choose Us** ← 6 features + trust bar
6. **Footer** (existing)

---

## 📞 Quick Verification

Run this in PowerShell to test all APIs:
```powershell
# Test categories
Invoke-RestMethod -Uri http://localhost:5000/api/categories | ConvertTo-Json

# Test offers
Invoke-RestMethod -Uri http://localhost:5000/api/special-offers | ConvertTo-Json

# Test features
Invoke-RestMethod -Uri http://localhost:5000/api/homepage/features | ConvertTo-Json
```

If all three return JSON data, the backend is working correctly!

---

The sections ARE in the code and the data IS in the database. They just need the servers to restart to pick up the new routes! 🚀
