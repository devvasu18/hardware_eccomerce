# Frontend-Backend Connection Configuration

## Overview
The frontend is configured to automatically connect to the appropriate backend based on the environment:
- **Development (localhost)**: Connects to `http://localhost:5000`
- **Production (Vercel)**: Connects to `https://hardware-eccomerce.onrender.com`

## URLs
- **Frontend (Vercel)**: https://hardware-eccomerce-l4npq0ufy-vasus-projects-8c7b5fb1.vercel.app/
- **Backend (Render)**: https://hardware-eccomerce.onrender.com

## How It Works

### 1. API Client (`src/app/utils/api.ts`)
- Always uses `/api` as the base URL
- Next.js rewrites handle the routing to the correct backend

### 2. Next.js Rewrites (`next.config.mjs`)
- **Development**: Proxies `/api/*` → `http://localhost:5000/api/*`
- **Production**: Proxies `/api/*` → `https://hardware-eccomerce.onrender.com/api/*`

### 3. Environment Variables

#### `.env.local` (Development - Git Ignored)
```env
# Leave empty to use localhost:5000
# NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### `.env.production` (Production)
```env
NEXT_PUBLIC_API_URL=https://hardware-eccomerce.onrender.com
```

### 4. Backend CORS Configuration
The backend (`server.js`) allows requests from:
- `http://localhost:3000` (local development)
- `http://127.0.0.1:3000` (local development)
- `https://hardware-eccomerce-l4npq0ufy-vasus-projects-8c7b5fb1.vercel.app` (production frontend)

## Deployment Instructions

### Vercel Deployment
1. Push your code to GitHub
2. In Vercel dashboard, set environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://hardware-eccomerce.onrender.com`
3. Deploy

### Render Backend
1. Ensure `.env` has:
   ```env
   FRONTEND_URL=https://hardware-eccomerce-l4npq0ufy-vasus-projects-8c7b5fb1.vercel.app
   ```
2. Restart the backend service if needed

## Testing

### Local Development
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Visit: `http://localhost:3000`
4. API calls will go to `http://localhost:5000`

### Production Testing
1. Visit: `https://hardware-eccomerce-l4npq0ufy-vasus-projects-8c7b5fb1.vercel.app/`
2. API calls will go to `https://hardware-eccomerce.onrender.com`

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` is set in backend `.env`
- Restart backend after changing `.env`
- Check browser console for exact error

### API Connection Issues
- Check if backend is running: `https://hardware-eccomerce.onrender.com/health`
- Verify environment variables in Vercel dashboard
- Check Network tab in browser DevTools

### Image Loading Issues
- Images are served from backend `/uploads` path
- Next.js rewrites handle this automatically
- Ensure backend has proper CORS headers for images
