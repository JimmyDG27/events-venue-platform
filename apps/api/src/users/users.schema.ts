import { z } from 'zod';

export const UpdateProfileSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(30).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const UpdateNotificationsSchema = z.object({
  bookingUpdates: z.boolean().optional(),
  viewingReminders: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
export type UpdateNotificationsDto = z.infer<typeof UpdateNotificationsSchema>;
