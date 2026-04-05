import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/Card';
import type { Venue } from '@/lib/types';

interface VenueCardProps {
  venue: Venue;
}

function formatPrice(venue: Venue): string {
  const { pricing } = venue;
  if (pricing.pricePerDay) {
    return `From £${pricing.pricePerDay.toLocaleString()} / day`;
  }
  if (pricing.pricePerHour) {
    return `From £${pricing.pricePerHour.toLocaleString()} / hr`;
  }
  return 'Price on request';
}

export function VenueCard({ venue }: VenueCardProps) {
  const t = useTranslations('common');
  const tActions = useTranslations('actions');

  return (
    <Link href={`/venues/${venue.id}`} className="block group">
      <Card
        imageSrc={venue.photos[0]}
        title={venue.name}
        subtitle={venue.location}
        footer={
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-muted">
              {formatPrice(venue)}
            </span>
            <span className="font-body text-xs text-muted">
              {venue.capacity.toLocaleString()} {t('guests')}
            </span>
          </div>
        }
      >
        {venue.styles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {venue.styles.slice(0, 3).map((style) => (
              <span
                key={style}
                className="border border-border px-2 py-0.5 font-body text-[10px] uppercase tracking-widest text-muted"
              >
                {style}
              </span>
            ))}
          </div>
        )}
        <p className="mt-3 font-body text-xs uppercase tracking-widest text-accent transition-colors duration-200 group-hover:text-accent-hover">
          {tActions('viewDetails')} →
        </p>
      </Card>
    </Link>
  );
}
