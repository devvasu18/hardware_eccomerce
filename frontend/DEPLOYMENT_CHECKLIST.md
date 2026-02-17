# 🚀 Quick Deployment Checklist

## ✅ Pre-Deployment

- [x] Backend `.env` has `FRONTEND_URL=https://hardware-eccomerce-l4npq0ufy-vasus-projects-8c7b5fb1.vercel.app`
- [x] Frontend `.env.production` has `NEXT_PUBLIC_API_URL=https://hardware-eccomerce.onrender.com`
- [x] `vercel.json` is valid (no env object)
- [x] Build completes locally: `npm run build`

## 📝 Vercel Dashboard Setup

1. Go to: https://vercel.com/dashboard
2. Import your GitHub repository (or select existing project)
3. **Set Environment Variable:**
   - Settings → Environment Variables
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://hardware-eccomerce.onrender.com`
   - Environment: ✅ Production ✅ Preview
   - Click "Save"
4. Deploy (or Redeploy if already deployed)

## 🔍 Post-Deployment Verification

- [ ] Visit your Vercel URL
- [ ] Check homepage loads
- [ ] Open DevTools → Network tab
- [ ] Navigate to products/categories
- [ ] Verify API calls go to `hardware-eccomerce.onrender.com`
- [ ] Check Console for errors (should be none)
- [ ] Test login/signup
- [ ] Test adding to cart
- [ ] Verify images load

## 🐛 Common Issues & Fixes

### Issue: "Failed to proxy" error locally
**Fix**: Start your backend server
```bash
cd c:\vasu\hardware_system\backend
npm run dev
```

### Issue: CORS errors in production
**Fix**: Update backend and restart
1. Ensure backend `.env` has correct `FRONTEND_URL`
2. Restart Render service or redeploy

### Issue: API calls fail in production
**Fix**: Check environment variable
1. Vercel Dashboard → Settings → Environment Variables
2. Verify `NEXT_PUBLIC_API_URL` is set
3. Redeploy after adding/changing variables

### Issue: Build fails on Vercel
**Fix**: Check build logs
1. Most likely: missing environment variable
2. Or: build timeout (already fixed with `dynamic = 'force-dynamic'`)

## 📞 Support URLs

- **Frontend (Vercel)**: https://hardware-eccomerce-l4npq0ufy-vasus-projects-8c7b5fb1.vercel.app/
- **Backend (Render)**: https://hardware-eccomerce.onrender.com
- **Backend Health**: https://hardware-eccomerce.onrender.com/health
- **Backend Test**: https://hardware-eccomerce.onrender.com/api/test

## 🎯 Current Status

- ✅ Build configuration fixed (no timeouts)
- ✅ API routing configured (rewrites)
- ✅ CORS configured (backend)
- ✅ Environment files created
- ✅ `vercel.json` fixed (valid schema)
- ⏳ Ready to deploy!

---

**Next Step**: Deploy to Vercel using the dashboard or CLI (see VERCEL_DEPLOYMENT.md)
