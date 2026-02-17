# Vercel Deployment Guide

## Build Timeout Issues - SOLVED ✅

### Changes Made:

1. **Fixed `next.config.mjs`:**
   - Removed deprecated `experimental.staticPageGenerationTimeout`
   - Added `staticGenerationTimeout: 180` (3 minutes)
   - Added `output: 'standalone'` for optimized deployments

2. **Admin Pages - Force Dynamic Rendering:**
   - Added `export const dynamic = 'force-dynamic'` to `/admin/layout.tsx`
   - This prevents static generation of admin pages at build time
   - Admin pages will be rendered on-demand (SSR)

3. **Home Page Optimization:**
   - Removed artificial 2.3s delay
   - Added 30-second timeout for API calls
   - Uses `NEXT_PUBLIC_API_URL` environment variable

## Deployment Steps:

### 1. Set Environment Variables in Vercel:

Go to your Vercel project settings → Environment Variables and add:

```
NEXT_PUBLIC_API_URL=https://your-backend-api-url.com
```

**Important:** If your backend is not deployed yet, you have two options:

#### Option A: Deploy Backend First
Deploy your backend to Render/Railway/etc., then use that URL.

#### Option B: Use Dynamic Rendering for All Pages
Add this to `next.config.mjs`:
```javascript
const nextConfig = {
  output: 'export', // Static export
  // OR
  experimental: {
    appDir: true,
  },
}
```

### 2. Vercel Build Settings:

- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)

### 3. If Build Still Times Out:

Add this to the root of problematic page files:

```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

Or use ISR (Incremental Static Regeneration):

```typescript
export const revalidate = 60; // Revalidate every 60 seconds
```

### 4. For Production Without Backend:

If you need to deploy the frontend before the backend is ready:

1. Create a mock API or use static data
2. Or make all pages dynamic:

```typescript
// In app/layout.tsx or specific pages
export const dynamic = 'force-dynamic';
```

## Current Configuration:

✅ Admin pages: Dynamic rendering (no build-time generation)
✅ Home page: Optimized with timeout handling
✅ Static generation timeout: 180 seconds
✅ Standalone output mode enabled

## Testing Locally:

```bash
# Build locally to test
npm run build

# If it completes successfully, Vercel should work
npm start
```

## Common Issues:

### Issue: "Failed to build page (timeout)"
**Solution:** Add `export const dynamic = 'force-dynamic'` to that page

### Issue: "Cannot connect to localhost:5000"
**Solution:** Set `NEXT_PUBLIC_API_URL` in Vercel environment variables

### Issue: "Build takes too long"
**Solution:** 
- Reduce number of static pages
- Use dynamic rendering for data-heavy pages
- Implement ISR instead of SSG

## Recommended Deployment Strategy:

1. **Static Pages:** Home, About, Contact (if they don't need real-time data)
2. **Dynamic Pages:** Admin, User Dashboard, Product Details (if they need auth/real-time data)
3. **ISR Pages:** Product Listings, Categories (revalidate every 60s)

## Next Steps:

1. Deploy your backend first
2. Update `.env.production` with the backend URL
3. Push changes to GitHub
4. Vercel will auto-deploy
5. Monitor build logs for any remaining issues

## Support:

If you still face issues:
- Check Vercel build logs
- Verify environment variables are set
- Ensure backend API is accessible from Vercel's servers
- Consider using Vercel's Edge Functions for API routes
