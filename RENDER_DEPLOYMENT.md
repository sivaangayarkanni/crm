# Render Deployment Guide for TenantFlow

This guide provides step-by-step instructions for deploying TenantFlow to Render.

## Prerequisites

- GitHub account with repository access
- Render account (free tier works)
- MongoDB Atlas account (or use Render's MongoDB add-on)

## Quick Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

## Manual Deployment Steps

### 1. Prepare Your Repository

Ensure all files are committed and pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Create Render Web Service

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `tenantflow`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && cd backend && npm install && cd ../frontend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: `Free` (or paid for production)

### 3. Configure Environment Variables

In the Render service dashboard, go to **Environment Variables** and add:

| Key | Value | Required |
|-----|-------|----------|
| `NODE_ENV` | `production` | Yes |
| `MONGODB_URI` | Your MongoDB Atlas connection string | Yes |
| `JWT_SECRET` | Strong secret (min 32 chars) | Yes |
| `FRONTEND_URL` | Your Render service URL | Yes |
| `JWT_EXPIRES_IN` | `15m` | No |
| `REFRESH_TOKEN_EXPIRY` | `7d` | No |
| `STRIPE_SECRET_KEY` | Stripe secret key | No |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | No |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | No |
| `OPENAI_API_KEY` | OpenAI API key | No |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | No |
| `CLOUDINARY_API_KEY` | Cloudinary API key | No |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | No |

### 4. Deploy

1. Click **Create Web Service**
2. Wait for build to complete (5-10 minutes)
3. Check logs for any errors
4. Once deployed, visit your service URL

### 5. Verify Deployment

- Health check: `https://your-app.onrender.com/health`
- Frontend: `https://your-app.onrender.com`
- API: `https://your-app.onrender.com/api/auth/test`

## MongoDB Atlas Setup

If using MongoDB Atlas:

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database user with read/write permissions
3. Whitelist IP addresses (0.0.0.0/0 for Render)
4. Get connection string: Cluster → Connect → Connect your application
5. Update `MONGODB_URI` in Render environment variables

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

### Cannot Connect to Database
- Verify `MONGODB_URI` is correct
- Check IP whitelist in MongoDB Atlas
- Ensure database user has correct permissions

### Static Files Not Loading
- Verify `frontend/build` exists
- Check `NODE_ENV=production` is set
- Review server.js static file configuration

### CORS Errors
- Update `FRONTEND_URL` to match your Render service URL
- Check CORS configuration in server.js

## Architecture

```
┌─────────────────────────────────────┐
│           Render Web Service        │
│  ┌─────────────────────────────┐    │
│  │     Express.js Backend      │    │
│  │  - API Routes               │    │
│  │  - Socket.io                │    │
│  │  - Static File Server       │    │
│  └─────────────────────────────┘    │
│                │                    │
│         Serves React Build          │
└─────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │    MongoDB Atlas      │
        └───────────────────────┘
```

## Scaling

For production with higher traffic:
- Upgrade to Paid Plan ($25+/month)
- Add Render Redis for caching
- Enable auto-scaling
- Use multiple instances

## Monitoring

- **Logs**: Render Dashboard → Logs
- **Metrics**: Render Dashboard → Metrics
- **Health**: `/health` endpoint

## Support

- Render Documentation: https://render.com/docs
- TenantFlow Issues: GitHub Issues
