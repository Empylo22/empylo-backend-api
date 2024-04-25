import { UnauthorizedException } from '@nestjs/common';

export class CustomUnauthorizedException extends UnauthorizedException {
  constructor(message: string) {
    super(message, 'Custom Unauthorized Exception');
  }
}
