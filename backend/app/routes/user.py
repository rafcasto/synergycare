from flask import Blueprint, request, jsonify
from ..middleware.auth import require_auth
from ..services.firebase_service import FirebaseService
from ..utils.responses import success_response, error_response

user_bp = Blueprint('user', __name__, url_prefix='/user')

@user_bp.route('/profile', methods=['GET'])
@require_auth
def get_user_profile():
    """Get user profile information."""
    user = request.user
    
    profile_data = {
        'uid': user.get('uid'),
        'email': user.get('email'),
        'email_verified': user.get('email_verified'),
        'name': user.get('name'),
        'picture': user.get('picture'),
        'auth_time': user.get('auth_time'),
        'firebase': user.get('firebase', {})
    }
    
    return success_response(profile_data, "Profile retrieved successfully")

@user_bp.route('/complete-registration', methods=['POST'])
@require_auth
def complete_registration():
    """Complete user registration with role and additional information."""
    try:
        user = request.user
        data = request.get_json()
        
        role = data.get('role')
        user_data = data.get('user_data', {})
        
        if not role:
            return error_response('Role is required', 400)
        
        if role not in FirebaseService.VALID_ROLES:
            return error_response(f'Invalid role. Must be one of: {", ".join(FirebaseService.VALID_ROLES)}', 400)
        
        # Set the user role
        uid = user.get('uid')
        role_success = FirebaseService.set_user_role(uid, role)
        
        if not role_success:
            return error_response('Failed to set user role', 500)
        
        # TODO: Store additional user data based on role
        # For now, we'll just log it
        print(f"User {uid} registered as {role} with data: {user_data}")
        
        return success_response({
            'uid': uid,
            'role': role,
            'message': 'Registration completed successfully'
        }, 'Registration completed successfully')
        
    except Exception as e:
        return error_response(f'Error completing registration: {str(e)}', 500)