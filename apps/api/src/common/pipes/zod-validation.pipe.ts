import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';

/**
 * Validates incoming request data against a Zod schema.
 * Use as a method-level pipe: @Body(new ZodValidationPipe(schema))
 *
 * Throws BadRequestException with a list of field-level messages on failure.
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const messages = result.error.errors.map((e) => {
        const path = e.path.length > 0 ? `${e.path.join('.')}: ` : '';
        return `${path}${e.message}`;
      });
      throw new BadRequestException(messages);
    }

    return result.data;
  }
}
