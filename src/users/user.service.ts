import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

import { comparePassword, hashFunction } from 'src/common/utils';
import { MailService } from 'src/mail/mail.service';
import {
  ChangePasswordDto,
  GettingStartedUpdateProfileDto,
} from 'src/auth/dto/auth.dto';
import { S3UploadService } from 'src/upload-service/upload.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly s3UploadService: S3UploadService,
  ) {}

  async userUpdateProfile(
    profileImage: any,
    userId: number,
    dto: GettingStartedUpdateProfileDto,
  ): Promise<User> {
    try {
      const {
        accountType,
        firstName,
        lastName,
        ageRange,
        ethnicity,
        maritalStatus,
        department,
        jobRole,
        gender,
        DOB,
        address,
        disability,
      } = dto;

      const foundUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!foundUser) {
        throw new BadRequestException('User not found');
      }

      if (!accountType) {
        throw new BadRequestException('Account type is required');
      }

      const saveData: Record<string, any> = {};

      if (accountType) saveData.accountType = accountType;
      if (firstName) saveData.firstName = firstName;
      if (lastName) saveData.lastName = lastName;
      if (ageRange) saveData.ageRange = ageRange;
      if (ethnicity) saveData.ethnicity = ethnicity;
      if (maritalStatus) saveData.maritalStatus = maritalStatus;
      if (department) saveData.department = department;
      if (jobRole) saveData.jobRole = jobRole;
      if (gender) saveData.gender = gender;
      if (DOB) saveData.DOB = DOB;
      if (address) saveData.address = address;
      if (disability) saveData.disability = disability;
      if (profileImage) {
        const fileUrl = await this.s3UploadService.uploadFile(profileImage);
        // console.log(fileUrl);
        saveData.profileImage = fileUrl;
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: saveData,
      });

      delete updatedUser.password;

      if (updatedUser) {
        return updatedUser;
      } else {
        throw new BadRequestException('Failed to update profile');
      }
    } catch (error) {
      // throw new BadRequestException(error.message);
      throw error;
    }
  }

  async changePassword(id: number, dto: ChangePasswordDto): Promise<User> {
    const { currentPassword, newPassword } = dto;

    const foundUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!foundUser) {
      throw new BadRequestException('User not found');
    }

    const isMatch = await comparePassword(currentPassword, foundUser.password);

    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await hashFunction(newPassword);

    const data = {
      password: hashedPassword,
      passwordResetCode: null,
      updatedAt: new Date(),
    };

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });

    if (!updatedUser) {
      throw new BadRequestException('Failed to update user password');
    }

    delete updatedUser.password;

    return updatedUser;
  }

  async activateUserTwoStepVerification(userId: number): Promise<User> {
    const userFromDb = await this.findById(userId);

    if (!userFromDb) {
      throw new HttpException(
        'No user found for specified id.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (userFromDb.twoStepVerification) {
      throw new HttpException(
        'User two-step verification is already activated',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { twoStepVerification: true },
    });

    if (!updatedUser) {
      throw new HttpException(
        'Unable to activate user two-step verification.',
        HttpStatus.BAD_REQUEST,
      );
    }

    delete updatedUser.password;
    return updatedUser;
  }

  async deactivateUserTwoStepVerification(userId: number): Promise<User> {
    const userFromDb = await this.findById(userId);

    if (!userFromDb) {
      throw new HttpException(
        'No user found for specified id.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (!userFromDb.twoStepVerification) {
      throw new HttpException(
        'User two-step verification is already deactivated',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { twoStepVerification: false },
    });

    if (!updatedUser) {
      throw new HttpException(
        'Unable to deactivate user two-step verification.',
        HttpStatus.BAD_REQUEST,
      );
    }

    delete updatedUser.password;
    return updatedUser;
  }

  async generateOTP(
    token: string,
    duration: 10,
    operationType: string,
    user: User,
  ): Promise<any> {
    const expiryDate = new Date(Date.now() + duration * 60000); // 2880 minutes = 2 days

    const activationToken = await this.prisma.tokenManager.create({
      data: {
        token,
        expiryDate,
        user: { connect: { id: user.id } },
        operationType,
      },
    });

    return activationToken;
  }

  async findById(id: number): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id,
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      delete user.password;
      return user;
    } catch (error) {
      // Handle specific errors if needed
      throw error; // Re-throw the error for global exception handling
    }
  }

  async activateAccountHelper(
    email: string,
    password: string,
  ): Promise<User | null> {
    const userFromDb = await this.prisma.user.findUnique({ where: { email } });

    if (!userFromDb) {
      throw new BadRequestException('Invalid email.');
    }

    const hashedPassword = await hashFunction(password);
    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword, isActivated: true },
    });

    delete updatedUser.password;
    return updatedUser;
  }
}
