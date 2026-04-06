import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getVenues } from '@/lib/api';
import { VenueCard } from './VenueCard';

export async function FeaturedVenues() {
  const t = await getTranslations('home');

  let venues: Awaited<ReturnType<typeof getVenues>>['data'] = [];

  try {
    const result = await getVenues({ limit: 6 });
    venues = result.data;
  } catch {
    // API unavailable (dev/build time) — render empty state gracefully
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      {/* Section header */}
      <div className="mb-12 flex items-end justify-between">
        <div>
          <h2 className="font-display text-4xl font-light tracking-wide text-fg">
            {t('featuredTitle')}
          </h2>
          <p className="mt-2 font-body text-sm text-muted">
            {t('featuredSubtitle')}
          </p>
        </div>
        <Link
          href="/venues"
          className="hidden font-body text-xs uppercase tracking-widest text-accent transition-colors duration-200 hover:text-accent-hover md:block"
        >
          {t('viewAllVenues')} →
        </Link>
      </div>

      {venues.length === 0 ? (
        <p className="font-body text-sm text-muted">{t('noFeaturedVenues')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue, i) => (
            <VenueCard key={venue.id} venue={venue} priority={i === 0} />
          ))}
        </div>
      )}

      {/* Mobile "view all" link */}
      <div className="mt-10 text-center md:hidden">
        <Link
          href="/venues"
          className="font-body text-xs uppercase tracking-widest text-accent"
        >
          {t('viewAllVenues')} →
        </Link>
      </div>
    </section>
  );
}
