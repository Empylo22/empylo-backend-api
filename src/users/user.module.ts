import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtService } from '@nestjs/jwt';

import { PrismaModule } from 'src/prisma/prisma.module';
import { MailModule } from 'src/mail/mail.module';
import { S3UploadService } from 'src/config/upload.service';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [UserController],
  providers: [JwtService, S3UploadService, UserService],
  exports: [UserService],
})
export class UserModule {}
