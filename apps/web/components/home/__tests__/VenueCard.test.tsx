import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { VenueCard } from '../VenueCard';
import type { Venue } from '@/lib/types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const mockVenue: Venue = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'The Grand Hall',
  description: 'A magnificent event space',
  location: 'Mayfair, London',
  capacity: 300,
  styles: ['luxury', 'ballroom'],
  pricing: { currency: 'GBP', pricePerDay: 5000 },
  photos: ['https://example.com/photo.jpg'],
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('VenueCard', () => {
  it('renders venue name', () => {
    render(<VenueCard venue={mockVenue} />);
    expect(screen.getByText('The Grand Hall')).toBeInTheDocument();
  });

  it('renders venue location', () => {
    render(<VenueCard venue={mockVenue} />);
    expect(screen.getByText('Mayfair, London')).toBeInTheDocument();
  });

  it('renders formatted price', () => {
    render(<VenueCard venue={mockVenue} />);
    expect(screen.getByText(/£5,000/)).toBeInTheDocument();
  });

  it('renders style tags', () => {
    render(<VenueCard venue={mockVenue} />);
    expect(screen.getByText('luxury')).toBeInTheDocument();
    expect(screen.getByText('ballroom')).toBeInTheDocument();
  });

  it('links to venue detail page', () => {
    render(<VenueCard venue={mockVenue} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/venues/${mockVenue.id}`);
  });

  it('renders photo with alt text', () => {
    render(<VenueCard venue={mockVenue} />);
    expect(screen.getByAltText('The Grand Hall')).toBeInTheDocument();
  });
});
