// Seed script to populate Firebase emulator with sample doctors
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth';

// Firebase config (for emulator)
const firebaseConfig = {
  projectId: "synergycare-1ccf9", // Replace with your project ID
  authDomain: "localhost:9099",
  databaseURL: "http://localhost:8081",
};

// Initialize Firebase for emulator
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Connect to emulators
connectAuthEmulator(auth, "http://localhost:9099");
connectFirestoreEmulator(db, "localhost", 8081);

// Sample doctors data
const sampleDoctors = [
  {
    displayName: "Dr. Sarah Johnson",
    email: "sarah.johnson@hospital.com",
    specialization: "Cardiology",
    experienceYears: 12,
    licenseNumber: "LIC001",
    bio: "Experienced cardiologist specializing in heart disease prevention and treatment.",
    hospitalAffiliation: "Central Medical Center",
    consultationFee: 200,
    rating: 4.8,
    reviewCount: 45,
    isAvailable: true,
    languages: ["English", "Spanish"],
    education: "Harvard Medical School",
  },
  {
    displayName: "Dr. Michael Chen",
    email: "michael.chen@hospital.com",
    specialization: "Dermatology",
    experienceYears: 8,
    licenseNumber: "LIC002",
    bio: "Dermatology specialist with expertise in skin cancer detection and cosmetic procedures.",
    hospitalAffiliation: "Skin Health Institute",
    consultationFee: 180,
    rating: 4.9,
    reviewCount: 67,
    isAvailable: true,
    languages: ["English", "Mandarin"],
    education: "Stanford Medical School",
  },
  {
    displayName: "Dr. Emily Rodriguez",
    email: "emily.rodriguez@hospital.com",
    specialization: "Pediatrics",
    experienceYears: 15,
    licenseNumber: "LIC003",
    bio: "Pediatrician dedicated to providing comprehensive care for children and adolescents.",
    hospitalAffiliation: "Children's Hospital",
    consultationFee: 150,
    rating: 4.7,
    reviewCount: 89,
    isAvailable: true,
    languages: ["English", "Spanish"],
    education: "UCLA Medical School",
  },
  {
    displayName: "Dr. James Wilson",
    email: "james.wilson@hospital.com",
    specialization: "Orthopedics",
    experienceYears: 20,
    licenseNumber: "LIC004",
    bio: "Orthopedic surgeon specializing in sports medicine and joint replacement.",
    hospitalAffiliation: "Sports Medicine Center",
    consultationFee: 250,
    rating: 4.6,
    reviewCount: 123,
    isAvailable: true,
    languages: ["English"],
    education: "Johns Hopkins Medical School",
  },
  {
    displayName: "Dr. Lisa Park",
    email: "lisa.park@hospital.com",
    specialization: "Neurology",
    experienceYears: 10,
    licenseNumber: "LIC005",
    bio: "Neurologist with expertise in treating migraines, epilepsy, and neurological disorders.",
    hospitalAffiliation: "Neuroscience Institute",
    consultationFee: 220,
    rating: 4.9,
    reviewCount: 34,
    isAvailable: true,
    languages: ["English", "Korean"],
    education: "Mayo Clinic Medical School",
  }
];

async function seedDoctors() {
  console.log('Starting to seed doctors...');
  
  try {
    for (const doctorData of sampleDoctors) {
      // Create auth user first
      console.log(`Creating auth user for ${doctorData.displayName}...`);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        doctorData.email,
        'password123'
      );
      
      const uid = userCredential.user.uid;
      
      // Create base user document
      await setDoc(doc(db, 'users', uid), {
        uid,
        email: doctorData.email,
        displayName: doctorData.displayName,
        role: 'doctor',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Create doctor profile
      await setDoc(doc(db, 'doctors', uid), {
        uid,
        displayName: doctorData.displayName,
        email: doctorData.email,
        specialization: doctorData.specialization,
        experienceYears: doctorData.experienceYears,
        licenseNumber: doctorData.licenseNumber,
        bio: doctorData.bio,
        hospitalAffiliation: doctorData.hospitalAffiliation,
        consultationFee: doctorData.consultationFee,
        rating: doctorData.rating,
        reviewCount: doctorData.reviewCount,
        isAvailable: doctorData.isAvailable,
        languages: doctorData.languages,
        education: doctorData.education,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Add some availability slots for each doctor
      const today = new Date();
      for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Morning slots (9:00 AM - 12:00 PM)
        const morningSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
        // Afternoon slots (2:00 PM - 5:00 PM)
        const afternoonSlots = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
        
        const allSlots = [...morningSlots, ...afternoonSlots];
        
        for (const startTime of allSlots) {
          const [hours, minutes] = startTime.split(':');
          const endDate = new Date(date);
          endDate.setHours(parseInt(hours), parseInt(minutes) + 30); // 30-minute slots
          const endTime = endDate.toTimeString().slice(0, 5);
          
          await addDoc(collection(db, 'availability'), {
            doctorId: uid,
            date: dateStr,
            startTime: startTime,
            endTime: endTime,
            duration: 30,
            status: 'available',
            isBooked: false,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
      
      console.log(`✓ Created doctor: ${doctorData.displayName}`);
    }
    
    console.log('🎉 Successfully seeded all doctors!');
    console.log('You can now search for doctors in the app.');
    
  } catch (error) {
    console.error('Error seeding doctors:', error);
  }
}

// Run the seeding
seedDoctors().then(() => {
  console.log('Seeding completed. You can now close this script.');
}).catch(console.error);
