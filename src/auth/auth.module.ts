import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserModule } from 'src/user/user.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailModule } from 'src/mail/mail.module';
import { ConfigService } from '@nestjs/config';
export const jwtSecret = 'zjP9h6ZI5LoSKCRj';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    MailModule,
    // JwtModule.register({
    //   secret: ConfigService.get('JWT_SECRET'),
    //   signOptions: { expiresIn: '7d' }, // e.g. 30s, 7d, 24h
    // }),
    // ConfigModule.forRoot(),
    JwtModule.registerAsync({
      // imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
