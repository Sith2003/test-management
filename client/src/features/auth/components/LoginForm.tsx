'use client';

import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { useLogin } from '@/features/auth/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const loginMutation = useLogin();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-white shadow-sm ring-1 ring-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
            <Image src="/qa-logo.png" alt="QA" width={36} height={36} className="object-contain" />
          </div>
          <div>
            <p className="text-gray-900 font-bold text-sm leading-tight">Quality Intelligence</p>
            <p className="text-gray-500 text-[11px] tracking-wider">Inspect. Analyze. Improve.</p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">Welcome back</h1>
            <p className="mt-1 text-sm text-gray-500">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit((d) => loginMutation.mutate(d))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <Input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loginMutation.isPending}
              className="w-full mt-2"
            >
              Sign in
            </Button>
          </form>

          {/* Quick Login */}
          <div className="mt-6">
            <div className="relative flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-widest shrink-0">
                Quick login
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  role: 'Admin',
                  email: 'admin@example.com',
                  password: 'Admin@123456!',
                  style: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
                  dot: 'bg-rose-500',
                },
                {
                  role: 'Manager',
                  email: 'manager@example.com',
                  password: 'Manager@123456!',
                  style: 'bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100',
                  dot: 'bg-primary-500',
                },
                {
                  role: 'Tester',
                  email: 'tester@example.com',
                  password: 'Tester@123456!',
                  style: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
                  dot: 'bg-emerald-500',
                },
                {
                  role: 'Developer',
                  email: 'developer@example.com',
                  password: 'Developer@123456!',
                  style: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
                  dot: 'bg-amber-500',
                },
              ].map(({ role, email, password, style, dot }) => (
                <button
                  key={role}
                  type="button"
                  disabled={loginMutation.isPending}
                  onClick={() => loginMutation.mutate({ email, password })}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors disabled:opacity-50 ${style}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">© 2025 Quality Intelligence</p>
      </div>
    </div>
  );
}
