'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FirestoreService, DoctorSchedule, ScheduleException } from '@/lib/firebase/firestore';
import { ScheduleService } from '@/lib/firebase/schedule';
import { WeeklyScheduleEditor } from '@/components/doctor/WeeklyScheduleEditor';
import { CalendarView } from '@/components/doctor/CalendarView';
import { ExceptionManager } from '@/components/doctor/ExceptionManager';
import { Calendar, Clock, Settings } from 'lucide-react';

type ScheduleTab = 'weekly' | 'calendar' | 'exceptions' | 'settings';

export default function ScheduleManager() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ScheduleTab>('weekly');
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [defaultSchedule, setDefaultSchedule] = useState<DoctorSchedule | null>(null);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadScheduleData = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);

      console.log('Loading schedule data for doctor:', user.uid);

      // Try to load schedules first
      let schedulesData: DoctorSchedule[] = [];
      try {
        schedulesData = await FirestoreService.getDoctorSchedules(user.uid);
        console.log('Loaded schedules:', schedulesData);
      } catch (scheduleErr) {
        console.warn('Error loading schedules (this is normal for new doctors):', scheduleErr);
        schedulesData = [];
      }

      // Try to load exceptions
      let exceptionsData: ScheduleException[] = [];
      try {
        exceptionsData = await FirestoreService.getScheduleExceptions(user.uid);
        console.log('Loaded exceptions:', exceptionsData);
      } catch (exceptionErr) {
        console.warn('Error loading exceptions (this is normal for new doctors):', exceptionErr);
        exceptionsData = [];
      }

      setSchedules(schedulesData);
      setExceptions(exceptionsData);

      // Find default schedule
      const defaultSched = schedulesData.find(s => s.isDefault) || null;
      setDefaultSchedule(defaultSched);

      console.log('Schedule data loaded successfully');

    } catch (err) {
      console.error('Error loading schedule data:', err);
      setError('Failed to load schedule data. This might be your first time accessing schedules.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      loadScheduleData();
    }
  }, [user?.uid, loadScheduleData]);

  const createDefaultSchedule = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      console.log('🔧 Starting default schedule creation for doctor:', user.uid);

      // Step 1: Create schedule template
      console.log('📋 Step 1: Creating schedule template...');
      const defaultScheduleData = ScheduleService.createDefaultScheduleTemplate(user.uid);
      console.log('✅ Schedule template created:', defaultScheduleData);
      
      // Step 2: Save to Firestore
      console.log('💾 Step 2: Saving schedule to Firestore...');
      const scheduleId = await FirestoreService.createDoctorSchedule(defaultScheduleData);
      console.log('✅ Schedule saved with ID:', scheduleId);
      
      // Step 3: Reload schedule data
      console.log('🔄 Step 3: Reloading schedule data...');
      await loadScheduleData();
      console.log('✅ Schedule data reloaded');
      
      // Step 4: Generate availability slots
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 30);
      
      const fromDate = today.toISOString().split('T')[0];
      const toDate = endDate.toISOString().split('T')[0];
      
      console.log(`🕐 Step 4: Generating availability slots from ${fromDate} to ${toDate}...`);
      
      await FirestoreService.generateAvailabilitySlots(
        user.uid,
        fromDate,
        toDate
      );

      console.log('✅ Default schedule creation completed successfully!');
      setError(null); // Clear any previous errors

    } catch (err) {
      console.error('❌ Error creating default schedule:', err);
      
      // Log the full error details
      if (err instanceof Error) {
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
        if ('code' in err) {
          console.error('Error code:', (err as Error & { code?: string }).code);
        }
      }
      
      // More specific error handling
      const errorMessage = (err as Error).message;
      const errorCode = (err as Error & { code?: string }).code;
      
      if (errorCode === 'permission-denied') {
        setError(`Permission denied: ${errorMessage}. Check your user role and Firestore rules.`);
      } else if (errorMessage.includes('index') || errorMessage.includes('Index')) {
        setError('Database indexes are still building - this may take a few moments. Please try again in a minute.');
      } else {
        setError(`Failed to create default schedule: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleUpdate = async (updatedSchedule: DoctorSchedule) => {
    try {
      await FirestoreService.updateDoctorSchedule(updatedSchedule.id, updatedSchedule);
      await loadScheduleData();
    } catch (err) {
      console.error('Error updating schedule:', err);
      setError('Failed to update schedule');
    }
  };

  const handleExceptionCreate = async (exception: Omit<ScheduleException, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await FirestoreService.createScheduleException(exception);
      await loadScheduleData();
    } catch (err) {
      console.error('Error creating exception:', err);
      setError('Failed to create schedule exception');
    }
  };

  const tabs = [
    {
      id: 'weekly' as const,
      name: 'Weekly Schedule',
      icon: <Clock className="w-4 h-4" />,
      description: 'Set your regular weekly hours'
    },
    {
      id: 'calendar' as const,
      name: 'Calendar View',
      icon: <Calendar className="w-4 h-4" />,
      description: 'View and manage daily availability'
    },
    {
      id: 'exceptions' as const,
      name: 'Time Off & Exceptions',
      icon: <Settings className="w-4 h-4" />,
      description: 'Manage holidays and special hours'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading schedule...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <div className="flex justify-center space-x-3">
            <Button onClick={loadScheduleData}>Try Again</Button>
            <Button variant="outline" onClick={createDefaultSchedule}>
              Create Default Schedule
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your availability and working hours
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={loadScheduleData}
            className="flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              console.log('Testing Firebase connection...');
              console.log('Current user:', user);
              try {
                const userProfile = await FirestoreService.getUser(user?.uid || '');
                console.log('User profile from Firestore:', userProfile);
                alert('Firebase connection working! Check console for details.');
              } catch (err) {
                console.error('Firebase connection error:', err);
                alert('Firebase connection failed: ' + (err as Error).message);
              }
            }}
            className="flex items-center space-x-2"
          >
            <span>Test Firebase</span>
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              const { FirebaseDiagnostic } = await import('@/lib/firebase/diagnostic');
              await FirebaseDiagnostic.checkEnvironment();
              const results = await FirebaseDiagnostic.runFullDiagnostic();
              console.log('🔍 Diagnostic Results:', results);
              
              if (results.errors.length > 0) {
                alert(`Issues found:\n${results.errors.join('\n')}\n\nCheck console for details.`);
              } else {
                alert('All tests passed! Check console for details.');
              }
            }}
            className="flex items-center space-x-2"
          >
            <span>Run Diagnostics</span>
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              if (!user?.uid) {
                alert('No user logged in');
                return;
              }
              
              try {
                const { FirebaseDiagnostic } = await import('@/lib/firebase/diagnostic');
                const role = await FirebaseDiagnostic.fixUserRole('doctor');
                alert(`User role set to: ${role}. Now try creating the schedule again.`);
                await loadScheduleData(); // Refresh the page data
              } catch (error) {
                console.error('Failed to fix user role:', error);
                alert(`Failed to fix user role: ${error}`);
              }
            }}
            className="flex items-center space-x-2"
          >
            <span>Fix User Role</span>
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <Card className="p-1">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.name}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'weekly' && defaultSchedule && (
          <WeeklyScheduleEditor
            schedule={defaultSchedule}
            onUpdate={handleScheduleUpdate}
          />
        )}

        {activeTab === 'weekly' && !defaultSchedule && (
          <Card className="p-8 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedule Found</h3>
            <p className="text-gray-600 mb-4">
              You haven&apos;t set up your weekly schedule yet.
            </p>
            <Button onClick={createDefaultSchedule}>
              Create Default Schedule
            </Button>
          </Card>
        )}

        {activeTab === 'calendar' && user && (
          <CalendarView
            doctorId={user.uid}
            schedules={schedules}
            exceptions={exceptions}
            onRefresh={loadScheduleData}
          />
        )}

        {activeTab === 'exceptions' && user && (
          <ExceptionManager
            doctorId={user.uid}
            exceptions={exceptions}
            onExceptionCreate={handleExceptionCreate}
            onRefresh={loadScheduleData}
          />
        )}
      </div>
    </div>
  );
}
