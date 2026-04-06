import type {
  Venue,
  VenueFilters,
  VenuesResponse,
  AvailabilityRequest,
  Viewing,
  UserProfile,
  NotificationPreferences,
  PaginatedResponse,
  ListResponse,
} from './types';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const contentTypeHeader =
    options?.body !== undefined ? { 'Content-Type': 'application/json' } : {};
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...contentTypeHeader, ...options?.headers },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export async function getVenues(filters: VenueFilters = {}): Promise<VenuesResponse> {
  const params = new URLSearchParams();
  if (filters.location) params.set('location', filters.location);
  if (filters.capacity) params.set('capacity', String(filters.capacity));
  if (filters.style) params.set('style', filters.style);
  if (filters.eventType) params.set('eventType', filters.eventType);
  if (filters.budgetMin) params.set('budgetMin', String(filters.budgetMin));
  if (filters.budgetMax) params.set('budgetMax', String(filters.budgetMax));
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const query = params.toString();
  return apiFetch<VenuesResponse>(`/venues${query ? `?${query}` : ''}`);
}

export async function getVenue(id: string): Promise<Venue> {
  return apiFetch<Venue>(`/venues/${id}`);
}

// Auth
export async function register(data: { name: string; email: string; password: string }) {
  return apiFetch<{ accessToken: string; user: UserProfile }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function login(data: { email: string; password: string }) {
  return apiFetch<{ accessToken: string; user: UserProfile }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Users
export async function getProfile(token: string): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateProfile(token: string, data: Partial<Pick<UserProfile, 'name' | 'email' | 'phone'>>) {
  return apiFetch<UserProfile>('/users/me', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function updateNotifications(token: string, data: NotificationPreferences) {
  return apiFetch<UserProfile>('/users/me/notifications', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

// Requests
export async function getRequests(token: string, status?: string): Promise<PaginatedResponse<AvailabilityRequest>> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch<PaginatedResponse<AvailabilityRequest>>(`/requests${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Favorites
export async function getFavorites(token: string): Promise<ListResponse<{ id: string; venue: Venue }>> {
  return apiFetch<ListResponse<{ id: string; venue: Venue }>>('/favorites', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function removeFavorite(token: string, venueId: string): Promise<void> {
  return apiFetch<void>(`/favorites/${venueId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Viewings
export async function getViewings(token: string): Promise<ListResponse<Viewing>> {
  return apiFetch<ListResponse<Viewing>>('/viewings', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function cancelViewing(token: string, id: string): Promise<Viewing> {
  return apiFetch<Viewing>(`/viewings/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: 'Cancelled' }),
  });
}
