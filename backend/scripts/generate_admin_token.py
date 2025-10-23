#!/usr/bin/env python3
"""
CLI script to generate one-time admin registration tokens.
Usage: python generate_admin_token.py
"""
import sys
import os
import requests
import json
from datetime import datetime

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def generate_token():
    """Generate an admin registration token via API call."""
    
    # Configuration
    backend_url = os.getenv('BACKEND_URL', 'http://localhost:5000')
    admin_secret = os.getenv('ADMIN_SETUP_SECRET', 'change-me-in-production')
    
    print("🔧 Generating one-time admin registration token...")
    print(f"Backend URL: {backend_url}")
    
    try:
        # Make API call to generate token
        response = requests.post(
            f"{backend_url}/admin-setup/generate-token",
            json={"secret_key": admin_secret},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data['data']['token']
            expires_at = data['data']['expires_at']
            registration_url = data['data']['registration_url']
            
            # Convert timestamp to readable date
            expires_date = datetime.fromtimestamp(expires_at).strftime('%Y-%m-%d %H:%M:%S')
            
            print("\n✅ Admin registration token generated successfully!")
            print(f"📋 Token: {token}")
            print(f"⏰ Expires: {expires_date}")
            print(f"🔗 Registration URL: {backend_url.replace(':5000', ':3000')}{registration_url}")
            print("\n📝 Instructions:")
            print("1. Copy the token above")
            print("2. Visit the registration URL in your browser")
            print("3. Enter your admin credentials along with the token")
            print("4. The token will be automatically invalidated after use")
            print("\n⚠️  Security Note: This token is valid for 24 hours and can only be used once.")
            
        elif response.status_code == 403:
            print("❌ Admin user already exists. Registration is disabled.")
            
        else:
            error_data = response.json() if response.headers.get('content-type') == 'application/json' else {}
            error_msg = error_data.get('message', f'HTTP {response.status_code}')
            print(f"❌ Failed to generate token: {error_msg}")
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Could not connect to backend at {backend_url}")
        print("💡 Make sure the backend server is running")
        
    except requests.exceptions.Timeout:
        print("❌ Request timed out")
        
    except Exception as e:
        print(f"❌ Error: {e}")

def check_admin_status():
    """Check if admin setup is complete."""
    backend_url = os.getenv('BACKEND_URL', 'http://localhost:5000')
    
    try:
        response = requests.get(f"{backend_url}/admin-setup/status", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            status_data = data['data']
            
            if status_data['setup_complete']:
                print("✅ Admin setup is complete")
                print(f"👥 Admin users: {status_data['admin_count']}")
                return True
            else:
                print("⚠️  Admin setup is required")
                print(f"🎫 Valid tokens: {status_data.get('valid_tokens', 0)}")
                return False
                
    except Exception as e:
        print(f"❌ Could not check admin status: {e}")
        return None

if __name__ == "__main__":
    print("🛡️  SynergyCare Admin Token Generator")
    print("=" * 40)
    
    # Check current status
    status = check_admin_status()
    
    if status is True:
        print("\n⚠️  Admin user already exists. No token generation needed.")
        sys.exit(0)
    elif status is False:
        print("\n🚀 Proceeding with token generation...")
        generate_token()
    else:
        print("\n⚠️  Could not determine admin status. Attempting to generate token anyway...")
        generate_token()
