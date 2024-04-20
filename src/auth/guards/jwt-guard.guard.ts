// jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
// import { JwtProtected } from './jwt.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private readonly reflector: Reflector) {
    super({ passport: true });
  }

  canActivate(context: ExecutionContext) {
    const isJwtProtected = this.reflector.get<boolean>(
      'jwtProtected',
      context.getHandler(),
    );

    if (!isJwtProtected) {
      return true; // Allow access if JwtProtected decorator is not present
    }

    const request = context.switchToHttp().getRequest();
    const url = request.url;
    const pattern = /login|user-register|api-json|token/;

    if (pattern.test(url)) {
      return true; // Allow access if URL matches the pattern
    }

    return super.canActivate(context); // Continue with JWT authentication for other routes
  }
}
