'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getViewings, cancelViewing } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { Viewing } from '@/lib/types';

type TabKey = 'upcoming' | 'past';

const STATUS_VARIANT: Record<string, 'scheduled' | 'completed' | 'cancelled'> = {
  Scheduled: 'scheduled',
  Completed: 'completed',
  Cancelled: 'cancelled',
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ViewingsPage() {
  const t = useTranslations('viewings');
  const tStatus = useTranslations('status');
  const { token } = useAuth();

  const [tab, setTab] = useState<TabKey>('upcoming');
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(false);
    try {
      const res = await getViewings(token);
      setViewings(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const now = new Date();
  const filtered = viewings.filter((v) => {
    const scheduled = new Date(v.scheduledAt);
    if (tab === 'upcoming') return scheduled >= now && v.status !== 'Cancelled';
    return scheduled < now || v.status === 'Cancelled';
  });

  async function handleCancel(id: string) {
    if (!token) return;
    setCancelling(id);
    setConfirmId(null);
    try {
      const updated = await cancelViewing(token, id);
      setViewings((prev) => prev.map((v) => (v.id === id ? updated : v)));
    } catch {
      // silent fail
    } finally {
      setCancelling(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-light text-fg">{t('title')}</h1>
        <p className="mt-1 font-body text-sm text-muted">{t('subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['upcoming', 'past'] as TabKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'px-4 py-2.5 font-body text-xs uppercase tracking-widest transition-colors duration-200',
              tab === key
                ? 'border-b-2 border-accent text-fg'
                : 'text-muted hover:text-fg',
            )}
          >
            {t(key)}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <p className="font-body text-sm text-muted">Loading…</p>
      ) : error ? (
        <p className="font-body text-sm text-red-600">{t('errorLoading')}</p>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-display text-xl font-light text-muted">{t('empty')}</p>
          <p className="mt-2 font-body text-sm text-muted">{t('emptyHint')}</p>
          <Link href="/venues">
            <Button variant="primary" size="md" className="mt-6">
              {t('browseCta')}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((viewing) => (
            <div key={viewing.id} className="border border-border bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-body text-sm font-medium text-fg">
                    {viewing.venue?.name ?? viewing.venueId}
                  </p>
                  <p className="font-body text-xs text-muted">
                    {viewing.venue?.location}
                  </p>
                  <p className="font-body text-xs text-muted">
                    {t('scheduledAt')}: {formatDateTime(viewing.scheduledAt)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={STATUS_VARIANT[viewing.status] ?? 'scheduled'}>
                    {tStatus(viewing.status.toLowerCase() as 'scheduled')}
                  </Badge>

                  {viewing.status === 'Scheduled' && tab === 'upcoming' && (
                    confirmId === viewing.id ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmId(null)}
                          className="text-muted"
                        >
                          No
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(viewing.id)}
                          disabled={cancelling === viewing.id}
                          className="text-red-600 hover:bg-red-50"
                        >
                          {cancelling === viewing.id ? '…' : 'Yes, cancel'}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmId(viewing.id)}
                        className="text-muted hover:text-red-600"
                      >
                        {t('cancel')}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
