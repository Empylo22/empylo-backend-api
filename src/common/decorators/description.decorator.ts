// permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const Description = (...description: string[]) =>
  SetMetadata('description', description);
