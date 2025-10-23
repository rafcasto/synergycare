'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserCheck, Stethoscope } from 'lucide-react';

export function RoleSelectionForm() {
  const router = useRouter();

  const handleRoleSelection = (role: 'doctor' | 'patient', action: 'login' | 'register') => {
    router.push(`/${role}/${action}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <div className="p-8 space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Welcome to SynergyCare</h1>
            <p className="mt-3 text-lg text-gray-600">
              Please select your role to continue
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Doctor Section */}
            <div className="space-y-4">
              <div className="text-center p-6 border-2 border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                <Stethoscope className="w-16 h-16 mx-auto text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Doctor</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Access your practice management tools, patient records, and medical workflows
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => handleRoleSelection('doctor', 'login')}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Doctor Sign In
                  </Button>
                  <Button
                    onClick={() => handleRoleSelection('doctor', 'register')}
                    variant="outline"
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    Join as Doctor
                  </Button>
                </div>
              </div>
            </div>

            {/* Patient Section */}
            <div className="space-y-4">
              <div className="text-center p-6 border-2 border-gray-200 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
                <UserCheck className="w-16 h-16 mx-auto text-green-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Patient</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Manage your health records, appointments, and connect with healthcare providers
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => handleRoleSelection('patient', 'login')}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Patient Sign In
                  </Button>
                  <Button
                    onClick={() => handleRoleSelection('patient', 'register')}
                    variant="outline"
                    className="w-full border-green-600 text-green-600 hover:bg-green-50"
                  >
                    Join as Patient
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help? Contact our support team
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
