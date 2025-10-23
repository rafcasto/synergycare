'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/firebase/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserRole } from '@/types/auth';

interface UserWithRole {
  uid: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  email_verified: boolean;
  created_at: number;
}

interface RoleStats {
  role: UserRole;
  users: UserWithRole[];
  count: number;
}

interface UserManagementProps {
  onUserCreated?: () => void;
  onUserUpdated?: () => void;
  onUserDeleted?: () => void;
}

export default function UserManagement({ onUserCreated, onUserUpdated, onUserDeleted }: UserManagementProps) {
  const [roleStats, setRoleStats] = useState<RoleStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  
  // Form states for creating new user
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserDisplayName, setNewUserDisplayName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('patient');
  const [creating, setCreating] = useState(false);
  
  // Form states for editing user
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [editUserDisplayName, setEditUserDisplayName] = useState('');
  const [editUserRole, setEditUserRole] = useState<UserRole>('patient');
  const [updating, setUpdating] = useState(false);

  const fetchRoleStats = async () => {
    try {
      setLoading(true);
      const roles: UserRole[] = ['admin', 'patient', 'doctor'];
      const stats: RoleStats[] = [];
      
      for (const role of roles) {
        const response = await apiClient.get<RoleStats>(`/roles/list/${role}`);
        stats.push(response);
      }
      
      setRoleStats(stats);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const createUserWithRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserEmail || !newUserPassword || !newUserRole) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      await apiClient.post('/roles/create-user', {
        email: newUserEmail,
        password: newUserPassword,
        display_name: newUserDisplayName || null,
        role: newUserRole,
      });
      
      // Reset form
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserDisplayName('');
      setNewUserRole('patient');
      setShowCreateForm(false);
      
      // Refresh stats
      await fetchRoleStats();
      onUserCreated?.();
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const updateUserRole = async () => {
    if (!editingUser || !editUserRole) {
      setError('Please select a user and role');
      return;
    }

    try {
      setUpdating(true);
      await apiClient.post('/roles/set', {
        uid: editingUser.uid,
        role: editUserRole,
      });
      
      // Close edit form
      setEditingUser(null);
      
      // Refresh stats
      await fetchRoleStats();
      onUserUpdated?.();
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setUpdating(false);
    }
  };

  const deleteUser = async (user: UserWithRole) => {
    if (!confirm(`Are you sure you want to delete user ${user.email}? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.delete(`/roles/delete-user/${user.uid}`);
      
      // Refresh stats
      await fetchRoleStats();
      onUserDeleted?.();
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const startEditUser = (user: UserWithRole) => {
    setEditingUser(user);
    setEditUserDisplayName(user.display_name || '');
    setEditUserRole(user.role);
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditUserDisplayName('');
    setEditUserRole('patient');
  };

  // Get all users from all roles
  const allUsers = roleStats.flatMap(stat => stat.users);

  // Filter users based on search term and role filter
  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.display_name && user.display_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  useEffect(() => {
    fetchRoleStats();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, filterRole]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage system users and their roles</p>
        </div>
        <Button 
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setEditingUser(null);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {showCreateForm ? 'Cancel' : 'Create New User'}
        </Button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Create New User</h3>
          <form onSubmit={createUserWithRole} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <Input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <Input
                  type="text"
                  value={newUserDisplayName}
                  onChange={(e) => setNewUserDisplayName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={creating} className="bg-green-600 hover:bg-green-700">
                {creating ? 'Creating...' : 'Create User'}
              </Button>
              <Button 
                type="button" 
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-500 hover:bg-gray-600"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Edit User Form */}
      {editingUser && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Edit User: {editingUser.email}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <Input
                  type="text"
                  value={editUserDisplayName}
                  onChange={(e) => setEditUserDisplayName(e.target.value)}
                  placeholder="Enter display name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={updateUserRole} 
                disabled={updating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updating ? 'Updating...' : 'Update User'}
              </Button>
              <Button 
                onClick={cancelEdit}
                className="bg-gray-500 hover:bg-gray-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Search and Filter */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Users
            </label>
            <Input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as UserRole | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="patient">Patients</option>
              <option value="doctor">Doctors</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Users ({filteredUsers.length} {filterRole !== 'all' ? filterRole + 's' : 'total'})
          </h3>
        </div>

        {paginatedUsers.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.display_name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'doctor' ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.email_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.email_verified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at * 1000).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => startEditUser(user)}
                            className="bg-blue-600 hover:bg-blue-700"
                            size="sm"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => deleteUser(user)}
                            className="bg-red-600 hover:bg-red-700"
                            size="sm"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(startIndex + usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
                </div>
                <div className="flex space-x-1">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    size="sm"
                    className="bg-gray-500 hover:bg-gray-600"
                  >
                    Previous
                  </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      size="sm"
                      className={page === currentPage ? 
                        "bg-blue-600 hover:bg-blue-700" : 
                        "bg-gray-500 hover:bg-gray-600"
                      }
                    >
                      {page}
                    </Button>
                  ))}
                  
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    size="sm"
                    className="bg-gray-500 hover:bg-gray-600"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No users found matching your search criteria.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
