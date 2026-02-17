# 🔧 CORS & Localhost Error - FIXED

## The Problem

Your Vercel deployment was showing these errors:
```
Access to fetch at 'http://localhost:5000/api/public/settings' from origin 
'https://hardware-eccomerce-l4npq0ufy-vasus-projects-8c7b5fb1.vercel.app' 
has been blocked by CORS policy
```

**Root Cause**: The `vercel.json` rewrites were overriding the `next.config.mjs` rewrites, causing the production app to try accessing `localhost:5000` instead of the Render backend.

## The Solution

### 1. ✅ Removed Rewrites from `vercel.json`
Changed from:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://hardware-eccomerce.onrender.com/api/:path*"
    }
  ]
}
```

To:
```json
{}
```

**Why?** Vercel-specific rewrites override Next.js rewrites and hardcode URLs, preventing environment-based routing.

### 2. ✅ Added Render Backend to Image Patterns
Added to `next.config.mjs`:
```javascript
{
  protocol: 'https',
  hostname: 'hardware-eccomerce.onrender.com',
}
```

This allows images from the production backend to load properly.

## How It Works Now

### Development (localhost:3000)
```
1. Browser requests: /api/products
2. next.config.mjs rewrites to: http://localhost:5000/api/products
   (because NEXT_PUBLIC_API_URL is not set)
3. Response from local backend ✓
```

### Production (Vercel)
```
1. Browser requests: /api/products
2. next.config.mjs reads: NEXT_PUBLIC_API_URL=https://hardware-eccomerce.onrender.com
3. Rewrites to: https://hardware-eccomerce.onrender.com/api/products
4. Response from Render backend ✓
```

## What You Need to Do

### 1. Commit and Push Changes
```bash
git add .
git commit -m "Fix: Remove vercel.json rewrites to prevent localhost CORS error"
git push
```

### 2. Verify Environment Variable in Vercel
Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Ensure you have:
- **Name**: `NEXT_PUBLIC_API_URL`
- **Value**: `https://hardware-eccomerce.onrender.com`
- **Environment**: ✓ Production ✓ Preview

### 3. Redeploy
- Vercel will auto-deploy on push, OR
- Manually trigger redeploy in Vercel Dashboard

### 4. Test
After deployment:
1. Visit your Vercel URL
2. Open DevTools → Network tab
3. You should see API calls going to `hardware-eccomerce.onrender.com`
4. No more localhost errors! ✓

## Files Changed

- ✅ `vercel.json` - Now empty (lets Next.js handle rewrites)
- ✅ `next.config.mjs` - Added Render backend to image patterns
- ✅ `VERCEL_DEPLOYMENT.md` - Updated documentation

## Why This Approach is Better

1. **Environment-aware**: Automatically uses correct backend based on environment
2. **No hardcoding**: URLs come from environment variables
3. **Flexible**: Easy to change backend URL without code changes
4. **Standard**: Uses Next.js built-in rewrites feature
5. **No CORS issues**: Proper routing to production backend

## Verification Checklist

After redeploying:
- [ ] No "localhost" errors in console
- [ ] API calls go to `hardware-eccomerce.onrender.com`
- [ ] Images load from backend
- [ ] No CORS errors
- [ ] Login/signup works
- [ ] Products display correctly

---

**Status**: ✅ Fixed and ready to redeploy!
