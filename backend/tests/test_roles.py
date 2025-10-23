"""
Test role-based access control functionality
"""
import sys
import os

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.firebase_service import FirebaseService

def test_valid_roles():
    """Test that valid roles are properly defined."""
    expected_roles = ['admin', 'patient', 'doctor']
    assert FirebaseService.VALID_ROLES == expected_roles

def test_role_validation():
    """Test role validation logic."""
    # Valid roles should pass
    for role in ['admin', 'patient', 'doctor']:
        assert role in FirebaseService.VALID_ROLES
    
    # Invalid roles should fail
    invalid_roles = ['superuser', 'nurse', 'manager', '']
    for role in invalid_roles:
        assert role not in FirebaseService.VALID_ROLES

def test_firebase_service_methods_exist():
    """Test that required methods exist on FirebaseService."""
    required_methods = [
        'set_user_role',
        'get_user_role', 
        'remove_user_role',
        'create_user_with_role',
        'list_users_by_role'
    ]
    
    for method_name in required_methods:
        assert hasattr(FirebaseService, method_name)
        assert callable(getattr(FirebaseService, method_name))

if __name__ == "__main__":
    # Run basic tests without Firebase connection
    test_valid_roles()
    test_role_validation()
    test_firebase_service_methods_exist()
    print("✅ All basic role system tests passed!")
