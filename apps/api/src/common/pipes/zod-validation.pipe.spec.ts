import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  capacity: z.number().int().positive('Capacity must be a positive integer'),
});

describe('ZodValidationPipe', () => {
  let pipe: ZodValidationPipe;

  beforeEach(() => {
    pipe = new ZodValidationPipe(schema);
  });

  it('returns parsed data for a valid payload', () => {
    const result = pipe.transform({ name: 'The Loft', capacity: 150 });
    expect(result).toEqual({ name: 'The Loft', capacity: 150 });
  });

  it('throws BadRequestException for an invalid payload', () => {
    expect(() => pipe.transform({ name: '', capacity: -5 })).toThrow(
      BadRequestException,
    );
  });

  it('includes field-level messages in the exception', () => {
    try {
      pipe.transform({ name: '', capacity: 0 });
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      const response = (err as BadRequestException).getResponse() as Record<string, unknown>;
      expect(Array.isArray(response.message)).toBe(true);
    }
  });

  it('strips unknown fields (Zod strip behaviour)', () => {
    const result = pipe.transform({
      name: 'Grand Hall',
      capacity: 300,
      unknownField: 'should be removed',
    }) as Record<string, unknown>;
    expect(result).not.toHaveProperty('unknownField');
  });

  it('throws for completely missing required fields', () => {
    expect(() => pipe.transform({})).toThrow(BadRequestException);
  });
});
