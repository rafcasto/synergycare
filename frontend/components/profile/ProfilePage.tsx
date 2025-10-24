'use client';

import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, Stethoscope, Calendar, Phone, MapPin, Building } from 'lucide-react';
import { DoctorProfile, PatientProfile } from '@/lib/firebase/firestore';

export function ProfilePage() {
  const { profile, loading, error, refetch } = useUserProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-md">
          <div className="text-center text-red-600">
            <p className="font-semibold">Error loading profile</p>
            <p className="text-sm mt-2">{error}</p>
            <Button onClick={refetch} className="mt-4">
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No profile found</p>
            <Button onClick={refetch} className="mt-4">
              Refresh
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <Button onClick={refetch} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Basic Info Card */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-full">
            {profile.role === 'doctor' ? (
              <Stethoscope className="w-8 h-8 text-blue-600" />
            ) : (
              <User className="w-8 h-8 text-green-600" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{profile.displayName}</h2>
            <p className="text-gray-600 capitalize">{profile.role}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>
      </Card>

      {/* Role-specific Information */}
      {profile.role === 'doctor' && (
        <DoctorProfileCard profile={profile as DoctorProfile} />
      )}
      
      {profile.role === 'patient' && (
        <PatientProfileCard profile={profile as PatientProfile} />
      )}

      {/* Contact Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {profile.phoneNumber && (
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <span>{profile.phoneNumber}</span>
            </div>
          )}
          {profile.address && (
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span>{profile.address}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function DoctorProfileCard({ profile }: { profile: DoctorProfile }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Medical Information</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600">Medical License</label>
          <p className="mt-1">{profile.medicalLicense}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Specialization</label>
          <p className="mt-1">{profile.specialization}</p>
        </div>
        {profile.hospitalAffiliation && (
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-600">Hospital Affiliation</label>
            <div className="flex items-center space-x-2 mt-1">
              <Building className="w-4 h-4 text-gray-400" />
              <span>{profile.hospitalAffiliation}</span>
            </div>
          </div>
        )}
        {profile.experienceYears && (
          <div>
            <label className="text-sm font-medium text-gray-600">Experience</label>
            <p className="mt-1">{profile.experienceYears} years</p>
          </div>
        )}
        {profile.consultationFee && (
          <div>
            <label className="text-sm font-medium text-gray-600">Consultation Fee</label>
            <p className="mt-1">${profile.consultationFee}</p>
          </div>
        )}
      </div>
      {profile.bio && (
        <div className="mt-4">
          <label className="text-sm font-medium text-gray-600">Bio</label>
          <p className="mt-1 text-gray-700">{profile.bio}</p>
        </div>
      )}
    </Card>
  );
}

function PatientProfileCard({ profile }: { profile: PatientProfile }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600">Date of Birth</label>
          <div className="flex items-center space-x-2 mt-1">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{profile.dateOfBirth}</span>
          </div>
        </div>
        {profile.gender && (
          <div>
            <label className="text-sm font-medium text-gray-600">Gender</label>
            <p className="mt-1 capitalize">{profile.gender}</p>
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-gray-600">Emergency Contact</label>
          <p className="mt-1">{profile.emergencyContact}</p>
        </div>
        {profile.insuranceProvider && (
          <div>
            <label className="text-sm font-medium text-gray-600">Insurance Provider</label>
            <p className="mt-1">{profile.insuranceProvider}</p>
          </div>
        )}
        {profile.insuranceNumber && (
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-600">Insurance Number</label>
            <p className="mt-1 font-mono text-sm">{profile.insuranceNumber}</p>
          </div>
        )}
      </div>
      
      {profile.medicalHistory && profile.medicalHistory.length > 0 && (
        <div className="mt-4">
          <label className="text-sm font-medium text-gray-600">Medical History</label>
          <ul className="mt-1 space-y-1">
            {profile.medicalHistory.map((item, index) => (
              <li key={index} className="text-sm text-gray-700">• {item}</li>
            ))}
          </ul>
        </div>
      )}
      
      {profile.allergies && profile.allergies.length > 0 && (
        <div className="mt-4">
          <label className="text-sm font-medium text-gray-600">Allergies</label>
          <ul className="mt-1 space-y-1">
            {profile.allergies.map((allergy, index) => (
              <li key={index} className="text-sm text-red-600">• {allergy}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
