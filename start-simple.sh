#!/bin/bash

# SynergyCare Simple Development Environment Startup
# Starts backend and frontend for full-stack development

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

# Function to check if port is in use
port_in_use() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    if port_in_use $1; then
        warn "Killing process on port $1..."
        lsof -ti:$1 | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Quick cleanup
cleanup_quick() {
    echo ""
    info "Stopping services..."
    
    # Kill background processes if they exist
    [ ! -z "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null || true
    [ ! -z "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null || true
    
    # Kill common processes
    pkill -f "next-server\|python.*run.py\|flask" 2>/dev/null || true
    
    # Kill processes on our ports
    kill_port 3000  # Next.js
    kill_port 3001  # Next.js alternate
    kill_port 5001  # Backend
    
    log "All services stopped"
}

# Function to start backend
start_backend() {
    info "Starting backend server..."
    
    if [ ! -f "backend/run.py" ]; then
        warn "Backend not found, skipping..."
        return 0
    fi
    
    cd backend
    
    # Create and activate virtual environment
    if [ ! -d "venv" ]; then
        info "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    
    # Install dependencies if needed
    if [ ! -f "venv/.installed" ]; then
        info "Installing backend dependencies..."
        pip install -r requirements.txt --quiet
        touch venv/.installed
    fi
    
    # Start backend
    export PORT=5001
    python run.py > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend
    local attempts=0
    while [ $attempts -lt 10 ]; do
        if port_in_use 5001; then
            log "Backend running at http://localhost:5001"
            return 0
        fi
        attempts=$((attempts + 1))
        sleep 1
    done
    
    warn "Backend may still be starting..."
}

# Function to start frontend
start_frontend() {
    info "Starting frontend development server..."
    
    if [ ! -f "frontend/package.json" ]; then
        error "Frontend not found"
        return 1
    fi
    
    cd frontend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        info "Installing frontend dependencies..."
        npm install --silent
    fi
    
    # Set backend URL
    export BACKEND_URL=http://localhost:5001
    
    log "Frontend starting (this may take a moment)..."
    echo ""
    info "🌐 Frontend: http://localhost:3000 (or 3001)"
    info "🐍 Backend API: http://localhost:5001"
    info "🛡️  Admin Setup: http://localhost:3000/admin-setup"
    echo ""
    warn "Use './setup-admin.sh generate' to create admin registration token"
    echo ""
    
    # Start frontend (this blocks)
    npm run dev
}

# Trap for cleanup
trap cleanup_quick EXIT INT TERM

# Show help
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "SynergyCare Simple Development Environment"
    echo ""
    echo "Usage: ./start-simple.sh [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help       Show this help"
    echo "  --frontend-only  Start only frontend"
    echo "  --backend-only   Start only backend"
    echo ""
    echo "Full Stack Services:"
    echo "  • Backend API (Flask): http://localhost:5001"
    echo "  • Frontend (Next.js): http://localhost:3000"
    echo "  • Admin Setup: http://localhost:3000/admin-setup"
    echo ""
    echo "Admin Commands:"
    echo "  • Generate token: ./setup-admin.sh generate"
    echo "  • Check status: ./setup-admin.sh status"
    trap - EXIT
    exit 0
fi

echo ""
log "🚀 SynergyCare Full Stack Development Environment"
echo ""

# Check directory
if [ ! -f "setup-admin.sh" ]; then
    error "Please run this script from the project root directory"
    exit 1
fi

# Quick cleanup first
info "Cleaning up any existing processes..."
pkill -f "next-server\|python.*run.py\|flask" 2>/dev/null || true
kill_port 3000
kill_port 3001
kill_port 5001
sleep 2

# Frontend only mode
if [[ "$1" == "--frontend-only" ]]; then
    start_frontend
    exit 0
fi

# Backend only mode
if [[ "$1" == "--backend-only" ]]; then
    start_backend
    log "Backend running at http://localhost:5001"
    log "Press Ctrl+C to stop"
    wait $BACKEND_PID
    exit 0
fi

# Start both services
start_backend
start_frontend
