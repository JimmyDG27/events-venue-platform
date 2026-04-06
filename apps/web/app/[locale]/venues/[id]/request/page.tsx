import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getVenue } from '@/lib/api';
import { Link } from '@/i18n/navigation';
import { RequestForm } from '@/components/request-flow/RequestForm';

type Props = {
  params: Promise<{ id: string; locale: string }>;
};

export default async function RequestPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations('requestFlow');

  let venue: Awaited<ReturnType<typeof getVenue>>;
  try {
    venue = await getVenue(id);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pt-28 pb-20">
      {/* Back link */}
      <Link
        href={`/venues/${id}`}
        className="mb-8 inline-block font-body text-xs uppercase tracking-widest text-muted transition-colors duration-200 hover:text-fg"
      >
        ← {venue.name}
      </Link>

      {/* Header */}
      <div className="mb-10">
        <div className="mb-3 h-px w-12 bg-accent" />
        <h1 className="font-display text-4xl font-light tracking-wide text-fg">
          {t('pageTitle')}
        </h1>
        <p className="mt-1 font-body text-sm text-muted">
          {t('forVenue', { venueName: venue.name })}
        </p>
      </div>

      <RequestForm
        venueId={venue.id}
        capacity={venue.capacity}
      />
    </div>
  );
}
