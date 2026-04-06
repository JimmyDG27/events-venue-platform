'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getRequests } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { AvailabilityRequest } from '@/lib/types';

type FilterStatus = 'all' | 'Active' | 'Completed' | 'Rejected' | 'Cancelled';

const TABS: { key: FilterStatus; labelKey: string }[] = [
  { key: 'all', labelKey: 'all' },
  { key: 'Active', labelKey: 'active' },
  { key: 'Completed', labelKey: 'completed' },
  { key: 'Rejected', labelKey: 'rejected' },
  { key: 'Cancelled', labelKey: 'cancelled' },
];

const STATUS_VARIANT: Record<string, 'active' | 'completed' | 'rejected' | 'cancelled'> = {
  Active: 'active',
  Completed: 'completed',
  Rejected: 'rejected',
  Cancelled: 'cancelled',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function RequestsPage() {
  const t = useTranslations('requests');
  const tStatus = useTranslations('status');
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState<FilterStatus>('all');
  const [requests, setRequests] = useState<AvailabilityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(false);
    try {
      const res = await getRequests(token, activeTab === 'all' ? undefined : activeTab);
      setRequests(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [token, activeTab]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-light text-fg">{t('title')}</h1>
        <p className="mt-1 font-body text-sm text-muted">{t('subtitle')}</p>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map(({ key, labelKey }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'px-4 py-2.5 font-body text-xs uppercase tracking-widest transition-colors duration-200',
              activeTab === key
                ? 'border-b-2 border-accent text-fg'
                : 'text-muted hover:text-fg',
            )}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <p className="font-body text-sm text-muted">Loading…</p>
      ) : error ? (
        <p className="font-body text-sm text-red-600">{t('errorLoading')}</p>
      ) : requests.length === 0 ? (
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
          {requests.map((req) => (
            <div key={req.id} className="border border-border bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-body text-sm font-medium text-fg">
                    {req.venue?.name ?? req.venueId}
                  </p>
                  <p className="font-body text-xs text-muted">
                    {req.venue?.location}
                  </p>
                  <p className="font-body text-xs text-muted">
                    {t('dateFrom')} {formatDate(req.dateFrom)} — {t('dateTo')} {formatDate(req.dateTo)}
                  </p>
                  <p className="font-body text-xs text-muted">
                    {t('guests', { count: req.guests })} · {t('eventType')}: {req.eventType}
                  </p>
                  <p className="font-body text-xs text-muted">
                    {t('submitted')} {formatDate(req.createdAt)}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[req.status] ?? 'active'}>
                  {tStatus(req.status.toLowerCase() as 'active')}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
