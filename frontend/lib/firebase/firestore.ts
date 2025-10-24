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
}
