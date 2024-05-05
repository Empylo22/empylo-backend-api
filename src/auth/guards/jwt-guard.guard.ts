// import { AuthGuard } from '@nestjs/passport';

// export class JwtAuthGuard extends AuthGuard('jwt') {
//   constructor() {
//     super();
//   }
// }

//src/auth/jwt-auth.guard.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JsonWebTokenError } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: any, status: any) {
    // console.log(info);
    if (info instanceof JsonWebTokenError) {
      throw new UnauthorizedException('Invalid Token!');
    }

    return super.handleRequest(err, user, info, context, status);
  }
}

// jwt-auth.guard.ts
// import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { AuthGuard } from '@nestjs/passport';
// // import { JwtProtected } from './jwt.decorator';

// @Injectable()
// export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
//   constructor(private readonly reflector: Reflector) {
//     super({ passport: true });
//   }

//   canActivate(context: ExecutionContext) {
//     const isJwtProtected = this.reflector.get<boolean>(
//       'jwtProtected',
//       context.getHandler(),
//     );

//     if (!isJwtProtected) {
//       return true; // Allow access if JwtProtected decorator is not present
//     }

//     const request = context.switchToHttp().getRequest();
//     const url = request.url;
//     const pattern = /login|user-register|api-json|token/;

//     if (pattern.test(url)) {
//       return true; // Allow access if URL matches the pattern
//     }

//     return super.canActivate(context); // Continue with JWT authentication for other routes
//   }
// }
