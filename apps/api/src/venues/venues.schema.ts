import { z } from 'zod';

export const ListVenuesQuerySchema = z.object({
  /** Minimum guest capacity required */
  capacity: z.coerce.number().int().positive().optional(),
  /** Style/theme tag, e.g. "industrial" or "rooftop" */
  style: z.string().optional(),
  /** Free-text location search (case-insensitive contains) */
  location: z.string().optional(),
  /** Event type keyword (matched against styles array) */
  eventType: z.string().optional(),
  /** Minimum budget in venue currency (applied to pricePerDay then pricePerHour) */
  budgetMin: z.coerce.number().positive().optional(),
  /** Maximum budget in venue currency */
  budgetMax: z.coerce.number().positive().optional(),
  sort: z
    .enum(['newest', 'capacity_asc', 'capacity_desc', 'price_asc', 'price_desc'])
    .optional()
    .default('newest'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type ListVenuesQuery = z.infer<typeof ListVenuesQuerySchema>;

export const VenueIdParamSchema = z
  .string()
  .uuid({ message: 'Venue ID must be a valid UUID' });

export type PricingJson = {
  currency: string;
  pricePerHour?: number;
  pricePerDay?: number;
  minimumHours?: number;
};
