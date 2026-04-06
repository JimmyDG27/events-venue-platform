import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { FeaturedVenues } from '@/components/home/FeaturedVenues';
import { SearchBar } from '@/components/home/SearchBar';

function VenuesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border border-border bg-surface">
          <div className="aspect-[4/3] animate-pulse bg-border" />
          <div className="p-6">
            <div className="h-5 w-3/4 animate-pulse rounded-sm bg-border" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded-sm bg-border" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-6 pt-16 text-center">
        {/* Subtle background texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_60%_10%,rgba(44,74,62,0.06)_0%,transparent_70%)]"
        />

        {/* Decorative line */}
        <div aria-hidden className="mb-8 h-px w-16 bg-accent" />

        <h1 className="max-w-3xl font-display text-5xl font-light leading-tight tracking-wide text-fg sm:text-6xl lg:text-7xl">
          {t('heroTitle')}
        </h1>

        <p className="mt-6 max-w-xl font-body text-base text-muted sm:text-lg">
          {t('heroSubtitle')}
        </p>

        {/* Search bar */}
        <div className="mt-10 w-full max-w-3xl">
          <SearchBar />
        </div>

        {/* Scroll indicator */}
        <div aria-hidden className="absolute bottom-10 flex flex-col items-center gap-2">
          <span className="font-body text-[10px] uppercase tracking-widest text-muted">
            Scroll
          </span>
          <div className="h-8 w-px bg-border" />
        </div>
      </section>

      {/* Featured venues */}
      <Suspense
        fallback={
          <section className="mx-auto max-w-7xl px-6 py-20">
            <div className="mb-12">
              <div className="h-9 w-48 animate-pulse rounded-sm bg-border" />
            </div>
            <VenuesSkeleton />
          </section>
        }
      >
        <FeaturedVenues />
      </Suspense>
    </>
  );
}
