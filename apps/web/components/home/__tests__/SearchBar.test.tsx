import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SearchBar } from '../SearchBar';

const mockPush = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/en',
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('SearchBar', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders all three search inputs', () => {
    render(<SearchBar />);
    expect(screen.getByRole('textbox', { name: 'searchEventType' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'searchLocation' })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'searchGuests' })).toBeInTheDocument();
  });

  it('renders the search submit button', () => {
    render(<SearchBar />);
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('navigates to /venues with location query on submit', () => {
    render(<SearchBar />);
    const locationInput = screen.getByRole('textbox', { name: 'searchLocation' });
    fireEvent.change(locationInput, { target: { value: 'Shoreditch' } });
    fireEvent.submit(screen.getByRole('button', { name: /search/i }).closest('form')!);
    expect(mockPush).toHaveBeenCalledWith('/venues?location=Shoreditch');
  });

  it('includes all non-empty values in query string', () => {
    render(<SearchBar />);
    fireEvent.change(screen.getByRole('textbox', { name: 'searchEventType' }), {
      target: { value: 'Wedding' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'searchGuests' }), {
      target: { value: '150' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /search/i }).closest('form')!);
    const call = mockPush.mock.calls[0][0] as string;
    expect(call).toContain('eventType=Wedding');
    expect(call).toContain('capacity=150');
  });

  it('navigates to /venues with no query string when form is empty', () => {
    render(<SearchBar />);
    fireEvent.submit(screen.getByRole('button', { name: /search/i }).closest('form')!);
    expect(mockPush).toHaveBeenCalledWith('/venues?');
  });
});
