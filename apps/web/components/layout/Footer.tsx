import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function Footer() {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <p className="font-display text-2xl font-light tracking-wide text-fg">
              Venue<span className="text-accent">.</span>
            </p>
            <p className="mt-3 font-body text-sm text-muted">{t('tagline')}</p>
          </div>

          {/* Quick links */}
          <div>
            <p className="mb-4 font-body text-xs uppercase tracking-widest text-fg">
              {t('links')}
            </p>
            <ul className="space-y-2">
              {(['venues', 'about', 'contact'] as const).map((key) => (
                <li key={key}>
                  <Link
                    href={`/${key}`}
                    className="font-body text-sm text-muted transition-colors duration-200 hover:text-fg"
                  >
                    {nav(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="mb-4 font-body text-xs uppercase tracking-widest text-fg">
              {t('legal')}
            </p>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="font-body text-sm text-muted transition-colors duration-200 hover:text-fg"
                >
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="font-body text-sm text-muted transition-colors duration-200 hover:text-fg"
                >
                  {t('terms')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="font-body text-xs text-muted">
            {t('copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
