#!/bin/bash

# SynergyCare Local Development Environment Stop Script
# This script stops all local development services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

log "🛑 Stopping SynergyCare Local Development Environment..."

# Kill Firebase emulators
log "Stopping Firebase emulators..."
pkill -f "firebase.*emulators" 2>/dev/null || true
pkill -f "java.*firestore" 2>/dev/null || true

# Kill Next.js development server
log "Stopping frontend server..."
pkill -f "next-server" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

# Kill Flask backend
log "Stopping backend server..."
pkill -f "python.*run.py" 2>/dev/null || true
pkill -f "flask" 2>/dev/null || true
pkill -f "PORT=5001.*python" 2>/dev/null || true

# Kill any processes on our known ports
local_ports=("3000" "3001" "4001" "5001" "5002" "8081" "9099" "9399")

for port in "${local_ports[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        warn "Killing process on port $port..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    fi
done

log "✅ All services stopped successfully!"
log "You can restart the environment with: ./start-local.sh"
