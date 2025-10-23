from functools import wraps
from flask import request, jsonify
from typing import List, Union
from ..services.firebase_service import FirebaseService
from ..utils.responses import error_response

def require_auth(f):
    """Middleware decorator to verify Firebase token."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return error_response('No authorization header provided', 401)
        
        try:
            # Extract token (format: "Bearer <token>")
            token = auth_header.split(' ')[1] if auth_header.startswith('Bearer ') else auth_header
            
            # Verify the token with Firebase
            decoded_token, error = FirebaseService.verify_token(token)
            
            if error:
                return error_response(f'Invalid token: {error}', 401)
            
            # Add user info to request context
            request.user = decoded_token
            
        except IndexError:
            return error_response('Invalid authorization header format', 401)
        except Exception as e:
            return error_response(f'Authentication failed: {str(e)}', 401)
        
        return f(*args, **kwargs)
    
    return decorated_function

def require_role(allowed_roles: Union[str, List[str]]):
    """Middleware decorator to verify user has required role(s)."""
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]
    
    def decorator(f):
        @wraps(f)
        @require_auth  # First authenticate the user
        def decorated_function(*args, **kwargs):
            user = request.user
            
            # Get user role from custom claims
            user_role = user.get('role')
            
            if not user_role:
                return error_response('User role not found. Please contact administrator.', 403)
            
            if user_role not in allowed_roles:
                return error_response(f'Access denied. Required role: {", ".join(allowed_roles)}. Your role: {user_role}', 403)
            
            # Add role to request context for easy access
            request.user_role = user_role
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def require_admin(f):
    """Middleware decorator to require admin role."""
    return require_role('admin')(f)

def require_doctor(f):
    """Middleware decorator to require doctor role."""
    return require_role('doctor')(f)

def require_patient(f):
    """Middleware decorator to require patient role."""
    return require_role('patient')(f)

def require_doctor_or_admin(f):
    """Middleware decorator to require doctor or admin role."""
    return require_role(['doctor', 'admin'])(f)

def require_patient_or_doctor(f):
    """Middleware decorator to require patient or doctor role."""
    return require_role(['patient', 'doctor'])(f)