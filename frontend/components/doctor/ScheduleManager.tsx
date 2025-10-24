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
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Retry logic for production delays
  const retryWithDelay = async (fn: () => Promise<unknown>, maxRetries: number = 3, delay: number = 1000): Promise<unknown> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        console.log(`Attempt ${attempt}/${maxRetries} failed:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff with jitter
        const backoffDelay = delay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.log(`Retrying in ${Math.round(backoffDelay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  };

  const loadScheduleData = useCallback(async (retryAttempt: number = 0) => {
    if (!user?.uid) return;

    try {
      setDataLoading(true);
      setError(null);
      setRetryCount(retryAttempt);

      console.log(`Loading schedule data for doctor: ${user.uid} (attempt ${retryAttempt + 1})`);

      // Load data with retry logic and proper error handling
      const loadWithRetry = async () => {
        // Load schedules with retry
        const schedulesData = await retryWithDelay(async () => {
          try {
            const data = await FirestoreService.getDoctorSchedules(user.uid);
            console.log('Loaded schedules:', data);
            return data;
          } catch (err) {
            console.warn('Error loading schedules:', err);
            // For permission or index errors, don't retry
            const errorCode = (err as Error & { code?: string }).code;
            if (errorCode === 'permission-denied' || 
                (err as Error).message.includes('index')) {
              return [];
            }
            throw err;
          }
        }, 3, 1000);

        // Load exceptions with retry
        const exceptionsData = await retryWithDelay(async () => {
          try {
            const data = await FirestoreService.getScheduleExceptions(user.uid);
            console.log('Loaded exceptions:', data);
            return data;
          } catch (err) {
            console.warn('Error loading exceptions:', err);
            // For permission or index errors, don't retry
            const errorCode = (err as Error & { code?: string }).code;
            if (errorCode === 'permission-denied' || 
                (err as Error).message.includes('index')) {
              return [];
            }
            throw err;
          }
        }, 3, 1000);

        return { schedulesData, exceptionsData };
      };

      const { schedulesData, exceptionsData } = await loadWithRetry();

      // Update state atomically to prevent race conditions
      setSchedules(schedulesData as DoctorSchedule[]);
      setExceptions(exceptionsData as ScheduleException[]);

      // Find default schedule
      const defaultSched = (schedulesData as DoctorSchedule[]).find((s: DoctorSchedule) => s.isDefault) || null;
      setDefaultSchedule(defaultSched);

      console.log('Schedule data loaded successfully');

    } catch (err) {
      console.error('Error loading schedule data:', err);
      
      // Enhanced error logging for schedule data loading
      console.error('=== SCHEDULE DATA LOADING ERROR ===');
      console.error('User ID:', user?.uid);
      console.error('Error:', err instanceof Error ? {
        message: err.message,
        code: (err as Error & { code?: string }).code,
        stack: err.stack
      } : err);
      console.error('=== END LOADING ERROR ===');
      
      const errorMessage = (err as Error).message || String(err);
      const errorCode = (err as Error & { code?: string }).code;
      
      if (errorCode === 'permission-denied') {
        setError('Permission denied: Unable to load schedule data. Check your user permissions.');
      } else if (errorMessage.includes('index') || errorMessage.includes('Index')) {
        setError('Database indexes are building. Schedule data will be available shortly.');
      } else {
        setError(`Failed to load schedule data: ${errorMessage}. This might be your first time accessing schedules.`);
      }
    } finally {
      setLoading(false);
      setDataLoading(false);
    }
  }, [user?.uid]);

  // Wrapper for UI event handlers
  const handleRefresh = async () => {
    await loadScheduleData(0);
  };

  useEffect(() => {
    if (user?.uid) {
      loadScheduleData();
    }
  }, [user?.uid, loadScheduleData]);

  const createDefaultSchedule = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);
      console.log('🔧 Starting default schedule creation for doctor:', user.uid);

      // Step 1: Create schedule template
      console.log('📋 Step 1: Creating schedule template...');
      const defaultScheduleData = ScheduleService.createDefaultScheduleTemplate(user.uid);
      console.log('✅ Schedule template created:', defaultScheduleData);
      
      // Step 2: Save to Firestore with retry logic
      console.log('💾 Step 2: Saving schedule to Firestore...');
      const scheduleId = await retryWithDelay(async () => {
        return await FirestoreService.createDoctorSchedule(defaultScheduleData);
      }, 3, 2000);
      console.log('✅ Schedule saved with ID:', scheduleId);
      
      // Step 3: Wait a moment for consistency in production
      console.log('⏳ Step 3: Waiting for database consistency...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Step 4: Reload schedule data with retry
      console.log('🔄 Step 4: Reloading schedule data...');
      await loadScheduleData(0);
      console.log('✅ Schedule data reloaded');
      
      // Step 5: Generate availability slots with retry
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 30);
      
      const fromDate = today.toISOString().split('T')[0];
      const toDate = endDate.toISOString().split('T')[0];
      
      console.log(`🕐 Step 5: Generating availability slots from ${fromDate} to ${toDate}...`);
      
      await retryWithDelay(async () => {
        return await FirestoreService.generateAvailabilitySlots(
          user.uid,
          fromDate,
          toDate
        );
      }, 3, 2000);

      console.log('✅ Default schedule creation completed successfully!');
      setError(null); // Clear any previous errors
      
      // Final data reload to ensure everything is up to date
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadScheduleData(0);

    } catch (err) {
      console.error('❌ Error creating default schedule:', err);
      
      const errorMessage = (err as Error).message || String(err);
      const errorCode = (err as Error & { code?: string }).code;
      
      if (errorCode === 'permission-denied') {
        setError(`Permission denied: ${errorMessage}. Check your user role and Firestore rules.`);
      } else if (errorMessage.includes('index') || errorMessage.includes('Index')) {
        setError('Database indexes are still building - this may take a few moments. Please try again in a minute.');
      } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        setError(`Network error: ${errorMessage}. Please check your internet connection and try again.`);
      } else if (errorCode === 'unavailable') {
        setError(`Service temporarily unavailable: ${errorMessage}. Please try again in a few moments.`);
      } else if (errorCode === 'deadline-exceeded') {
        setError(`Request timeout: ${errorMessage}. The operation took too long. Please try again.`);
      } else if (errorCode === 'resource-exhausted') {
        setError(`Resource limits exceeded: ${errorMessage}. Please try again later.`);
      } else {
        setError(`Failed to create default schedule: ${errorMessage} (Code: ${errorCode || 'unknown'})`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleUpdate = async (updatedSchedule: DoctorSchedule) => {
    try {
      setDataLoading(true);
      setError(null);
      
      await retryWithDelay(async () => {
        return await FirestoreService.updateDoctorSchedule(updatedSchedule.id, updatedSchedule);
      }, 3, 1000);
      
      // Wait for consistency before reloading
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadScheduleData(0);
      
    } catch (err) {
      console.error('Error updating schedule:', err);
      
      const errorMessage = (err as Error).message || String(err);
      const errorCode = (err as Error & { code?: string }).code;
      
      if (errorCode === 'permission-denied') {
        setError('Permission denied: Unable to update schedule. Check your user permissions.');
      } else {
        setError(`Failed to update schedule: ${errorMessage}`);
      }
    } finally {
      setDataLoading(false);
    }
  };

  const handleExceptionCreate = async (exception: Omit<ScheduleException, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setDataLoading(true);
      setError(null);
      
      await retryWithDelay(async () => {
        return await FirestoreService.createScheduleException(exception);
      }, 3, 1000);
      
      // Wait for consistency before reloading
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadScheduleData(0);
      
    } catch (err) {
      console.error('Error creating exception:', err);
      
      const errorMessage = (err as Error).message || String(err);
      const errorCode = (err as Error & { code?: string }).code;
      
      if (errorCode === 'permission-denied') {
        setError('Permission denied: Unable to create schedule exception. Check your user permissions.');
      } else {
        setError(`Failed to create schedule exception: ${errorMessage}`);
      }
    } finally {
      setDataLoading(false);
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
        {retryCount > 0 && <span className="ml-2 text-xs text-gray-500">(Retry {retryCount + 1})</span>}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          {retryCount > 0 && (
            <div className="text-sm text-gray-500 mb-4">
              Attempted {retryCount + 1} time{retryCount > 0 ? 's' : ''}
            </div>
          )}
          <div className="flex justify-center space-x-3">
            <Button onClick={handleRefresh} disabled={dataLoading}>
              {dataLoading ? 'Retrying...' : 'Try Again'}
            </Button>
            <Button variant="outline" onClick={createDefaultSchedule} disabled={loading}>
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
            {dataLoading && <span className="ml-2 text-blue-600 text-sm">• Updating...</span>}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={dataLoading}
            className="flex items-center space-x-2"
          >
            <svg className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{dataLoading ? 'Refreshing...' : 'Refresh'}</span>
            {retryCount > 0 && <span className="text-xs text-gray-500">({retryCount + 1})</span>}
          </Button>
        </div>
      </div>

      {/* Data Loading Progress Bar */}
      {dataLoading && (
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{width: '60%'}}></div>
        </div>
      )}

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
            <Button onClick={createDefaultSchedule} disabled={loading || dataLoading}>
              {loading ? 'Creating...' : 'Create Default Schedule'}
            </Button>
          </Card>
        )}

        {activeTab === 'calendar' && user && (
          <CalendarView
            doctorId={user.uid}
            schedules={schedules}
            exceptions={exceptions}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'exceptions' && user && (
          <ExceptionManager
            doctorId={user.uid}
            exceptions={exceptions}
            onExceptionCreate={handleExceptionCreate}
            onRefresh={handleRefresh}
          />
        )}
      </div>
    </div>
  );
}
