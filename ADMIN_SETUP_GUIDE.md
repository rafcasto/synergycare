# Admin Setup Guide

This guide explains how to set up the first administrator account for SynergyCare using the one-time registration system.

## Overview

The admin setup system provides a secure way to create the first administrator account without requiring an existing admin. It uses one-time tokens that automatically expire after use or after 24 hours.

## Quick Start

### Method 1: Using the Setup Script (Recommended)

1. **Start your development environment:**
   ```bash
   # Start backend
   cd backend
   python run.py
   
   # In another terminal, start frontend
   cd frontend
   npm run dev
   ```

2. **Generate admin token:**
   ```bash
   ./setup-admin.sh generate
   ```

3. **Follow the instructions** to open the registration URL and complete the admin setup.

### Method 2: Manual Token Generation

1. **Generate token via API:**
   ```bash
   curl -X POST http://localhost:5000/admin-setup/generate-token \
     -H "Content-Type: application/json" \
     -d '{"secret_key": "synergycare-admin-setup-2024-secure-key"}'
   ```

2. **Visit the registration page:**
   Open `http://localhost:3000/admin-setup?token=YOUR_TOKEN`

3. **Complete the registration form** with your admin credentials.

## Security Features

### Token Security
- **One-time use:** Each token can only be used once
- **Time-limited:** Tokens expire after 24 hours
- **Auto-invalidation:** Tokens become invalid after the first admin is created
- **Secret key protection:** Token generation requires a secret key

### Access Control
- **Single admin protection:** Only one admin can be created via this method
- **Automatic disabling:** The system disables itself after the first admin is registered
- **Secure validation:** Real-time token validation with expiration checking

## Environment Variables

### Backend (.env)
```bash
ADMIN_SETUP_SECRET=your-secure-secret-key-here
FLASK_ENV=development
CORS_ORIGINS=http://localhost:3000
```

### Frontend (.env.local)
```bash
BACKEND_URL=http://localhost:5000
```

## API Endpoints

### Generate Token
```http
POST /admin-setup/generate-token
Content-Type: application/json

{
  "secret_key": "your-secret-key"
}
```

### Validate Token
```http
POST /admin-setup/validate-token
Content-Type: application/json

{
  "token": "uuid-token-here"
}
```

### Register Admin
```http
POST /admin-setup/register
Content-Type: application/json

{
  "token": "uuid-token-here",
  "email": "admin@example.com",
  "password": "secure-password",
  "display_name": "System Administrator"
}
```

### Check Status
```http
GET /admin-setup/status
```

## Troubleshooting

### Common Issues

1. **"Admin user already exists"**
   - This means an admin has already been created
   - No further admin registration is needed
   - Use the regular login page instead

2. **"Invalid token"**
   - Check if the token was copied correctly
   - Verify the token hasn't expired (24-hour limit)
   - Ensure the token hasn't been used already

3. **"Backend not accessible"**
   - Verify the backend server is running on port 5000
   - Check firewall settings
   - Confirm the BACKEND_URL environment variable

4. **"Invalid secret key"**
   - Verify the ADMIN_SETUP_SECRET environment variable
   - Ensure it matches between the generator and backend

### Debug Commands

```bash
# Check backend health
curl http://localhost:5000/health

# Check admin setup status
curl http://localhost:5000/admin-setup/status

# View backend logs
cd backend && python run.py

# Check frontend logs
cd frontend && npm run dev
```

## Production Deployment

### Security Considerations

1. **Change the secret key:**
   ```bash
   export ADMIN_SETUP_SECRET="your-production-secret-$(openssl rand -hex 32)"
   ```

2. **Use HTTPS:**
   Ensure all communications use HTTPS in production

3. **Restrict access:**
   Consider firewall rules to limit access to the token generation endpoint

4. **Monitor usage:**
   Log all admin setup attempts for security auditing

### Deployment Steps

1. **Set environment variables:**
   ```bash
   ADMIN_SETUP_SECRET=your-production-secret
   BACKEND_URL=https://your-backend-domain.com
   ```

2. **Deploy backend and frontend**

3. **Generate token:**
   ```bash
   BACKEND_URL=https://your-backend-domain.com ./setup-admin.sh generate
   ```

4. **Complete setup** via the provided URL

5. **Verify completion:**
   ```bash
   BACKEND_URL=https://your-backend-domain.com ./setup-admin.sh status
   ```

## After Setup

Once the admin account is created:

1. **Login normally** at `/login`
2. **Access admin features** at `/admin`
3. **Create additional users** through the admin panel
4. **Set up roles** for doctors, patients, etc.

The one-time setup system will automatically disable itself and is no longer accessible.

## Files Created

This setup creates the following new files:

- `backend/app/routes/admin_setup.py` - Admin setup API routes
- `backend/scripts/generate_admin_token.py` - Python token generator
- `frontend/app/admin-setup/page.tsx` - Admin registration page
- `frontend/app/api/proxy/[...path]/route.ts` - API proxy routes
- `setup-admin.sh` - Shell script for easy setup
- `ADMIN_SETUP_GUIDE.md` - This documentation

## Next Steps

After completing admin setup:

1. Review the [RBAC Guide](RBAC_GUIDE.md) for role management
2. Check the [Integration Summary](INTEGRATION_SUMMARY.md) for system overview
3. Follow the [Local Development Guide](LOCAL_DEV.md) for development workflow
