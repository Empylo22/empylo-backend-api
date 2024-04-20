import { SetMetadata } from '@nestjs/common';

export const JwtProtected = () => SetMetadata('jwtProtected', true);
