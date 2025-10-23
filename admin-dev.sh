#!/bin/bash

# SynergyCare Development Admin Helper
# Quick admin management for local development

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}✓ $1${NC}"; }
info() { echo -e "${BLUE}ℹ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
error() { echo -e "${RED}✗ $1${NC}"; }

# Set development environment
export FLASK_ENV=development
export NODE_ENV=development
export BACKEND_URL=http://localhost:5001
export FRONTEND_URL=http://localhost:3000

echo ""
log "🛡️ SynergyCare Admin Helper (Development Mode)"
echo ""

# Check if backend is running
if ! curl -s http://localhost:5001/health > /dev/null 2>&1; then
    warn "Backend not running on port 5001"
    info "Start it with: ./start-simple.sh --backend-only"
    exit 1
fi

case "${1:-status}" in
    "create"|"generate")
        info "Generating new admin token..."
        ./setup-admin.sh generate
        ;;
        
    "reset")
        info "Resetting development admin setup..."
        ./setup-admin.sh reset-dev
        ;;
        
    "status")
        info "Checking admin setup status..."
        ./setup-admin.sh status
        ;;
        
    "quick"|"q")
        info "Quick admin setup for development..."
        echo ""
        
        # Reset first
        info "1. Resetting development setup..."
        ./setup-admin.sh reset-dev
        
        # Generate token
        info "2. Generating new admin token..."
        ./setup-admin.sh generate
        ;;
        
    "help"|"-h"|"--help")
        echo "SynergyCare Development Admin Helper"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  create/generate  Generate new admin token"
        echo "  reset           Reset admin setup (dev mode)"
        echo "  status          Check admin status"
        echo "  quick/q         Reset and generate new token"
        echo "  help            Show this help"
        echo ""
        echo "URLs:"
        echo "  Frontend: http://localhost:3000"
        echo "  Admin Setup: http://localhost:3000/admin-setup"
        echo "  Backend API: http://localhost:5001"
        ;;
        
    *)
        error "Unknown command: $1"
        echo "Use '$0 help' for available commands"
        exit 1
        ;;
esac
