import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
  phone: z.string().max(30).optional(),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginDto = z.infer<typeof LoginSchema>;

export const VerifyEmailQuerySchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export type VerifyEmailQuery = z.infer<typeof VerifyEmailQuerySchema>;
