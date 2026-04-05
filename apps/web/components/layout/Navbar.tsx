'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function Navbar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const navLinks = [
    { href: '/venues', label: t('venues') },
    { href: '/about', label: t('about') },
    { href: '/contact', label: t('contact') },
  ];

  function handleLogout() {
    logout();
    router.push('/');
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-bg/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="font-display text-xl font-light tracking-wide text-fg">
          Venue<span className="text-accent">.</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'font-body text-xs uppercase tracking-widest transition-colors duration-200',
                pathname.endsWith(href)
                  ? 'text-fg'
                  : 'text-muted hover:text-fg',
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Auth actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/dashboard/requests"
                className="font-body text-xs uppercase tracking-widest text-muted transition-colors duration-200 hover:text-fg"
              >
                {t('dashboard')}
              </Link>
              <button
                onClick={handleLogout}
                className="font-body text-xs uppercase tracking-widest text-muted transition-colors duration-200 hover:text-fg"
              >
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="font-body text-xs uppercase tracking-widest text-muted transition-colors duration-200 hover:text-fg"
              >
                {t('login')}
              </Link>
              <Link
                href="/auth/register"
                className="border border-accent bg-accent px-5 py-2 font-body text-xs uppercase tracking-widest text-accent-fg transition-colors duration-200 hover:bg-accent-hover"
              >
                {t('register')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
