'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getFavorites, removeFavorite } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import type { Venue } from '@/lib/types';

interface FavoriteItem {
  id: string;
  venue: Venue;
}

function formatPrice(venue: Venue) {
  const { pricing } = venue;
  const amount = pricing.pricePerDay ?? pricing.pricePerHour;
  if (!amount) return 'Price on request';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: pricing.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function FavoritesPage() {
  const t = useTranslations('favorites');
  const { token } = useAuth();

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(false);
    try {
      const res = await getFavorites(token);
      setFavorites(res.data as FavoriteItem[]);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  async function handleRemove(venueId: string) {
    if (!token) return;
    setRemoving(venueId);
    try {
      await removeFavorite(token, venueId);
      setFavorites((prev) => prev.filter((f) => f.venue.id !== venueId));
    } catch {
      // silent fail — item stays
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-light text-fg">{t('title')}</h1>
        <p className="mt-1 font-body text-sm text-muted">{t('subtitle')}</p>
      </div>

      {/* Content */}
      {loading ? (
        <p className="font-body text-sm text-muted">Loading…</p>
      ) : error ? (
        <p className="font-body text-sm text-red-600">{t('errorLoading')}</p>
      ) : favorites.length === 0 ? (
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map(({ venue }) => (
            <div key={venue.id} className="border border-border bg-surface p-5 flex flex-col gap-3">
              {/* Photo */}
              {venue.photos[0] && (
                <div className="aspect-[16/9] overflow-hidden bg-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={venue.photos[0]}
                    alt={venue.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="flex-1 space-y-1">
                <p className="font-body text-sm font-medium text-fg">{venue.name}</p>
                <p className="font-body text-xs text-muted">{venue.location}</p>
                <p className="font-body text-xs text-muted">
                  {venue.capacity} guests · {formatPrice(venue)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/venues/${venue.id}`} className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full">
                    View
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(venue.id)}
                  disabled={removing === venue.id}
                  className="text-red-600 hover:bg-red-50"
                >
                  {t('remove')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
