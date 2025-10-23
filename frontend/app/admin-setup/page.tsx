'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Shield, UserPlus, CheckCircle, XCircle, Clock } from 'lucide-react';

const adminRegistrationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
  displayName: z.string().min(1, 'Display name is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AdminRegistrationFormData = z.infer<typeof adminRegistrationSchema>;

interface TokenValidationResponse {
  valid: boolean;
  expires_at: number;
}

interface AdminSetupStatus {
  setup_complete: boolean;
  admin_count: number;
  message: string;
}

export default function AdminSetupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenExpiration, setTokenExpiration] = useState<number | null>(null);
  const [setupStatus, setSetupStatus] = useState<AdminSetupStatus | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AdminRegistrationFormData>({
    resolver: zodResolver(adminRegistrationSchema),
    defaultValues: {
      token: tokenFromUrl || '',
      displayName: 'System Administrator',
    },
  });

  const watchedToken = watch('token');

  // Check admin setup status
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await fetch('/api/proxy/admin-setup/status');
        if (response.ok) {
          const data = await response.json();
          setSetupStatus(data.data);
          
          if (data.data.setup_complete) {
            setError('Admin user already exists. Registration is disabled.');
          }
        }
      } catch (err) {
        console.error('Failed to check setup status:', err);
      }
    };

    checkSetupStatus();
  }, []);

  // Validate token when it changes
  useEffect(() => {
    if (watchedToken && watchedToken.length > 10) {
      validateToken(watchedToken);
    } else {
      setTokenValid(null);
      setTokenExpiration(null);
    }
  }, [watchedToken]);

  const validateToken = async (token: string) => {
    try {
      const response = await fetch('/api/proxy/admin-setup/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        const tokenData: TokenValidationResponse = data.data;
        setTokenValid(tokenData.valid);
        setTokenExpiration(tokenData.expires_at);
        setError(null);
      } else {
        const errorData = await response.json();
        setTokenValid(false);
        setError(errorData.message || 'Invalid token');
      }
    } catch (err) {
      setTokenValid(false);
      setError('Failed to validate token');
    }
  };

  const onSubmit = async (data: AdminRegistrationFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/proxy/admin-setup/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login?message=Admin account created successfully');
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create admin account');
      }
    } catch (err) {
      setError('Failed to create admin account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTokenStatusIcon = () => {
    if (tokenValid === null) return <Clock className="w-4 h-4 text-gray-400" />;
    if (tokenValid) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getTokenStatusText = () => {
    if (tokenValid === null) return 'Enter token to validate';
    if (tokenValid) {
      const expiresAt = tokenExpiration ? new Date(tokenExpiration * 1000).toLocaleString() : 'Unknown';
      return `Valid token (expires: ${expiresAt})`;
    }
    return 'Invalid or expired token';
  };

  const formatTimeRemaining = () => {
    if (!tokenExpiration) return '';
    const now = Math.floor(Date.now() / 1000);
    const remaining = tokenExpiration - now;
    
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  if (setupStatus?.setup_complete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card className="shadow-lg">
            <div className="p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Complete</h2>
              <p className="text-gray-600 mb-4">
                Admin user already exists. Registration is no longer available.
              </p>
              <Button onClick={() => router.push('/login')} className="w-full">
                Go to Login
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card className="shadow-lg">
            <div className="p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Account Created!</h2>
              <p className="text-gray-600 mb-4">
                Your admin account has been successfully created. You'll be redirected to the login page shortly.
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Redirecting in 3 seconds...</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="shadow-lg">
          <div className="p-6 space-y-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <UserPlus className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Admin Setup</h2>
              <p className="mt-2 text-sm text-gray-600">
                Create the first administrator account for SynergyCare
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <XCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Token
                </label>
                <Input
                  id="token"
                  type="text"
                  placeholder="Enter your admin registration token"
                  {...register('token')}
                  error={errors.token?.message}
                />
                <div className="mt-2 flex items-center space-x-2 text-xs">
                  {getTokenStatusIcon()}
                  <span className={`${tokenValid ? 'text-green-600' : tokenValid === false ? 'text-red-600' : 'text-gray-500'}`}>
                    {getTokenStatusText()}
                  </span>
                  {tokenExpiration && tokenValid && (
                    <span className="text-gray-500">({formatTimeRemaining()})</span>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Enter your name"
                  {...register('displayName')}
                  error={errors.displayName?.message}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your admin email"
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
                  placeholder="Enter a secure password"
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

              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
                disabled={isLoading || !tokenValid || setupStatus?.setup_complete}
              >
                {isLoading ? 'Creating Admin Account...' : 'Create Admin Account'}
              </Button>
            </form>

            <div className="flex items-center justify-center text-xs text-gray-500 space-x-2">
              <Shield className="w-3 h-3" />
              <span>One-time registration with secure token validation</span>
            </div>

            <div className="text-center">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push('/login')}
              >
                Back to Login
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
