import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';

import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { BaseResponse } from 'src/common/utils';
import {
  ChangePasswordDto,
  GettingStartedUpdateProfileDto,
} from 'src/auth/dto/auth.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard.guard';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user')
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiResponse({
    status: 200,
    description: 'The User has successfully been retrieved.',
  })
  @Get('get-user-info/:userId')
  public async findById(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<BaseResponse> {
    const updatedUser = await this.userService.findById(userId);
    return {
      message: 'User retrieved successfully.',
      status: HttpStatus.OK,
      result: updatedUser,
    };
    // try {

    // } catch (error) {
    //   return {
    //     message: error.message || 'An error occurred.',
    //     status: HttpStatus.BAD_REQUEST,
    //     // error: error.stack,
    //   };
    // }
  }

  @ApiResponse({
    status: 200,
    description: 'The user info has ben updated.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: GettingStartedUpdateProfileDto })
  @Patch('update-user-info/:userId')
  @UseInterceptors(FileInterceptor('profileImage'))
  public async updateBasicInfo(
    @UploadedFile()
    profileImage: Express.Multer.File,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateBasicInfoDto: GettingStartedUpdateProfileDto,
  ): Promise<BaseResponse> {
    const updatedUser = await this.userService.userUpdateProfile(
      profileImage,
      userId,
      updateBasicInfoDto,
    );
    return {
      message: 'Profle updated successfully.',
      status: HttpStatus.OK,
      result: updatedUser,
    };
    // try {
    //   const updatedUser = await this.userService.userUpdateProfile(
    //     profileImage,
    //     userId,
    //     updateBasicInfoDto,
    //   );
    //   return {
    //     message: 'Profle updated successfully.',
    //     status: HttpStatus.OK,
    //     result: updatedUser,
    //   };
    // } catch (error) {
    //   return {
    //     message: error.message || 'An error occurred.',
    //     status: HttpStatus.BAD_REQUEST,
    //     // error: error.stack,
    //   };
    // }
  }

  @Patch('change-password/:userId')
  async changePassword(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: ChangePasswordDto,
  ) {
    try {
      const updatedUser = await this.userService.changePassword(userId, dto);
      return {
        message: 'Password updated successfully.',
        status: HttpStatus.OK,
        result: updatedUser,
      };
    } catch (error) {
      return {
        message: error.message || 'An error occurred.',
        status: HttpStatus.BAD_REQUEST,
        // error: error.stack,
      };
    }
  }

  @Patch('activate-two-step-verification/:userId')
  public async activateUserTwoStepVerification(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<BaseResponse> {
    try {
      const updatedUser =
        await this.userService.activateUserTwoStepVerification(userId);
      return {
        message: 'Two step verification activated.',
        status: HttpStatus.OK,
        result: updatedUser,
      };
    } catch (error) {
      return {
        message: error.message || 'An error occurred.',
        status: HttpStatus.BAD_REQUEST,
        // error: error.stack,
      };
    }
  }

  @Patch('deactivate-two-step-verification/:userId')
  public async deactivateUserTwoStepVerification(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<BaseResponse> {
    try {
      const updatedUser =
        await this.userService.deactivateUserTwoStepVerification(userId);
      return {
        message: 'Two step verification deactivated.',
        status: HttpStatus.OK,
        result: updatedUser,
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
