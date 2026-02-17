# Vercel Deployment Guide

## Environment Variables Setup

**IMPORTANT**: Environment variables in Vercel must be set through the Vercel Dashboard, not in `vercel.json`.

### Steps to Deploy:

1. **Push your code to GitHub** (if not already done)

2. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project or import from GitHub

3. **Set Environment Variable**
   - Go to: Project Settings → Environment Variables
   - Add the following:
     - **Name**: `NEXT_PUBLIC_API_URL`
     - **Value**: `https://hardware-eccomerce.onrender.com`
     - **Environment**: Production (and Preview if needed)
   - Click "Save"

4. **Deploy**
   - Go to Deployments tab
   - Click "Redeploy" or push new commit to trigger deployment

## What `vercel.json` Does

The `vercel.json` file configures:
- **Rewrites**: Routes `/api/*` and `/uploads/*` to your backend
- This works alongside the environment variable

## Alternative: Deploy via CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL production
# When prompted, enter: https://hardware-eccomerce.onrender.com

# Deploy
vercel --prod
```

## Verification

After deployment:
1. Visit your Vercel URL
2. Open browser DevTools → Network tab
3. Check that API calls go to `https://hardware-eccomerce.onrender.com`
4. Verify no CORS errors in Console tab

## Troubleshooting

### "Failed to proxy" error locally
- This is normal if your backend (localhost:5000) is not running
- Start backend: `cd backend && npm run dev`

### CORS errors in production
- Ensure backend `.env` has: `FRONTEND_URL=https://your-vercel-url.vercel.app`
- Restart backend service on Render

### Environment variable not working
- Check it's set in Vercel Dashboard → Settings → Environment Variables
- Redeploy after adding/changing environment variables
- Variable must start with `NEXT_PUBLIC_` to be accessible in browser
