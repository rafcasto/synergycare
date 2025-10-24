/**
 * Synthetic test data for doctor registration
 * This file contains realistic doctor profiles for testing registration flows
 */

export interface DoctorTestData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  medicalLicense: string;
  specialization: string;
  hospitalAffiliation?: string;
  phoneNumber: string;
  // Additional profile data that might be added later
  experienceYears?: number;
  bio?: string;
  consultationFee?: number;
}

// Medical specializations commonly used in healthcare
export const MEDICAL_SPECIALIZATIONS = [
  'Cardiology',
  'Dermatology',
  'Emergency Medicine',
  'Family Medicine',
  'General Practice',
  'Internal Medicine',
  'Neurology',
  'Obstetrics and Gynecology',
  'Oncology',
  'Orthopedic Surgery',
  'Pediatrics',
  'Psychiatry',
  'Radiology',
  'Surgery',
  'Urology',
  'Anesthesiology',
  'Pathology',
  'Ophthalmology',
  'Otolaryngology',
  'Gastroenterology',
  'Pulmonology',
  'Endocrinology',
  'Rheumatology',
  'Nephrology',
  'Infectious Disease'
];

// Hospital affiliations for variety
export const HOSPITAL_AFFILIATIONS = [
  'General Hospital',
  'Metropolitan Medical Center',
  'City Regional Hospital',
  'University Medical Center',
  'St. Mary\'s Hospital',
  'Community Health System',
  'Children\'s Hospital',
  'Heart & Vascular Institute',
  'Cancer Treatment Center',
  'Rehabilitation Medical Center',
  'Women\'s Health Center',
  'Emergency Care Network',
  'Specialty Surgical Center',
  'Family Health Clinic',
  'Private Practice Group'
];

// Comprehensive test data for doctor registration
export const DOCTOR_TEST_DATA: DoctorTestData[] = [
  // Cardiology
  {
    email: 'sarah.johnson@cardiology.com',
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!',
    firstName: 'Sarah',
    lastName: 'Johnson',
    medicalLicense: 'MD-CA-54321',
    specialization: 'Cardiology',
    hospitalAffiliation: 'Heart & Vascular Institute',
    phoneNumber: '+1-555-0101',
    experienceYears: 12,
    bio: 'Board-certified cardiologist specializing in interventional cardiology and heart disease prevention.',
    consultationFee: 250
  },
  
  // Emergency Medicine
  {
    email: 'michael.chen@emergency.hospital.com',
    password: 'EmergencyDoc2024',
    confirmPassword: 'EmergencyDoc2024',
    firstName: 'Michael',
    lastName: 'Chen',
    medicalLicense: 'MD-NY-98765',
    specialization: 'Emergency Medicine',
    hospitalAffiliation: 'Metropolitan Medical Center',
    phoneNumber: '+1-555-0102',
    experienceYears: 8,
    bio: 'Emergency medicine physician with expertise in trauma care and critical patient management.',
    consultationFee: 200
  },

  // Pediatrics
  {
    email: 'emily.rodriguez@pediatrics.com',
    password: 'KidsDoctor456',
    confirmPassword: 'KidsDoctor456',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    medicalLicense: 'MD-TX-11223',
    specialization: 'Pediatrics',
    hospitalAffiliation: 'Children\'s Hospital',
    phoneNumber: '+1-555-0103',
    experienceYears: 15,
    bio: 'Pediatrician dedicated to providing comprehensive care for children from infancy through adolescence.',
    consultationFee: 180
  },

  // Family Medicine
  {
    email: 'david.thompson@familymed.com',
    password: 'FamilyDoc789',
    confirmPassword: 'FamilyDoc789',
    firstName: 'David',
    lastName: 'Thompson',
    medicalLicense: 'MD-FL-44556',
    specialization: 'Family Medicine',
    hospitalAffiliation: 'Family Health Clinic',
    phoneNumber: '+1-555-0104',
    experienceYears: 20,
    bio: 'Family medicine physician providing primary care for patients of all ages with a focus on preventive care.',
    consultationFee: 150
  },

  // Dermatology
  {
    email: 'lisa.patel@dermatology.com',
    password: 'SkinExpert321',
    confirmPassword: 'SkinExpert321',
    firstName: 'Lisa',
    lastName: 'Patel',
    medicalLicense: 'MD-IL-77889',
    specialization: 'Dermatology',
    hospitalAffiliation: 'Specialty Surgical Center',
    phoneNumber: '+1-555-0105',
    experienceYears: 10,
    bio: 'Dermatologist specializing in medical and cosmetic dermatology, including skin cancer prevention.',
    consultationFee: 220
  },

  // Neurology
  {
    email: 'robert.kim@neurology.com',
    password: 'NeuroDoc654',
    confirmPassword: 'NeuroDoc654',
    firstName: 'Robert',
    lastName: 'Kim',
    medicalLicense: 'MD-WA-33445',
    specialization: 'Neurology',
    hospitalAffiliation: 'University Medical Center',
    phoneNumber: '+1-555-0106',
    experienceYears: 14,
    bio: 'Neurologist with expertise in stroke treatment, epilepsy management, and neurodegenerative diseases.',
    consultationFee: 280
  },

  // Obstetrics and Gynecology
  {
    email: 'maria.gonzalez@obgyn.com',
    password: 'WomensHealth987',
    confirmPassword: 'WomensHealth987',
    firstName: 'Maria',
    lastName: 'Gonzalez',
    medicalLicense: 'MD-AZ-66778',
    specialization: 'Obstetrics and Gynecology',
    hospitalAffiliation: 'Women\'s Health Center',
    phoneNumber: '+1-555-0107',
    experienceYears: 18,
    bio: 'OB/GYN specialist providing comprehensive women\'s healthcare from adolescence through menopause.',
    consultationFee: 200
  },

  // Orthopedic Surgery
  {
    email: 'james.williams@orthopedics.com',
    password: 'OrthoPedic123',
    confirmPassword: 'OrthoPedic123',
    firstName: 'James',
    lastName: 'Williams',
    medicalLicense: 'MD-CO-99001',
    specialization: 'Orthopedic Surgery',
    hospitalAffiliation: 'General Hospital',
    phoneNumber: '+1-555-0108',
    experienceYears: 16,
    bio: 'Orthopedic surgeon specializing in sports medicine, joint replacement, and trauma surgery.',
    consultationFee: 350
  },

  // Psychiatry
  {
    email: 'amanda.brown@mentalhealth.com',
    password: 'MentalHealth456',
    confirmPassword: 'MentalHealth456',
    firstName: 'Amanda',
    lastName: 'Brown',
    medicalLicense: 'MD-OR-22334',
    specialization: 'Psychiatry',
    hospitalAffiliation: 'Community Health System',
    phoneNumber: '+1-555-0109',
    experienceYears: 11,
    bio: 'Psychiatrist specializing in anxiety disorders, depression, and cognitive behavioral therapy.',
    consultationFee: 180
  },

  // General Practice - No hospital affiliation
  {
    email: 'john.davis@generalpractice.com',
    password: 'GeneralDoc789',
    confirmPassword: 'GeneralDoc789',
    firstName: 'John',
    lastName: 'Davis',
    medicalLicense: 'MD-NV-55667',
    specialization: 'General Practice',
    phoneNumber: '+1-555-0110',
    experienceYears: 25,
    bio: 'General practitioner with decades of experience in primary care and preventive medicine.',
    consultationFee: 120
  },

  // Oncology
  {
    email: 'jennifer.lee@oncology.com',
    password: 'CancerCare321',
    confirmPassword: 'CancerCare321',
    firstName: 'Jennifer',
    lastName: 'Lee',
    medicalLicense: 'MD-MA-88990',
    specialization: 'Oncology',
    hospitalAffiliation: 'Cancer Treatment Center',
    phoneNumber: '+1-555-0111',
    experienceYears: 13,
    bio: 'Medical oncologist specializing in breast cancer treatment and immunotherapy.',
    consultationFee: 300
  },

  // Internal Medicine
  {
    email: 'anthony.miller@internal.com',
    password: 'InternalMed654',
    confirmPassword: 'InternalMed654',
    firstName: 'Anthony',
    lastName: 'Miller',
    medicalLicense: 'MD-VA-11223',
    specialization: 'Internal Medicine',
    hospitalAffiliation: 'City Regional Hospital',
    phoneNumber: '+1-555-0112',
    experienceYears: 9,
    bio: 'Internist focused on adult medicine, chronic disease management, and preventive care.',
    consultationFee: 160
  },

  // Radiology
  {
    email: 'susan.taylor@radiology.com',
    password: 'RadiologY987',
    confirmPassword: 'RadiologY987',
    firstName: 'Susan',
    lastName: 'Taylor',
    medicalLicense: 'MD-NC-44556',
    specialization: 'Radiology',
    hospitalAffiliation: 'University Medical Center',
    phoneNumber: '+1-555-0113',
    experienceYears: 12,
    bio: 'Diagnostic radiologist with expertise in CT, MRI, and interventional radiology procedures.',
    consultationFee: 240
  },

  // Gastroenterology
  {
    email: 'kevin.anderson@gi.com',
    password: 'GastroDoc123',
    confirmPassword: 'GastroDoc123',
    firstName: 'Kevin',
    lastName: 'Anderson',
    medicalLicense: 'MD-GA-77889',
    specialization: 'Gastroenterology',
    hospitalAffiliation: 'General Hospital',
    phoneNumber: '+1-555-0114',
    experienceYears: 14,
    bio: 'Gastroenterologist specializing in digestive disorders, endoscopy, and inflammatory bowel disease.',
    consultationFee: 220
  },

  // Anesthesiology
  {
    email: 'rachel.white@anesthesia.com',
    password: 'AnesthesIA456',
    confirmPassword: 'AnesthesIA456',
    firstName: 'Rachel',
    lastName: 'White',
    medicalLicense: 'MD-SC-33445',
    specialization: 'Anesthesiology',
    hospitalAffiliation: 'Specialty Surgical Center',
    phoneNumber: '+1-555-0115',
    experienceYears: 10,
    bio: 'Anesthesiologist with expertise in perioperative care and pain management.',
    consultationFee: 200
  },

  // Newer doctor with minimal experience
  {
    email: 'alex.johnson@resident.com',
    password: 'NewDoctor2024',
    confirmPassword: 'NewDoctor2024',
    firstName: 'Alex',
    lastName: 'Johnson',
    medicalLicense: 'MD-CA-99001',
    specialization: 'Family Medicine',
    hospitalAffiliation: 'Community Health System',
    phoneNumber: '+1-555-0116',
    experienceYears: 2,
    bio: 'Recently graduated family medicine physician passionate about patient-centered primary care.',
    consultationFee: 100
  }
];

// Edge cases and validation test data
export const INVALID_DOCTOR_TEST_DATA = [
  // Invalid email
  {
    email: 'invalid-email',
    password: 'ValidPass123',
    confirmPassword: 'ValidPass123',
    firstName: 'Test',
    lastName: 'Doctor',
    medicalLicense: 'MD-12345',
    specialization: 'General Practice',
    phoneNumber: '+1-555-0199'
  },
  
  // Password too short
  {
    email: 'test@example.com',
    password: '123',
    confirmPassword: '123',
    firstName: 'Test',
    lastName: 'Doctor',
    medicalLicense: 'MD-12345',
    specialization: 'General Practice',
    phoneNumber: '+1-555-0199'
  },
  
  // Passwords don't match
  {
    email: 'test@example.com',
    password: 'ValidPass123',
    confirmPassword: 'DifferentPass456',
    firstName: 'Test',
    lastName: 'Doctor',
    medicalLicense: 'MD-12345',
    specialization: 'General Practice',
    phoneNumber: '+1-555-0199'
  },
  
  // Missing required fields
  {
    email: 'test@example.com',
    password: 'ValidPass123',
    confirmPassword: 'ValidPass123',
    firstName: '',
    lastName: '',
    medicalLicense: '',
    specialization: '',
    phoneNumber: ''
  }
];

// Quick access arrays for testing
export const VALID_DOCTORS = DOCTOR_TEST_DATA;
export const CARDIOLOGY_DOCTORS = DOCTOR_TEST_DATA.filter(d => d.specialization === 'Cardiology');
export const PEDIATRIC_DOCTORS = DOCTOR_TEST_DATA.filter(d => d.specialization === 'Pediatrics');
export const EMERGENCY_DOCTORS = DOCTOR_TEST_DATA.filter(d => d.specialization === 'Emergency Medicine');

// Helper functions for test data generation
export function getRandomDoctor(): DoctorTestData {
  return DOCTOR_TEST_DATA[Math.floor(Math.random() * DOCTOR_TEST_DATA.length)];
}

export function getDoctorsBySpecialization(specialization: string): DoctorTestData[] {
  return DOCTOR_TEST_DATA.filter(d => d.specialization === specialization);
}

export function getDoctorsWithHospitalAffiliation(): DoctorTestData[] {
  return DOCTOR_TEST_DATA.filter(d => d.hospitalAffiliation);
}

export function getDoctorsWithoutHospitalAffiliation(): DoctorTestData[] {
  return DOCTOR_TEST_DATA.filter(d => !d.hospitalAffiliation);
}

export function getExperiencedDoctors(minYears: number = 10): DoctorTestData[] {
  return DOCTOR_TEST_DATA.filter(d => d.experienceYears && d.experienceYears >= minYears);
}

export function getNewDoctors(maxYears: number = 5): DoctorTestData[] {
  return DOCTOR_TEST_DATA.filter(d => d.experienceYears && d.experienceYears <= maxYears);
}

// Utility function to generate unique test emails
export function generateUniqueTestEmail(baseName: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${baseName}.test.${timestamp}.${random}@synergycare-test.com`;
}

// Generate a realistic medical license number
export function generateMedicalLicense(state: string = 'CA'): string {
  const number = Math.floor(Math.random() * 99999) + 10000;
  return `MD-${state}-${number}`;
}

// Generate a realistic phone number
export function generatePhoneNumber(): string {
  const areaCode = Math.floor(Math.random() * 800) + 200;
  const exchange = Math.floor(Math.random() * 800) + 200;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `+1-${areaCode}-${exchange}-${number}`;
}

export default DOCTOR_TEST_DATA;
