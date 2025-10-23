# Role-Based Access Control (RBAC) Implementation

## Overview

This SynergyCare application implements a comprehensive role-based access control system using Firebase Authentication with custom claims and Firestore security rules.

## Roles

### 1. Admin
- **Purpose**: System administrators with full access
- **Permissions**:
  - Create, read, update, delete users
  - Assign roles to users
  - Access all data and functionality
  - View system logs and analytics
  - Manage system settings

### 2. Doctor
- **Purpose**: Medical professionals providing healthcare services
- **Permissions**:
  - View and manage their appointments
  - Access medical records of their patients
  - Create and update medical records
  - View patient profiles (limited to their patients)
  - Manage their doctor profile

### 3. Patient
- **Purpose**: Healthcare consumers seeking medical services
- **Permissions**:
  - Book appointments with doctors
  - View their own appointments
  - Access their own medical records
  - Search and view doctor profiles
  - Manage their patient profile

## Implementation Details

### Backend (Flask + Firebase Admin SDK)

#### Firebase Service (`/backend/app/services/firebase_service.py`)
- **Custom Claims**: Roles are stored as Firebase custom claims
- **Role Management**: Functions to set, get, and remove user roles
- **User Creation**: Create users with specific roles
- **Role Validation**: Ensure only valid roles are assigned

#### Middleware (`/backend/app/middleware/auth.py`)
- **Authentication**: `@require_auth` decorator verifies Firebase tokens
- **Role-based Authorization**: `@require_role()` decorator checks user roles
- **Convenience Decorators**: `@require_admin`, `@require_doctor`, `@require_patient`

#### Role Management Routes (`/backend/app/routes/roles.py`)
- `POST /roles/set` - Set user role (Admin only)
- `GET /roles/get/<uid>` - Get user role (Admin only)
- `DELETE /roles/remove/<uid>` - Remove user role (Admin only)
- `POST /roles/create-user` - Create user with role (Admin only)
- `GET /roles/list/<role>` - List users by role (Admin only)
- `GET /roles/my-role` - Get current user's role
- `GET /roles/valid-roles` - Get list of valid roles

### Frontend (Next.js + React)

#### Type Definitions (`/frontend/types/auth.ts`)
- `UserRole` type defining valid roles
- Enhanced `User` interface with role property
- `AuthContextType` with role management functions

#### Auth Provider (`/frontend/components/auth/AuthProvider.tsx`)
- Fetches user roles from custom claims or backend
- `refreshUserRole()` function to update role after changes
- Enhanced user object with role information

#### Role Guards (`/frontend/components/auth/RoleGuard.tsx`)
- `RoleGuard` component for conditional rendering
- Role-specific components: `AdminOnly`, `DoctorOnly`, `PatientOnly`
- Combined role components: `DoctorOrAdmin`, `PatientOrDoctor`

#### Navigation (`/frontend/components/layout/Navigation.tsx`)
- Role-based menu items
- Dynamic navigation based on user role
- Conditional route access

### Database Security (Firestore Rules)

#### Security Rules (`/firestore.rules`)
- **Helper Functions**: Role checking, authentication, ownership validation
- **Collection-specific Rules**:
  - Users: Read/write own profile, admin read/write all
  - Doctors: Public read, doctor/admin write
  - Patients: Patient/doctor/admin read, patient/admin write
  - Appointments: Role-based access with ownership checks
  - Medical Records: Doctor/admin write, patient/doctor/admin read
  - Reviews: Public read, patient create, author/admin modify

## Setup Instructions

### 1. Initial Admin Setup

Run the setup script to create the first admin user:

```bash
cd backend
python scripts/setup_admin.py
```

Or set environment variables:
```bash
export INITIAL_ADMIN_EMAIL="admin@yourdomain.com"
export INITIAL_ADMIN_PASSWORD="secure_password"
python scripts/setup_admin.py
```

### 2. Role Assignment Workflow

1. **Admin creates users** via the admin dashboard (`/admin`)
2. **Users are assigned roles** during creation or afterward
3. **Roles are stored** as Firebase custom claims
4. **Frontend fetches roles** from token claims or backend API
5. **Firestore rules enforce** data access permissions

### 3. Environment Configuration

Ensure these environment variables are set:

```bash
# Firebase configuration
FIREBASE_SERVICE_ACCOUNT_KEY="{...}"  # or
FIREBASE_SERVICE_ACCOUNT_BASE64="..."  # or
FIREBASE_SERVICE_ACCOUNT_FILE="path/to/serviceAccountKey.json"

# Initial admin (optional)
INITIAL_ADMIN_EMAIL="admin@yourdomain.com"
INITIAL_ADMIN_PASSWORD="secure_password"
```

## Usage Examples

### Backend Route Protection

```python
@user_bp.route('/admin-only', methods=['GET'])
@require_admin
def admin_only_endpoint():
    return success_response({'message': 'Admin access granted'})

@appointments_bp.route('/', methods=['GET'])
@require_role(['patient', 'doctor'])
def get_appointments():
    user_role = request.user_role
    # Role-specific logic here
```

### Frontend Component Protection

```tsx
import { AdminOnly, DoctorOrAdmin, RoleGuard } from '@/components/auth/RoleGuard';

// Admin-only content
<AdminOnly>
  <AdminPanel />
</AdminOnly>

// Doctor or Admin content
<DoctorOrAdmin>
  <PatientManagement />
</DoctorOrAdmin>

// Custom role combinations
<RoleGuard allowedRoles={['patient', 'doctor']}>
  <AppointmentBooking />
</RoleGuard>
```

### Role Management API Usage

```typescript
// Create user with role
await apiClient.post('/roles/create-user', {
  email: 'doctor@example.com',
  password: 'password123',
  role: 'doctor',
  display_name: 'Dr. Smith'
});

// Update user role
await apiClient.post('/roles/set', {
  uid: 'user-uid-here',
  role: 'admin'
});

// Get user's role
const response = await apiClient.get('/roles/my-role');
console.log('My role:', response.role);
```

## Security Considerations

1. **Custom Claims**: Roles are stored in Firebase custom claims for security
2. **Token Validation**: All backend routes validate Firebase ID tokens
3. **Firestore Rules**: Database access controlled by security rules
4. **Role Hierarchy**: Admin has access to all resources
5. **Ownership Checks**: Users can only access their own data (except admins)
6. **API Rate Limiting**: Consider implementing rate limiting for production

## Testing

### Manual Testing Steps

1. Create admin user using setup script
2. Log in as admin and create doctor/patient users
3. Test role-based navigation and access
4. Verify Firestore security rules in Firebase console
5. Test API endpoints with different roles

### Automated Testing

Consider adding tests for:
- Role assignment and validation
- API endpoint access control
- Frontend component rendering based on roles
- Firestore security rules

## Deployment Notes

1. **Initial Setup**: Run admin setup script after deployment
2. **Environment Variables**: Ensure all Firebase credentials are set
3. **Security Rules**: Deploy Firestore rules with Firebase CLI
4. **Custom Claims**: May take up to 1 hour to propagate in some cases

## Troubleshooting

### Common Issues

1. **Role not appearing**: User may need to log out and back in for custom claims to refresh
2. **Access denied errors**: Check Firestore security rules and user roles
3. **Admin setup fails**: Verify Firebase service account credentials
4. **Frontend role undefined**: Check if custom claims are properly set

### Debug Commands

```bash
# Check user's custom claims
firebase auth:export --format=json users.json

# Test Firestore rules
firebase firestore:rules:test

# View backend logs
tail -f backend/logs/app.log
```

This role-based system provides a secure, scalable foundation for managing user access in a healthcare application while maintaining HIPAA compliance principles and data security best practices.
