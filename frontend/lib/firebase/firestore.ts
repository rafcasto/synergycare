import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

// Types for Firestore documents
export interface BaseUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'doctor' | 'patient' | 'admin';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  photoURL?: string;
  phoneNumber?: string;
  address?: string;
}

export interface DoctorProfile extends BaseUser {
  role: 'doctor';
  firstName: string;
  lastName: string;
  medicalLicense: string;
  specialization: string;
  hospitalAffiliation?: string;
  experienceYears?: number;
  bio?: string;
  consultationFee?: number;
  availability?: {
    [day: string]: {
      start: string;
      end: string;
      isAvailable: boolean;
    };
  };
}

// New interfaces for schedule management
export interface DoctorSchedule {
  id: string;
  doctorId: string;
  name: string; // e.g., "Regular Hours", "Weekend Clinic"
  isDefault: boolean;
  timezone: string;
  weeklySchedule: {
    [key in DayOfWeek]: DaySchedule;
  };
  effectiveFrom: Timestamp;
  effectiveTo?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DaySchedule {
  isWorking: boolean;
  shifts: TimeSlot[];
  breaks: TimeSlot[];
}

export interface TimeSlot {
  startTime: string; // Format: "HH:mm" (24-hour)
  endTime: string;   // Format: "HH:mm" (24-hour)
  id?: string;
}

export interface ScheduleException {
  id: string;
  doctorId: string;
  date: string; // Format: "YYYY-MM-DD"
  type: 'unavailable' | 'modified_hours' | 'holiday';
  reason?: string;
  modifiedSchedule?: DaySchedule; // Only for 'modified_hours' type
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AvailabilitySlot {
  id: string;
  doctorId: string;
  date: string; // Format: "YYYY-MM-DD"
  startTime: string; // Format: "HH:mm"
  endTime: string;   // Format: "HH:mm"
  duration: number; // in minutes
  isBooked: boolean;
  appointmentId?: string;
  status: 'available' | 'booked' | 'blocked';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface DoctorPublicProfile {
  uid: string;
  displayName: string;
  specialization: string;
  hospitalAffiliation?: string;
  experienceYears?: number;
  bio?: string;
  consultationFee?: number;
  rating?: number;
  reviewCount?: number;
  availability?: {
    [day: string]: {
      start: string;
      end: string;
      isAvailable: boolean;
    };
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PatientProfile extends BaseUser {
  role: 'patient';
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  emergencyContact: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  medicalHistory?: string[];
  allergies?: string[];
}

// Collections
const USERS_COLLECTION = 'users';
const DOCTORS_COLLECTION = 'doctors';
const PATIENTS_COLLECTION = 'patients';
const DOCTOR_PUBLIC_COLLECTION = 'doctor_public'; // New: Public doctor directory
const DOCTOR_SCHEDULES_COLLECTION = 'doctor_schedules';
const SCHEDULE_EXCEPTIONS_COLLECTION = 'schedule_exceptions';
const AVAILABILITY_SLOTS_COLLECTION = 'availability_slots';

export class FirestoreService {
  // Generic user operations
  static async createUser(userData: Partial<BaseUser>): Promise<void> {
    if (!userData.uid) throw new Error('UID is required');
    
    // Filter out undefined values
    const cleanUserData = Object.fromEntries(
      Object.entries(userData).filter(([, value]) => value !== undefined)
    );
    
    const userDoc = {
      ...cleanUserData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    await setDoc(doc(db, USERS_COLLECTION, userData.uid), userDoc);
  }

  static async getUser(uid: string): Promise<BaseUser | null> {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
    return userDoc.exists() ? userDoc.data() as BaseUser : null;
  }

  static async updateUser(uid: string, updates: Partial<BaseUser>): Promise<void> {
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    
    await updateDoc(doc(db, USERS_COLLECTION, uid), updateData);
  }

  static async deleteUser(uid: string): Promise<void> {
    await deleteDoc(doc(db, USERS_COLLECTION, uid));
  }

  // Doctor operations
  static async createDoctorProfile(doctorData: Omit<DoctorProfile, 'createdAt' | 'updatedAt'>): Promise<void> {
    // Filter out undefined values
    const cleanDoctorData = Object.fromEntries(
      Object.entries(doctorData).filter(([, value]) => value !== undefined)
    );
    
    const doctorDoc = {
      ...cleanDoctorData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    // Create public profile (safe for discovery)
    const publicProfile: Omit<DoctorPublicProfile, 'createdAt' | 'updatedAt'> = {
      uid: doctorData.uid,
      displayName: doctorData.displayName,
      specialization: doctorData.specialization,
      hospitalAffiliation: doctorData.hospitalAffiliation,
      experienceYears: doctorData.experienceYears,
      bio: doctorData.bio,
      consultationFee: doctorData.consultationFee,
      availability: doctorData.availability,
      rating: 0,
      reviewCount: 0,
    };
    
    const publicDoc = {
      ...Object.fromEntries(Object.entries(publicProfile).filter(([, value]) => value !== undefined)),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    // Store in users (personal), doctors (private), and doctor_public (discoverable) collections
    await Promise.all([
      setDoc(doc(db, USERS_COLLECTION, doctorData.uid), doctorDoc),
      setDoc(doc(db, DOCTORS_COLLECTION, doctorData.uid), doctorDoc),
      setDoc(doc(db, DOCTOR_PUBLIC_COLLECTION, doctorData.uid), publicDoc)
    ]);
  }

  static async getDoctorProfile(uid: string): Promise<DoctorProfile | null> {
    const doctorDoc = await getDoc(doc(db, DOCTORS_COLLECTION, uid));
    return doctorDoc.exists() ? doctorDoc.data() as DoctorProfile : null;
  }

  static async updateDoctorProfile(uid: string, updates: Partial<DoctorProfile>): Promise<void> {
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    
    // Update both collections
    await Promise.all([
      updateDoc(doc(db, USERS_COLLECTION, uid), updateData),
      updateDoc(doc(db, DOCTORS_COLLECTION, uid), updateData)
    ]);
  }

  static async getAllDoctors(limitCount = 50): Promise<DoctorPublicProfile[]> {
    const q = query(
      collection(db, DOCTOR_PUBLIC_COLLECTION), // Use public collection
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as DoctorPublicProfile);
  }

  static async getDoctorsBySpecialization(specialization: string): Promise<DoctorPublicProfile[]> {
    const q = query(
      collection(db, DOCTOR_PUBLIC_COLLECTION), // Use public collection
      where('specialization', '==', specialization),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as DoctorPublicProfile);
  }

  // Patient operations
  static async createPatientProfile(patientData: Omit<PatientProfile, 'createdAt' | 'updatedAt'>): Promise<void> {
    // Filter out undefined values
    const cleanPatientData = Object.fromEntries(
      Object.entries(patientData).filter(([, value]) => value !== undefined)
    );
    
    const patientDoc = {
      ...cleanPatientData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    // Store in both users and patients collections
    await Promise.all([
      setDoc(doc(db, USERS_COLLECTION, patientData.uid), patientDoc),
      setDoc(doc(db, PATIENTS_COLLECTION, patientData.uid), patientDoc)
    ]);
  }

  static async getPatientProfile(uid: string): Promise<PatientProfile | null> {
    const patientDoc = await getDoc(doc(db, PATIENTS_COLLECTION, uid));
    return patientDoc.exists() ? patientDoc.data() as PatientProfile : null;
  }

  static async updatePatientProfile(uid: string, updates: Partial<PatientProfile>): Promise<void> {
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    
    // Update both collections
    await Promise.all([
      updateDoc(doc(db, USERS_COLLECTION, uid), updateData),
      updateDoc(doc(db, PATIENTS_COLLECTION, uid), updateData)
    ]);
  }

  static async getAllPatients(limitCount = 50): Promise<PatientProfile[]> {
    const q = query(
      collection(db, PATIENTS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as PatientProfile);
  }

  // Search operations
  static async searchDoctorsByName(searchTerm: string): Promise<DoctorPublicProfile[]> {
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation that searches by displayName
    // For better search, consider using Algolia or similar service
    
    const q = query(
      collection(db, DOCTOR_PUBLIC_COLLECTION), // Use public collection
      where('displayName', '>=', searchTerm),
      where('displayName', '<=', searchTerm + '\uf8ff'),
      limit(20)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as DoctorPublicProfile);
  }

  // Utility functions
  static async getUsersByRole(role: 'doctor' | 'patient' | 'admin'): Promise<BaseUser[]> {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('role', '==', role),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as BaseUser);
  }

  static async checkEmailExists(email: string): Promise<boolean> {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('email', '==', email),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }

  // Batch operations for admin
  static async deleteDoctorProfile(uid: string): Promise<void> {
    await Promise.all([
      deleteDoc(doc(db, USERS_COLLECTION, uid)),
      deleteDoc(doc(db, DOCTORS_COLLECTION, uid)),
      deleteDoc(doc(db, DOCTOR_PUBLIC_COLLECTION, uid))
    ]);
  }

  static async deletePatientProfile(uid: string): Promise<void> {
    await Promise.all([
      deleteDoc(doc(db, USERS_COLLECTION, uid)),
      deleteDoc(doc(db, PATIENTS_COLLECTION, uid))
    ]);
  }

  // ===============================
  // SCHEDULE MANAGEMENT METHODS
  // ===============================

  // Doctor Schedule Operations
  static async createDoctorSchedule(scheduleData: Omit<DoctorSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    console.log('🔧 Creating doctor schedule:', scheduleData);
    
    try {
      const scheduleRef = doc(collection(db, DOCTOR_SCHEDULES_COLLECTION));
      const scheduleDoc: DoctorSchedule = {
        ...scheduleData,
        id: scheduleRef.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      console.log('💾 Writing schedule document to Firestore...');
      await setDoc(scheduleRef, scheduleDoc);
      console.log('✅ Schedule created successfully with ID:', scheduleRef.id);
      return scheduleRef.id;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string }).code;
      
      console.error('❌ Failed to create doctor schedule:', {
        message: errorMessage,
        code: errorCode,
        doctorId: scheduleData.doctorId,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Enhanced error logging for schedule creation
      console.error('=== DOCTOR SCHEDULE CREATION ERROR ===');
      console.error('Function: createDoctorSchedule');
      console.error('Doctor ID:', scheduleData.doctorId);
      console.error('Schedule Name:', scheduleData.name);
      console.error('Timestamp:', new Date().toISOString());
      
      if (error instanceof Error) {
        console.error('Error Details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        
        const firebaseError = error as Error & { 
          code?: string; 
          details?: unknown; 
        };
        if (firebaseError.code) {
          console.error('Firebase Error Code:', firebaseError.code);
        }
        if (firebaseError.details) {
          console.error('Firebase Error Details:', firebaseError.details);
        }
        
        // Check for specific error patterns
        const lowerMessage = error.message.toLowerCase();
        if (lowerMessage.includes('index')) {
          console.error('INDEX ERROR: Missing Firestore composite indexes detected');
          console.error('Check Firebase Console > Firestore > Indexes for index creation status');
        }
        if (lowerMessage.includes('permission')) {
          console.error('PERMISSION ERROR: Check Firestore security rules for schedules collection');
        }
      }
      
      console.error('=== END SCHEDULE CREATION ERROR ===');
      
      if (errorCode === 'permission-denied') {
        throw new Error(`Permission denied: Unable to create schedule. Please check that your account has doctor permissions. Error: ${errorMessage}`);
      }
      
      throw error;
    }
  }

  static async getDoctorSchedules(doctorId: string): Promise<DoctorSchedule[]> {
    const q = query(
      collection(db, DOCTOR_SCHEDULES_COLLECTION),
      where('doctorId', '==', doctorId),
      orderBy('effectiveFrom', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as DoctorSchedule);
  }

  static async getDoctorDefaultSchedule(doctorId: string): Promise<DoctorSchedule | null> {
    const q = query(
      collection(db, DOCTOR_SCHEDULES_COLLECTION),
      where('doctorId', '==', doctorId),
      where('isDefault', '==', true),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty ? null : querySnapshot.docs[0].data() as DoctorSchedule;
  }

  static async updateDoctorSchedule(scheduleId: string, updates: Partial<DoctorSchedule>): Promise<void> {
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    
    await updateDoc(doc(db, DOCTOR_SCHEDULES_COLLECTION, scheduleId), updateData);
  }

  static async deleteDoctorSchedule(scheduleId: string): Promise<void> {
    await deleteDoc(doc(db, DOCTOR_SCHEDULES_COLLECTION, scheduleId));
  }

  static async setDefaultSchedule(doctorId: string, scheduleId: string): Promise<void> {
    // First, remove default flag from all doctor's schedules
    const existingSchedules = await this.getDoctorSchedules(doctorId);
    const updatePromises = existingSchedules.map(schedule => 
      this.updateDoctorSchedule(schedule.id, { isDefault: false })
    );
    
    // Then set the new default
    updatePromises.push(
      this.updateDoctorSchedule(scheduleId, { isDefault: true })
    );
    
    await Promise.all(updatePromises);
  }

  // Schedule Exception Operations
  static async createScheduleException(exceptionData: Omit<ScheduleException, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const exceptionRef = doc(collection(db, SCHEDULE_EXCEPTIONS_COLLECTION));
    
    // Filter out undefined values to prevent Firestore errors
    const cleanExceptionData = Object.fromEntries(
      Object.entries(exceptionData).filter(([, value]) => value !== undefined)
    );
    
    const exceptionDoc: ScheduleException = {
      ...cleanExceptionData,
      id: exceptionRef.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as ScheduleException;
    
    await setDoc(exceptionRef, exceptionDoc);
    return exceptionRef.id;
  }

  static async getScheduleExceptions(doctorId: string, fromDate?: string, toDate?: string): Promise<ScheduleException[]> {
    let q = query(
      collection(db, SCHEDULE_EXCEPTIONS_COLLECTION),
      where('doctorId', '==', doctorId)
    );
    
    if (fromDate) {
      q = query(q, where('date', '>=', fromDate));
    }
    
    if (toDate) {
      q = query(q, where('date', '<=', toDate));
    }
    
    q = query(q, orderBy('date', 'asc'));
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as ScheduleException);
  }

  static async updateScheduleException(exceptionId: string, updates: Partial<ScheduleException>): Promise<void> {
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    
    await updateDoc(doc(db, SCHEDULE_EXCEPTIONS_COLLECTION, exceptionId), updateData);
  }

  static async deleteScheduleException(exceptionId: string): Promise<void> {
    await deleteDoc(doc(db, SCHEDULE_EXCEPTIONS_COLLECTION, exceptionId));
  }

  // Availability Slot Operations
  static async createAvailabilitySlot(slotData: Omit<AvailabilitySlot, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const slotRef = doc(collection(db, AVAILABILITY_SLOTS_COLLECTION));
      const slotDoc: AvailabilitySlot = {
        ...slotData,
        id: slotRef.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      await setDoc(slotRef, slotDoc);
      return slotRef.id;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string }).code;
      
      console.error('❌ Failed to create availability slot:', {
        message: errorMessage,
        code: errorCode,
        slotData,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Enhanced error logging for availability slot creation
      console.error('=== AVAILABILITY SLOT CREATION ERROR ===');
      console.error('Function: createAvailabilitySlot');
      console.error('Doctor ID:', slotData.doctorId);
      console.error('Date:', slotData.date);
      console.error('Time Slot:', slotData.startTime, '-', slotData.endTime);
      console.error('Timestamp:', new Date().toISOString());
      
      if (error instanceof Error) {
        console.error('Error Details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        
        const firebaseError = error as Error & { 
          code?: string; 
          details?: unknown; 
        };
        if (firebaseError.code) {
          console.error('Firebase Error Code:', firebaseError.code);
        }
        if (firebaseError.details) {
          console.error('Firebase Error Details:', firebaseError.details);
        }
        
        // Check for specific error patterns
        const lowerMessage = error.message.toLowerCase();
        if (lowerMessage.includes('index')) {
          console.error('INDEX ERROR: Missing Firestore composite indexes for availability_slots collection');
          console.error('Indexes needed for queries on: doctorId, date, startTime combinations');
        }
        if (lowerMessage.includes('permission')) {
          console.error('PERMISSION ERROR: Check Firestore security rules for availability_slots collection');
        }
        if (lowerMessage.includes('quota') || lowerMessage.includes('limit')) {
          console.error('QUOTA ERROR: Firestore write limits exceeded');
        }
      }
      
      console.error('=== END SLOT CREATION ERROR ===');
      
      if (errorCode === 'permission-denied') {
        throw new Error(`Permission denied: Unable to create availability slot. Please check that your account has doctor permissions. Error: ${errorMessage}`);
      }
      
      throw error;
    }
  }

  // Helper function to retry queries that might fail due to index building
  private static async retryQuery<T>(
    queryFn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await queryFn();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorCode = (error as { code?: string }).code;
        
        console.error(`🔄 Query attempt ${attempt + 1} failed:`, {
          message: errorMessage,
          code: errorCode,
          stack: error instanceof Error ? error.stack : undefined
        });
        
        const isIndexError = errorMessage.includes('index') || 
                            errorMessage.includes('Index') ||
                            errorCode === 'failed-precondition';
        
        const isPermissionError = errorCode === 'permission-denied' ||
                                 errorMessage.includes('permission');
        
        if (isPermissionError) {
          console.error('❌ Permission denied - this might be a Firestore rules issue');
          throw error; // Don't retry permission errors
        }
        
        if (isIndexError && attempt < maxRetries - 1) {
          console.log(`🔄 Index error detected, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          delayMs *= 2; // Exponential backoff
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }

  static async getAvailabilitySlots(doctorId: string, fromDate: string, toDate: string): Promise<AvailabilitySlot[]> {
    return this.retryQuery(async () => {
      const q = query(
        collection(db, AVAILABILITY_SLOTS_COLLECTION),
        where('doctorId', '==', doctorId),
        where('date', '>=', fromDate),
        where('date', '<=', toDate),
        orderBy('date', 'asc'),
        orderBy('startTime', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AvailabilitySlot));
    });
  }

  static async getAvailabilitySlot(slotId: string): Promise<AvailabilitySlot | null> {
    const slotDoc = await getDoc(doc(db, AVAILABILITY_SLOTS_COLLECTION, slotId));
    if (!slotDoc.exists()) {
      return null;
    }
    
    return {
      id: slotDoc.id,
      ...slotDoc.data()
    } as AvailabilitySlot;
  }

  static async updateAvailabilitySlot(slotId: string, updates: Partial<AvailabilitySlot>): Promise<void> {
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    
    await updateDoc(doc(db, AVAILABILITY_SLOTS_COLLECTION, slotId), updateData);
  }

  static async deleteAvailabilitySlot(slotId: string): Promise<void> {
    await deleteDoc(doc(db, AVAILABILITY_SLOTS_COLLECTION, slotId));
  }

  static async getAvailableSlotsForDate(doctorId: string, date: string): Promise<AvailabilitySlot[]> {
    return this.retryQuery(async () => {
      const q = query(
        collection(db, AVAILABILITY_SLOTS_COLLECTION),
        where('doctorId', '==', doctorId),
        where('date', '==', date),
        where('status', '==', 'available'),
        orderBy('startTime', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as AvailabilitySlot);
    });
  }

  static async generateAvailabilitySlots(
    doctorId: string, 
    fromDate: string, 
    toDate: string, 
    slotDuration: number = 30
  ): Promise<void> {
    console.log(`🔧 generateAvailabilitySlots called: ${doctorId}, ${fromDate} to ${toDate}`);
    
    try {
      // First, check if slots already exist for this date range and clear them
      console.log('🔍 Step 1: Checking for existing slots...');
      try {
        const existingSlots = await this.getAvailabilitySlots(doctorId, fromDate, toDate);
        if (existingSlots.length > 0) {
          console.log(`🗑️ Found ${existingSlots.length} existing slots, clearing them...`);
          const deletePromises = existingSlots.map(slot => this.deleteAvailabilitySlot(slot.id));
          await Promise.all(deletePromises);
          console.log('✅ Existing slots cleared');
        } else {
          console.log('✅ No existing slots found');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isIndexError = errorMessage.includes('index') || errorMessage.includes('Index');
        if (isIndexError) {
          console.warn('⚠️ Index error during existing slots cleanup - continuing with generation:', errorMessage);
        } else {
          console.error('❌ Error during slot cleanup:', errorMessage);
          throw error;
        }
      }
      
      // Get doctor's default schedule
      console.log('🔍 Step 2: Getting doctor default schedule...');
      const defaultSchedule = await this.getDoctorDefaultSchedule(doctorId);
      if (!defaultSchedule) {
        throw new Error('No default schedule found for doctor');
      }
      console.log('✅ Default schedule found:', defaultSchedule.name);

      // Get schedule exceptions for the date range
      console.log('🔍 Step 3: Getting schedule exceptions...');
      const exceptions = await this.getScheduleExceptions(doctorId, fromDate, toDate);
      const exceptionMap = new Map(exceptions.map(ex => [ex.date, ex]));
      console.log(`✅ Found ${exceptions.length} exceptions`);

      // Helper function to generate time slots
      const generateTimeSlots = (daySchedule: DaySchedule, date: string): AvailabilitySlot[] => {
        const slots: AvailabilitySlot[] = [];
        
        daySchedule.shifts.forEach(shift => {
          let currentTime = this.timeStringToMinutes(shift.startTime);
          const endTime = this.timeStringToMinutes(shift.endTime);
          
          while (currentTime + slotDuration <= endTime) {
            const currentTimeStr = this.minutesToTimeString(currentTime);
            const slotEndTimeStr = this.minutesToTimeString(currentTime + slotDuration);
            
            const isInBreak = daySchedule.breaks.some(breakSlot => {
              const breakStart = this.timeStringToMinutes(breakSlot.startTime);
              const breakEnd = this.timeStringToMinutes(breakSlot.endTime);
              return currentTime < breakEnd && (currentTime + slotDuration) > breakStart;
            });
            
            if (!isInBreak) {
              slots.push({
                id: '', // Will be set by createAvailabilitySlot
                doctorId,
                date,
                startTime: currentTimeStr,
                endTime: slotEndTimeStr,
                duration: slotDuration,
                isBooked: false,
                status: 'available',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
              });
            }
            
            currentTime += slotDuration;
          }
        });
        
        return slots;
      };

      // Generate slots for each date
      console.log('🔍 Step 4: Generating slots for date range...');
      const startDate = this.parseLocalDate(fromDate);
      const endDate = this.parseLocalDate(toDate);
      const promises: Promise<string>[] = [];
      
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const dayOfWeek = this.getDayOfWeek(date);
        
        const exception = exceptionMap.get(dateStr);
        let daySchedule: DaySchedule;
        
        if (exception) {
          if (exception.type === 'unavailable' || exception.type === 'holiday') {
            continue; // Skip this date
          } else if (exception.type === 'modified_hours' && exception.modifiedSchedule) {
            daySchedule = exception.modifiedSchedule;
          } else {
            daySchedule = defaultSchedule.weeklySchedule[dayOfWeek];
          }
        } else {
          daySchedule = defaultSchedule.weeklySchedule[dayOfWeek];
        }
        
        if (daySchedule.isWorking) {
          const slots = generateTimeSlots(daySchedule, dateStr);
          console.log(`� Generated ${slots.length} slots for ${dateStr} (${dayOfWeek})`);
          slots.forEach(slot => {
            promises.push(this.createAvailabilitySlot(slot));
          });
        }
      }
      
      console.log(`💾 Step 5: Creating ${promises.length} total slots in Firestore...`);
      if (promises.length === 0) {
        console.warn('⚠️ No slots to create - check your schedule configuration');
        return;
      }
      
      // Create slots in batches to avoid overwhelming Firestore
      const batchSize = 50;
      for (let i = 0; i < promises.length; i += batchSize) {
        const batch = promises.slice(i, i + batchSize);
        console.log(`💾 Creating batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(promises.length/batchSize)} (${batch.length} slots)...`);
        await Promise.all(batch);
      }
      
      console.log('✅ Slot generation completed successfully');
      
    } catch (error) {
      console.error('❌ generateAvailabilitySlots failed:', error);
      
      // Enhanced error logging for slot generation
      console.error('=== AVAILABILITY SLOT GENERATION ERROR ===');
      console.error('Function: generateAvailabilitySlots');
      console.error('Doctor ID:', doctorId);
      console.error('Date Range:', fromDate, 'to', toDate);
      console.error('Slot Duration:', slotDuration);
      console.error('Timestamp:', new Date().toISOString());
      
      if (error instanceof Error) {
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
        
        // Check for Firebase-specific error properties
        const firebaseError = error as Error & { 
          code?: string; 
          details?: unknown; 
          serverResponse?: unknown; 
        };
        if (firebaseError.code) {
          console.error('Firebase Error Code:', firebaseError.code);
        }
        if (firebaseError.details) {
          console.error('Firebase Error Details:', firebaseError.details);
        }
        if (firebaseError.serverResponse) {
          console.error('Firebase Server Response:', firebaseError.serverResponse);
        }
        
        // Check for specific error patterns
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('index')) {
          console.error('INDEX ERROR DETECTED: This is likely due to missing Firestore indexes.');
          console.error('Check the Firebase Console for index creation status.');
        }
        if (errorMessage.includes('permission')) {
          console.error('PERMISSION ERROR DETECTED: Check Firestore security rules.');
        }
        if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
          console.error('QUOTA ERROR DETECTED: Firestore limits may have been exceeded.');
        }
      } else {
        console.error('Non-Error object thrown:', JSON.stringify(error, null, 2));
      }
      
      console.error('=== END SLOT GENERATION ERROR ===');
      throw error;
    }
  }

  // Utility methods for time handling
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

  // Timezone-safe date parsing for YYYY-MM-DD strings
  private static parseLocalDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  }
}
