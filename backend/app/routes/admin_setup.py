"""
Admin setup routes for one-time admin registration.
"""
import uuid
import time
import hashlib
import os
from flask import Blueprint, request, current_app
from ..services.firebase_service import FirebaseService
from ..utils.responses import success_response, error_response
import logging

logger = logging.getLogger(__name__)

admin_setup_bp = Blueprint('admin_setup', __name__, url_prefix='/admin-setup')

# In-memory storage for tokens (in production, use Redis or database)
_admin_tokens = {}

@admin_setup_bp.route('/generate-token', methods=['POST'])
def generate_admin_token():
    """
    Generate a one-time admin registration token.
    This endpoint should be protected in production (e.g., only callable from server environment).
    """
    try:
        # Get request data
        data = request.get_json() or {}
        
        # Check development mode
        is_dev_mode = os.getenv('FLASK_ENV') == 'development'
        allow_multiple_admins = data.get('allow_multiple', False)
        
        # Check if admin already exists (skip in dev mode if allow_multiple is true)
        admins = FirebaseService.list_users_by_role('admin')
        if admins and not (is_dev_mode and allow_multiple_admins):
            return error_response('Admin user already exists. Registration is disabled.', 403)
        
        # Verify secret key (for additional security)
        secret_key = data.get('secret_key') or request.headers.get('X-Admin-Secret')
        
        expected_secret = os.getenv('ADMIN_SETUP_SECRET', 'change-me-in-production')
        if secret_key != expected_secret:
            return error_response('Invalid secret key', 401)
        
        # Generate unique token
        token = str(uuid.uuid4())
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        # Store token with expiration (24 hours)
        expiration = int(time.time()) + (24 * 60 * 60)
        _admin_tokens[token_hash] = {
            'created_at': int(time.time()),
            'expires_at': expiration,
            'used': False
        }
        
        # Clean up expired tokens
        _cleanup_expired_tokens()
        
        logger.info(f"Generated admin registration token (expires at {expiration})")
        
        return success_response({
            'token': token,
            'expires_at': expiration,
            'registration_url': f"/admin-setup/register?token={token}"
        }, 'Admin registration token generated successfully')
        
    except Exception as e:
        logger.error(f"Error generating admin token: {e}")
        return error_response(f'Failed to generate admin token: {str(e)}', 500)

@admin_setup_bp.route('/validate-token', methods=['POST'])
def validate_admin_token():
    """Validate if a token is still valid for admin registration."""
    try:
        data = request.get_json() or {}
        token = data.get('token')
        
        if not token:
            return error_response('Token is required', 400)
        
        # Check development mode
        is_dev_mode = os.getenv('FLASK_ENV') == 'development'
        
        # Check if admin already exists (skip in dev mode)
        admins = FirebaseService.list_users_by_role('admin')
        if admins and not is_dev_mode:
            return error_response('Admin user already exists. Registration is disabled.', 403)
        
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        token_data = _admin_tokens.get(token_hash)
        
        if not token_data:
            return error_response('Invalid token', 400)
        
        if token_data['used']:
            return error_response('Token has already been used', 400)
        
        if token_data['expires_at'] < int(time.time()):
            return error_response('Token has expired', 400)
        
        return success_response({
            'valid': True,
            'expires_at': token_data['expires_at']
        }, 'Token is valid')
        
    except Exception as e:
        logger.error(f"Error validating admin token: {e}")
        return error_response(f'Failed to validate token: {str(e)}', 500)

@admin_setup_bp.route('/register', methods=['POST'])
def register_admin_with_token():
    """Register admin user using a valid token."""
    try:
        data = request.get_json() or {}
        token = data.get('token')
        email = data.get('email')
        password = data.get('password')
        display_name = data.get('display_name', 'System Administrator')
        
        if not all([token, email, password]):
            return error_response('Token, email, and password are required', 400)
        
        # Check development mode
        is_dev_mode = os.getenv('FLASK_ENV') == 'development'
        
        # Check if admin already exists (skip in dev mode)
        admins = FirebaseService.list_users_by_role('admin')
        if admins and not is_dev_mode:
            return error_response('Admin user already exists. Registration is disabled.', 403)
        
        # Validate token
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        token_data = _admin_tokens.get(token_hash)
        
        if not token_data:
            return error_response('Invalid token', 400)
        
        if token_data['used']:
            return error_response('Token has already been used', 400)
        
        if token_data['expires_at'] < int(time.time()):
            return error_response('Token has expired', 400)
        
        # Create admin user
        admin_uid = FirebaseService.create_user_with_role(
            email=email,
            password=password,
            role='admin',
            display_name=display_name
        )
        
        if not admin_uid:
            return error_response('Failed to create admin user', 500)
        
        # Mark token as used
        token_data['used'] = True
        token_data['used_at'] = int(time.time())
        token_data['admin_uid'] = admin_uid
        
        logger.info(f"Successfully created admin user {admin_uid} using token")
        
        return success_response({
            'uid': admin_uid,
            'email': email,
            'role': 'admin',
            'display_name': display_name
        }, 'Admin user created successfully')
        
    except Exception as e:
        logger.error(f"Error registering admin with token: {e}")
        return error_response(f'Failed to register admin: {str(e)}', 500)

@admin_setup_bp.route('/status', methods=['GET'])
def get_admin_setup_status():
    """Get the current admin setup status."""
    try:
        # Check development mode
        is_dev_mode = os.getenv('FLASK_ENV') == 'development'
        
        # Check if admin already exists
        admins = FirebaseService.list_users_by_role('admin')
        
        if admins:
            return success_response({
                'setup_complete': True,
                'admin_count': len(admins),
                'development_mode': is_dev_mode,
                'message': 'Admin setup is complete' + (' (Development Mode)' if is_dev_mode else '')
            }, 'Admin setup status retrieved')
        else:
            # Clean up expired tokens
            _cleanup_expired_tokens()
            
            # Count valid tokens
            valid_tokens = sum(1 for token_data in _admin_tokens.values() 
                             if not token_data['used'] and token_data['expires_at'] > int(time.time()))
            
            return success_response({
                'setup_complete': False,
                'admin_count': 0,
                'valid_tokens': valid_tokens,
                'development_mode': is_dev_mode,
                'message': 'Admin setup is required' + (' (Development Mode)' if is_dev_mode else '')
            }, 'Admin setup status retrieved')
        
    except Exception as e:
        logger.error(f"Error getting admin setup status: {e}")
        return error_response(f'Failed to get setup status: {str(e)}', 500)

@admin_setup_bp.route('/reset-dev', methods=['POST'])
def reset_development_admin():
    """Reset admin users in development mode only."""
    try:
        # Only allow in development mode
        if os.getenv('FLASK_ENV') != 'development':
            return error_response('This endpoint is only available in development mode', 403)
        
        # Verify secret key
        data = request.get_json() or {}
        secret_key = data.get('secret_key') or request.headers.get('X-Admin-Secret')
        
        expected_secret = os.getenv('ADMIN_SETUP_SECRET', 'change-me-in-production')
        if secret_key != expected_secret:
            return error_response('Invalid secret key', 401)
        
        # In development mode, we'll just clear tokens (Firebase users persist)
        # This allows for repeated admin creation testing
        global _admin_tokens
        _admin_tokens.clear()
        
        logger.info("Development admin tokens cleared")
        
        return success_response({
            'reset': True,
            'message': 'Development admin setup has been reset'
        }, 'Admin setup reset successfully')
        
    except Exception as e:
        logger.error(f"Error resetting development admin: {e}")
        return error_response(f'Failed to reset admin setup: {str(e)}', 500)

def _cleanup_expired_tokens():
    """Clean up expired tokens from memory."""
    current_time = int(time.time())
    expired_tokens = [
        token_hash for token_hash, token_data in _admin_tokens.items()
        if token_data['expires_at'] < current_time
    ]
    
    for token_hash in expired_tokens:
        del _admin_tokens[token_hash]
    
    if expired_tokens:
        logger.info(f"Cleaned up {len(expired_tokens)} expired admin tokens")
