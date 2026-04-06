import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about');
  return { title: t('title'), description: t('subtitle') };
}

export default async function AboutPage() {
  const t = await getTranslations('about');

  const steps = [
    { n: '01', title: t('step1'), body: t('step1Body') },
    { n: '02', title: t('step2'), body: t('step2Body') },
    { n: '03', title: t('step3'), body: t('step3Body') },
  ];

  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-4 h-px w-12 bg-accent" />
        <h1 className="max-w-2xl font-display text-6xl font-light leading-tight tracking-wide text-fg">
          {t('title')}
        </h1>
        <p className="mt-6 max-w-xl font-body text-base text-muted">{t('subtitle')}</p>
      </section>

      {/* Mission */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <h2 className="font-display text-4xl font-light text-fg">{t('missionTitle')}</h2>
            <p className="font-body text-base leading-relaxed text-fg/80">{t('missionBody')}</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="mb-12 font-display text-4xl font-light text-fg">{t('howTitle')}</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map(({ n, title, body }) => (
            <div key={n} className="border-t-2 border-accent pt-6">
              <span className="font-display text-5xl font-light text-border">{n}</span>
              <h3 className="mt-4 font-body text-sm uppercase tracking-widest text-fg">{title}</h3>
              <p className="mt-2 font-body text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-accent">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <h2 className="font-display text-4xl font-light text-accent-fg">{t('ctaTitle')}</h2>
          <div className="mt-8">
            <Link href="/venues">
              <Button variant="secondary" size="lg" className="border-accent-fg text-accent-fg hover:bg-accent-fg hover:text-accent">
                {t('cta')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
