# Admin Portal Documentation

## Overview

The Admin Portal provides comprehensive administrative capabilities for managing users and monitoring system metrics in the SynergyCare healthcare management system.

## Features

### 1. Dashboard
The admin dashboard provides real-time insights into system usage and user metrics:

#### Key Metrics
- **Total Users**: Overview of all registered users in the system
- **User Distribution**: Breakdown by role (Patients, Doctors, Admins)
- **Verification Status**: Track verified vs unverified users
- **Recent Registrations**: Shows users who registered in the last 7 days

#### Visual Components
- **Statistics Cards**: Quick overview of user counts by role
- **Progress Bars**: Visual representation of user verification rates
- **Recent Activity Table**: Detailed view of recent user registrations

### 2. User Management
Comprehensive user management system with full CRUD operations:

#### Create Users
- Add new users with email, password, display name, and role
- Automatic role assignment during creation
- Form validation for required fields

#### View & Search Users
- Paginated user list with search functionality
- Filter users by role (All, Patients, Doctors, Admins)
- Search by email or display name
- User status indicators (verified/unverified)

#### Edit Users
- Update user display names
- Change user roles
- Inline editing interface

#### Delete Users
- Remove users from the system
- Confirmation dialog to prevent accidental deletions
- Immediate removal from Firebase Authentication

## Access Control

### Role-Based Access
- Only users with `admin` role can access the admin portal
- Automatic redirect for unauthorized users
- Role verification through Firebase custom claims

### Navigation
- Admin portal is accessible via `/admin` route
- Automatically appears in navigation for admin users only
- Hidden from non-admin users

## Technical Implementation

### Frontend Architecture
```
/frontend/app/admin/
├── page.tsx                 # Main admin page with tab navigation
└── components/admin/
    ├── AdminDashboard.tsx   # Dashboard component with metrics
    └── UserManagement.tsx   # User management CRUD operations
```

### Backend API Endpoints
```
GET  /roles/list/{role}      # List users by role
POST /roles/create-user      # Create new user with role
POST /roles/set              # Update user role
DELETE /roles/delete-user/{uid}  # Delete user
```

### Key Components
- **AdminDashboard**: Displays system metrics and user statistics
- **UserManagement**: Handles all user CRUD operations
- **RoleGuard**: Ensures only admin users can access admin features
- **ApiClient**: Handles authenticated API requests

## Usage Guide

### Accessing the Admin Portal
1. Log in as a user with admin role
2. Navigate to the "Admin" link in the main navigation
3. Choose between "Dashboard" and "User Management" tabs

### Creating a New User
1. Go to User Management tab
2. Click "Create New User" button
3. Fill in required fields (email, password, role)
4. Optionally add display name
5. Click "Create User"

### Managing Existing Users
1. Use search bar to find specific users
2. Filter by role using the dropdown
3. Click "Edit" to modify user details
4. Click "Delete" to remove users (with confirmation)

### Monitoring System Metrics
1. Go to Dashboard tab
2. View user count summaries
3. Check verification status distribution
4. Review recent registration activity

## Security Considerations

### Authentication
- All admin routes require valid Firebase authentication
- Role verification through Firebase custom claims
- Automatic token refresh for API requests

### Authorization
- Backend endpoints protected with `@require_admin` decorator
- Frontend components wrapped with `AdminOnly` guard
- Role-based navigation visibility

### Data Protection
- User deletion requires confirmation
- Audit trail through application logs
- Secure API endpoints with proper error handling

## Error Handling

### Frontend
- User-friendly error messages for failed operations
- Loading states during API requests
- Form validation for required fields

### Backend
- Comprehensive error logging
- Proper HTTP status codes
- Standardized error response format

## Performance Considerations

### Pagination
- User list supports pagination (10 users per page)
- Efficient data loading for large user bases
- Client-side filtering and search

### Caching
- Component-level state management
- Automatic refresh after data modifications
- Optimistic UI updates where appropriate

## Future Enhancements

### Planned Features
- **User Activity Logs**: Track user login/logout times
- **Bulk Operations**: Import/export users via CSV
- **Advanced Analytics**: User engagement metrics
- **Email Notifications**: Automated user onboarding emails
- **User Impersonation**: Admin ability to view system as another user
- **Role Permissions**: Granular permission management beyond basic roles

### Technical Improvements
- **Real-time Updates**: WebSocket integration for live user status
- **Advanced Search**: Complex filtering and sorting options
- **Data Export**: CSV/PDF reports generation
- **API Rate Limiting**: Protection against abuse
- **Audit Trail**: Comprehensive logging of admin actions

## Troubleshooting

### Common Issues
1. **Access Denied**: Ensure user has admin role assigned
2. **API Errors**: Check Firebase configuration and credentials
3. **Loading Issues**: Verify backend services are running
4. **Permission Errors**: Confirm Firebase Admin SDK setup

### Debug Steps
1. Check browser console for JavaScript errors
2. Verify network requests in developer tools
3. Review backend logs for API endpoint errors
4. Confirm Firebase Authentication status

## Support

For technical support or feature requests related to the admin portal, please:
1. Check this documentation first
2. Review application logs for error details
3. Contact the development team with specific error messages
4. Provide steps to reproduce any issues encountered
