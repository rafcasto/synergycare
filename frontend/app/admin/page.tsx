'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { AdminOnly } from '@/components/auth/RoleGuard';
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

export default function AdminPage() {
  const { user: _user } = useAuth(); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [roleStats, setRoleStats] = useState<RoleStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserDisplayName, setNewUserDisplayName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('patient');
  const [creating, setCreating] = useState(false);
  
  // Role change states
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserNewRole, setSelectedUserNewRole] = useState<UserRole>('patient');
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
      setError('Failed to fetch role statistics');
      console.error('Error fetching role stats:', err);
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
      
      // Refresh stats
      await fetchRoleStats();
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const updateUserRole = async () => {
    if (!selectedUserId || !selectedUserNewRole) {
      setError('Please select a user and role');
      return;
    }

    try {
      setUpdating(true);
      await apiClient.post('/roles/set', {
        uid: selectedUserId,
        role: selectedUserNewRole,
      });
      
      // Reset selection
      setSelectedUserId('');
      setSelectedUserNewRole('patient');
      
      // Refresh stats
      await fetchRoleStats();
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchRoleStats();
  }, []);

  return (
    <AdminOnly>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Manage user roles and permissions
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Role Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-3 text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading role statistics...</p>
              </div>
            ) : (
              roleStats.map((stat) => (
                <Card key={stat.role} className="p-6">
                  <h3 className="text-lg font-semibold capitalize mb-2">
                    {stat.role}s
                  </h3>
                  <p className="text-3xl font-bold text-blue-600 mb-4">
                    {stat.count}
                  </p>
                  <div className="space-y-2">
                    {stat.users.slice(0, 3).map((user) => (
                      <div key={user.uid} className="text-sm text-gray-600">
                        {user.display_name || user.email}
                      </div>
                    ))}
                    {stat.users.length > 3 && (
                      <div className="text-sm text-gray-500">
                        +{stat.users.length - 3} more
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Create New User */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Create New User</h2>
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
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create User'}
              </Button>
            </form>
          </Card>

          {/* Update User Role */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Update User Role</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select User
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select a user...</option>
                    {roleStats.flatMap(stat => 
                      stat.users.map(user => (
                        <option key={user.uid} value={user.uid}>
                          {user.display_name || user.email} ({user.role})
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Role
                  </label>
                  <select
                    value={selectedUserNewRole}
                    onChange={(e) => setSelectedUserNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <Button 
                onClick={updateUserRole} 
                disabled={updating || !selectedUserId}
              >
                {updating ? 'Updating...' : 'Update Role'}
              </Button>
            </div>
          </Card>

          {/* All Users List */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">All Users</h2>
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roleStats.flatMap(stat => 
                    stat.users.map(user => (
                      <tr key={user.uid}>
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
                            user.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminOnly>
  );
}
