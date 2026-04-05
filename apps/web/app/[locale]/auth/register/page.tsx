'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { register as apiRegister } from '@/lib/api';
import { AuthForm } from '@/components/auth/AuthForm';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('return') ?? '/dashboard/requests';

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(data: { name?: string; email: string; password: string }) {
    setError(null);
    setLoading(true);
    try {
      const { accessToken, user } = await apiRegister({
        name: data.name!,
        email: data.email,
        password: data.password,
      });
      login(accessToken, user);
      router.push(returnUrl as '/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      if (message.includes('409') || message.toLowerCase().includes('already')) {
        setError(t('emailTaken'));
      } else {
        setError(t('errorGeneric'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-24">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl font-light text-fg">{t('registerTitle')}</h1>
          <p className="mt-3 font-body text-sm text-muted">{t('registerSubtitle')}</p>
        </div>

        {/* Card */}
        <div className="border border-border bg-surface p-8">
          <AuthForm
            mode="register"
            onSubmit={handleSubmit}
            error={error}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
