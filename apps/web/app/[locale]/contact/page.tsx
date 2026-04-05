'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ContactPage() {
  const t = useTranslations('contact');
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Static contact page — no backend in Phase 3
    // Phase 5 can wire up a real endpoint if needed
    setSubmitted(true);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pt-28 pb-20">
      <div className="mb-4 h-px w-12 bg-accent" />
      <h1 className="font-display text-5xl font-light tracking-wide text-fg">{t('title')}</h1>
      <p className="mt-3 font-body text-sm text-muted">{t('subtitle')}</p>

      <div className="mt-12">
        {submitted ? (
          <div className="border border-accent/20 bg-accent/5 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-accent">
              <svg className="h-6 w-6 text-accent" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="font-display text-2xl font-light text-fg">{t('successTitle')}</h2>
            <p className="mt-2 font-body text-sm text-muted">{t('successBody')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label={t('nameLabel')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label={t('emailLabel')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div>
              <label className="mb-1 block font-body text-xs uppercase tracking-widest text-muted">
                {t('messageLabel')}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('messagePlaceholder')}
                rows={5}
                required
                className="w-full resize-none border border-border bg-bg px-3 py-2 font-body text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>
            <Button type="submit" variant="primary" size="md">
              {t('submit')}
            </Button>
          </form>
        )}

        <p className="mt-10 font-body text-xs text-muted">
          {t('emailUs')}{' '}
          <a
            href="mailto:hello@venuebooking.com"
            className="text-accent underline underline-offset-2"
          >
            hello@venuebooking.com
          </a>
        </p>
      </div>
    </div>
  );
}
