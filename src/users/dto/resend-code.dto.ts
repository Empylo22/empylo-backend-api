import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OtpDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export interface SendOtpDto {
  receiverEmail: string;
  receiverName: string;
  otp: string;
}

export interface SendPasswordResetDto {
  receiverEmail: string;
  receiverName: string;
  resetToken: string;
}
