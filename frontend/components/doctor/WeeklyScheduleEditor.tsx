'use client';

import { useState } from 'react';
import { DoctorSchedule, DaySchedule, TimeSlot, DayOfWeek } from '@/lib/firebase/firestore';
import { ScheduleService } from '@/lib/firebase/schedule';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Save, Clock } from 'lucide-react';

interface WeeklyScheduleEditorProps {
  schedule: DoctorSchedule;
  onUpdate: (schedule: DoctorSchedule) => void;
}

const DAYS_ORDER: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

export function WeeklyScheduleEditor({ schedule, onUpdate }: WeeklyScheduleEditorProps) {
  const [editedSchedule, setEditedSchedule] = useState<DoctorSchedule>({ ...schedule });
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const timeOptions = ScheduleService.generateTimeOptions(6, 22, 15);

  const updateDay = (day: DayOfWeek, daySchedule: DaySchedule) => {
    setEditedSchedule(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: daySchedule
      }
    }));
    setHasChanges(true);
  };

  const toggleDayWorking = (day: DayOfWeek) => {
    const currentDay = editedSchedule.weeklySchedule[day];
    const newDay: DaySchedule = {
      ...currentDay,
      isWorking: !currentDay.isWorking,
      shifts: !currentDay.isWorking ? [{ startTime: '09:00', endTime: '17:00' }] : [],
      breaks: !currentDay.isWorking ? [{ startTime: '12:00', endTime: '13:00' }] : []
    };
    updateDay(day, newDay);
  };

  const addShift = (day: DayOfWeek) => {
    const currentDay = editedSchedule.weeklySchedule[day];
    const newShift: TimeSlot = { startTime: '09:00', endTime: '17:00' };
    updateDay(day, {
      ...currentDay,
      shifts: [...currentDay.shifts, newShift]
    });
  };

  const updateShift = (day: DayOfWeek, shiftIndex: number, shift: TimeSlot) => {
    const currentDay = editedSchedule.weeklySchedule[day];
    const newShifts = [...currentDay.shifts];
    newShifts[shiftIndex] = shift;
    updateDay(day, {
      ...currentDay,
      shifts: newShifts
    });
  };

  const removeShift = (day: DayOfWeek, shiftIndex: number) => {
    const currentDay = editedSchedule.weeklySchedule[day];
    const newShifts = currentDay.shifts.filter((_, index) => index !== shiftIndex);
    updateDay(day, {
      ...currentDay,
      shifts: newShifts
    });
  };

  const addBreak = (day: DayOfWeek) => {
    const currentDay = editedSchedule.weeklySchedule[day];
    const newBreak: TimeSlot = { startTime: '12:00', endTime: '13:00' };
    updateDay(day, {
      ...currentDay,
      breaks: [...currentDay.breaks, newBreak]
    });
  };

  const updateBreak = (day: DayOfWeek, breakIndex: number, breakSlot: TimeSlot) => {
    const currentDay = editedSchedule.weeklySchedule[day];
    const newBreaks = [...currentDay.breaks];
    newBreaks[breakIndex] = breakSlot;
    updateDay(day, {
      ...currentDay,
      breaks: newBreaks
    });
  };

  const removeBreak = (day: DayOfWeek, breakIndex: number) => {
    const currentDay = editedSchedule.weeklySchedule[day];
    const newBreaks = currentDay.breaks.filter((_, index) => index !== breakIndex);
    updateDay(day, {
      ...currentDay,
      breaks: newBreaks
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setErrors([]);

    // Validate schedule
    const validation = ScheduleService.validateSchedule(editedSchedule);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setSaving(false);
      return;
    }

    try {
      await onUpdate(editedSchedule);
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to save schedule:', err);
      setErrors(['Failed to save schedule. Please try again.']);
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setEditedSchedule({ ...schedule });
    setHasChanges(false);
    setErrors([]);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Weekly Schedule</h2>
          <p className="text-gray-600 mt-1">Set your regular working hours for each day</p>
        </div>
        <div className="flex space-x-3">
          {hasChanges && (
            <Button variant="outline" onClick={resetChanges}>
              Cancel
            </Button>
          )}
          <Button 
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Please fix the following errors:
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Days Schedule */}
      <div className="space-y-6">
        {DAYS_ORDER.map(day => {
          const daySchedule = editedSchedule.weeklySchedule[day];
          
          return (
            <div key={day} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    {DAY_LABELS[day]}
                  </h3>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`working-${day}`}
                      checked={daySchedule.isWorking}
                      onChange={() => toggleDayWorking(day)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`working-${day}`} className="ml-2 text-sm text-gray-700">
                      Working day
                    </label>
                  </div>
                </div>
              </div>

              {daySchedule.isWorking && (
                <div className="space-y-4">
                  {/* Shifts */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Working Hours</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addShift(day)}
                        className="flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Shift</span>
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {daySchedule.shifts.map((shift, shiftIndex) => (
                        <div key={shiftIndex} className="flex items-center space-x-3">
                          <select
                            value={shift.startTime}
                            onChange={(e) => updateShift(day, shiftIndex, { ...shift, startTime: e.target.value })}
                            className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            {timeOptions.map(time => (
                              <option key={time} value={time}>
                                {ScheduleService.formatTime(time)}
                              </option>
                            ))}
                          </select>
                          
                          <span className="text-gray-500">to</span>
                          
                          <select
                            value={shift.endTime}
                            onChange={(e) => updateShift(day, shiftIndex, { ...shift, endTime: e.target.value })}
                            className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            {timeOptions.map(time => (
                              <option key={time} value={time}>
                                {ScheduleService.formatTime(time)}
                              </option>
                            ))}
                          </select>
                          
                          {daySchedule.shifts.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeShift(day, shiftIndex)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Breaks */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Breaks</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addBreak(day)}
                        className="flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Break</span>
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {daySchedule.breaks.map((breakSlot, breakIndex) => (
                        <div key={breakIndex} className="flex items-center space-x-3">
                          <select
                            value={breakSlot.startTime}
                            onChange={(e) => updateBreak(day, breakIndex, { ...breakSlot, startTime: e.target.value })}
                            className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            {timeOptions.map(time => (
                              <option key={time} value={time}>
                                {ScheduleService.formatTime(time)}
                              </option>
                            ))}
                          </select>
                          
                          <span className="text-gray-500">to</span>
                          
                          <select
                            value={breakSlot.endTime}
                            onChange={(e) => updateBreak(day, breakIndex, { ...breakSlot, endTime: e.target.value })}
                            className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            {timeOptions.map(time => (
                              <option key={time} value={time}>
                                {ScheduleService.formatTime(time)}
                              </option>
                            ))}
                          </select>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBreak(day, breakIndex)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      
                      {daySchedule.breaks.length === 0 && (
                        <p className="text-sm text-gray-500 italic">No breaks scheduled</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {!daySchedule.isWorking && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Day off</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
