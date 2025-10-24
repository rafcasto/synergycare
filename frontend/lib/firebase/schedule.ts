import { Timestamp } from 'firebase/firestore';
import { FirestoreService, DoctorSchedule, AvailabilitySlot, DaySchedule, DayOfWeek } from './firestore';

export class ScheduleService {
  
  // Create a default schedule template for new doctors
  static createDefaultScheduleTemplate(doctorId: string, timezone: string = 'America/New_York'): Omit<DoctorSchedule, 'id' | 'createdAt' | 'updatedAt'> {
    const defaultWorkingHours: DaySchedule = {
      isWorking: true,
      shifts: [
        { startTime: '09:00', endTime: '17:00' }
      ],
      breaks: [
        { startTime: '12:00', endTime: '13:00' } // Lunch break
      ]
    };

    const weekendHours: DaySchedule = {
      isWorking: false,
      shifts: [],
      breaks: []
    };

    return {
      doctorId,
      name: 'Default Schedule',
      isDefault: true,
      timezone,
      weeklySchedule: {
        monday: defaultWorkingHours,
        tuesday: defaultWorkingHours,
        wednesday: defaultWorkingHours,
        thursday: defaultWorkingHours,
        friday: defaultWorkingHours,
        saturday: weekendHours,
        sunday: weekendHours,
      },
      effectiveFrom: Timestamp.now(),
    };
  }

  // Validate schedule data
  static validateSchedule(schedule: Partial<DoctorSchedule>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!schedule.name || schedule.name.trim().length === 0) {
      errors.push('Schedule name is required');
    }

    if (!schedule.timezone) {
      errors.push('Timezone is required');
    }

    if (!schedule.weeklySchedule) {
      errors.push('Weekly schedule is required');
    } else {
      // Validate each day
      Object.entries(schedule.weeklySchedule).forEach(([day, daySchedule]) => {
        if (daySchedule.isWorking) {
          if (!daySchedule.shifts || daySchedule.shifts.length === 0) {
            errors.push(`${day}: Working day must have at least one shift`);
          } else {
            // Validate shifts don't overlap
            const sortedShifts = [...daySchedule.shifts].sort((a, b) => 
              this.timeStringToMinutes(a.startTime) - this.timeStringToMinutes(b.startTime)
            );
            
            for (let i = 0; i < sortedShifts.length - 1; i++) {
              const currentEnd = this.timeStringToMinutes(sortedShifts[i].endTime);
              const nextStart = this.timeStringToMinutes(sortedShifts[i + 1].startTime);
              
              if (currentEnd > nextStart) {
                errors.push(`${day}: Shifts cannot overlap`);
                break;
              }
            }

            // Validate shift times
            daySchedule.shifts.forEach((shift, index) => {
              const startMinutes = this.timeStringToMinutes(shift.startTime);
              const endMinutes = this.timeStringToMinutes(shift.endTime);
              
              if (startMinutes >= endMinutes) {
                errors.push(`${day}: Shift ${index + 1} end time must be after start time`);
              }
            });
          }

          // Validate breaks are within shifts
          if (daySchedule.breaks) {
            daySchedule.breaks.forEach((breakSlot, index) => {
              const breakStart = this.timeStringToMinutes(breakSlot.startTime);
              const breakEnd = this.timeStringToMinutes(breakSlot.endTime);
              
              if (breakStart >= breakEnd) {
                errors.push(`${day}: Break ${index + 1} end time must be after start time`);
                return;
              }

              const isWithinShift = daySchedule.shifts.some(shift => {
                const shiftStart = this.timeStringToMinutes(shift.startTime);
                const shiftEnd = this.timeStringToMinutes(shift.endTime);
                return breakStart >= shiftStart && breakEnd <= shiftEnd;
              });

              if (!isWithinShift) {
                errors.push(`${day}: Break ${index + 1} must be within a working shift`);
              }
            });
          }
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Check if a specific time slot is available
  static async isTimeSlotAvailable(
    doctorId: string, 
    date: string, 
    startTime: string, 
    endTime: string
  ): Promise<boolean> {
    const slots = await FirestoreService.getAvailabilitySlots(doctorId, date, date);
    
    const requestedStart = this.timeStringToMinutes(startTime);
    const requestedEnd = this.timeStringToMinutes(endTime);
    
    return slots.some(slot => {
      const slotStart = this.timeStringToMinutes(slot.startTime);
      const slotEnd = this.timeStringToMinutes(slot.endTime);
      const slotStatus = slot.status || (slot.isBooked ? 'booked' : 'available');
      
      return slotStatus === 'available' && 
             requestedStart >= slotStart && 
             requestedEnd <= slotEnd;
    });
  }

  // Get available time slots for a date range
  static async getAvailableSlots(
    doctorId: string,
    fromDate: string,
    toDate: string
  ): Promise<{ [date: string]: AvailabilitySlot[] }> {
    const slots = await FirestoreService.getAvailabilitySlots(doctorId, fromDate, toDate);
    
    const groupedSlots: { [date: string]: AvailabilitySlot[] } = {};
    
    slots.forEach(slot => {
      const slotStatus = slot.status || (slot.isBooked ? 'booked' : 'available');
      if (slotStatus === 'available') {
        if (!groupedSlots[slot.date]) {
          groupedSlots[slot.date] = [];
        }
        groupedSlots[slot.date].push(slot);
      }
    });
    
    return groupedSlots;
  }

  // Block time slots (for breaks, meetings, etc.)
  static async blockTimeSlots(
    doctorId: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<void> {
    const slots = await FirestoreService.getAvailabilitySlots(doctorId, date, date);
    
    const blockStart = this.timeStringToMinutes(startTime);
    const blockEnd = this.timeStringToMinutes(endTime);
    
    const slotsToBlock = slots.filter(slot => {
      const slotStart = this.timeStringToMinutes(slot.startTime);
      const slotEnd = this.timeStringToMinutes(slot.endTime);
      const slotStatus = slot.status || (slot.isBooked ? 'booked' : 'available');
      
      // Check if slot overlaps with block period
      return slotStart < blockEnd && slotEnd > blockStart && slotStatus === 'available';
    });
    
    const updatePromises = slotsToBlock.map(slot =>
      FirestoreService.updateAvailabilitySlot(slot.id, { status: 'blocked' })
    );
    
    await Promise.all(updatePromises);
  }

  // Unblock time slots
  static async unblockTimeSlots(
    doctorId: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<void> {
    const slots = await FirestoreService.getAvailabilitySlots(doctorId, date, date);
    
    const unblockStart = this.timeStringToMinutes(startTime);
    const unblockEnd = this.timeStringToMinutes(endTime);
    
    const slotsToUnblock = slots.filter(slot => {
      const slotStart = this.timeStringToMinutes(slot.startTime);
      const slotEnd = this.timeStringToMinutes(slot.endTime);
      const slotStatus = slot.status || (slot.isBooked ? 'booked' : 'available');
      
      return slotStart < unblockEnd && slotEnd > unblockStart && slotStatus === 'blocked';
    });
    
    const updatePromises = slotsToUnblock.map(slot =>
      FirestoreService.updateAvailabilitySlot(slot.id, { status: 'available' })
    );
    
    await Promise.all(updatePromises);
  }

  // Get doctor's schedule for a specific date
  static async getScheduleForDate(doctorId: string, date: string): Promise<DaySchedule | null> {
    try {
      const dayOfWeek = this.getDayOfWeek(new Date(date));
      
      // Check for exceptions first
      const exceptions = await FirestoreService.getScheduleExceptions(doctorId, date, date);
      const exception = exceptions.find(ex => ex.date === date);
      
      if (exception) {
        if (exception.type === 'unavailable' || exception.type === 'holiday') {
          return {
            isWorking: false,
            shifts: [],
            breaks: []
          };
        } else if (exception.type === 'modified_hours' && exception.modifiedSchedule) {
          return exception.modifiedSchedule;
        }
      }
      
      // Get default schedule
      const defaultSchedule = await FirestoreService.getDoctorDefaultSchedule(doctorId);
      if (defaultSchedule && defaultSchedule.weeklySchedule[dayOfWeek]) {
        return defaultSchedule.weeklySchedule[dayOfWeek];
      }
      
      return null;
    } catch (error) {
      console.error('Error getting schedule for date:', error);
      return null;
    }
  }

  // Utility methods
  private static timeStringToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private static minutesToTimeString(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private static getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }

  // Format time for display
  static formatTime(timeStr: string, format12Hour: boolean = true): string {
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    if (!format12Hour) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  // Generate time options for dropdowns
  static generateTimeOptions(startHour: number = 6, endHour: number = 22, intervalMinutes: number = 15): string[] {
    const options: string[] = [];
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeStr);
      }
    }
    
    return options;
  }
}
