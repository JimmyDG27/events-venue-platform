import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Suppress act() warnings from async state updates triggered by useEffect
vi.spyOn(console, 'error').mockImplementation(() => undefined);
import RequestsPage from '../requests/page';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (values) return `${key}:${JSON.stringify(values)}`;
    return key;
  },
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token' }),
}));

const mockGetRequests = vi.fn();
vi.mock('@/lib/api', () => ({
  getRequests: (...args: unknown[]) => mockGetRequests(...args),
}));

const MOCK_REQUESTS = [
  {
    id: 'req-1',
    venueId: 'v1',
    venue: { name: 'The Grand Hall', location: 'Mayfair' },
    dateFrom: '2026-06-01T00:00:00.000Z',
    dateTo: '2026-06-02T00:00:00.000Z',
    guests: 150,
    eventType: 'Wedding',
    status: 'Active',
    createdAt: '2026-04-01T00:00:00.000Z',
  },
  {
    id: 'req-2',
    venueId: 'v2',
    venue: { name: 'Rooftop Space', location: 'Shoreditch' },
    dateFrom: '2026-07-10T00:00:00.000Z',
    dateTo: '2026-07-11T00:00:00.000Z',
    guests: 80,
    eventType: 'Corporate',
    status: 'Completed',
    createdAt: '2026-04-02T00:00:00.000Z',
  },
];

describe('RequestsPage', () => {
  beforeEach(() => {
    mockGetRequests.mockReset();
  });

  it('renders title and tabs', async () => {
    mockGetRequests.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 10, pages: 0 } });
    render(<RequestsPage />);
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('all')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('shows empty state when no requests', async () => {
    mockGetRequests.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 10, pages: 0 } });
    render(<RequestsPage />);
    await waitFor(() => expect(screen.getByText('empty')).toBeInTheDocument());
    expect(screen.getByText('browseCta')).toBeInTheDocument();
  });

  it('renders request cards', async () => {
    mockGetRequests.mockResolvedValue({ data: MOCK_REQUESTS, meta: { total: 2, page: 1, limit: 10, pages: 1 } });
    render(<RequestsPage />);
    await waitFor(() => expect(screen.getByText('The Grand Hall')).toBeInTheDocument());
    expect(screen.getByText('Rooftop Space')).toBeInTheDocument();
  });

  it('filters by status tab — only passes status to API', async () => {
    mockGetRequests.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 10, pages: 0 } });
    render(<RequestsPage />);
    await waitFor(() => expect(mockGetRequests).toHaveBeenCalledWith('test-token', undefined));
    fireEvent.click(screen.getByText('active'));
    await waitFor(() => expect(mockGetRequests).toHaveBeenCalledWith('test-token', 'Active'));
  });

  it('shows error message on API failure', async () => {
    mockGetRequests.mockRejectedValue(new Error('Network error'));
    render(<RequestsPage />);
    await waitFor(() => expect(screen.getByText('errorLoading')).toBeInTheDocument());
  });
});
