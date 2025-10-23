#!/bin/bash

# SynergyCare Deployment Script
# This script helps deploy both frontend and backend to Vercel

echo "🚀 SynergyCare Deployment Script"
echo "================================="

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Function to deploy frontend
deploy_frontend() {
    echo "📦 Deploying Frontend..."
    cd frontend
    
    # Check if linked to Vercel
    if [ ! -d ".vercel" ]; then
        echo "⚠️  Frontend not linked to Vercel. Please run: cd frontend && vercel link"
        cd ..
        return 1
    fi
    
    # Deploy
    if [ "$1" = "--production" ]; then
        vercel --prod
    else
        vercel
    fi
    
    cd ..
    echo "✅ Frontend deployment completed"
}

# Function to deploy backend
deploy_backend() {
    echo "🔧 Deploying Backend..."
    cd backend
    
    # Check if linked to Vercel
    if [ ! -d ".vercel" ]; then
        echo "⚠️  Backend not linked to Vercel. Please run: cd backend && vercel link"
        cd ..
        return 1
    fi
    
    # Deploy
    if [ "$1" = "--production" ]; then
        vercel --prod
    else
        vercel
    fi
    
    cd ..
    echo "✅ Backend deployment completed"
}

# Main script logic
case "$1" in
    "frontend")
        deploy_frontend $2
        ;;
    "backend")
        deploy_backend $2
        ;;
    "both"|"")
        deploy_frontend $2
        deploy_backend $2
        ;;
    "prod"|"production")
        echo "🎯 Production Deployment"
        deploy_frontend --production
        deploy_backend --production
        ;;
    *)
        echo "Usage: $0 [frontend|backend|both|prod] [--production]"
        echo ""
        echo "Examples:"
        echo "  $0                    # Deploy both to preview"
        echo "  $0 frontend           # Deploy only frontend to preview"
        echo "  $0 backend            # Deploy only backend to preview"
        echo "  $0 prod               # Deploy both to production"
        echo "  $0 frontend --production  # Deploy frontend to production"
        exit 1
        ;;
esac

echo "🎉 Deployment script completed!"
echo ""
echo "📱 Your applications:"
echo "   Frontend: https://synergycare.vercel.app"
echo "   Backend:  https://synergycare-backend.vercel.app"
