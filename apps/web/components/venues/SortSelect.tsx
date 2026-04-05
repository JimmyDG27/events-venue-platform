'use client';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';

interface SortSelectProps {
  current?: string;
  searchParams: Record<string, string>;
}

export function SortSelect({ current, searchParams }: SortSelectProps) {
  const t = useTranslations('venues');
  const router = useRouter();
  const pathname = usePathname();

  const options = [
    { value: '', label: t('sortRelevance') },
    { value: 'price_asc', label: t('sortPriceAsc') },
    { value: 'price_desc', label: t('sortPriceDesc') },
    { value: 'capacity_asc', label: t('sortCapacityAsc') },
    { value: 'capacity_desc', label: t('sortCapacityDesc') },
  ];

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('sort', value);
    } else {
      params.delete('sort');
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-3">
      <span className="font-body text-xs uppercase tracking-widest text-muted">
        {t('sortLabel')}
      </span>
      <select
        value={current ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        className="border border-border bg-bg px-3 py-1.5 font-body text-sm text-fg focus:border-accent focus:outline-none"
      >
        {options.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
