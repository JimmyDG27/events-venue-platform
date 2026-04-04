import { RequestStatus } from '@prisma/client';
import { z } from 'zod';

export const CreateRequestSchema = z
  .object({
    venueId: z.string().uuid('venueId must be a valid UUID'),
    dateFrom: z.coerce.date(),
    dateTo: z.coerce.date(),
    guests: z.number().int().positive('guests must be a positive integer'),
    eventType: z.string().min(1).max(100),
    message: z.string().max(1000).optional(),
  })
  .refine((d) => d.dateTo > d.dateFrom, {
    message: 'dateTo must be after dateFrom',
    path: ['dateTo'],
  });

export type CreateRequestDto = z.infer<typeof CreateRequestSchema>;

export const ListRequestsQuerySchema = z.object({
  status: z.nativeEnum(RequestStatus).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type ListRequestsQuery = z.infer<typeof ListRequestsQuerySchema>;

export const UpdateRequestStatusSchema = z.object({
  status: z.nativeEnum(RequestStatus),
});

export type UpdateRequestStatusDto = z.infer<typeof UpdateRequestStatusSchema>;

export const RequestIdParamSchema = z
  .string()
  .uuid({ message: 'Request ID must be a valid UUID' });
