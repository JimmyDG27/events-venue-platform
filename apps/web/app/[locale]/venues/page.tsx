import { getTranslations } from 'next-intl/server';
import { getVenues } from '@/lib/api';
import { VenueCard } from '@/components/home/VenueCard';
import { FiltersPanel } from '@/components/venues/FiltersPanel';
import { SortSelect } from '@/components/venues/SortSelect';
import { Pagination } from '@/components/venues/Pagination';
import type { VenueFilters } from '@/lib/types';

const PAGE_SIZE = 9;

type SearchParams = Record<string, string | string[] | undefined>;

function first(val: string | string[] | undefined): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function VenuesPage({ searchParams: searchParamsPromise }: Props) {
  const t = await getTranslations('venues');
  const searchParams = await searchParamsPromise;

  const location = first(searchParams.location);
  const eventType = first(searchParams.eventType);
  const style = first(searchParams.style);
  const capacityStr = first(searchParams.capacity);
  const budgetMinStr = first(searchParams.budgetMin);
  const budgetMaxStr = first(searchParams.budgetMax);
  const sort = first(searchParams.sort) as VenueFilters['sort'];
  const pageStr = first(searchParams.page);

  const page = Math.max(1, Number(pageStr) || 1);
  const capacity = capacityStr ? Number(capacityStr) : undefined;
  const budgetMin = budgetMinStr ? Number(budgetMinStr) : undefined;
  const budgetMax = budgetMaxStr ? Number(budgetMaxStr) : undefined;

  const filters: VenueFilters = {
    location,
    eventType,
    style,
    capacity,
    budgetMin,
    budgetMax,
    sort,
    page,
    limit: PAGE_SIZE,
  };

  // Flat record for client components (URLSearchParams)
  const flatParams: Record<string, string> = {};
  Object.entries(searchParams).forEach(([k, v]) => {
    const val = first(v);
    if (val !== undefined) flatParams[k] = val;
  });

  let venues: Awaited<ReturnType<typeof getVenues>>['data'] = [];
  let totalPages = 0;
  let total = 0;

  try {
    const result = await getVenues(filters);
    venues = result.data;
    total = result.meta.total;
    totalPages = result.meta.pages;
  } catch {
    // API unavailable — show empty state
  }

  return (
    <div className="mx-auto max-w-7xl px-6 pt-28 pb-20">
      {/* Page header */}
      <div className="mb-10">
        <div className="mb-3 h-px w-12 bg-accent" />
        <h1 className="font-display text-5xl font-light tracking-wide text-fg">
          {t('pageTitle')}
        </h1>
        <p className="mt-2 font-body text-sm text-muted">{t('pageSubtitle')}</p>
      </div>

      <div className="flex flex-col gap-10 md:flex-row">
        {/* Filters sidebar */}
        <FiltersPanel
          initialValues={{ location, eventType, capacity: capacityStr, budgetMin: budgetMinStr, budgetMax: budgetMaxStr, style }}
        />

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Sort + count bar */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-body text-sm text-muted">
              {t('resultsCount', { count: total })}
            </p>
            <SortSelect current={sort} searchParams={flatParams} />
          </div>

          {/* Grid */}
          {venues.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-display text-2xl font-light text-fg">{t('noResults')}</p>
              <p className="mt-2 font-body text-sm text-muted">{t('noResultsHint')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            searchParams={flatParams}
          />
        </div>
      </div>
    </div>
  );
}
