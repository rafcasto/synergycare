import { format, parseISO, isToday, isBefore, isAfter } from 'date-fns';

interface AppointmentWithDateTime {
  date: string;
  startTime: string;
}

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy');
};

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const isAppointmentToday = (date: string): boolean => {
  return isToday(parseISO(date));
};

export const isAppointmentPast = (date: string, time: string): boolean => {
  const appointmentDateTime = new Date(`${date}T${time}`);
  return isBefore(appointmentDateTime, new Date());
};

export const isAppointmentFuture = (date: string, time: string): boolean => {
  const appointmentDateTime = new Date(`${date}T${time}`);
  return isAfter(appointmentDateTime, new Date());
};

export const sortAppointmentsByDateTime = (a: AppointmentWithDateTime, b: AppointmentWithDateTime): number => {
  const dateTimeA = new Date(`${a.date}T${a.startTime}`);
  const dateTimeB = new Date(`${b.date}T${b.startTime}`);
  return dateTimeA.getTime() - dateTimeB.getTime();
};

export const sortAppointmentsByDateTimeDesc = (a: AppointmentWithDateTime, b: AppointmentWithDateTime): number => {
  const dateTimeA = new Date(`${a.date}T${a.startTime}`);
  const dateTimeB = new Date(`${b.date}T${b.startTime}`);
  return dateTimeB.getTime() - dateTimeA.getTime();
};
