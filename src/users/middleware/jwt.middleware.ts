import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';
// import { JwtStrategy } from './jwt.strategy'; // Assuming JwtStrategy is in the same directory

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(private readonly jwtStrategy: JwtStrategy) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Authorization token is missing');
    }

    // Delegate to JwtStrategy for validation
    // await this.jwtStrategy.validateToken(token);

    next();
  }
}
