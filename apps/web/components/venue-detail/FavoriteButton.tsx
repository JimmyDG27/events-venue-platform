'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface FavoriteButtonProps {
  venueId: string;
}

export function FavoriteButton({ venueId }: FavoriteButtonProps) {
  const t = useTranslations('venueDetail');
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // On mount, check if this venue is already in the user's favorites
  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    void fetch(`${API_URL}/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { data: { venue: { id: string } }[] } | null) => {
        if (!data) return;
        const isFavorited = data.data.some((f) => f.venue.id === venueId);
        setSaved(isFavorited);
      })
      .catch(() => {});
  }, [venueId]);

  async function handleToggle() {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    if (!token) {
      router.push(`/auth/login?return=/venues/${venueId}`);
      return;
    }

    setLoading(true);
    try {
      const method = saved ? 'DELETE' : 'POST';
      const res = await fetch(`${API_URL}/favorites/${venueId}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok || res.status === 204) {
        setSaved((s) => !s);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={saved ? t('savedToFavorites') : t('saveToFavorites')}
      className={cn(
        'flex w-full items-center justify-center gap-2',
        'border border-border px-6 py-3',
        'font-body text-xs uppercase tracking-widest',
        'transition-colors duration-200',
        saved
          ? 'border-accent bg-accent/5 text-accent'
          : 'text-muted hover:border-fg hover:text-fg',
        'disabled:opacity-40',
      )}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 20 20"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M10 17.5S2 12.5 2 7a4 4 0 0 1 8 0 4 4 0 0 1 8 0c0 5.5-8 10.5-8 10.5z" strokeLinejoin="round" />
      </svg>
      {saved ? t('savedToFavorites') : t('saveToFavorites')}
    </button>
  );
}
