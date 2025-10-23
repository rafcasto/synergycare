# Firebase + Vercel Integration Guide

This project uses Firebase for backend services (Firestore, Authentication, Functions, Data Connect) and Vercel for hosting both frontend and backend APIs.

## Architecture Overview

- **Frontend**: Next.js app hosted on Vercel
- **Backend**: Python Flask API hosted on Vercel
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Functions**: Firebase Functions (for complex server-side logic)
- **Data Connect**: Firebase Data Connect (for GraphQL APIs)

## Deployment Steps

### 1. Firebase Setup (Free Tier)

1. Create a Firebase project at https://console.firebase.google.com
2. Enable the following services:
   - **Firestore Database** (free tier: 50K reads, 20K writes per day)
   - **Authentication** (free tier: unlimited users)
   - **Functions** (free tier: 125K invocations per month)
   - **Data Connect** (currently in preview)

3. Get your Firebase configuration:
   - Go to Project Settings → General
   - Copy the configuration object

### 2. Frontend Deployment on Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. In the `frontend` directory:
   ```bash
   cd frontend
   vercel login
   vercel
   ```
3. Set environment variables in Vercel dashboard:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

### 3. Backend Deployment on Vercel

1. In the `backend` directory:
   ```bash
   cd backend
   vercel
   ```
2. Set environment variables for Python backend if needed

### 4. Firebase Functions Deployment (Optional)

For complex server-side logic that can't run on Vercel:
```bash
cd functions
npm install
firebase deploy --only functions
```

### 5. Firestore Rules and Indexes

Deploy your Firestore configuration:
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 6. Data Connect Deployment

Deploy your GraphQL schema:
```bash
firebase deploy --only dataconnect
```

## Development Workflow

### Local Development

1. Start Firebase emulators:
   ```bash
   firebase emulators:start
   ```

2. Start frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Start backend development server:
   ```bash
   cd backend
   python run.py
   ```

### Environment Configuration

- **Development**: Uses Firebase emulators (free)
- **Production**: Uses Firebase production services (pay-as-you-go)

## Cost Optimization

### Firebase Free Tier Limits
- **Firestore**: 50K document reads, 20K writes, 20K deletes per day
- **Authentication**: Unlimited users
- **Functions**: 125K invocations, 40K GB-seconds per month
- **Storage**: 5GB

### Vercel Free Tier
- **Hobby Plan**: 100GB bandwidth, 100 serverless function executions per day
- **Frontend**: Unlimited static sites
- **Functions**: 100GB-hours per month

## Scaling Strategy

1. **Start with free tiers** for both Firebase and Vercel
2. **Monitor usage** through dashboards
3. **Optimize queries** to stay within Firestore limits
4. **Cache data** where possible
5. **Scale functions** to Vercel when Firebase limits are reached

## Security Considerations

1. **Firestore Rules**: Properly configure security rules
2. **API Keys**: Use environment variables
3. **CORS**: Configure properly for cross-origin requests
4. **Authentication**: Validate tokens on server-side

## Benefits of This Architecture

✅ **Cost-effective**: Start completely free
✅ **Scalable**: Pay-as-you-grow model
✅ **Global CDN**: Vercel provides edge locations
✅ **Real-time**: Firestore real-time updates
✅ **Type-safe**: TypeScript throughout
✅ **Modern**: Latest tech stack
✅ **Developer Experience**: Great local development with emulators
