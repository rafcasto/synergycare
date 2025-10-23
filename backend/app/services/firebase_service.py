import json
import base64
import os
import time
import uuid
import firebase_admin
from firebase_admin import credentials, auth
from flask import current_app
import logging
from typing import Dict, Optional, List

logger = logging.getLogger(__name__)

class FirebaseService:
    """Service class for Firebase operations."""
    
    # Define valid user roles
    VALID_ROLES = ['admin', 'patient', 'doctor']
    
    # Track initialization status
    _initialized = False
    _dev_mode = False
    
    @staticmethod
    def initialize():
        """Initialize Firebase Admin SDK."""
        if FirebaseService._initialized:
            return
            
        try:
            config = current_app.config
            
            # Check if we're in development mode and should use emulator
            if config.get('FLASK_ENV') == 'development':
                logger.info("Initializing Firebase in development mode with emulator support")
                FirebaseService._dev_mode = True
                
                # Set environment variables for Firebase emulator
                os.environ['FIREBASE_AUTH_EMULATOR_HOST'] = 'localhost:9099'
                os.environ['FIRESTORE_EMULATOR_HOST'] = 'localhost:8081'
                
                # Try to initialize with credentials if available, otherwise use default
                try:
                    if config.get('FIREBASE_SERVICE_ACCOUNT_KEY'):
                        service_account_info = json.loads(config['FIREBASE_SERVICE_ACCOUNT_KEY'])
                        cred = credentials.Certificate(service_account_info)
                        firebase_admin.initialize_app(cred)
                        logger.info("Using Firebase service account from environment variable for emulator")
                    elif config.get('FIREBASE_SERVICE_ACCOUNT_BASE64'):
                        encoded_key = config['FIREBASE_SERVICE_ACCOUNT_BASE64']
                        decoded_key = base64.b64decode(encoded_key).decode('utf-8')
                        service_account_info = json.loads(decoded_key)
                        cred = credentials.Certificate(service_account_info)
                        firebase_admin.initialize_app(cred)
                        logger.info("Using Firebase service account from base64 environment variable for emulator")
                    elif os.path.exists(config.get('FIREBASE_SERVICE_ACCOUNT_FILE', '')):
                        cred = credentials.Certificate(config['FIREBASE_SERVICE_ACCOUNT_FILE'])
                        firebase_admin.initialize_app(cred)
                        logger.info("Using Firebase service account from file for emulator")
                    else:
                        # For emulator, we can use default credentials or minimal setup
                        firebase_admin.initialize_app()
                        logger.info("Firebase Admin initialized with default credentials for emulator")
                        
                except Exception as dev_error:
                    logger.warning(f"Firebase init with credentials failed: {dev_error}")
                    # Try to initialize without credentials for emulator use
                    try:
                        firebase_admin.initialize_app()
                        logger.info("Firebase Admin initialized without credentials for emulator")
                    except Exception as fallback_error:
                        logger.error(f"Firebase fallback initialization failed: {fallback_error}")
                        raise
            else:
                # Production mode - require proper credentials
                logger.info("Initializing Firebase in production mode")
                if config.get('FIREBASE_SERVICE_ACCOUNT_KEY'):
                    service_account_info = json.loads(config['FIREBASE_SERVICE_ACCOUNT_KEY'])
                    cred = credentials.Certificate(service_account_info)
                elif config.get('FIREBASE_SERVICE_ACCOUNT_BASE64'):
                    encoded_key = config['FIREBASE_SERVICE_ACCOUNT_BASE64']
                    decoded_key = base64.b64decode(encoded_key).decode('utf-8')
                    service_account_info = json.loads(decoded_key)
                    cred = credentials.Certificate(service_account_info)
                else:
                    # Fallback to service account key file
                    cred = credentials.Certificate(config['FIREBASE_SERVICE_ACCOUNT_FILE'])
                
                firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin initialized successfully in production mode")
            
            FirebaseService._initialized = True
            logger.info("Firebase Admin initialization completed")
            
        except Exception as e:
            logger.error(f"Error initializing Firebase: {e}")
            if config.get('FLASK_ENV') != 'development':
                raise
            else:
                logger.error("Failed to initialize Firebase in development mode")
                raise
    
    @staticmethod
    def verify_token(token):
        """Verify Firebase ID token."""
        try:
            decoded_token = auth.verify_id_token(token)
            return decoded_token, None
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            return None, str(e)
    
    @staticmethod
    def set_user_role(uid: str, role: str) -> bool:
        """Set custom claims for a user to define their role."""
        try:
            if role not in FirebaseService.VALID_ROLES:
                logger.error(f"Invalid role: {role}. Must be one of {FirebaseService.VALID_ROLES}")
                return False
            
            # Set custom claims
            custom_claims = {
                'role': role,
                'userType': role  # For backward compatibility with your schema
            }
            
            auth.set_custom_user_claims(uid, custom_claims)
            logger.info(f"Successfully set role '{role}' for user {uid}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to set user role: {e}")
            return False
    
    @staticmethod
    def get_user_role(uid: str) -> Optional[str]:
        """Get the role of a user."""
        try:
            user = auth.get_user(uid)
            custom_claims = user.custom_claims or {}
            return custom_claims.get('role')
            
        except Exception as e:
            logger.error(f"Failed to get user role: {e}")
            return None
    
    @staticmethod
    def remove_user_role(uid: str) -> bool:
        """Remove custom claims from a user."""
        try:
            auth.set_custom_user_claims(uid, None)
            logger.info(f"Successfully removed custom claims for user {uid}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to remove user role: {e}")
            return False
    
    @staticmethod
    def create_user_with_role(email: str, password: str, role: str, 
                            display_name: Optional[str] = None) -> Optional[str]:
        """Create a new user with a specific role."""
        try:
            if role not in FirebaseService.VALID_ROLES:
                logger.error(f"Invalid role: {role}")
                return None
            
            # Create user
            user = auth.create_user(
                email=email,
                password=password,
                display_name=display_name
            )
            
            # Set role
            if FirebaseService.set_user_role(user.uid, role):
                logger.info(f"Successfully created user {user.uid} with role {role}")
                return user.uid
            else:
                # If setting role failed, delete the user
                auth.delete_user(user.uid)
                logger.error(f"Failed to set role, deleted user {user.uid}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to create user with role: {e}")
            return None
    
    @staticmethod
    def list_users_by_role(role: str) -> List[Dict]:
        """List all users with a specific role."""
        try:
            if role not in FirebaseService.VALID_ROLES:
                logger.error(f"Invalid role: {role}")
                return []
            
            users_with_role = []
            
            # Iterate through all users (for small user bases)
            # For large user bases, consider using Firestore to store role mappings
            page = auth.list_users()
            while page:
                for user in page.users:
                    custom_claims = user.custom_claims or {}
                    if custom_claims.get('role') == role:
                        users_with_role.append({
                            'uid': user.uid,
                            'email': user.email,
                            'display_name': user.display_name,
                            'role': role,
                            'email_verified': user.email_verified,
                            'created_at': user.user_metadata.creation_timestamp
                        })
                
                page = page.get_next_page()
            
            return users_with_role
            
        except Exception as e:
            logger.error(f"Failed to list users by role: {e}")
            return []
