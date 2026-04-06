'use client';

import { FormEvent, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface FiltersPanelProps {
  initialValues: {
    location?: string;
    eventType?: string;
    capacity?: string;
    budgetMin?: string;
    budgetMax?: string;
    style?: string;
  };
}

export function FiltersPanel({ initialValues }: FiltersPanelProps) {
  const t = useTranslations('venues');
  const router = useRouter();
  const pathname = usePathname();

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const data = new FormData(form);
      const params = new URLSearchParams();

      (['location', 'eventType', 'style'] as const).forEach((key) => {
        const val = (data.get(key) as string | null)?.trim();
        if (val) params.set(key, val);
      });

      (['capacity', 'budgetMin', 'budgetMax'] as const).forEach((key) => {
        const val = (data.get(key) as string | null)?.trim();
        if (val && Number(val) > 0) params.set(key, val);
      });

      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname],
  );

  const handleClear = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  const inputCls = cn(
    'w-full border border-border bg-bg px-3 py-2',
    'font-body text-sm text-fg placeholder:text-muted',
    'focus:border-accent focus:outline-none transition-colors duration-200',
  );
  const labelCls = 'mb-1 block font-body text-xs uppercase tracking-widest text-muted';

  return (
    <aside className="w-full md:w-64 shrink-0">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-body text-xs uppercase tracking-widest text-fg">
          {t('filtersTitle')}
        </h2>
        <button
          type="button"
          onClick={handleClear}
          className="font-body text-xs text-muted underline underline-offset-2 transition-colors duration-200 hover:text-fg"
        >
          {t('clearFilters')}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelCls}>{t('location')}</label>
          <input
            name="location"
            type="text"
            defaultValue={initialValues.location}
            placeholder={t('locationPlaceholder')}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>{t('eventType')}</label>
          <input
            name="eventType"
            type="text"
            defaultValue={initialValues.eventType}
            placeholder={t('eventTypePlaceholder')}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>{t('style')}</label>
          <input
            name="style"
            type="text"
            defaultValue={initialValues.style}
            placeholder={t('stylePlaceholder')}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>{t('capacity')}</label>
          <input
            name="capacity"
            type="number"
            min={1}
            defaultValue={initialValues.capacity}
            placeholder={t('capacityPlaceholder')}
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>{t('budgetMin')}</label>
            <input
              name="budgetMin"
              type="number"
              min={0}
              defaultValue={initialValues.budgetMin}
              placeholder="0"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>{t('budgetMax')}</label>
            <input
              name="budgetMax"
              type="number"
              min={0}
              defaultValue={initialValues.budgetMax}
              placeholder="∞"
              className={inputCls}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-accent px-4 py-2.5 font-body text-xs uppercase tracking-widest text-accent-fg transition-colors duration-200 hover:bg-accent-hover"
        >
          {t('filtersTitle')}
        </button>
      </form>
    </aside>
  );
}
