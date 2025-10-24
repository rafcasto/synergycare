import { Timestamp, doc, collection, addDoc, updateDoc, query, where, getDocs, orderBy, getDoc } from 'firebase/firestore';
import { db } from './config';
import { FirestoreService, AvailabilitySlot, DoctorPublicProfile } from './firestore';

export interface AppointmentBooking {
  id?: string;
  patientId: string;
  doctorId: string;
  slotId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number; // minutes
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  appointmentType?: 'consultation' | 'follow-up' | 'emergency' | 'routine';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DoctorAvailability {
  doctorId: string;
  doctorName: string;
  specialization: string;
  availableSlots: AvailabilitySlot[];
  consultationFee?: number;
}

const APPOINTMENTS_COLLECTION = 'appointments';

export class BookingService {
  
  // Find available doctors by specialization
  static async findAvailableDoctors(
    specialization?: string,
    fromDate?: string,
    toDate?: string,
    limit?: number
  ): Promise<DoctorAvailability[]> {
    try {
      // Get doctors by specialization
      let doctors: DoctorPublicProfile[];
      if (specialization) {
        doctors = await FirestoreService.getDoctorsBySpecialization(specialization);
      } else {
        doctors = await FirestoreService.getAllDoctors(limit || 20);
      }

      // Get availability for each doctor
      const doctorAvailabilities: DoctorAvailability[] = [];
      
      for (const doctor of doctors) {
        const availableSlots = await this.getAvailableSlots(
          doctor.uid,
          fromDate,
          toDate
        );

        if (availableSlots.length > 0) {
          doctorAvailabilities.push({
            doctorId: doctor.uid,
            doctorName: doctor.displayName,
            specialization: doctor.specialization,
            consultationFee: doctor.consultationFee,
            availableSlots
          });
        }
      }

      return doctorAvailabilities;
    } catch (error) {
      console.error('Error finding available doctors:', error);
      throw error;
    }
  }

  // Get available slots for a specific doctor
  static async getAvailableSlots(
    doctorId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<AvailabilitySlot[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const searchFromDate = fromDate || today;
      const searchToDate = toDate || this.addDaysToDate(today, 30);

      const allSlots = await FirestoreService.getAvailabilitySlots(
        doctorId,
        searchFromDate,
        searchToDate
      );

      // Filter to only available slots, handling undefined status
      return allSlots.filter(slot => {
        const status = slot.status || (slot.isBooked ? 'booked' : 'available');
        return status === 'available';
      });
    } catch (error) {
      console.error('Error getting available slots:', error);
      throw error;
    }
  }

  // Book an appointment
  static async bookAppointment(
    patientId: string,
    doctorId: string,
    slotId: string,
    appointmentDetails: {
      notes?: string;
      appointmentType?: AppointmentBooking['appointmentType'];
    } = {}
  ): Promise<string> {
    try {
      // First, verify the slot is still available
      const slot = await FirestoreService.getAvailabilitySlot(slotId);
      const slotStatus = slot?.status || (slot?.isBooked ? 'booked' : 'available');
      if (!slot || slotStatus !== 'available') {
        throw new Error('Appointment slot is no longer available');
      }

      // Create appointment record
      const appointmentData: Omit<AppointmentBooking, 'id'> = {
        patientId,
        doctorId,
        slotId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: slot.duration,
        status: 'scheduled',
        appointmentType: appointmentDetails.appointmentType || 'consultation',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        // Include notes if provided and not empty
        ...(appointmentDetails.notes !== undefined && appointmentDetails.notes !== '' ? { notes: appointmentDetails.notes } : {})
      };

      const appointmentRef = await addDoc(
        collection(db, APPOINTMENTS_COLLECTION),
        appointmentData
      );

      // Update the availability slot to mark as booked
      await FirestoreService.updateAvailabilitySlot(slotId, {
        status: 'booked',
        isBooked: true,
        appointmentId: appointmentRef.id
      });

      return appointmentRef.id;
    } catch (error) {
      console.error('Error booking appointment:', error);
      throw error;
    }
  }

  // Cancel an appointment
  static async cancelAppointment(
    appointmentId: string,
    userId: string,
    userRole: 'patient' | 'doctor'
  ): Promise<void> {
    try {
      // Get appointment details
      const appointmentDoc = await getDoc(doc(db, APPOINTMENTS_COLLECTION, appointmentId));
      if (!appointmentDoc.exists()) {
        throw new Error('Appointment not found');
      }

      const appointment = appointmentDoc.data() as AppointmentBooking;

      // Verify user has permission to cancel
      if (userRole === 'patient' && appointment.patientId !== userId) {
        throw new Error('Not authorized to cancel this appointment');
      }
      if (userRole === 'doctor' && appointment.doctorId !== userId) {
        throw new Error('Not authorized to cancel this appointment');
      }

      // Update appointment status
      await updateDoc(doc(db, APPOINTMENTS_COLLECTION, appointmentId), {
        status: 'cancelled',
        updatedAt: Timestamp.now()
      });

      // Free up the availability slot
      if (appointment.slotId) {
        await FirestoreService.updateAvailabilitySlot(appointment.slotId, {
          status: 'available',
          isBooked: false,
          appointmentId: undefined
        });
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  // Get patient's appointments
  static async getPatientAppointments(
    patientId: string,
    status?: AppointmentBooking['status']
  ): Promise<AppointmentBooking[]> {
    try {
      let q = query(
        collection(db, APPOINTMENTS_COLLECTION),
        where('patientId', '==', patientId),
        orderBy('date', 'desc'),
        orderBy('startTime', 'desc')
      );

      if (status) {
        q = query(
          collection(db, APPOINTMENTS_COLLECTION),
          where('patientId', '==', patientId),
          where('status', '==', status),
          orderBy('date', 'desc'),
          orderBy('startTime', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AppointmentBooking));
    } catch (error) {
      console.error('Error getting patient appointments:', error);
      throw error;
    }
  }

  // Get doctor's appointments
  static async getDoctorAppointments(
    doctorId: string,
    status?: AppointmentBooking['status']
  ): Promise<AppointmentBooking[]> {
    try {
      let q = query(
        collection(db, APPOINTMENTS_COLLECTION),
        where('doctorId', '==', doctorId),
        orderBy('date', 'desc'),
        orderBy('startTime', 'desc')
      );

      if (status) {
        q = query(
          collection(db, APPOINTMENTS_COLLECTION),
          where('doctorId', '==', doctorId),
          where('status', '==', status),
          orderBy('date', 'desc'),
          orderBy('startTime', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AppointmentBooking));
    } catch (error) {
      console.error('Error getting doctor appointments:', error);
      throw error;
    }
  }

  // Get appointment details
  static async getAppointment(appointmentId: string): Promise<AppointmentBooking | null> {
    try {
      const appointmentDoc = await getDoc(doc(db, APPOINTMENTS_COLLECTION, appointmentId));
      if (!appointmentDoc.exists()) {
        return null;
      }

      return {
        id: appointmentDoc.id,
        ...appointmentDoc.data()
      } as AppointmentBooking;
    } catch (error) {
      console.error('Error getting appointment:', error);
      throw error;
    }
  }

  // Reschedule appointment
  static async rescheduleAppointment(
    appointmentId: string,
    newSlotId: string,
    userId: string,
    userRole: 'patient' | 'doctor'
  ): Promise<void> {
    try {
      // Get current appointment
      const appointment = await this.getAppointment(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Verify permission
      if (userRole === 'patient' && appointment.patientId !== userId) {
        throw new Error('Not authorized to reschedule this appointment');
      }
      if (userRole === 'doctor' && appointment.doctorId !== userId) {
        throw new Error('Not authorized to reschedule this appointment');
      }

      // Verify new slot is available
      const newSlot = await FirestoreService.getAvailabilitySlot(newSlotId);
      const newSlotStatus = newSlot?.status || (newSlot?.isBooked ? 'booked' : 'available');
      if (!newSlot || newSlotStatus !== 'available') {
        throw new Error('New appointment slot is not available');
      }

      // Free up old slot
      if (appointment.slotId) {
        await FirestoreService.updateAvailabilitySlot(appointment.slotId, {
          status: 'available',
          isBooked: false,
          appointmentId: undefined
        });
      }

      // Book new slot
      await FirestoreService.updateAvailabilitySlot(newSlotId, {
        status: 'booked',
        isBooked: true,
        appointmentId: appointmentId
      });

      // Update appointment
      await updateDoc(doc(db, APPOINTMENTS_COLLECTION, appointmentId), {
        slotId: newSlotId,
        date: newSlot.date,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        duration: newSlot.duration,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      throw error;
    }
  }

  // Utility methods
  private static addDaysToDate(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  // Search appointments by date range
  static async getAppointmentsByDateRange(
    userId: string,
    userRole: 'patient' | 'doctor',
    fromDate: string,
    toDate: string
  ): Promise<AppointmentBooking[]> {
    try {
      const field = userRole === 'patient' ? 'patientId' : 'doctorId';
      
      const q = query(
        collection(db, APPOINTMENTS_COLLECTION),
        where(field, '==', userId),
        where('date', '>=', fromDate),
        where('date', '<=', toDate),
        orderBy('date', 'asc'),
        orderBy('startTime', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AppointmentBooking));
    } catch (error) {
      console.error('Error getting appointments by date range:', error);
      throw error;
    }
  }
}
