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
