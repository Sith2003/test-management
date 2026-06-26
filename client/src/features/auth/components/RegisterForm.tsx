'use client';

import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { useRegister } from '@/features/auth/hooks/useAuth';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const registerMutation = useRegister();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({ name: data.name, email: data.email, password: data.password });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-500 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-white font-semibold text-base">Quality Intelligence</span>
        </div>

        <div className="relative space-y-4">
          <h2 className="text-3xl font-bold text-white leading-snug">
            Start testing<br />
            <span className="text-primary-200">with confidence</span>
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Create an account and invite your team to collaborate on test cases and runs.
          </p>
        </div>

        <p className="relative text-xs text-white/40">© 2025 Quality Intelligence</p>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-8 w-8 rounded-xl bg-white shadow-sm ring-1 ring-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
              <Image src="/qa-logo.png" alt="QA" width={28} height={28} className="object-contain" />
            </div>
            <span className="font-semibold text-gray-900">Quality Intelligence</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
            <p className="mt-1.5 text-sm text-gray-500">Start managing your test cases today</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full name"
              type="text"
              autoComplete="name"
              placeholder="John Doe"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={registerMutation.isPending}
              className="w-full mt-2"
            >
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary-500 hover:text-primary-600">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
