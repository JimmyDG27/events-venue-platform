'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type State = 'loading' | 'success' | 'already' | 'error' | 'no_token';

export default function VerifyEmailPage() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const [state, setState] = useState<State>('loading');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setState('no_token');
      return;
    }

    void fetch(`${API_URL}/auth/verify?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          setState('error');
          return;
        }
        const body = (await res.json()) as { message?: string };
        if (body.message?.includes('already')) {
          setState('already');
        } else {
          setState('success');
        }
      })
      .catch(() => setState('error'));
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="font-display text-3xl font-light text-fg">{t('verifyTitle')}</h1>

        {state === 'loading' && (
          <p className="font-body text-sm text-muted">{t('verifying')}</p>
        )}

        {state === 'success' && (
          <>
            <p className="font-body text-sm text-fg">{t('verifySuccess')}</p>
            <Link href="/auth/login">
              <Button variant="primary" size="md" className="mt-4">
                {t('signIn')}
              </Button>
            </Link>
          </>
        )}

        {state === 'already' && (
          <>
            <p className="font-body text-sm text-fg">{t('verifyAlready')}</p>
            <Link href="/auth/login">
              <Button variant="primary" size="md" className="mt-4">
                {t('signIn')}
              </Button>
            </Link>
          </>
        )}

        {state === 'error' && (
          <p className="font-body text-sm text-red-600">{t('verifyFailed')}</p>
        )}

        {state === 'no_token' && (
          <p className="font-body text-sm text-red-600">{t('noToken')}</p>
        )}
      </div>
    </div>
  );
}
