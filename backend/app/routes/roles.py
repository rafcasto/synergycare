from flask import Blueprint, request, jsonify
from ..middleware.auth import require_admin, require_auth
from ..services.firebase_service import FirebaseService
from ..utils.responses import success_response, error_response

roles_bp = Blueprint('roles', __name__, url_prefix='/roles')

@roles_bp.route('/set', methods=['POST'])
@require_admin
def set_user_role():
    """Set role for a user (Admin only)."""
    try:
        data = request.get_json()
        uid = data.get('uid')
        role = data.get('role')
        
        if not uid or not role:
            return error_response('uid and role are required', 400)
        
        if role not in FirebaseService.VALID_ROLES:
            return error_response(f'Invalid role. Must be one of: {", ".join(FirebaseService.VALID_ROLES)}', 400)
        
        success = FirebaseService.set_user_role(uid, role)
        
        if success:
            return success_response({'uid': uid, 'role': role}, f'Role {role} set successfully for user')
        else:
            return error_response('Failed to set user role', 500)
            
    except Exception as e:
        return error_response(f'Error setting user role: {str(e)}', 500)

@roles_bp.route('/get/<uid>', methods=['GET'])
@require_admin
def get_user_role(uid):
    """Get role for a user (Admin only)."""
    try:
        role = FirebaseService.get_user_role(uid)
        
        if role:
            return success_response({'uid': uid, 'role': role}, 'User role retrieved successfully')
        else:
            return error_response('User role not found', 404)
            
    except Exception as e:
        return error_response(f'Error getting user role: {str(e)}', 500)

@roles_bp.route('/remove/<uid>', methods=['DELETE'])
@require_admin
def remove_user_role(uid):
    """Remove role from a user (Admin only)."""
    try:
        success = FirebaseService.remove_user_role(uid)
        
        if success:
            return success_response({'uid': uid}, 'User role removed successfully')
        else:
            return error_response('Failed to remove user role', 500)
            
    except Exception as e:
        return error_response(f'Error removing user role: {str(e)}', 500)

@roles_bp.route('/create-user', methods=['POST'])
@require_admin
def create_user_with_role():
    """Create a new user with a specific role (Admin only)."""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        role = data.get('role')
        display_name = data.get('display_name')
        
        if not email or not password or not role:
            return error_response('email, password, and role are required', 400)
        
        if role not in FirebaseService.VALID_ROLES:
            return error_response(f'Invalid role. Must be one of: {", ".join(FirebaseService.VALID_ROLES)}', 400)
        
        uid = FirebaseService.create_user_with_role(email, password, role, display_name)
        
        if uid:
            return success_response({
                'uid': uid,
                'email': email,
                'role': role,
                'display_name': display_name
            }, 'User created successfully with role')
        else:
            return error_response('Failed to create user with role', 500)
            
    except Exception as e:
        return error_response(f'Error creating user: {str(e)}', 500)

@roles_bp.route('/list/<role>', methods=['GET'])
@require_admin
def list_users_by_role(role):
    """List all users with a specific role (Admin only)."""
    try:
        if role not in FirebaseService.VALID_ROLES:
            return error_response(f'Invalid role. Must be one of: {", ".join(FirebaseService.VALID_ROLES)}', 400)
        
        users = FirebaseService.list_users_by_role(role)
        
        return success_response({
            'role': role,
            'users': users,
            'count': len(users)
        }, f'Users with role {role} retrieved successfully')
        
    except Exception as e:
        return error_response(f'Error listing users by role: {str(e)}', 500)

@roles_bp.route('/my-role', methods=['GET'])
@require_auth
def get_my_role():
    """Get the current user's role."""
    try:
        user = request.user
        role = user.get('role')
        
        if role:
            return success_response({
                'uid': user.get('uid'),
                'role': role,
                'email': user.get('email')
            }, 'Your role retrieved successfully')
        else:
            return error_response('Role not found. Please contact administrator.', 404)
            
    except Exception as e:
        return error_response(f'Error getting your role: {str(e)}', 500)

@roles_bp.route('/valid-roles', methods=['GET'])
@require_auth
def get_valid_roles():
    """Get list of valid roles."""
    return success_response({
        'roles': FirebaseService.VALID_ROLES
    }, 'Valid roles retrieved successfully')

@roles_bp.route('/delete-user/<uid>', methods=['DELETE'])
@require_admin
def delete_user(uid):
    """Delete a user (Admin only)."""
    try:
        success = FirebaseService.delete_user(uid)
        
        if success:
            return success_response({'uid': uid}, 'User deleted successfully')
        else:
            return error_response('Failed to delete user', 500)
            
    except Exception as e:
        return error_response(f'Error deleting user: {str(e)}', 500)
