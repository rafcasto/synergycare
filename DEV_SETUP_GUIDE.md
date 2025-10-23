# SynergyCare Local Development Setup

## ✅ What You Have

Your SynergyCare application now has a complete local development setup with:

### 🔧 **Start Scripts**

1. **`./start-simple.sh`** - Quick full-stack startup (Recommended)
   - Starts backend API (Flask on port 5001)
   - Starts frontend (Next.js on port 3000/3001)
   - Includes admin setup functionality
   - No Firebase emulators for faster startup

2. **`./start-local.sh`** - Full environment with Firebase
   - All services from start-simple.sh
   - Firebase emulators (Auth, Firestore, Functions)
   - Takes longer to start but full Firebase features

3. **`./dev.sh`** - Alternative quick start
   - Similar to start-simple.sh but different output style

### 🛡️ **Admin Registration System**

#### **Production Mode (Default)**
- **One-time admin registration** with secure tokens
- **Single admin only** - prevents multiple admin creation
- **24-hour token expiration**
- **Secure for production deployment**

#### **Development Mode (Local)**
- **Multiple admin creation allowed**
- **Reusable tokens for testing**
- **Easy reset functionality**
- **Perfect for local development**

### 🚀 **How to Use**

#### **Quick Start (Recommended):**
```bash
cd /Users/rafaelcastillo/sc/synergycare
./start-simple.sh
```

#### **Development Admin Management:**
```bash
# Quick setup - reset and create new admin
./admin-dev.sh quick

# Generate admin token (allows multiple in dev mode)
./admin-dev.sh create

# Reset admin setup (development only)
./admin-dev.sh reset

# Check status
./admin-dev.sh status
```

#### **Manual Admin Token Generation:**
```bash
# Development mode (allows multiple admins)
FLASK_ENV=development ./setup-admin.sh generate

# Production mode (one admin only)
./setup-admin.sh generate
```

#### **Stop Services:**
```bash
./stop-local.sh
```

### 📋 **Available Services**

When running, you'll have access to:

- **Frontend App**: http://localhost:3000 (or 3001)
- **Backend API**: http://localhost:5001
- **Admin Setup**: http://localhost:3000/admin-setup
- **API Health**: http://localhost:5001/health
- **Admin Status**: http://localhost:5001/admin-setup/status

### 🎯 **Development vs Production**

#### **Development Mode Features:**
- ✅ Multiple admin users allowed
- ✅ Token reuse for testing
- ✅ Reset functionality available
- ✅ More relaxed security for easier testing

#### **Production Mode Features:**
- ✅ One-time admin registration only
- ✅ Single admin user enforced
- ✅ Enhanced security measures
- ✅ Token expiration strictly enforced

### 🔧 **Quick Commands**

```bash
# === DEVELOPMENT WORKFLOW ===

# Start everything
./start-simple.sh

# Quick admin setup (development)
./admin-dev.sh quick

# Reset and create new admin
./admin-dev.sh reset && ./admin-dev.sh create

# === PRODUCTION WORKFLOW ===

# Generate one-time admin token
./setup-admin.sh generate

# Check if admin exists
./setup-admin.sh status

# === GENERAL ===

# Stop all services
./stop-local.sh

# Get help
./start-simple.sh --help
./setup-admin.sh --help
./admin-dev.sh --help
```

### 🔒 **Security Features**

#### **Development Mode:**
- ✅ Multiple admin creation for testing
- ✅ Easy reset functionality
- ✅ Relaxed restrictions for development
- ✅ Environment variable protection

#### **Production Mode:**
- ✅ One-time admin registration tokens
- ✅ Token expiration (24 hours)
- ✅ Prevents multiple admin creation
- ✅ Secure token validation
- ✅ Production-ready safeguards

### 📁 **Project Structure**

```
synergycare/
├── start-simple.sh     # Quick full-stack startup
├── start-local.sh      # Full environment with Firebase
├── stop-local.sh       # Stop all services
├── setup-admin.sh      # Admin registration helper
├── admin-dev.sh        # Development admin helper
├── dev.sh             # Alternative quick start
├── backend/           # Flask API server
├── frontend/          # Next.js application
└── functions/         # Firebase Functions
```

## 🎉 Ready for Both Development and Production!

Your development environment is fully configured for:
- **Easy local development** with multiple admin testing
- **Production-ready deployment** with secure one-time admin setup
- **Flexible workflow** supporting both scenarios

### **For Daily Development:**
```bash
./start-simple.sh
./admin-dev.sh quick  # Creates fresh admin for testing
```

### **For Production Deployment:**
```bash
./setup-admin.sh generate  # One-time secure admin creation
```
