'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

export function SearchBar() {
  const t = useTranslations('home');
  const tActions = useTranslations('actions');
  const router = useRouter();

  const [eventType, setEventType] = useState('');
  const [location, setLocation] = useState('');
  const [guests, setGuests] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (eventType.trim()) params.set('eventType', eventType.trim());
    if (location.trim()) params.set('location', location.trim());
    if (guests.trim()) params.set('capacity', guests.trim());
    router.push(`/venues?${params.toString()}`);
  }

  const inputBase =
    'w-full bg-bg border border-border px-4 py-3 font-body text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none transition-colors duration-200';

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-0 border border-border bg-bg shadow-lg md:grid-cols-[1fr_1fr_auto_auto]"
    >
      {/* Event type */}
      <div className="border-b border-border md:border-b-0 md:border-r">
        <label className="block px-4 pt-3 font-body text-[10px] uppercase tracking-widest text-muted">
          {t('searchEventType')}
        </label>
        <input
          type="text"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          placeholder={t('searchEventTypePlaceholder')}
          className={`${inputBase} border-0 pt-0`}
          aria-label={t('searchEventType')}
        />
      </div>

      {/* Location */}
      <div className="border-b border-border md:border-b-0 md:border-r">
        <label className="block px-4 pt-3 font-body text-[10px] uppercase tracking-widest text-muted">
          {t('searchLocation')}
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t('searchLocationPlaceholder')}
          className={`${inputBase} border-0 pt-0`}
          aria-label={t('searchLocation')}
        />
      </div>

      {/* Guests */}
      <div className="border-b border-border md:border-b-0 md:border-r">
        <label className="block px-4 pt-3 font-body text-[10px] uppercase tracking-widest text-muted">
          {t('searchGuests')}
        </label>
        <input
          type="number"
          min={1}
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          placeholder={t('searchGuestsPlaceholder')}
          className={`${inputBase} border-0 pt-0`}
          aria-label={t('searchGuests')}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="bg-accent px-8 py-4 font-body text-xs uppercase tracking-widest text-accent-fg transition-colors duration-200 hover:bg-accent-hover"
      >
        {tActions('search')}
      </button>
    </form>
  );
}
