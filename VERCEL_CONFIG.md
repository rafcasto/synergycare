# Vercel Environment Variables Configuration

## Required Environment Variables for Frontend

Set these in your Vercel dashboard (Project Settings → Environment Variables):

### Firebase Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=patients-synergycare
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### API Configuration
```
NEXT_PUBLIC_API_URL=https://your-backend-deployment.vercel.app
BACKEND_URL=https://your-backend-deployment.vercel.app
```

### reCAPTCHA Configuration
```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

### General Configuration
```
NODE_ENV=production
```

## Backend Environment Variables (for separate backend deployment)

### Firebase Configuration
```
FIREBASE_PROJECT_ID=patients-synergycare
FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64_encoded_service_account
```

### Admin Setup
```
ADMIN_SETUP_SECRET=synergycare-admin-setup-2024-secure-key
```

### CORS Configuration
```
CORS_ORIGINS=https://your-frontend.vercel.app,https://your-custom-domain.com
```

## How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Select "Environment Variables" from the sidebar
4. Add each variable with:
   - Key: Variable name (e.g., NEXT_PUBLIC_FIREBASE_API_KEY)
   - Value: Your actual value
   - Environment: Select "Production", "Preview", and "Development" as needed

## Deployment Configurations

### Option 1: Monorepo Deployment (Recommended)
Deploy both frontend and backend from the same repository with different Vercel projects:

1. **Frontend Project**: Root directory set to `frontend/`
2. **Backend Project**: Root directory set to `backend/`

### Option 2: Separate Repositories
Move frontend and backend to separate repositories for independent deployments.

## Domain Configuration

1. In Vercel dashboard, go to "Domains" tab
2. Add your custom domain (optional)
3. Update CORS_ORIGINS and API URLs accordingly

## Automatic Deployments

Once connected to GitHub:
- **Production**: Deploys automatically on pushes to `main` branch
- **Preview**: Deploys automatically on pull requests
- **Branch Deployments**: Can be configured for specific branches
