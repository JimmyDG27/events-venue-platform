import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.spyOn(console, 'error').mockImplementation(() => undefined);
import FavoritesPage from '../favorites/page';

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

const mockGetFavorites = vi.fn();
const mockRemoveFavorite = vi.fn();

vi.mock('@/lib/api', () => ({
  getFavorites: (...args: unknown[]) => mockGetFavorites(...args),
  removeFavorite: (...args: unknown[]) => mockRemoveFavorite(...args),
}));

const MOCK_VENUES = [
  {
    id: 'fav-1',
    venue: {
      id: 'v1',
      name: 'The Grand Hall',
      location: 'Mayfair, London',
      capacity: 300,
      styles: ['luxury'],
      pricing: { currency: 'GBP', pricePerDay: 5000 },
      photos: [],
      description: '',
      createdAt: '',
    },
  },
];

describe('FavoritesPage', () => {
  beforeEach(() => {
    mockGetFavorites.mockReset();
    mockRemoveFavorite.mockReset();
  });

  it('renders title', async () => {
    mockGetFavorites.mockResolvedValue({ data: [], meta: {} });
    render(<FavoritesPage />);
    expect(screen.getByText('title')).toBeInTheDocument();
  });

  it('shows empty state when no favorites', async () => {
    mockGetFavorites.mockResolvedValue({ data: [], meta: {} });
    render(<FavoritesPage />);
    await waitFor(() => expect(screen.getByText('empty')).toBeInTheDocument());
  });

  it('renders favorite venue cards', async () => {
    mockGetFavorites.mockResolvedValue({ data: MOCK_VENUES, meta: {} });
    render(<FavoritesPage />);
    await waitFor(() => expect(screen.getByText('The Grand Hall')).toBeInTheDocument());
    expect(screen.getByText('Mayfair, London')).toBeInTheDocument();
  });

  it('removes a favorite when remove button clicked', async () => {
    mockGetFavorites.mockResolvedValue({ data: MOCK_VENUES, meta: {} });
    mockRemoveFavorite.mockResolvedValue(undefined);
    render(<FavoritesPage />);
    await waitFor(() => screen.getByText('The Grand Hall'));
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    await waitFor(() => expect(mockRemoveFavorite).toHaveBeenCalledWith('test-token', 'v1'));
    await waitFor(() => expect(screen.queryByText('The Grand Hall')).toBeNull());
  });

  it('shows error on API failure', async () => {
    mockGetFavorites.mockRejectedValue(new Error('fail'));
    render(<FavoritesPage />);
    await waitFor(() => expect(screen.getByText('errorLoading')).toBeInTheDocument());
  });
});
