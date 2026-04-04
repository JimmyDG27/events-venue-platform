import { ViewingStatus } from '@prisma/client';
import { z } from 'zod';

export const CreateViewingSchema = z.object({
  venueId: z.string().uuid('venueId must be a valid UUID'),
  scheduledAt: z.coerce
    .date()
    .refine((d) => d > new Date(), { message: 'scheduledAt must be in the future' }),
});

export type CreateViewingDto = z.infer<typeof CreateViewingSchema>;

export const UpdateViewingSchema = z
  .object({
    scheduledAt: z.coerce
      .date()
      .refine((d) => d > new Date(), { message: 'scheduledAt must be in the future' })
      .optional(),
    status: z.nativeEnum(ViewingStatus).optional(),
  })
  .refine((d) => d.scheduledAt !== undefined || d.status !== undefined, {
    message: 'At least one of scheduledAt or status must be provided',
  });

export type UpdateViewingDto = z.infer<typeof UpdateViewingSchema>;

export const ListViewingsQuerySchema = z.object({
  /** Filter to only upcoming (scheduled, future) or past viewings */
  filter: z.enum(['upcoming', 'past', 'all']).optional().default('all'),
});

export type ListViewingsQuery = z.infer<typeof ListViewingsQuerySchema>;

export const ViewingIdParamSchema = z
  .string()
  .uuid({ message: 'Viewing ID must be a valid UUID' });
