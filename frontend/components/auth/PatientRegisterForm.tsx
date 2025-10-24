'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from './AuthProvider';
import { useRecaptcha } from '@/lib/hooks/useRecaptcha';
import { patientRegisterSchema, PatientRegisterFormData } from '@/lib/utils/validators';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Shield, UserCheck, ArrowLeft } from 'lucide-react';
import { getDashboardUrl } from '@/lib/utils/navigation';

interface AuthError {
  message: string;
}

export function PatientRegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const { executeRecaptchaAction, isRecaptchaAvailable } = useRecaptcha();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientRegisterFormData>({
    resolver: zodResolver(patientRegisterSchema),
  });

  const onSubmit = async (data: PatientRegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Execute reCAPTCHA
      let recaptchaToken: string | null = null;
      if (isRecaptchaAvailable) {
        recaptchaToken = await executeRecaptchaAction('patient_register');
        if (!recaptchaToken) {
          throw new Error('reCAPTCHA verification failed. Please try again.');
        }
      }

      // Create display name from first and last name
      const displayName = `${data.firstName} ${data.lastName}`;
      
      // Prepare additional patient data
      const additionalData = {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        phoneNumber: data.phoneNumber,
        address: data.address,
        emergencyContact: data.emergencyContact,
        insuranceProvider: data.insuranceProvider,
        insuranceNumber: data.insuranceNumber,
      };
      
      // Register the user with patient role
      await registerUser(data.email, data.password, displayName, 'patient', additionalData);

      // Redirect to patient portal instead of general dashboard
      router.push(getDashboardUrl('patient'));
    } catch (err) {
      const error = err as AuthError;
      setError(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <div className="p-6 space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Join as Patient</h2>
            <p className="mt-2 text-sm text-gray-600">
              Create your health management account
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  {...register('firstName')}
                  error={errors.firstName?.message}
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  {...register('lastName')}
                  error={errors.lastName?.message}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="patient@email.com"
                {...register('email')}
                error={errors.email?.message}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register('dateOfBirth')}
                  error={errors.dateOfBirth?.message}
                />
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  {...register('phoneNumber')}
                  error={errors.phoneNumber?.message}
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <Input
                id="address"
                type="text"
                placeholder="123 Main St, City, State 12345"
                {...register('address')}
                error={errors.address?.message}
              />
            </div>

            <div>
              <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact
              </label>
              <Input
                id="emergencyContact"
                type="tel"
                placeholder="+1 (555) 987-6543"
                {...register('emergencyContact')}
                error={errors.emergencyContact?.message}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="insuranceProvider" className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Provider (Optional)
                </label>
                <Input
                  id="insuranceProvider"
                  type="text"
                  placeholder="Blue Cross Blue Shield"
                  {...register('insuranceProvider')}
                  error={errors.insuranceProvider?.message}
                />
              </div>

              <div>
                <label htmlFor="insuranceNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Number (Optional)
                </label>
                <Input
                  id="insuranceNumber"
                  type="text"
                  placeholder="ABC123456789"
                  {...register('insuranceNumber')}
                  error={errors.insuranceNumber?.message}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  {...register('password')}
                  error={errors.password?.message}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  {...register('confirmPassword')}
                  error={errors.confirmPassword?.message}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Patient Account'}
            </Button>
          </form>

          {/* reCAPTCHA Status */}
          <div className="flex items-center justify-center text-xs text-gray-500">
            <Shield className="w-3 h-3 mr-1" />
            {isRecaptchaAvailable ? (
              <span>Protected by reCAPTCHA</span>
            ) : (
              <span>reCAPTCHA not available</span>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Already have an account?
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full border-green-600 text-green-600 hover:bg-green-50"
              onClick={() => router.push('/patient/login')}
            >
              Sign In
            </Button>
          </div>

          <div className="flex items-center justify-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push('/role-selection')}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to role selection
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
