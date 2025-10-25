'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';

const sampleDoctors = [
  {
    displayName: "Dr. Sarah Johnson",
    email: "sarah.johnson@test.com",
    specialization: "Cardiology",
    experienceYears: 12,
    licenseNumber: "LIC001",
    bio: "Experienced cardiologist specializing in heart disease prevention and treatment.",
    hospitalAffiliation: "Central Medical Center",
    consultationFee: 200,
    rating: 4.8,
    reviewCount: 45,
  },
  {
    displayName: "Dr. Michael Chen",
    email: "michael.chen@test.com",
    specialization: "Dermatology",
    experienceYears: 8,
    licenseNumber: "LIC002",
    bio: "Dermatology specialist with expertise in skin cancer detection.",
    hospitalAffiliation: "Skin Health Institute",
    consultationFee: 180,
    rating: 4.9,
    reviewCount: 67,
  },
  {
    displayName: "Dr. Emily Rodriguez",
    email: "emily.rodriguez@test.com",
    specialization: "Pediatrics",
    experienceYears: 15,
    licenseNumber: "LIC003",
    bio: "Pediatrician dedicated to providing comprehensive care for children.",
    hospitalAffiliation: "Children's Hospital",
    consultationFee: 150,
    rating: 4.7,
    reviewCount: 89,
  },
  {
    displayName: "Dr. James Wilson",
    email: "james.wilson@test.com",
    specialization: "Orthopedics",
    experienceYears: 20,
    licenseNumber: "LIC004",
    bio: "Orthopedic surgeon specializing in sports medicine and joint replacement.",
    hospitalAffiliation: "Sports Medicine Center",
    consultationFee: 250,
    rating: 4.6,
    reviewCount: 123,
  },
  {
    displayName: "Dr. Lisa Park",
    email: "lisa.park@test.com",
    specialization: "Neurology",
    experienceYears: 10,
    licenseNumber: "LIC005",
    bio: "Neurologist with expertise in treating migraines and epilepsy.",
    hospitalAffiliation: "Neuroscience Institute",
    consultationFee: 220,
    rating: 4.9,
    reviewCount: 34,
  }
];

export default function DevDoctorSeeder() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const seedDoctors = async () => {
    setIsSeeding(true);
    setMessage('');
    setError('');

    try {
      setMessage('Creating sample doctors in emulator...');
      
      for (let i = 0; i < sampleDoctors.length; i++) {
        const doctorData = sampleDoctors[i];
        setMessage(`Creating doctor ${i + 1}/${sampleDoctors.length}: ${doctorData.displayName}`);
        
        try {
          // Create auth user
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
            isAvailable: true,
            isVerified: true,
            languages: ["English"],
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          // Create public doctor profile (for discovery)
          await setDoc(doc(db, 'doctor_public', uid), {
            uid,
            displayName: doctorData.displayName,
            specialization: doctorData.specialization,
            experienceYears: doctorData.experienceYears,
            bio: doctorData.bio,
            hospitalAffiliation: doctorData.hospitalAffiliation,
            consultationFee: doctorData.consultationFee,
            rating: doctorData.rating,
            reviewCount: doctorData.reviewCount,
            isAvailable: true,
            isVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          // Add availability slots for the next 7 days
          const today = new Date();
          for (let day = 1; day <= 7; day++) {
            const date = new Date(today);
            date.setDate(today.getDate() + day);
            const dateStr = date.toISOString().split('T')[0];
            
            // Create morning and afternoon slots
            const timeSlots = [
              '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
              '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
            ];
            
            for (const startTime of timeSlots) {
              const [hours, minutes] = startTime.split(':');
              const endTime = `${hours}:${String(parseInt(minutes) + 30).padStart(2, '0')}`;
              
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
          
        } catch (docError) {
          console.warn(`Error creating ${doctorData.displayName}:`, docError);
          // Continue with next doctor
        }
      }
      
      setMessage('✅ Successfully created sample doctors! You can now search for doctors.');
      
    } catch (err) {
      console.error('Seeding error:', err);
      setError(err instanceof Error ? err.message : 'Failed to seed doctors');
    } finally {
      setIsSeeding(false);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="p-6 m-4 border-yellow-300 bg-yellow-50">
      <div className="flex items-center mb-4">
        <svg className="w-6 h-6 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 19.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 className="text-lg font-semibold text-yellow-800">Development Mode</h3>
      </div>
      
      <p className="text-yellow-700 mb-4">
        This is a development utility to populate the Firebase emulator with sample doctors.
        Only visible in development mode.
      </p>
      
      {message && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-800">{message}</p>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      <Button 
        onClick={seedDoctors} 
        disabled={isSeeding}
        className="bg-yellow-600 hover:bg-yellow-700 text-white"
      >
        {isSeeding ? 'Creating Doctors...' : 'Seed Sample Doctors'}
      </Button>
    </Card>
  );
}
