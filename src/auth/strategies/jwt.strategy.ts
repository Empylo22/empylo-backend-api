import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private usersService: UserService,
    private jwt: JwtService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'jwtConstants.secret', // Replace with your secret key
    });
  }

  async validateJwtAndLog(req: any) {
    const bearerAuth = req.headers.authorization;
    const url = req.originalUrl;
    const pattern = /login|user-register|api-json|token/;
    if (pattern.test(url)) {
      return;
    }
    if (!bearerAuth) {
      throw new UnauthorizedException('No authorization header.');
    }

    const token = bearerAuth.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('No token provided.');
    } else {
      try {
        this.jwt.verify(token, {
          secret: 'jwtConstants.secret',
        });

        const decodedJwt = this.jwt.decode(token);

        const user = decodedJwt?.sub;

        return user;
      } catch (error) {
        throw new UnauthorizedException(error.message);
      }
    }
  }

  async validate(payload: { userId: number }, req: any) {
    await this.validateJwtAndLog(req);

    const user = await this.usersService.findById(payload.userId);

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
