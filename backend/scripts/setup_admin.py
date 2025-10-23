"""
Initial setup script to create the first admin user.
This should be run once during initial deployment.
"""
import sys
import os
import json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.services.firebase_service import FirebaseService

def setup_initial_admin():
    """Create the first admin user."""
    app = create_app()
    
    with app.app_context():
        print("Setting up initial admin user...")
        
        # Get admin credentials from environment or prompt
        admin_email = os.getenv('INITIAL_ADMIN_EMAIL')
        admin_password = os.getenv('INITIAL_ADMIN_PASSWORD')
        
        if not admin_email:
            admin_email = input("Enter admin email: ")
        
        if not admin_password:
            admin_password = input("Enter admin password: ")
        
        try:
            # Create admin user
            admin_uid = FirebaseService.create_user_with_role(
                email=admin_email,
                password=admin_password,
                role='admin',
                display_name='System Administrator'
            )
            
            if admin_uid:
                print(f"✅ Successfully created admin user: {admin_email} (UID: {admin_uid})")
                print("You can now log in with these credentials and manage other users.")
            else:
                print("❌ Failed to create admin user")
                return False
                
        except Exception as e:
            print(f"❌ Error creating admin user: {e}")
            return False
    
    return True

if __name__ == "__main__":
    setup_initial_admin()
