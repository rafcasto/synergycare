#!/bin/bash

# SynergyCare Full Stack Development Environment
# Starts backend, frontend, and Firebase emulators

# Colors
G='\033[0;32m'; Y='\033[1;33m'; B='\033[0;34m'; R='\033[0;31m'; NC='\033[0m'

log() { echo -e "${G}✓ $1${NC}"; }
info() { echo -e "${B}→ $1${NC}"; }
warn() { echo -e "${Y}⚠ $1${NC}"; }
error() { echo -e "${R}✗ $1${NC}"; }

# Quick cleanup
pkill -f "next-server\|firebase.*emulators\|python.*run.py" 2>/dev/null || true
sleep 1

echo ""
log "🚀 SynergyCare Full Stack Dev Environment"

# Check directory
[ ! -f "firebase.json" ] && { error "Run from project root"; exit 1; }

# Start emulators in background (silent)
info "Starting Firebase emulators..."
firebase emulators:start >/dev/null 2>&1 &
EMULATOR_PID=$!

# Start backend
if [ -f "backend/run.py" ]; then
    info "Starting backend server..."
    cd backend
    if [ -d "venv" ]; then
        source venv/bin/activate
    fi
    PORT=5001 python run.py > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    sleep 2
    log "Backend API: http://localhost:5001"
else
    warn "Backend not found, skipping..."
fi

# Start frontend
info "Starting frontend..."
cd frontend
export BACKEND_URL=http://localhost:5001

echo ""
log "🎉 All services starting..."
echo ""
info "Frontend: http://localhost:3000 (or 3001)"
info "Backend API: http://localhost:5001"
info "Firebase UI: http://localhost:4001"
info "Admin Setup: Use './setup-admin.sh generate' to create admin token"
echo ""

# Cleanup function
cleanup() {
    echo ""
    info "Shutting down services..."
    kill $BACKEND_PID $EMULATOR_PID 2>/dev/null || true
    pkill -f "next-server\|firebase.*emulators\|python.*run.py" 2>/dev/null || true
    log "All services stopped"
}

trap cleanup EXIT INT TERM

# This blocks and shows Next.js output
exec npm run dev
