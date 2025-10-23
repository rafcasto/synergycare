# Production Admin Setup Guide

## 🚀 Production Deployment Strategy

### Option 1: Environment Variables (Recommended)
Set these environment variables in your production environment:

```bash
# Production environment variables
ADMIN_SETUP_SECRET=your-super-secure-secret-key-here
INITIAL_ADMIN_EMAIL=admin@yourcompany.com
INITIAL_ADMIN_PASSWORD=secure-temp-password
INITIAL_ADMIN_NAME=System Administrator
```

### Option 2: Server-Side Token Generation
Use a secure server environment to generate tokens:

```bash
# On your production server or CI/CD pipeline
curl -X POST https://your-api.com/admin-setup/generate-token \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: your-super-secure-secret" \
  -d '{"secret_key": "your-super-secure-secret"}'
```

### Option 3: Infrastructure as Code
Include admin user creation in your deployment scripts:

```bash
# In your deployment script
./setup-admin.sh generate
# Use the generated URL for one-time setup
```

## 🔐 Production Security Considerations

1. **Use strong secrets** (minimum 32 characters)
2. **Rotate secrets** after admin setup
3. **Use HTTPS** in production
4. **Monitor admin creation** events
5. **Disable token generation** after first admin

## 📋 Production Deployment Checklist

- [ ] Set strong `ADMIN_SETUP_SECRET`
- [ ] Configure HTTPS
- [ ] Set up monitoring
- [ ] Test admin token generation
- [ ] Document admin credentials securely
- [ ] Plan for admin password rotation
