import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { RolesModule } from './roles/roles.module';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './auth/guards/jwt-guard.guard';
import { MailService } from './mail/mail.service';
import { MailerService } from './mailer/mailer.service';
import { CirclesModule } from './circles/circles.module';
import { providePrismaClientExceptionFilter } from 'nestjs-prisma';
import { AllExceptionsFilter } from './common/error/all-exceptions.filter.ts';
import { CompanyModule } from './company/company.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { UploadServiceModule } from './upload-service/upload-service.module';
// import {
//   LocalUploadService,
//   S3UploadService,
// } from './upload-service/upload.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // load: [config],
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    RolesModule,
    CirclesModule,
    CompanyModule,
    AssessmentsModule,
    UploadServiceModule,
  ],
  controllers: [AppController],
  providers: [
    providePrismaClientExceptionFilter(),
    JwtService,
    MailService,
    MailerService,
    AppService,
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
    // {
    //   provide: APP_FILTER,
    //   useClass: AllExceptionsFilter,
    // },
  ],
  // exports: [PrismaModule],
})
export class AppModule {}
