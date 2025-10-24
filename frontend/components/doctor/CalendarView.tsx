'use client';

import { useState, useEffect, useCallback } from 'react';
import { DoctorSchedule, ScheduleException, AvailabilitySlot, DayOfWeek } from '@/lib/firebase/firestore';
import { FirestoreService } from '@/lib/firebase/firestore';
import { ScheduleService } from '@/lib/firebase/schedule';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, Calendar, RefreshCw } from 'lucide-react';

interface CalendarViewProps {
  doctorId: string;
  schedules: DoctorSchedule[];
  exceptions: ScheduleException[];
  onRefresh: () => void;
}

interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWorking: boolean;
  hasException: boolean;
  availableSlots: number;
  bookedSlots: number;
  exceptionType?: 'unavailable' | 'modified_hours' | 'holiday';
}

export function CalendarView({ doctorId, schedules, exceptions, onRefresh }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // Get first day of the month and last day
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // Get start of calendar (might include previous month days)
      // Adjust to start on Sunday (getDay() returns 0 for Sunday)
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());
      
      // Get end of calendar (might include next month days)
      const endDate = new Date(lastDay);
      endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

      // Load availability slots for the month
      const slots = await FirestoreService.getAvailabilitySlots(
        doctorId,
        formatLocalDate(startDate),
        formatLocalDate(endDate)
      );

      // Create calendar days
      const days: CalendarDay[] = [];
      const today = formatLocalDate(new Date());
      const defaultSchedule = schedules.find(s => s.isDefault);
      
      console.log('Calendar Debug Info:', {
        currentDate: currentDate.toString(),
        startDate: startDate.toString(),
        endDate: endDate.toString(),
        defaultSchedule: defaultSchedule?.weeklySchedule,
        exceptionsCount: exceptions.length
      });
      
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateStr = formatLocalDate(date);
        const daySlots = slots.filter(slot => slot.date === dateStr);
        const exception = exceptions.find(ex => ex.date === dateStr);
        
        // Determine if this is a working day
        let isWorking = false;
        if (defaultSchedule) {
          const dayOfWeek = getDayOfWeek(date);
          const daySchedule = defaultSchedule.weeklySchedule[dayOfWeek];
          isWorking = daySchedule?.isWorking || false;
          
          // Debug log for specific days
          if (date.getMonth() === month && date.getDate() <= 7) {
            console.log(`Day ${dateStr} (${dayOfWeek}):`, {
              isWorking: daySchedule?.isWorking,
              hasException: !!exception,
              exceptionType: exception?.type
            });
          }
          
          // Override with exception
          if (exception) {
            if (exception.type === 'unavailable' || exception.type === 'holiday') {
              isWorking = false;
            } else if (exception.type === 'modified_hours') {
              isWorking = exception.modifiedSchedule?.isWorking || false;
            }
          }
        }

        // Count available and booked slots
        const availableCount = daySlots.filter(slot => slot.status === 'available').length;
        const bookedCount = daySlots.filter(slot => slot.status === 'booked').length;

        days.push({
          date: dateStr,
          dayOfMonth: date.getDate(),
          isCurrentMonth: date.getMonth() === month,
          isToday: dateStr === today,
          isWorking,
          hasException: !!exception,
          availableSlots: availableCount,
          bookedSlots: bookedCount,
          exceptionType: exception?.type as 'unavailable' | 'modified_hours' | 'holiday' | undefined
        });
      }

      setCalendarDays(days);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate, doctorId, schedules, exceptions]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  const loadDayDetails = async (date: string) => {
    try {
      const slots = await FirestoreService.getAvailabilitySlots(doctorId, date, date);
      setAvailabilitySlots(slots);
      setSelectedDate(date);
    } catch (error) {
      console.error('Error loading day details:', error);
    }
  };

  const generateSlotsForMonth = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // Ensure we don't generate slots for past dates
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      
      // Use today as start date if it's later than the first day of the month
      const startDate = firstDay < today ? today : firstDay;

      await FirestoreService.generateAvailabilitySlots(
        doctorId,
        startDate.toISOString().split('T')[0],
        lastDay.toISOString().split('T')[0]
      );

      await loadCalendarData();
      onRefresh();
    } catch (error) {
      console.error('Error generating slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  // Timezone-safe date formatting
  const formatLocalDate = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getDayOfWeek = (date: Date): DayOfWeek => {
    const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  const isViewingPastMonth = (): boolean => {
    const today = new Date();
    const viewingYear = currentDate.getFullYear();
    const viewingMonth = currentDate.getMonth();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    return viewingYear < currentYear || (viewingYear === currentYear && viewingMonth < currentMonth);
  };

  const getDayStatus = (day: CalendarDay) => {
    if (day.hasException) {
      switch (day.exceptionType) {
        case 'holiday':
          return 'Holiday';
        case 'unavailable':
          return 'Unavailable';
        case 'modified_hours':
          return 'Modified Hours';
        default:
          return 'Exception';
      }
    }
    
    if (!day.isWorking) {
      return 'Day Off';
    }
    
    if (day.availableSlots === 0 && day.bookedSlots === 0) {
      return 'No Slots';
    }
    
    return `${day.availableSlots} Available, ${day.bookedSlots} Booked`;
  };

  const getDayColor = (day: CalendarDay) => {
    if (!day.isCurrentMonth) {
      return 'text-gray-300';
    }
    
    if (day.isToday) {
      return 'bg-blue-100 text-blue-900 font-semibold';
    }
    
    if (day.hasException) {
      switch (day.exceptionType) {
        case 'holiday':
          return 'bg-purple-100 text-purple-800';
        case 'unavailable':
          return 'bg-red-100 text-red-800';
        case 'modified_hours':
          return 'bg-orange-100 text-orange-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }
    
    if (!day.isWorking) {
      return 'bg-gray-50 text-gray-400';
    }
    
    if (day.availableSlots > 0) {
      return 'bg-green-50 text-green-800';
    }
    
    if (day.bookedSlots > 0) {
      return 'bg-yellow-50 text-yellow-800';
    }
    
    return 'text-gray-600';
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onRefresh}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
            <Button
              onClick={generateSlotsForMonth}
              disabled={loading || isViewingPastMonth()}
              className="flex items-center space-x-2"
              title={isViewingPastMonth() ? "Cannot generate slots for past months" : undefined}
            >
              <Calendar className="w-4 h-4" />
              <span>{loading ? 'Generating...' : 'Generate Slots'}</span>
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Week day headers */}
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 bg-gray-50">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day, index) => (
            <button
              key={index}
              onClick={() => loadDayDetails(day.date)}
              className={`p-2 min-h-[80px] text-left border border-gray-100 hover:bg-gray-50 transition-colors ${getDayColor(day)} ${
                selectedDate === day.date ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="text-sm font-medium">{day.dayOfMonth}</div>
              <div className="text-xs mt-1 space-y-1">
                {day.isCurrentMonth && (
                  <>
                    <div>{getDayStatus(day)}</div>
                    {day.isWorking && !day.hasException && (
                      <div className="flex space-x-1">
                        {day.availableSlots > 0 && (
                          <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
                        )}
                        {day.bookedSlots > 0 && (
                          <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full"></span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span>Booked</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded-full"></div>
            <span>Unavailable</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded-full"></div>
            <span>Holiday</span>
          </div>
        </div>
      </Card>

      {/* Day Details */}
      {selectedDate && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Details for {(() => {
              const [year, month, day] = selectedDate.split('-').map(Number);
              const localDate = new Date(year, month - 1, day); // month is 0-indexed
              return localDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              });
            })()}
          </h3>
          
          {availabilitySlots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availabilitySlots.map(slot => (
                <div
                  key={slot.id}
                  className={`p-3 rounded-lg border ${
                    slot.status === 'available' 
                      ? 'border-green-200 bg-green-50' 
                      : slot.status === 'booked'
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {ScheduleService.formatTime(slot.startTime)} - {ScheduleService.formatTime(slot.endTime)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {slot.duration} minutes
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      slot.status === 'available' 
                        ? 'bg-green-100 text-green-800' 
                        : slot.status === 'booked'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {slot.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No availability slots for this date</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
