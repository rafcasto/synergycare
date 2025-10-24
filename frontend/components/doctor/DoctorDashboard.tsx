'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/admin/MetricCard';
import { SimpleChart } from '@/components/admin/SimpleChart';
import { useAuth } from '@/components/auth/AuthProvider';

interface DoctorDashboardStats {
  totalPatients: number;
  todayAppointments: number;
  weeklyAppointments: number;
  completedConsultations: number;
  pendingReviews: number;
  newPatients: number;
  recentAppointments: AppointmentData[];
  appointmentTrends: TrendData[];
}

interface AppointmentData {
  id: string;
  patientName: string;
  time: string;
  type: 'consultation' | 'follow-up' | 'emergency';
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface TrendData {
  label: string;
  value: number;
  color: string;
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<DoctorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  // Mock data for demonstration - in real app, fetch from API
  useEffect(() => {
    const loadDoctorStats = () => {
      setLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        const mockStats: DoctorDashboardStats = {
          totalPatients: 247,
          todayAppointments: 8,
          weeklyAppointments: 32,
          completedConsultations: 1456,
          pendingReviews: 5,
          newPatients: 12,
          recentAppointments: [
            {
              id: '1',
              patientName: 'Sarah Johnson',
              time: '09:00 AM',
              type: 'consultation',
              status: 'scheduled'
            },
            {
              id: '2',
              patientName: 'Michael Chen',
              time: '10:30 AM',
              type: 'follow-up',
              status: 'scheduled'
            },
            {
              id: '3',
              patientName: 'Emily Rodriguez',
              time: '02:00 PM',
              type: 'consultation',
              status: 'scheduled'
            },
            {
              id: '4',
              patientName: 'David Thompson',
              time: '03:30 PM',
              type: 'emergency',
              status: 'scheduled'
            }
          ],
          appointmentTrends: [
            { label: 'Consultations', value: 45, color: '#3b82f6' },
            { label: 'Follow-ups', value: 35, color: '#10b981' },
            { label: 'Emergency', value: 20, color: '#ef4444' }
          ]
        };
        
        setDashboardStats(mockStats);
        setLoading(false);
      }, 1000);
    };

    loadDoctorStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
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
          </div>
        </div>
      </Card>
    );
  }

  if (!dashboardStats) {
    return null;
  }

  const getAppointmentTypeColor = (type: string) => {
    switch (type) {
      case 'consultation': return 'bg-blue-100 text-blue-800';
      case 'follow-up': return 'bg-green-100 text-green-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, Dr. {user?.displayName?.split(' ')[0] || 'Doctor'}
        </h1>
        <p className="text-gray-600">Here&apos;s what&apos;s happening with your practice today.</p>
      </div>

      {/* Key Metrics Grid */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Practice Overview</h2>
          <p className="text-gray-600">Key metrics and patient statistics</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Patients"
            value={dashboardStats.totalPatients}
            change={{
              value: 8,
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
            title="Today's Appointments"
            value={dashboardStats.todayAppointments}
            change={{
              value: 12,
              trend: 'up',
              period: 'vs yesterday'
            }}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            color="green"
          />

          <MetricCard
            title="Completed Consultations"
            value={dashboardStats.completedConsultations}
            change={{
              value: 5,
              trend: 'up',
              period: 'last month'
            }}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="purple"
          />

          <MetricCard
            title="Pending Reviews"
            value={dashboardStats.pendingReviews}
            change={{
              value: 2,
              trend: 'down',
              period: 'last week'
            }}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="yellow"
          />
        </div>
      </div>

      {/* Charts and Analytics */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Practice Analytics</h2>
          <p className="text-gray-600">Appointment types and patient trends</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SimpleChart
            title="Appointment Types"
            subtitle="Distribution of consultation types this month"
            type="doughnut"
            height={220}
            data={dashboardStats.appointmentTrends}
          />

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-blue-900">This Week&apos;s Appointments</p>
                  <p className="text-2xl font-bold text-blue-600">{dashboardStats.weeklyAppointments}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-900">New Patients This Month</p>
                  <p className="text-2xl font-bold text-green-600">{dashboardStats.newPatients}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Today's Schedule and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Today&apos;s Schedule</h3>
              <p className="text-sm text-gray-600">
                {dashboardStats.recentAppointments.length} appointments scheduled
              </p>
            </div>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {dashboardStats.recentAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {appointment.patientName}
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAppointmentTypeColor(appointment.type)}`}>
                      {appointment.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{appointment.time}</p>
                </div>
                <div className="flex-shrink-0">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="space-y-4">
            <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Schedule New Appointment</span>
              </div>
            </button>
            
            <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Add New Patient</span>
              </div>
            </button>
            
            <button className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Review Medical Records</span>
              </div>
            </button>
            
            <button className="w-full text-left px-4 py-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors group">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Pending Lab Results</span>
              </div>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
