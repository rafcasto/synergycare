'use client';

import { useState } from 'react';
import { ScheduleException, DaySchedule } from '@/lib/firebase/firestore';
import { FirestoreService } from '@/lib/firebase/firestore';
import { ScheduleService } from '@/lib/firebase/schedule';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Calendar, Trash2, Edit } from 'lucide-react';

interface ExceptionManagerProps {
  doctorId: string;
  exceptions: ScheduleException[];
  onExceptionCreate: (exception: Omit<ScheduleException, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onRefresh: () => void;
}

interface ExceptionFormData {
  date: string;
  type: 'unavailable' | 'modified_hours' | 'holiday';
  reason: string;
  modifiedSchedule?: DaySchedule;
}

export function ExceptionManager({ doctorId, exceptions, onExceptionCreate, onRefresh }: ExceptionManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingException, setEditingException] = useState<ScheduleException | null>(null);
  const [formData, setFormData] = useState<ExceptionFormData>({
    date: '',
    type: 'unavailable',
    reason: '',
  });
  const [saving, setSaving] = useState(false);

  const timeOptions = ScheduleService.generateTimeOptions(6, 22, 15);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingException) {
        // Update existing exception
        await FirestoreService.updateScheduleException(editingException.id, {
          date: formData.date,
          type: formData.type,
          reason: formData.reason,
          modifiedSchedule: formData.modifiedSchedule,
        });
      } else {
        // Create new exception
        await onExceptionCreate({
          doctorId,
          date: formData.date,
          type: formData.type,
          reason: formData.reason,
          modifiedSchedule: formData.modifiedSchedule,
        });
      }

      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error saving exception:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (exception: ScheduleException) => {
    setEditingException(exception);
    setFormData({
      date: exception.date,
      type: exception.type,
      reason: exception.reason || '',
      modifiedSchedule: exception.modifiedSchedule,
    });
    setShowForm(true);
  };

  const handleDelete = async (exceptionId: string) => {
    if (!confirm('Are you sure you want to delete this exception?')) {
      return;
    }

    try {
      await FirestoreService.deleteScheduleException(exceptionId);
      onRefresh();
    } catch (error) {
      console.error('Error deleting exception:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      date: '',
      type: 'unavailable',
      reason: '',
    });
    setEditingException(null);
    setShowForm(false);
  };

  const updateModifiedSchedule = (field: string, value: DaySchedule[keyof DaySchedule]) => {
    setFormData(prev => ({
      ...prev,
      modifiedSchedule: {
        ...prev.modifiedSchedule,
        [field]: value,
      } as DaySchedule
    }));
  };

  const addShift = () => {
    const currentSchedule = formData.modifiedSchedule || { isWorking: true, shifts: [], breaks: [] };
    const newShift = { startTime: '09:00', endTime: '17:00' };
    updateModifiedSchedule('shifts', [
      ...currentSchedule.shifts,
      newShift
    ]);
    // Also ensure isWorking is true when adding shifts
    updateModifiedSchedule('isWorking', true);
  };

  const updateShift = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const currentSchedule = formData.modifiedSchedule || { isWorking: true, shifts: [], breaks: [] };
    const newShifts = [...currentSchedule.shifts];
    newShifts[index] = { ...newShifts[index], [field]: value };
    updateModifiedSchedule('shifts', newShifts);
  };

  const removeShift = (index: number) => {
    const currentSchedule = formData.modifiedSchedule || { isWorking: true, shifts: [], breaks: [] };
    const newShifts = currentSchedule.shifts.filter((_, i) => i !== index);
    updateModifiedSchedule('shifts', newShifts);
  };

  const getExceptionTypeLabel = (type: string) => {
    switch (type) {
      case 'unavailable': return 'Unavailable';
      case 'modified_hours': return 'Modified Hours';
      case 'holiday': return 'Holiday';
      default: return type;
    }
  };

  const getExceptionTypeColor = (type: string) => {
    switch (type) {
      case 'unavailable': return 'bg-red-100 text-red-800';
      case 'modified_hours': return 'bg-orange-100 text-orange-800';
      case 'holiday': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Sort exceptions by date
  const sortedExceptions = [...exceptions].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Schedule Exceptions</h2>
            <p className="text-gray-600 mt-1">Manage holidays, time off, and special hours</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Exception</span>
          </Button>
        </div>

        {/* Exception Form */}
        {showForm && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingException ? 'Edit Exception' : 'Add New Exception'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exception Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      type: e.target.value as 'unavailable' | 'modified_hours' | 'holiday',
                      modifiedSchedule: e.target.value === 'modified_hours' ? { 
                        isWorking: true, 
                        shifts: [{ startTime: '09:00', endTime: '17:00' }], 
                        breaks: [] 
                      } : undefined
                    }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="unavailable">Unavailable (Day Off)</option>
                    <option value="holiday">Holiday</option>
                    <option value="modified_hours">Modified Hours</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <Input
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g., Personal appointment, Conference, etc."
                />
              </div>

              {/* Modified Hours Configuration */}
              {formData.type === 'modified_hours' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">Modified Working Hours</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addShift}
                      className="flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Shift</span>
                    </Button>
                  </div>

                  {formData.modifiedSchedule?.shifts.map((shift, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <select
                        value={shift.startTime}
                        onChange={(e) => updateShift(index, 'startTime', e.target.value)}
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
                        onChange={(e) => updateShift(index, 'endTime', e.target.value)}
                        className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        {timeOptions.map(time => (
                          <option key={time} value={time}>
                            {ScheduleService.formatTime(time)}
                          </option>
                        ))}
                      </select>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeShift(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {(!formData.modifiedSchedule?.shifts || formData.modifiedSchedule.shifts.length === 0) && (
                    <p className="text-sm text-gray-500 italic">No shifts configured. Add at least one shift.</p>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingException ? 'Update Exception' : 'Create Exception'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </Card>

      {/* Exceptions List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Exceptions</h3>
        
        {sortedExceptions.length > 0 ? (
          <div className="space-y-3">
            {sortedExceptions.map((exception) => (
              <div
                key={exception.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(exception.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getExceptionTypeColor(exception.type)}`}>
                      {getExceptionTypeLabel(exception.type)}
                    </span>
                  </div>
                  
                  {exception.reason && (
                    <div className="text-sm text-gray-600 mt-1">{exception.reason}</div>
                  )}
                  
                  {exception.type === 'modified_hours' && exception.modifiedSchedule && (
                    <div className="text-sm text-gray-600 mt-1">
                      Modified hours: {exception.modifiedSchedule.shifts.map(shift => 
                        `${ScheduleService.formatTime(shift.startTime)} - ${ScheduleService.formatTime(shift.endTime)}`
                      ).join(', ')}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(exception)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(exception.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No schedule exceptions found</p>
            <p className="text-sm mt-1">Create exceptions for holidays, time off, or special hours</p>
          </div>
        )}
      </Card>
    </div>
  );
}
