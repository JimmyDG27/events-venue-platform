'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface PhotoGalleryProps {
  photos: string[];
  venueName: string;
}

export function PhotoGallery({ photos, venueName }: PhotoGalleryProps) {
  const t = useTranslations('venueDetail');
  const [current, setCurrent] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="aspect-[21/9] w-full bg-surface border-b border-border flex items-center justify-center">
        <span className="font-body text-sm text-muted">No photos available</span>
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c - 1 + photos.length) % photos.length);
  const next = () => setCurrent((c) => (c + 1) % photos.length);

  return (
    <div className="relative aspect-[21/9] w-full overflow-hidden bg-surface">
      <Image
        src={photos[current]}
        alt={t('photo', { n: current + 1, total: photos.length })}
        fill
        priority
        className="object-cover transition-opacity duration-500"
      />

      {photos.length > 1 && (
        <>
          {/* Navigation arrows */}
          <button
            onClick={prev}
            aria-label="Previous photo"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-bg/80 p-2 transition-colors duration-200 hover:bg-bg"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={next}
            aria-label="Next photo"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-bg/80 p-2 transition-colors duration-200 hover:bg-bg"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M8 4L14 10L8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to photo ${i + 1}`}
                className={cn(
                  'h-1.5 transition-all duration-200',
                  i === current ? 'w-6 bg-accent' : 'w-1.5 bg-bg/60 hover:bg-bg',
                )}
              />
            ))}
          </div>

          {/* Counter */}
          <div className="absolute top-4 right-4 bg-bg/80 px-3 py-1 font-body text-xs text-muted">
            {current + 1} / {photos.length}
          </div>
        </>
      )}

      {/* Venue name overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-fg/40 to-transparent py-8 px-8">
        <h1 className="font-display text-4xl font-light text-white drop-shadow-sm md:text-5xl">
          {venueName}
        </h1>
      </div>
    </div>
  );
}
