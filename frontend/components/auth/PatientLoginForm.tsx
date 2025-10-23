'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from './AuthProvider';
import { useRecaptcha } from '@/lib/hooks/useRecaptcha';
import { loginSchema, LoginFormData } from '@/lib/utils/validators';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Shield, UserCheck, ArrowLeft } from 'lucide-react';

interface AuthError {
  message: string;
}

export function PatientLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth();
  const { executeRecaptchaAction, isRecaptchaAvailable } = useRecaptcha();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Execute reCAPTCHA
      let recaptchaToken: string | null = null;
      if (isRecaptchaAvailable) {
        recaptchaToken = await executeRecaptchaAction('patient_login');
        if (!recaptchaToken) {
          throw new Error('reCAPTCHA verification failed. Please try again.');
        }
      }

      await login(data.email, data.password);
      
      // Optional: Verify reCAPTCHA token with your backend
      if (recaptchaToken) {
        console.log('reCAPTCHA token generated for patient login:', recaptchaToken);
      }

      router.push('/dashboard');
    } catch (err) {
      const error = err as AuthError;
      setError(error.message || 'Failed to log in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-lg">
        <div className="p-6 space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Patient Sign In</h2>
            <p className="mt-2 text-sm text-gray-600">
              Access your health records and appointments
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
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
              New patient?
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full border-green-600 text-green-600 hover:bg-green-50"
              onClick={() => router.push('/patient/register')}
            >
              Join as Patient
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
