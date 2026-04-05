import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getVenue } from '@/lib/api';
import { Link } from '@/i18n/navigation';
import { PhotoGallery } from '@/components/venue-detail/PhotoGallery';
import { VenueActions } from '@/components/venue-detail/VenueActions';
import type { VenuePricing } from '@/lib/types';

function formatPricing(pricing: VenuePricing): string {
  if (pricing.pricePerDay) return `£${pricing.pricePerDay.toLocaleString()} / day`;
  if (pricing.pricePerHour) return `£${pricing.pricePerHour.toLocaleString()} / hour`;
  return 'Price on request';
}

type Props = {
  params: Promise<{ id: string; locale: string }>;
};

export default async function VenueDetailPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations('venueDetail');

  let venue: Awaited<ReturnType<typeof getVenue>>;
  try {
    venue = await getVenue(id);
  } catch {
    notFound();
  }

  return (
    <>
      {/* Photo gallery */}
      <div className="mt-16">
        <PhotoGallery photos={venue.photos} venueName={venue.name} />
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Back link */}
        <Link
          href="/venues"
          className="mb-8 inline-block font-body text-xs uppercase tracking-widest text-muted transition-colors duration-200 hover:text-fg"
        >
          {t('backToVenues')}
        </Link>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_320px]">
          {/* Left: venue details */}
          <div>
            {/* Description */}
            <p className="font-body text-base leading-relaxed text-fg/80">
              {venue.description}
            </p>

            {/* Key facts */}
            <div className="mt-10 grid grid-cols-2 gap-6 border-t border-b border-border py-8 sm:grid-cols-3">
              <div>
                <p className="font-body text-xs uppercase tracking-widest text-muted">
                  {t('capacity')}
                </p>
                <p className="mt-1 font-display text-2xl font-light text-fg">
                  {venue.capacity.toLocaleString()}
                  <span className="ml-1 font-body text-sm text-muted">{t('guests')}</span>
                </p>
              </div>
              <div>
                <p className="font-body text-xs uppercase tracking-widest text-muted">
                  {t('location')}
                </p>
                <p className="mt-1 font-body text-sm text-fg">{venue.location}</p>
              </div>
              <div>
                <p className="font-body text-xs uppercase tracking-widest text-muted">
                  {t('pricing')}
                </p>
                <p className="mt-1 font-body text-sm text-fg">
                  {formatPricing(venue.pricing)}
                </p>
              </div>
            </div>

            {/* Styles & themes */}
            {venue.styles.length > 0 && (
              <div className="mt-8">
                <p className="mb-3 font-body text-xs uppercase tracking-widest text-muted">
                  {t('styles')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {venue.styles.map((style) => (
                    <span
                      key={style}
                      className="border border-border px-3 py-1 font-body text-xs uppercase tracking-widest text-fg"
                    >
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing detail */}
            <div className="mt-10 border border-border bg-surface p-6">
              <p className="mb-4 font-body text-xs uppercase tracking-widest text-muted">
                {t('pricing')}
              </p>
              <div className="space-y-2">
                {venue.pricing.pricePerHour && (
                  <div className="flex justify-between">
                    <span className="font-body text-sm text-muted">{t('pricingPerHour')}</span>
                    <span className="font-body text-sm text-fg">
                      £{venue.pricing.pricePerHour.toLocaleString()}
                    </span>
                  </div>
                )}
                {venue.pricing.pricePerDay && (
                  <div className="flex justify-between">
                    <span className="font-body text-sm text-muted">{t('pricingPerDay')}</span>
                    <span className="font-body text-sm text-fg">
                      £{venue.pricing.pricePerDay.toLocaleString()}
                    </span>
                  </div>
                )}
                {venue.pricing.minimumHours && (
                  <p className="font-body text-xs text-muted">
                    {t('pricingMinHours', { hours: venue.pricing.minimumHours })}
                  </p>
                )}
                {!venue.pricing.pricePerHour && !venue.pricing.pricePerDay && (
                  <p className="font-body text-sm text-muted">{t('pricingOnRequest')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right: CTA sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-border bg-surface p-6">
              <h2 className="mb-6 font-display text-2xl font-light text-fg">
                {venue.name}
              </h2>
              <p className="mb-1 font-body text-xs text-muted">{venue.location}</p>
              <p className="mb-6 font-body text-sm text-fg">
                {formatPricing(venue.pricing)}
              </p>

              <VenueActions venueId={venue.id} venueName={venue.name} />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
