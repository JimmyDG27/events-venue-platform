'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ScheduleViewingModalProps {
  venueId: string;
  venueName: string;
  open: boolean;
  onClose: () => void;
}

export function ScheduleViewingModal({
  venueId,
  venueName,
  open,
  onClose,
}: ScheduleViewingModalProps) {
  const t = useTranslations('venueDetail');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const token =
      typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    if (!token) {
      router.push(`/auth/login?return=/venues/${venueId}`);
      return;
    }

    const form = e.currentTarget;
    const scheduledAt = (form.elements.namedItem('scheduledAt') as HTMLInputElement).value;

    if (!scheduledAt) {
      setError('Please select a date and time.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/viewings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ venueId, scheduledAt }),
        },
      );

      if (!res.ok) {
        const body = (await res.json()) as { message?: string };
        setError(body.message ?? 'Something went wrong. Please try again.');
        return;
      }

      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setSuccess(false);
    setError('');
    onClose();
  }

  const minDateTime = new Date(Date.now() + 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  return (
    <Modal open={open} onClose={handleClose} title={t('scheduleViewing')}>
      {success ? (
        <div className="text-center py-4">
          <div className="mb-4 text-accent">
            <svg className="mx-auto h-12 w-12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="font-display text-2xl font-light text-fg">{t('scheduleSuccess')}</p>
          <p className="mt-2 font-body text-sm text-muted">
            A confirmation email has been sent to you.
          </p>
          <Button variant="secondary" size="sm" className="mt-6" onClick={handleClose}>
            Close
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="font-body text-sm text-muted">{venueName}</p>

          <div>
            <label className="mb-1 block font-body text-xs uppercase tracking-widest text-muted">
              {t('scheduledAt')}
            </label>
            <input
              type="datetime-local"
              name="scheduledAt"
              min={minDateTime}
              required
              className="w-full border border-border bg-bg px-3 py-2 font-body text-sm text-fg focus:border-accent focus:outline-none"
            />
          </div>

          {error && (
            <p className="font-body text-xs text-red-600">{error}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            disabled={loading}
          >
            {loading ? '…' : t('scheduleConfirm')}
          </Button>
        </form>
      )}
    </Modal>
  );
}
