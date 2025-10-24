'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useDoctors } from '@/lib/hooks/useDoctors';
import { DoctorPublicProfile } from '@/lib/firebase/firestore';

interface DoctorSearchProps {
  onDoctorSelect: (doctor: DoctorPublicProfile) => void;
  onClose?: () => void;
}

const SPECIALIZATIONS = [
  'All Specializations',
  'General Practice',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Radiology',
  'Surgery',
  'Oncology',
  'Endocrinology',
  'Gastroenterology',
  'Pulmonology',
  'Rheumatology',
  'Urology'
];

function DoctorSearch({ onDoctorSelect }: DoctorSearchProps) {
  const { doctors, loading, error, searchDoctors, getDoctorsBySpecialization } = useDoctors();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All Specializations');
  const [filteredDoctors, setFilteredDoctors] = useState<DoctorPublicProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filter doctors based on search term and specialization
  const filterDoctors = useCallback(async () => {
    setIsSearching(true);
    
    try {
      let results: DoctorPublicProfile[] = [];

      if (searchTerm.trim()) {
        // Search by name if there's a search term
        results = await searchDoctors(searchTerm.trim());
      } else if (selectedSpecialization !== 'All Specializations') {
        // Filter by specialization
        results = await getDoctorsBySpecialization(selectedSpecialization);
      } else {
        // Show all doctors
        results = doctors;
      }

      setFilteredDoctors(results);
    } catch (err) {
      console.error('Error filtering doctors:', err);
      setFilteredDoctors([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, selectedSpecialization, doctors, searchDoctors, getDoctorsBySpecialization]);

  useEffect(() => {
    filterDoctors();
  }, [filterDoctors]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleSpecializationChange = (specialization: string) => {
    setSelectedSpecialization(specialization);
    setSearchTerm(''); // Clear search when changing specialization
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSpecialization('All Specializations');
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading doctors...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="p-3 bg-red-100 rounded-full inline-block mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Doctors</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Doctors
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder="Search by doctor name..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">
              Specialization
            </label>
            <select
              id="specialization"
              value={selectedSpecialization}
              onChange={(e) => handleSpecializationChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {SPECIALIZATIONS.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {(searchTerm || selectedSpecialization !== 'All Specializations') && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {isSearching ? 'Searching...' : `${filteredDoctors.length} doctor(s) found`}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Doctors List */}
      <div className="space-y-4">
        {isSearching ? (
          <Card className="p-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-gray-600">Searching doctors...</p>
            </div>
          </Card>
        ) : filteredDoctors.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="p-3 bg-gray-100 rounded-full inline-block mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Doctors Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? `No doctors found matching "${searchTerm}"`
                : `No doctors found for ${selectedSpecialization}`
              }
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </Card>
        ) : (
          filteredDoctors.map((doctor) => (
            <Card
              key={doctor.uid}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onDoctorSelect(doctor)}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {doctor.displayName}
                      </h3>
                      <p className="text-blue-600 font-medium mb-2">
                        {doctor.specialization}
                      </p>
                      {doctor.hospitalAffiliation && (
                        <p className="text-sm text-gray-600 mb-2">
                          {doctor.hospitalAffiliation}
                        </p>
                      )}
                      {doctor.experienceYears && (
                        <p className="text-sm text-gray-600 mb-2">
                          {doctor.experienceYears} years experience
                        </p>
                      )}
                      {doctor.bio && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {doctor.bio}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      {doctor.consultationFee && (
                        <p className="text-lg font-bold text-gray-900 mb-1">
                          ${doctor.consultationFee}
                        </p>
                      )}
                      <Button size="sm">
                        View Availability
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default DoctorSearch;
