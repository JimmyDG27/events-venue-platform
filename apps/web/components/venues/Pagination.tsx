'use client';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string>;
}

export function Pagination({ currentPage, totalPages, searchParams }: PaginationProps) {
  const t = useTranslations('venues');
  const router = useRouter();
  const pathname = usePathname();

  if (totalPages <= 1) return null;

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    router.push(`${pathname}?${params.toString()}`);
  }

  const btnBase = cn(
    'px-4 py-2 font-body text-xs uppercase tracking-widest transition-colors duration-200',
    'border border-border',
  );

  return (
    <div className="mt-12 flex items-center justify-between">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className={cn(btnBase, 'disabled:opacity-30 hover:border-fg')}
      >
        ← {t('prevPage')}
      </button>

      <span className="font-body text-xs text-muted">
        {t('pagination', { current: currentPage, total: totalPages })}
      </span>

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={cn(btnBase, 'disabled:opacity-30 hover:border-fg')}
      >
        {t('nextPage')} →
      </button>
    </div>
  );
}
