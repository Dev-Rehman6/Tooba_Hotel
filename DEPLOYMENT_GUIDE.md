# Tooba Hotel Deployment Guide

## Backend Deployment (Render.com)

### Step 1: Deploy Backend to Render

1. Go to [Render.com](https://render.com) and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `Dev-Rehman6/Tooba_Hotel`
4. Configure the service:
   - **Name**: `tooba-hotel-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

5. Add Environment Variables (use your actual values from `backend/.env`):
   ```
   PORT=5001
   MONGO_URI=<your-mongodb-connection-string>
   JWT_SECRET=<your-jwt-secret>
   JWT_EXPIRES_IN=7d
   STRIPE_SECRET_KEY=<your-stripe-secret-key>
   EMAIL_USER=<your-email>
   EMAIL_PASS=<your-email-app-password>
   NODE_ENV=production
   ```

6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. Copy your backend URL (e.g., `https://tooba-hotel-backend.onrender.com`)

### Step 2: Update Frontend Environment Variable

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site: **toobas**
3. Go to "Site configuration" → "Environment variables"
4. Add new variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://YOUR-BACKEND-URL.onrender.com/api`
   (Replace with your actual Render backend URL)

5. Click "Save"
6. Go to "Deploys" → "Trigger deploy" → "Clear cache and deploy site"

### Step 3: Test Your Application

1. Visit: https://toobas.netlify.app
2. Try to register/login
3. Test booking functionality

## Alternative: Quick Backend Deployment

If you want to deploy backend quickly, you can also use:

### Railway.app
1. Go to [Railway.app](https://railway.app)
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose `Dev-Rehman6/Tooba_Hotel`
5. Add the same environment variables
6. Set root directory to `backend`

### Heroku
1. Install Heroku CLI
2. Run:
   ```bash
   cd backend
   heroku create tooba-hotel-backend
   heroku config:set MONGO_URI="your-mongo-uri"
   heroku config:set JWT_SECRET="supersecretkey"
   # ... add other env vars
   git push heroku main
   ```

## Troubleshooting

### Backend not connecting
- Check if backend URL is correct in Netlify environment variables
- Verify all environment variables are set in Render
- Check Render logs for errors

### Database not working
- Verify MongoDB URI is correct
- Check if MongoDB Atlas allows connections from anywhere (0.0.0.0/0)

### CORS errors
- Backend already has CORS enabled
- If issues persist, update CORS in `backend/server.js`:
  ```javascript
  app.use(cors({
    origin: 'https://toobas.netlify.app',
    credentials: true
  }));
  ```

## Current Status

✅ Frontend deployed: https://toobas.netlify.app
⏳ Backend: Needs deployment to Render/Railway/Heroku
✅ Database: MongoDB Atlas (already configured)
✅ Code: Pushed to GitHub

## Next Steps

1. Deploy backend to Render (follow Step 1 above)
2. Add backend URL to Netlify environment variables (Step 2)
3. Redeploy frontend on Netlify (Step 2, point 6)
4. Test the application
