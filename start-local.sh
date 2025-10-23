#!/bin/bash

# SynergyCare Local Development Environment Startup Script
# This script starts all services needed for local development

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to cleanup any existing processes
cleanup_ports() {
    local ports=("3000" "3001" "4001" "5001" "5002" "8081" "9099" "9399")
    
    log "Cleaning up any existing processes..."
    
    # Kill Firebase emulators
    pkill -f "firebase.*emulators" 2>/dev/null || true
    pkill -f "java.*firestore" 2>/dev/null || true
    
    # Kill backend processes
    pkill -f "python.*run.py" 2>/dev/null || true
    pkill -f "flask" 2>/dev/null || true
    
    # Kill frontend processes
    pkill -f "next-server" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    
    # Kill any processes on our ports
    for port in "${ports[@]}"; do
        if check_port $port; then
            warn "Port $port is in use, attempting to free it..."
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
        fi
    done
    
    sleep 3
}

# Function to install dependencies
install_dependencies() {
    log "Checking and installing dependencies..."
    
    # Check Node.js version
    if command -v node &> /dev/null; then
        local node_version=$(node -v | sed 's/v//')
        local major_version=$(echo $node_version | cut -d. -f1)
        if [ $major_version -lt 18 ]; then
            warn "Node.js version $node_version detected. Version 18+ recommended."
        else
            info "Node.js version $node_version ✓"
        fi
    else
        error "Node.js not found. Please install Node.js 18+"
        return 1
    fi
    
    # Install frontend dependencies
    if [ -f "frontend/package.json" ]; then
        info "Installing frontend dependencies..."
        cd frontend
        if npm install --silent; then
            info "✅ Frontend dependencies installed"
        else
            error "Failed to install frontend dependencies"
            cd ..
            return 1
        fi
        cd ..
    fi
    
    # Install functions dependencies
    if [ -f "functions/package.json" ]; then
        info "Installing functions dependencies..."
        cd functions
        if npm install --silent; then
            info "✅ Functions dependencies installed"
        else
            error "Failed to install functions dependencies"
            cd ..
            return 1
        fi
        cd ..
    fi
    
    # Install backend dependencies (Python)
    if [ -f "backend/requirements.txt" ]; then
        info "Installing backend dependencies..."
        cd backend
        if [ ! -d "venv" ]; then
            info "Creating Python virtual environment..."
            if ! python3 -m venv venv; then
                error "Failed to create Python virtual environment"
                cd ..
                return 1
            fi
        fi
        source venv/bin/activate
        if pip install -r requirements.txt --quiet; then
            info "✅ Backend dependencies installed"
        else
            error "Failed to install backend dependencies"
            cd ..
            return 1
        fi
        cd ..
    fi
}

# Function to build functions
build_functions() {
    if [ -f "functions/tsconfig.json" ]; then
        log "Building Firebase Functions..."
        cd functions
        npm run build
        cd ..
    fi
}

# Function to start Firebase emulators
start_emulators() {
    log "Starting Firebase emulators..."
    
    # Check if Firebase CLI is available
    if ! command -v firebase &> /dev/null; then
        error "Firebase CLI not found. Please install it with: npm install -g firebase-tools"
        return 1
    fi
    
    # Start emulators in background with explicit output redirect
    info "Starting Firebase emulators (this may take a moment)..."
    firebase emulators:start > firebase-emulator.log 2>&1 &
    EMULATOR_PID=$!
    
    # Wait for emulators to be ready
    info "Waiting for Firebase emulators to start..."
    sleep 15
    
    # Check if emulators are running
    local max_attempts=20
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if check_port 4001; then
            log "✅ Firebase emulators are running!"
            info "   • Emulator UI: http://localhost:4001"
            info "   • Functions: http://localhost:5002"
            info "   • Firestore: http://localhost:8081"
            info "   • Auth: http://localhost:9099"
            break
        fi
        
        # Check if process is still running
        if ! kill -0 $EMULATOR_PID 2>/dev/null; then
            error "Firebase emulators process died. Check firebase-emulator.log for details."
            return 1
        fi
        
        attempt=$((attempt + 1))
        info "Waiting for emulators... (attempt $attempt/$max_attempts)"
        sleep 3
    done
    
    if [ $attempt -eq $max_attempts ]; then
        error "Firebase emulators failed to start after $max_attempts attempts"
        error "Check firebase-emulator.log for details"
        return 1
    fi
}

# Function to start backend server
start_backend() {
    if [ -f "backend/run.py" ]; then
        log "Starting backend server..."
        cd backend
        
        # Activate virtual environment if it exists
        if [ -d "venv" ]; then
            source venv/bin/activate
        fi
        
        # Set backend port to avoid conflicts
        export PORT=5001
        
        # Set Firebase emulator environment variables
        export FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
        export FIRESTORE_EMULATOR_HOST=localhost:8081
        export FUNCTIONS_EMULATOR_HOST=localhost:5002
        
        # Start backend with logging
        python run.py > ../backend-dev.log 2>&1 &
        BACKEND_PID=$!
        cd ..
        
        info "Waiting for backend server to start..."
        
        # Check if backend is running
        local max_attempts=10
        local attempt=0
        
        while [ $attempt -lt $max_attempts ]; do
            if check_port 5001; then
                log "✅ Backend server is running!"
                info "   • Backend API: http://localhost:5001"
                break
            fi
            
            # Check if process is still running
            if ! kill -0 $BACKEND_PID 2>/dev/null; then
                error "Backend process died. Check backend-dev.log for details."
                return 1
            fi
            
            attempt=$((attempt + 1))
            info "Waiting for backend... (attempt $attempt/$max_attempts)"
            sleep 2
        done
        
        if [ $attempt -eq $max_attempts ]; then
            error "Backend failed to start after $max_attempts attempts"
            error "Check backend-dev.log for details"
            return 1
        fi
    else
        warn "No backend/run.py found, skipping backend startup"
    fi
}

# Function to start frontend
start_frontend() {
    if [ -f "frontend/package.json" ]; then
        log "Starting frontend development server..."
        cd frontend
        
        # Set environment variable for backend URL
        export BACKEND_URL=http://localhost:5001
        
        # Start Next.js in background with log output
        npm run dev > ../frontend-dev.log 2>&1 &
        FRONTEND_PID=$!
        cd ..
        
        info "Waiting for frontend server to start..."
        
        # Check if frontend is running (might start on port 3000 or 3001)
        local max_attempts=15
        local attempt=0
        local frontend_port=""
        
        while [ $attempt -lt $max_attempts ]; do
            if check_port 3000; then
                frontend_port="3000"
                break
            elif check_port 3001; then
                frontend_port="3001"
                break
            fi
            
            # Check if process is still running
            if ! kill -0 $FRONTEND_PID 2>/dev/null; then
                error "Frontend process died. Check frontend-dev.log for details."
                return 1
            fi
            
            attempt=$((attempt + 1))
            info "Waiting for frontend... (attempt $attempt/$max_attempts)"
            sleep 2
        done
        
        if [ -n "$frontend_port" ]; then
            log "✅ Frontend development server is running!"
            info "   • Next.js App: http://localhost:$frontend_port"
            FRONTEND_PORT=$frontend_port
        else
            error "Frontend failed to start after $max_attempts attempts"
            error "Check frontend-dev.log for details"
            return 1
        fi
    else
        warn "No frontend/package.json found, skipping frontend startup"
    fi
}

# Function to display running services
show_services() {
    echo ""
    log "🚀 SynergyCare Local Development Environment is running!"
    echo ""
    
    # Show frontend URL with dynamic port
    if [ -n "$FRONTEND_PORT" ]; then
        info "📱 Frontend (Next.js):     http://localhost:$FRONTEND_PORT"
        info "🛡️  Admin Setup:           http://localhost:$FRONTEND_PORT/admin-setup"
    fi
    
    info "🔥 Firebase Emulator UI:   http://localhost:4001"
    info "⚡ Functions Emulator:     http://localhost:5002"
    info "📊 Firestore Emulator:     http://localhost:8081"
    info "🔐 Auth Emulator:          http://localhost:9099"
    info "🔗 DataConnect Emulator:   http://localhost:9399"
    
    if [ -f "backend/run.py" ]; then
        info "🐍 Backend API:            http://localhost:5001"
        info "🩺 API Health Check:       http://localhost:5001/health"
    fi
    
    echo ""
    warn "🔧 Admin Setup Commands:"
    warn "   Generate token: BACKEND_URL=http://localhost:5001 FRONTEND_URL=http://localhost:${FRONTEND_PORT:-3000} ./setup-admin.sh generate"
    warn "   Check status:   BACKEND_URL=http://localhost:5001 ./setup-admin.sh status"
    echo ""
    warn "Press Ctrl+C to stop all services"
    echo ""
}

# Function to handle cleanup on exit
cleanup() {
    echo ""
    log "Shutting down services..."
    
    # Kill background processes gracefully
    if [ ! -z "$FRONTEND_PID" ] && kill -0 $FRONTEND_PID 2>/dev/null; then
        info "Stopping frontend server..."
        kill $FRONTEND_PID 2>/dev/null || true
        sleep 2
    fi
    
    if [ ! -z "$BACKEND_PID" ] && kill -0 $BACKEND_PID 2>/dev/null; then
        info "Stopping backend server..."
        kill $BACKEND_PID 2>/dev/null || true
        sleep 2
    fi
    
    if [ ! -z "$EMULATOR_PID" ] && kill -0 $EMULATOR_PID 2>/dev/null; then
        info "Stopping Firebase emulators..."
        kill -INT $EMULATOR_PID 2>/dev/null || true
        sleep 3
        # Force kill if still running
        kill -9 $EMULATOR_PID 2>/dev/null || true
    fi
    
    # Additional cleanup
    cleanup_ports
    
    # Clean up log files
    rm -f firebase-emulator.log frontend-dev.log backend-dev.log 2>/dev/null || true
    
    log "All services stopped. Goodbye! 👋"
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Main execution
main() {
    log "🏁 Starting SynergyCare Local Development Environment..."
    
    # Check if we're in the right directory
    if [ ! -f "firebase.json" ]; then
        error "firebase.json not found. Please run this script from the project root directory."
        exit 1
    fi
    
    # Cleanup any existing processes
    cleanup_ports
    
    # Only install dependencies if --clean flag is used or if node_modules don't exist
    if [[ "$1" == "--clean" ]] || [ ! -d "frontend/node_modules" ] || [ ! -d "functions/node_modules" ]; then
        install_dependencies
    else
        info "Skipping dependency installation (use --clean to force reinstall)"
    fi
    
    # Build functions only if needed
    if [ ! -f "functions/lib/index.js" ] || [ "functions/src/index.ts" -nt "functions/lib/index.js" ]; then
        build_functions
    else
        info "Functions already built (use --clean to rebuild)"
    fi
    
    # Start services
    start_emulators
    start_backend
    start_frontend
    
    # Show running services
    show_services
    
    # Offer to generate admin token if no admin exists
    if command -v curl &> /dev/null; then
        info "Checking admin setup status..."
        sleep 2
        
        # Check if backend is responding
        if curl -s http://localhost:5001/health > /dev/null 2>&1; then
            # Check admin status
            local admin_status=$(curl -s http://localhost:5001/admin-setup/status 2>/dev/null || echo "error")
            
            if [[ "$admin_status" != "error" ]]; then
                local setup_complete=$(echo "$admin_status" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['data']['setup_complete'])" 2>/dev/null || echo "true")
                
                if [[ "$setup_complete" == "False" ]]; then
                    echo ""
                    warn "🚨 No admin user detected!"
                    warn "Would you like to generate an admin registration token? (y/n)"
                    read -r -n 1 -t 10 response || response="n"
                    echo ""
                    
                    if [[ $response =~ ^[Yy]$ ]]; then
                        info "Generating admin token..."
                        BACKEND_URL=http://localhost:5001 FRONTEND_URL=http://localhost:${FRONTEND_PORT:-3000} ./setup-admin.sh generate
                    else
                        info "You can generate an admin token later with:"
                        info "BACKEND_URL=http://localhost:5001 FRONTEND_URL=http://localhost:${FRONTEND_PORT:-3000} ./setup-admin.sh generate"
                    fi
                else
                    info "✅ Admin user already exists"
                fi
            fi
        fi
    fi
    
    # Keep script running
    while true; do
        sleep 1
    done
}

# Check for help flag
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "SynergyCare Local Development Environment Startup Script"
    echo ""
    echo "Usage: ./start-local.sh [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  --clean        Clean install dependencies and rebuild"
    echo ""
    echo "This script will start:"
    echo "  • Firebase Emulators (Auth, Firestore, Functions, DataConnect)"
    echo "  • Frontend development server (Next.js on port 3000/3001)"
    echo "  • Backend API server (Flask on port 5001)"
    echo "  • Admin setup functionality"
    echo ""
    echo "After startup, you can:"
    echo "  • Access the app at http://localhost:3000 (or 3001)"
    echo "  • Generate admin tokens with ./setup-admin.sh generate"
    echo "  • Access Firebase emulator UI at http://localhost:4001"
    echo ""
    echo "Press Ctrl+C to stop all services."
    trap - EXIT  # Remove trap before exiting
    exit 0
fi

# Handle clean flag
if [[ "$1" == "--clean" ]]; then
    log "Clean install requested - removing node_modules and reinstalling..."
    rm -rf frontend/node_modules functions/node_modules backend/venv 2>/dev/null || true
fi

# Run main function
main
