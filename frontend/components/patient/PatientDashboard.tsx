'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/admin/MetricCard';
import { SimpleChart } from '@/components/admin/SimpleChart';
import { useAuth } from '@/components/auth/AuthProvider';

interface PatientDashboardStats {
  upcomingAppointments: number;
  totalAppointments: number;
  doctorsConnected: number;
  healthRecords: number;
  pendingResults: number;
  medicationReminders: number;
  recentAppointments: AppointmentData[];
  healthMetrics: HealthMetric[];
  appointmentHistory: TrendData[];
}

interface AppointmentData {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  type: 'consultation' | 'follow-up' | 'checkup';
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface HealthMetric {
  id: string;
  name: string;
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  lastUpdated: string;
}

interface TrendData {
  label: string;
  value: number;
  color: string;
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<PatientDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  // Mock data for demonstration - in real app, fetch from API
  useEffect(() => {
    const loadPatientStats = () => {
      setLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        const mockStats: PatientDashboardStats = {
          upcomingAppointments: 3,
          totalAppointments: 24,
          doctorsConnected: 4,
          healthRecords: 18,
          pendingResults: 2,
          medicationReminders: 5,
          recentAppointments: [
            {
              id: '1',
              doctorName: 'Dr. Sarah Williams',
              specialty: 'Cardiology',
              date: 'Nov 28, 2024',
              time: '10:00 AM',
              type: 'consultation',
              status: 'scheduled'
            },
            {
              id: '2',
              doctorName: 'Dr. Michael Brown',
              specialty: 'General Practice',
              date: 'Dec 02, 2024',
              time: '02:30 PM',
              type: 'checkup',
              status: 'scheduled'
            },
            {
              id: '3',
              doctorName: 'Dr. Emily Chen',
              specialty: 'Dermatology',
              date: 'Dec 05, 2024',
              time: '11:15 AM',
              type: 'follow-up',
              status: 'scheduled'
            }
          ],
          healthMetrics: [
            {
              id: '1',
              name: 'Blood Pressure',
              value: '120/80',
              unit: 'mmHg',
              status: 'normal',
              lastUpdated: '2 days ago'
            },
            {
              id: '2',
              name: 'Heart Rate',
              value: '72',
              unit: 'bpm',
              status: 'normal',
              lastUpdated: '2 days ago'
            },
            {
              id: '3',
              name: 'Weight',
              value: '68.5',
              unit: 'kg',
              status: 'normal',
              lastUpdated: '1 week ago'
            },
            {
              id: '4',
              name: 'Cholesterol',
              value: '185',
              unit: 'mg/dL',
              status: 'warning',
              lastUpdated: '1 month ago'
            }
          ],
          appointmentHistory: [
            { label: 'Completed', value: 18, color: '#10b981' },
            { label: 'Scheduled', value: 3, color: '#3b82f6' },
            { label: 'Cancelled', value: 3, color: '#ef4444' }
          ]
        };
        
        setDashboardStats(mockStats);
        setLoading(false);
      }, 1000);
    };

    loadPatientStats();
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
      case 'checkup': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Hello, {user?.displayName?.split(' ')[0] || 'Patient'}!
        </h1>
        <p className="text-gray-600">Here&apos;s an overview of your health journey and upcoming appointments.</p>
      </div>

      {/* Key Metrics Grid */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Health Overview</h2>
          <p className="text-gray-600">Your health metrics and appointment summary</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Upcoming Appointments"
            value={dashboardStats.upcomingAppointments}
            change={{
              value: 15,
              trend: 'up',
              period: 'this month'
            }}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            color="green"
          />

          <MetricCard
            title="Connected Doctors"
            value={dashboardStats.doctorsConnected}
            change={{
              value: 25,
              trend: 'up',
              period: 'vs last year'
            }}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
            color="blue"
          />

          <MetricCard
            title="Health Records"
            value={dashboardStats.healthRecords}
            change={{
              value: 8,
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
            title="Pending Results"
            value={dashboardStats.pendingResults}
            change={{
              value: 1,
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

      {/* Charts and Health Metrics */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Health Analytics</h2>
          <p className="text-gray-600">Appointment history and health metrics</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SimpleChart
            title="Appointment History"
            subtitle="Breakdown of your appointment status"
            type="doughnut"
            height={220}
            data={dashboardStats.appointmentHistory}
          />

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Health Metrics</h3>
            <div className="space-y-4">
              {dashboardStats.healthMetrics.map((metric) => (
                <div key={metric.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">{metric.name}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getHealthStatusColor(metric.status)}`}>
                        {metric.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Updated {metric.lastUpdated}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {metric.value} <span className="text-sm font-normal text-gray-500">{metric.unit}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Upcoming Appointments and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
              <p className="text-sm text-gray-600">
                {dashboardStats.recentAppointments.length} appointments scheduled
              </p>
            </div>
            <button className="text-green-600 hover:text-green-700 text-sm font-medium">
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {dashboardStats.recentAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {appointment.doctorName}
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAppointmentTypeColor(appointment.type)}`}>
                      {appointment.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{appointment.specialty}</p>
                  <p className="text-sm text-gray-600">{appointment.date} at {appointment.time}</p>
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
            <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Book New Appointment</span>
              </div>
            </button>
            
            <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Find New Doctor</span>
              </div>
            </button>
            
            <button className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">View Medical Records</span>
              </div>
            </button>
            
            <button className="w-full text-left px-4 py-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors group">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM12 17H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Medication Reminders</span>
              </div>
            </button>

            {dashboardStats.pendingResults > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      {dashboardStats.pendingResults} lab result{dashboardStats.pendingResults > 1 ? 's' : ''} pending
                    </p>
                    <p className="text-xs text-yellow-600">Check back later for updates</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
