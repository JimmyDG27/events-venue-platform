import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.spyOn(console, 'error').mockImplementation(() => undefined);
import ViewingsPage from '../viewings/page';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token' }),
}));

const mockGetViewings = vi.fn();
const mockCancelViewing = vi.fn();

vi.mock('@/lib/api', () => ({
  getViewings: (...args: unknown[]) => mockGetViewings(...args),
  cancelViewing: (...args: unknown[]) => mockCancelViewing(...args),
}));

const FUTURE_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const PAST_DATE = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

const MOCK_VIEWINGS = [
  {
    id: 'v1',
    venueId: 'venue-1',
    venue: { name: 'The Grand Hall', location: 'Mayfair' },
    scheduledAt: FUTURE_DATE,
    status: 'Scheduled',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'v2',
    venueId: 'venue-2',
    venue: { name: 'Rooftop Space', location: 'Shoreditch' },
    scheduledAt: PAST_DATE,
    status: 'Completed',
    createdAt: new Date().toISOString(),
  },
];

describe('ViewingsPage', () => {
  beforeEach(() => {
    mockGetViewings.mockReset();
    mockCancelViewing.mockReset();
  });

  it('renders title and tabs', async () => {
    mockGetViewings.mockResolvedValue({ data: [], meta: {} });
    render(<ViewingsPage />);
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('upcoming')).toBeInTheDocument();
    expect(screen.getByText('past')).toBeInTheDocument();
  });

  it('shows upcoming viewing on upcoming tab', async () => {
    mockGetViewings.mockResolvedValue({ data: MOCK_VIEWINGS, meta: {} });
    render(<ViewingsPage />);
    await waitFor(() => expect(screen.getByText('The Grand Hall')).toBeInTheDocument());
    expect(screen.queryByText('Rooftop Space')).toBeNull();
  });

  it('shows past viewing on past tab', async () => {
    mockGetViewings.mockResolvedValue({ data: MOCK_VIEWINGS, meta: {} });
    render(<ViewingsPage />);
    await waitFor(() => screen.getByText('The Grand Hall'));
    fireEvent.click(screen.getByText('past'));
    await waitFor(() => expect(screen.getByText('Rooftop Space')).toBeInTheDocument());
    expect(screen.queryByText('The Grand Hall')).toBeNull();
  });

  it('shows cancel button for upcoming scheduled viewings', async () => {
    mockGetViewings.mockResolvedValue({ data: MOCK_VIEWINGS, meta: {} });
    render(<ViewingsPage />);
    await waitFor(() => screen.getByText('The Grand Hall'));
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls cancelViewing API after confirmation', async () => {
    mockGetViewings.mockResolvedValue({ data: MOCK_VIEWINGS, meta: {} });
    mockCancelViewing.mockResolvedValue({ ...MOCK_VIEWINGS[0], status: 'Cancelled' });
    render(<ViewingsPage />);
    await waitFor(() => screen.getByText('The Grand Hall'));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    fireEvent.click(screen.getByRole('button', { name: /yes, cancel/i }));
    await waitFor(() => expect(mockCancelViewing).toHaveBeenCalledWith('test-token', 'v1'));
  });

  it('shows empty state when no viewings', async () => {
    mockGetViewings.mockResolvedValue({ data: [], meta: {} });
    render(<ViewingsPage />);
    await waitFor(() => expect(screen.getByText('empty')).toBeInTheDocument());
  });
});
