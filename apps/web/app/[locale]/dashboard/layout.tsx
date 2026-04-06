'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useRouter, Link } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard/requests', key: 'requests' },
  { href: '/dashboard/favorites', key: 'favorites' },
  { href: '/dashboard/viewings', key: 'viewings' },
  { href: '/dashboard/profile', key: 'profile' },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('dashboard');
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !token) {
      router.push(`/auth/login?return=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, token, router, pathname]);

  if (isLoading || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-body text-sm text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Sidebar nav */}
          <aside className="w-full md:w-56 shrink-0">
            <nav aria-label="Dashboard navigation" className="flex flex-row gap-1 md:flex-col">
              {NAV_ITEMS.map(({ href, key }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'px-4 py-2.5 font-body text-xs uppercase tracking-widest transition-colors duration-200',
                    pathname.endsWith(href)
                      ? 'bg-accent text-accent-fg'
                      : 'text-muted hover:text-fg hover:bg-surface',
                  )}
                >
                  {t(key)}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Page content */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
