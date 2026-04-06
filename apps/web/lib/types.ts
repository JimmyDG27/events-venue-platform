export interface AvailabilityRequest {
  id: string;
  venueId: string;
  venue?: { name: string; location: string };
  dateFrom: string;
  dateTo: string;
  guests: number;
  eventType: string;
  message?: string | null;
  status: 'Active' | 'Completed' | 'Rejected' | 'Cancelled';
  createdAt: string;
}

export interface Viewing {
  id: string;
  venueId: string;
  venue?: { name: string; location: string };
  scheduledAt: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface NotificationPreferences {
  bookingUpdates?: boolean;
  viewingReminders?: boolean;
  marketingEmails?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  notificationPreferences?: NotificationPreferences;
  createdAt: string;
}

export interface VenuePricing {
  currency: string;
  pricePerHour?: number;
  pricePerDay?: number;
  minimumHours?: number;
}

export interface Venue {
  id: string;
  name: string;
  description: string;
  location: string;
  capacity: number;
  styles: string[];
  pricing: VenuePricing;
  photos: string[];
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/** Simpler list response used by /favorites and /viewings (no page/limit/pages). */
export interface ListResponse<T> {
  data: T[];
  meta: { total: number };
}

export type VenuesResponse = PaginatedResponse<Venue>;

export interface VenueFilters {
  location?: string;
  capacity?: number;
  style?: string;
  eventType?: string;
  budgetMin?: number;
  budgetMax?: number;
  sort?: 'price_asc' | 'price_desc' | 'capacity_asc' | 'capacity_desc';
  page?: number;
  limit?: number;
}
