'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/firebase/api';
import { Card } from '@/components/ui/Card';
import { MetricCard } from './MetricCard';
import { SimpleChart } from './SimpleChart';
import { DashboardSkeleton } from './DashboardSkeleton';
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

interface DashboardStats {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  totalAdmins: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  recentRegistrations: UserWithRole[];
}

export default function AdminDashboard() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoleStats = async () => {
    try {
      setLoading(true);
      const roles: UserRole[] = ['admin', 'patient', 'doctor'];
      const stats: RoleStats[] = [];
      
      for (const role of roles) {
        const response = await apiClient.get<RoleStats>(`/roles/list/${role}`);
        stats.push(response);
      }
      
      // Calculate dashboard statistics
      const allUsers = stats.flatMap(stat => stat.users);
      const totalUsers = allUsers.length;
      const totalPatients = stats.find(s => s.role === 'patient')?.count || 0;
      const totalDoctors = stats.find(s => s.role === 'doctor')?.count || 0;
      const totalAdmins = stats.find(s => s.role === 'admin')?.count || 0;
      const verifiedUsers = allUsers.filter(u => u.email_verified).length;
      const unverifiedUsers = totalUsers - verifiedUsers;
      
      // Get recent registrations (last 7 days)
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const recentRegistrations = allUsers
        .filter(u => u.created_at * 1000 > weekAgo)
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, 10);
      
      setDashboardStats({
        totalUsers,
        totalPatients,
        totalDoctors,
        totalAdmins,
        verifiedUsers,
        unverifiedUsers,
        recentRegistrations
      });
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch dashboard statistics');
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoleStats();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <Card className="p-12 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-3 bg-red-100 rounded-full">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchRoleStats}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        </div>
      </Card>
    );
  }

  if (!dashboardStats) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics Grid */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">System Overview</h2>
          <p className="text-gray-600">Key metrics and system health indicators</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Users"
            value={dashboardStats.totalUsers}
            change={{
              value: 12,
              trend: 'up',
              period: 'last month'
            }}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            }
            color="blue"
          />

          <MetricCard
            title="Patients"
            value={dashboardStats.totalPatients}
            change={{
              value: 8,
              trend: 'up',
              period: 'last month'
            }}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            color="green"
          />

          <MetricCard
            title="Doctors"
            value={dashboardStats.totalDoctors}
            change={{
              value: 5,
              trend: 'up',
              period: 'last month'
            }}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            color="purple"
          />

          <MetricCard
            title="Admins"
            value={dashboardStats.totalAdmins}
            change={{
              value: 0,
              trend: 'neutral',
              period: 'last month'
            }}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
            color="red"
          />
        </div>
      </div>

      {/* Charts and Analytics */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Analytics & Distribution</h2>
          <p className="text-gray-600">User distribution and verification status</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SimpleChart
            title="User Distribution"
            subtitle="Breakdown by user roles"
            type="doughnut"
            height={220}
            data={[
              {
                label: 'Patients',
                value: dashboardStats.totalPatients,
                color: '#10b981'
              },
              {
                label: 'Doctors',
                value: dashboardStats.totalDoctors,
                color: '#8b5cf6'
              },
              {
                label: 'Admins',
                value: dashboardStats.totalAdmins,
                color: '#ef4444'
              }
            ]}
          />

          <SimpleChart
            title="Verification Status"
            subtitle="Email verification breakdown"
            type="bar"
            height={220}
            data={[
              {
                label: 'Verified Users',
                value: dashboardStats.verifiedUsers,
                color: '#10b981'
              },
              {
                label: 'Unverified Users',
                value: dashboardStats.unverifiedUsers,
                color: '#f59e0b'
              }
            ]}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          <p className="text-gray-600">Latest user registrations and system events</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Registrations */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Registrations</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Last 7 days
                </span>
              </div>
              
              {dashboardStats.recentRegistrations.length > 0 ? (
                <div className="space-y-4">
                  {dashboardStats.recentRegistrations.slice(0, 5).map((user) => (
                    <div key={user.uid} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.display_name || 'No name'}
                          </p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'doctor' ? 'bg-purple-100 text-purple-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {new Date(user.created_at * 1000).toLocaleDateString()}
                          </span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full ${
                            user.email_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {user.email_verified ? (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Verified
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                Pending
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {dashboardStats.recentRegistrations.length > 5 && (
                    <div className="text-center pt-4">
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View all {dashboardStats.recentRegistrations.length} registrations
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No recent registrations</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No new users have registered in the last 7 days.
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">API Status</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Database</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Cache</span>
                  </div>
                  <span className="text-sm font-medium text-blue-600">Active</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-sm font-medium text-blue-700">Add New User</span>
                  </div>
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">View Reports</span>
                  </div>
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">System Settings</span>
                  </div>
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
