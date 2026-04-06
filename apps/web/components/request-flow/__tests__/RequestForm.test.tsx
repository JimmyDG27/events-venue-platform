import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RequestForm } from '../RequestForm';

const mockPush = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (values) return `${key}:${JSON.stringify(values)}`;
    return key;
  },
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Suppress console.error for act() warnings in tests
vi.spyOn(console, 'error').mockImplementation(() => undefined);

describe('RequestForm', () => {
  beforeEach(() => {
    mockPush.mockClear();
    // No token → redirect to login
    Object.defineProperty(window, 'localStorage', {
      value: { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn(), removeItem: vi.fn() },
      writable: true,
    });
  });

  it('redirects to login when no token is present', () => {
    render(<RequestForm venueId="venue-1" capacity={200} />);
    // useEffect fires after render
    expect(mockPush).toHaveBeenCalledWith('/auth/login?return=/venues/venue-1/request');
  });

  it('renders step 1 with date inputs', () => {
    render(<RequestForm venueId="venue-1" capacity={200} />);
    // Step 1 shows dateFrom and dateTo labels as text
    expect(screen.getByText('dateFrom')).toBeInTheDocument();
    expect(screen.getByText('dateTo')).toBeInTheDocument();
  });

  it('shows validation error when dates are missing on step 1', () => {
    render(<RequestForm venueId="venue-1" capacity={200} />);
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/Start date is required/)).toBeInTheDocument();
  });

  it('shows step indicator with 3 steps', () => {
    render(<RequestForm venueId="venue-1" capacity={200} />);
    // Step indicators: 1, 2, 3
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('advances to step 2 when dates are valid', () => {
    render(<RequestForm venueId="venue-1" capacity={200} />);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: tomorrow } });
    fireEvent.change(dateInputs[1], { target: { value: dayAfter } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByText('step2Title')).toBeInTheDocument();
  });
});
