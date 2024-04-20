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
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { BaseResponse } from 'src/common/utils';
import {
  ChangePasswordDto,
  GettingStartedUpdateProfileDto,
} from 'src/auth/dto/auth.dto';

@Controller('user')
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiResponse({
    status: 200,
    description: 'The User basic info has ben updated.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: GettingStartedUpdateProfileDto })
  @Patch('update-basic-info/:userId')
  @UseInterceptors(FileInterceptor('profileImage'))
  public async updateBasicInfo(
    @UploadedFile()
    profileImage: Express.Multer.File,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateBasicInfoDto: GettingStartedUpdateProfileDto,
  ): Promise<BaseResponse> {
    try {
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
    } catch (error) {
      return {
        message: error.message || 'An error occurred.',
        status: HttpStatus.BAD_REQUEST,
        // error: error.stack,
      };
    }
  }

  @Patch('changePassword/:id')
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
