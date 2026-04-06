'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (data: { name?: string; email: string; password: string }) => Promise<void>;
  error?: string | null;
  loading?: boolean;
}

export function AuthForm({ mode, onSubmit, error, loading }: AuthFormProps) {
  const t = useTranslations('auth');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (mode === 'register' && !name.trim()) errs.name = t('nameRequired');
    if (!email.trim()) errs.email = t('emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = t('emailInvalid');
    if (!password) errs.password = t('passwordRequired');
    else if (password.length < 8) errs.password = t('passwordTooShort');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({ name: mode === 'register' ? name : undefined, email, password });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {mode === 'register' && (
        <Input
          label={t('nameLabel')}
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoComplete="name"
        />
      )}
      <Input
        label={t('emailLabel')}
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        autoComplete="email"
      />
      <Input
        label={t('passwordLabel')}
        name="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
        helperText={mode === 'register' ? t('passwordHint') : undefined}
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={loading}
        className="w-full"
      >
        {loading ? t('submitting') : mode === 'register' ? t('registerCta') : t('loginCta')}
      </Button>

      <p className={cn('text-center font-body text-sm text-muted')}>
        {mode === 'register' ? (
          <>
            {t('haveAccount')}{' '}
            <Link href="/auth/login" className="text-fg underline hover:text-accent">
              {t('signIn')}
            </Link>
          </>
        ) : (
          <>
            {t('noAccount')}{' '}
            <Link href="/auth/register" className="text-fg underline hover:text-accent">
              {t('createAccount')}
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
