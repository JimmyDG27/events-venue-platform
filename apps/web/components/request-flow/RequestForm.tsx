'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface RequestFormProps {
  venueId: string;
  capacity: number;
}

interface FormState {
  dateFrom: string;
  dateTo: string;
  guests: string;
  eventType: string;
  message: string;
}

const TOTAL_STEPS = 3;

export function RequestForm({ venueId, capacity }: RequestFormProps) {
  const t = useTranslations('requestFlow');
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [state, setState] = useState<FormState>({
    dateFrom: '',
    dateTo: '',
    guests: '',
    eventType: '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState('');

  // Redirect to login if no auth token
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      router.push(`/auth/login?return=/venues/${venueId}/request`);
    }
  }, [router, venueId]);

  function validate(): boolean {
    const errs: Partial<FormState> = {};

    if (step === 1) {
      if (!state.dateFrom) errs.dateFrom = 'Start date is required';
      if (!state.dateTo) errs.dateTo = 'End date is required';
      if (state.dateFrom && state.dateTo && state.dateTo < state.dateFrom) {
        errs.dateTo = 'End date must be after start date';
      }
    }

    if (step === 2) {
      const g = Number(state.guests);
      if (!state.guests || g < 1) errs.guests = 'Number of guests is required';
      else if (g > capacity) errs.guests = t('guestsExceeds', { capacity });
    }

    if (step === 3) {
      if (!state.eventType.trim()) errs.eventType = 'Event type is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      void handleSubmit();
    }
  }

  async function handleSubmit() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      router.push(`/auth/login?return=/venues/${venueId}/request`);
      return;
    }

    setLoading(true);
    setApiError('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/requests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            venueId,
            dateFrom: state.dateFrom,
            dateTo: state.dateTo,
            guests: Number(state.guests),
            eventType: state.eventType,
            message: state.message || undefined,
          }),
        },
      );

      if (!res.ok) {
        const body = (await res.json()) as { message?: string };
        setApiError(body.message ?? t('errorGeneric'));
        return;
      }

      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  const inputCls = 'border border-border bg-bg px-3 py-2 font-body text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none transition-colors duration-200 w-full';
  const labelCls = 'mb-1 block font-body text-xs uppercase tracking-widest text-muted';

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border border-accent">
          <svg className="h-8 w-8 text-accent" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="font-display text-3xl font-light text-fg">{t('confirmTitle')}</h2>
        <p className="mt-3 font-body text-sm text-muted">{t('confirmMessage')}</p>
        <Button
          variant="secondary"
          size="md"
          className="mt-8"
          onClick={() => router.push('/venues')}
        >
          {t('confirmCta')}
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-3">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className={`flex h-7 w-7 items-center justify-center font-body text-xs ${
                i + 1 <= step
                  ? 'bg-accent text-accent-fg'
                  : 'border border-border text-muted'
              }`}
            >
              {i + 1}
            </div>
            {i < TOTAL_STEPS - 1 && (
              <div className={`h-px w-8 ${i + 1 < step ? 'bg-accent' : 'bg-border'}`} />
            )}
          </div>
        ))}
        <span className="ml-2 font-body text-xs text-muted">
          {t('stepOf', { current: step, total: TOTAL_STEPS })}
        </span>
      </div>

      <form onSubmit={handleNext} className="space-y-6">
        {/* Step 1 — Dates */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-light text-fg">{t('step1Title')}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>{t('dateFrom')}</label>
                <input
                  type="date"
                  value={state.dateFrom}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setState((s) => ({ ...s, dateFrom: e.target.value }))}
                  className={inputCls}
                />
                {errors.dateFrom && (
                  <p className="mt-1 font-body text-xs text-red-600">{errors.dateFrom}</p>
                )}
              </div>
              <div>
                <label className={labelCls}>{t('dateTo')}</label>
                <input
                  type="date"
                  value={state.dateTo}
                  min={state.dateFrom || new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setState((s) => ({ ...s, dateTo: e.target.value }))}
                  className={inputCls}
                />
                {errors.dateTo && (
                  <p className="mt-1 font-body text-xs text-red-600">{errors.dateTo}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Guests */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-light text-fg">{t('step2Title')}</h2>
            <div>
              <Input
                label={t('guests')}
                type="number"
                min={1}
                max={capacity}
                value={state.guests}
                onChange={(e) => setState((s) => ({ ...s, guests: e.target.value }))}
                helperText={t('guestsHint', { capacity })}
                error={errors.guests}
                placeholder={`1 – ${capacity}`}
              />
            </div>
          </div>
        )}

        {/* Step 3 — Event details */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-light text-fg">{t('step3Title')}</h2>
            <div>
              <Input
                label={t('eventType')}
                value={state.eventType}
                onChange={(e) => setState((s) => ({ ...s, eventType: e.target.value }))}
                placeholder={t('eventTypePlaceholder')}
                error={errors.eventType}
              />
            </div>
            <div>
              <label className={labelCls}>{t('message')}</label>
              <textarea
                value={state.message}
                onChange={(e) => setState((s) => ({ ...s, message: e.target.value }))}
                placeholder={t('messagePlaceholder')}
                rows={4}
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>
        )}

        {apiError && (
          <p className="font-body text-xs text-red-600">{apiError}</p>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="font-body text-xs uppercase tracking-widest text-muted transition-colors duration-200 hover:text-fg"
            >
              ← {t('back')}
            </button>
          ) : (
            <span />
          )}

          <Button type="submit" variant="primary" size="md" disabled={loading}>
            {loading
              ? t('submitting')
              : step < TOTAL_STEPS
                ? t('next')
                : t('submit')}
          </Button>
        </div>
      </form>
    </div>
  );
}
