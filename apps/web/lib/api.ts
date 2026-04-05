import type { Venue, VenueFilters, VenuesResponse } from './types';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
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
