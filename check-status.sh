#!/bin/bash

echo "🔥 Firebase + Vercel Integration Status Check"
echo "============================================="

# Check if Firebase CLI is installed
if command -v firebase &> /dev/null; then
    echo "✅ Firebase CLI is installed"
    firebase --version
else
    echo "❌ Firebase CLI not found. Install with: npm install -g firebase-tools"
fi

# Check if Vercel CLI is installed
if command -v vercel &> /dev/null; then
    echo "✅ Vercel CLI is installed"
    vercel --version
else
    echo "❌ Vercel CLI not found. Install with: npm install -g vercel"
fi

echo ""
echo "📋 Current Firebase Project:"
firebase projects:list 2>/dev/null || echo "❌ Not authenticated. Run: firebase login"

echo ""
echo "🔧 Firebase Configuration:"
if [ -f "firebase.json" ]; then
    echo "✅ firebase.json exists"
    echo "Configured services:"
    if grep -q "functions" firebase.json; then echo "  - Functions"; fi
    if grep -q "firestore" firebase.json; then echo "  - Firestore"; fi
    if grep -q "dataconnect" firebase.json; then echo "  - Data Connect"; fi
    if grep -q "hosting" firebase.json; then echo "  - Hosting (remove this for Vercel)"; fi
else
    echo "❌ firebase.json not found"
fi

echo ""
echo "🌐 Frontend Configuration:"
if [ -f "frontend/package.json" ]; then
    echo "✅ Frontend package.json exists"
    if [ -f "frontend/vercel.json" ]; then
        echo "✅ Vercel configuration exists"
    else
        echo "⚠️  No vercel.json found (optional)"
    fi
else
    echo "❌ Frontend not found"
fi

echo ""
echo "🐍 Backend Configuration:"
if [ -f "backend/vercel.json" ]; then
    echo "✅ Backend Vercel configuration exists"
else
    echo "❌ Backend Vercel configuration not found"
fi

echo ""
echo "📄 Next Steps:"
echo "1. Run 'firebase login' if not authenticated"
echo "2. Run 'firebase use --add' to select/add your project"
echo "3. Deploy Firestore rules: 'firebase deploy --only firestore'"
echo "4. Deploy functions: 'firebase deploy --only functions'"
echo "5. Deploy frontend to Vercel: 'cd frontend && vercel'"
echo "6. Deploy backend to Vercel: 'cd backend && vercel'"
