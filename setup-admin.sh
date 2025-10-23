#!/bin/bash

# SynergyCare Admin Setup Script
# This script helps generate and use one-time admin registration tokens

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL=${BACKEND_URL:-"http://localhost:5000"}
FRONTEND_URL=${FRONTEND_URL:-"http://localhost:3000"}
ADMIN_SECRET=${ADMIN_SETUP_SECRET:-"synergycare-admin-setup-2024-secure-key"}

print_header() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "🛡️  SynergyCare Admin Setup Tool"
    echo "=================================================="
    echo -e "${NC}"
}

print_step() {
    echo -e "${YELLOW}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_backend() {
    print_step "Checking backend connectivity..."
    
    if curl -s "$BACKEND_URL/health" > /dev/null; then
        print_success "Backend is running at $BACKEND_URL"
        return 0
    else
        print_error "Backend is not accessible at $BACKEND_URL"
        echo "Please make sure the backend server is running."
        echo "You can start it with: cd backend && python run.py"
        return 1
    fi
}

check_admin_status() {
    print_step "Checking admin setup status..."
    
    local status_response=$(curl -s "$BACKEND_URL/admin-setup/status" || echo "error")
    
    if [[ "$status_response" == "error" ]]; then
        print_error "Could not check admin status"
        return 1
    fi
    
    local setup_complete=$(echo "$status_response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['data']['setup_complete'])" 2>/dev/null || echo "false")
    
    if [[ "$setup_complete" == "True" ]]; then
        print_success "Admin user already exists"
        local admin_count=$(echo "$status_response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['data']['admin_count'])" 2>/dev/null || echo "unknown")
        echo "Number of admin users: $admin_count"
        return 2
    else
        print_success "No admin user exists. Ready for setup."
        return 0
    fi
}

generate_token() {
    print_step "Generating admin registration token..."
    
    # Check if we're in development mode
    local dev_mode="false"
    if [[ "${FLASK_ENV:-}" == "development" || "${NODE_ENV:-}" == "development" ]]; then
        dev_mode="true"
    fi
    
    local request_body="{\"secret_key\": \"$ADMIN_SECRET\""
    if [[ "$dev_mode" == "true" ]]; then
        request_body="$request_body, \"allow_multiple\": true"
    fi
    request_body="$request_body}"
    
    local response=$(curl -s -w "%{http_code}" -o /tmp/token_response.json \
        -X POST "$BACKEND_URL/admin-setup/generate-token" \
        -H "Content-Type: application/json" \
        -d "$request_body")
    
    local http_code="${response: -3}"
    
    if [[ "$http_code" == "200" ]]; then
        local token=$(cat /tmp/token_response.json | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['data']['token'])" 2>/dev/null)
        local expires_at=$(cat /tmp/token_response.json | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['data']['expires_at'])" 2>/dev/null)
        
        if [[ -n "$token" ]]; then
            print_success "Token generated successfully!"
            if [[ "$dev_mode" == "true" ]]; then
                print_success "Development mode: Multiple admins allowed"
            fi
            echo ""
            echo "📋 Token: $token"
            echo "⏰ Expires: $(date -r "$expires_at" 2>/dev/null || echo "24 hours from now")"
            echo "🔗 Registration URL: $FRONTEND_URL/admin-setup?token=$token"
            echo ""
            echo "📝 Next steps:"
            echo "1. Copy the registration URL above"
            echo "2. Open it in your browser"
            echo "3. Fill in your admin credentials"
            echo "4. Complete the setup"
            echo ""
            
            # Ask if user wants to open the URL
            read -p "Would you like to open the registration URL now? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                if command -v open > /dev/null; then
                    open "$FRONTEND_URL/admin-setup?token=$token"
                elif command -v xdg-open > /dev/null; then
                    xdg-open "$FRONTEND_URL/admin-setup?token=$token"
                else
                    echo "Please manually open: $FRONTEND_URL/admin-setup?token=$token"
                fi
            fi
            
            return 0
        else
            print_error "Failed to parse token from response"
            return 1
        fi
    elif [[ "$http_code" == "403" ]]; then
        if [[ "$dev_mode" == "true" ]]; then
            print_error "Admin user already exists (even in dev mode)"
            echo "To reset in development, use: $0 reset-dev"
        else
            print_error "Admin user already exists"
        fi
        return 2
    elif [[ "$http_code" == "401" ]]; then
        print_error "Invalid admin secret key"
        echo "Please check the ADMIN_SETUP_SECRET environment variable"
        return 1
    else
        print_error "Failed to generate token (HTTP $http_code)"
        if [[ -f /tmp/token_response.json ]]; then
            local error_msg=$(cat /tmp/token_response.json | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('message', 'Unknown error'))" 2>/dev/null || echo "Unknown error")
            echo "Error: $error_msg"
        fi
        return 1
    fi
    
    # Clean up temp file
    rm -f /tmp/token_response.json
}

reset_dev_admin() {
    print_step "Resetting development admin setup..."
    
    # Check if we're in development mode
    if [[ "${FLASK_ENV:-}" != "development" && "${NODE_ENV:-}" != "development" ]]; then
        print_error "Reset is only available in development mode"
        echo "Set FLASK_ENV=development or NODE_ENV=development"
        return 1
    fi
    
    local response=$(curl -s -w "%{http_code}" -o /tmp/reset_response.json \
        -X POST "$BACKEND_URL/admin-setup/reset-dev" \
        -H "Content-Type: application/json" \
        -d "{\"secret_key\": \"$ADMIN_SECRET\"}")
    
    local http_code="${response: -3}"
    
    if [[ "$http_code" == "200" ]]; then
        print_success "Development admin setup has been reset!"
        echo "You can now generate new admin tokens and create new admin users."
        return 0
    elif [[ "$http_code" == "403" ]]; then
        print_error "Reset not allowed (not in development mode or invalid secret)"
        return 1
    else
        print_error "Failed to reset admin setup (HTTP $http_code)"
        if [[ -f /tmp/reset_response.json ]]; then
            local error_msg=$(cat /tmp/reset_response.json | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('message', 'Unknown error'))" 2>/dev/null || echo "Unknown error")
            echo "Error: $error_msg"
        fi
        return 1
    fi
    
    # Clean up temp file
    rm -f /tmp/reset_response.json
}

show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  generate    Generate a new admin registration token"
    echo "  status      Check current admin setup status"
    echo "  reset-dev   Reset admin setup (development mode only)"
    echo "  help        Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  BACKEND_URL           Backend server URL (default: http://localhost:5000)"
    echo "  FRONTEND_URL          Frontend server URL (default: http://localhost:3000)"
    echo "  ADMIN_SETUP_SECRET    Secret key for admin setup (required)"
    echo "  FLASK_ENV             Set to 'development' for dev mode features"
    echo ""
    echo "Examples:"
    echo "  $0 generate           # Generate a new token"
    echo "  $0 status             # Check setup status"
    echo "  $0 reset-dev          # Reset in development mode"
    echo "  BACKEND_URL=https://api.example.com $0 generate"
}

main() {
    print_header
    
    local command=${1:-"generate"}
    
    case "$command" in
        "generate")
            if ! check_backend; then
                exit 1
            fi
            
            local status_result=$(check_admin_status)
            local status_code=$?
            
            if [[ $status_code == 2 ]]; then
                echo "Admin setup is already complete. No action needed."
                exit 0
            elif [[ $status_code == 1 ]]; then
                exit 1
            fi
            
            if ! generate_token; then
                exit 1
            fi
            ;;
            
        "status")
            if ! check_backend; then
                exit 1
            fi
            check_admin_status
            ;;
            
        "reset-dev")
            if ! check_backend; then
                exit 1
            fi
            reset_dev_admin
            ;;
            
        "help"|"-h"|"--help")
            show_help
            ;;
            
        *)
            print_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
