import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import {
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  UserGettingStartedDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import {
  GettingStartedUpdateProfileDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import { PasswordResetDto } from 'src/users/dto/password-reset.dto';
import { AuthService } from './auth.service';
import { OtpDto } from 'src/users/dto/resend-code.dto';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { VerifyDto } from './dto/login-user.dto';
import { BaseResponse } from 'src/common/utils';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiBody({ type: UserGettingStartedDto })
  @ApiCreatedResponse({ type: UserGettingStartedDto })
  @Post('user-signup')
  async userGettingStarted(
    @Body() dto: UserGettingStartedDto,
  ): Promise<BaseResponse> {
    const result = await this.authService.userGettingStarted(dto);
    return {
      message: 'User created. Email sent.',
      status: HttpStatus.OK,
      result,
    };
    // try {
    //   const result = await this.authService.userGettingStarted(dto);
    //   return {
    //     message: 'User created. Email sent.',
    //     status: HttpStatus.OK,
    //     result,
    //   };
    // } catch (error) {
    //   return {
    //     message: error.message || 'An error occurred.',
    //     status: HttpStatus.BAD_REQUEST,
    //     // error: error.stack,
    //   };
    // }
  }

  @ApiBody({ type: VerifyDto })
  // @ApiOkResponse({ type: VerifyDto })
  @Post('verify-email-otp')
  async verifyOtp(@Body() verifyDto: VerifyDto): Promise<BaseResponse> {
    try {
      const response = await this.authService.verifyEmailOtp(verifyDto.otp);
      return {
        message: 'Email verification successful.',
        status: HttpStatus.OK,
        result: response,
      };
    } catch (error) {
      return {
        message: error.message || 'An error occurred.',
        status: HttpStatus.BAD_REQUEST,
        // error: error.stack,
      };
    }
  }

  @ApiBody({ type: LoginDto })
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<BaseResponse> {
    try {
      const response = await this.authService.login(loginDto);
      return {
        message: 'Login successful.',
        status: HttpStatus.OK,
        result: response,
      };
    } catch (error) {
      return {
        message: error.message || 'An error occurred.',
        status: HttpStatus.BAD_REQUEST,
        // error: error.stack,
      };
    }
  }

  @ApiBody({ type: VerifyDto })
  @Post('login-with-two-step-verification')
  async loginWithTwoStepVerication(
    @Body() verifyDto: VerifyDto,
  ): Promise<BaseResponse> {
    try {
      const response = await this.authService.loginWithTwoStepVerication(
        verifyDto.otp,
      );
      return {
        message: 'Login.',
        status: HttpStatus.OK,
        result: response,
      };
    } catch (error) {
      return {
        message: error.message || 'An error occurred.',
        status: HttpStatus.BAD_REQUEST,
        // error: error.stack,
      };
    }
  }

  @ApiBody({ type: ForgotPasswordDto })
  @Post('forgot-password')
  async forgetPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<BaseResponse> {
    try {
      const response = await this.authService.forgetPassword(forgotPasswordDto);
      return {
        message: 'Forgot password token sent.',
        status: HttpStatus.OK,
        result: response,
      };
    } catch (error) {
      return {
        message: error.message || 'An error occurred.',
        status: HttpStatus.BAD_REQUEST,
        // error: error.stack,
      };
    }
  }

  @ApiBody({ type: ResetPasswordDto })
  @Patch('password-reset')
  async passwordReset(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<BaseResponse> {
    try {
      const response = await this.authService.resetPassword(resetPasswordDto);
      return {
        message: 'Passwsord successfully reset.',
        status: HttpStatus.OK,
        result: response,
      };
    } catch (error) {
      return {
        message: error.message || 'An error occurred.',
        status: HttpStatus.BAD_REQUEST,
        // error: error.stack,
      };
    }
  }
}
