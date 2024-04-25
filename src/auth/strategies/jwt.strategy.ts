import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private prisma: PrismaService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  // async validate(payload: { userId: number }) {
  //   console.log(payload);
  //   const user = await this.prisma.user.findUnique({
  //     where: {
  //       id: payload.userId,
  //     },
  //   });
  //   if (!user) {
  //     throw new UnauthorizedException();
  //   }
  //   return user;
  // }

  async validate(payload: any) {
    // console.log(payload);

    if (!payload.sub || !payload.sub.id) {
      throw new UnauthorizedException('Invalid JWT payload');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub.id,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}

// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { PrismaService } from '../../prisma/prisma.service';

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
//   constructor(
//     config: ConfigService,
//     private prisma: PrismaService,
//   ) {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       secretOrKey: config.get('JWT_SECRET'),
//     });
//   }

//   async validate(payload: { sub: number; email: string }) {
//     console.log(payload.sub);
//     const user = await this.prisma.user.findUnique({
//       where: {
//         id: payload.sub,
//       },
//     });
//     delete user.password;
//     return user;
//   }
// }

// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ConfigService } from '@nestjs/config';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { JwtService } from '@nestjs/jwt';
// import { UserService } from 'src/user/user.service';

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
//   constructor(
//     private usersService: UserService,
//     private jwt: JwtService,
//     config: ConfigService,
//   ) {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       secretOrKey: config.get('JWT_SECRET'), // Replace with your secret key
//     });
//   }

//   async validateJwtAndLog(req: any) {
//     console.log(req);
//     const bearerAuth = req.headers.authorization;
//     const url = req.originalUrl;
//     const pattern = /login|user-register|api-json|token/;
//     if (pattern.test(url)) {
//       return;
//     }
//     if (!bearerAuth) {
//       throw new UnauthorizedException('No authorization header.');
//     }

//     const token = bearerAuth.replace('Bearer ', '');

//     if (!token) {
//       throw new UnauthorizedException('No token provided.');
//     } else {
//       try {
//         this.jwt.verify(token, {
//           secret: 'jwtConstants.secret',
//         });

//         const decodedJwt = this.jwt.decode(token);

//         const user = decodedJwt?.sub;

//         return user;
//       } catch (error) {
//         throw new UnauthorizedException(error.message);
//       }
//     }
//   }

//   async validate(payload: { userId: number }, req: any) {
//     await this.validateJwtAndLog(req);
//     console.log(payload.userId);

//     const user = await this.usersService.findById(payload.userId);

//     if (!user) {
//       throw new UnauthorizedException();
//     }

//     return user;
//   }
// }
