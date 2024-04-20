import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { OtpObject, User, ResetToken, ActivationToken } from '@prisma/client';
import otpGenerator from 'otp-generator';
import crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  comparePassword,
  createOTPToken,
  hashFunction,
} from 'src/common/utils';
import { OtpDto } from './dto/resend-code.dto';
import { PasswordResetDto } from './dto/password-reset.dto';
import { MailService } from 'src/mail/mail.service';
import {
  ChangePasswordDto,
  GettingStartedUpdateProfileDto,
} from 'src/auth/dto/auth.dto';
import { S3UploadService } from 'src/config/upload.service';

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
      throw new BadRequestException(error.message);
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

  async generateOtp(user: User): Promise<any> {
    const otp = otpGenerator.generate(6, {
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const otpToken = await createOTPToken();

    const payload = {
      sub: user,
    };

    const currentDate = new Date();
    const jwtString = await this.jwtService.signAsync(payload);

    console.log(new Date(currentDate.getTime() + 5 * 60000));

    await this.prisma.otpObject.create({
      data: {
        otp,
        user: {
          connect: {
            id: user.id,
          },
        },
        jwt: jwtString.toString(),
        expiryDate: new Date(currentDate.getTime() + 5 * 60000),
      },
    });

    // await this.prisma.tokenManager.create({
    //   data: {
    //     token: otpToken,
    //     expiryDate: new Date(currentDate.getTime() + 5 * 60000),
    //     user: { connect: { id: user.id } },
    //     operationType: 'Two Step Verification',
    //   },
    // });

    // const mailPayload: SendOtpDto = {
    //   receiverEmail: user.email,
    //   receiverName: user.first_name,
    //   otp,
    // };

    // this.publisherService.sendOtpMail(mailPayload);

    return 'Check Mail for otp';
  }

  async verifyOtp(otp: string, email: string): Promise<OtpObject> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const verifiedOtp = await this.prisma.otpObject.findFirst({
      where: {
        otp,
        user: { email },
      },
    });

    if (!verifiedOtp) {
      throw new HttpException('Invalid otp.', HttpStatus.BAD_REQUEST);
    }

    if (verifiedOtp.expiryDate < new Date()) {
      throw new HttpException(
        'Otp has expired. Please generate a new one.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (verifiedOtp.isUsed) {
      throw new HttpException('Otp has been used', HttpStatus.BAD_REQUEST);
    }

    await this.prisma.otpObject.updateMany({
      where: { userId: user.id },
      data: { isUsed: true },
    });

    return verifiedOtp;
  }

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async disableOtpJob(): Promise<void> {
    const expiredOtps = await this.prisma.otpObject.findMany({
      where: {
        expiryDate: { lt: new Date() },
        isUsed: false,
      },
    });

    await this.prisma.otpObject.updateMany({
      where: { id: { in: expiredOtps.map((otp) => otp.id) } },
      data: { isUsed: true },
    });
  }

  async deleteUser(userId: number): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new HttpException(
        'No user found for specified id.',
        HttpStatus.NOT_FOUND,
      );
    }

    user.isDeleted = true;

    await this.prisma.user.update({
      where: { id: userId },
      data: { isDeleted: true },
    });

    return 'User deleted successfully';
  }

  async forgetPassword(resendCodeDto: OtpDto, req: any): Promise<string> {
    const { email } = resendCodeDto;
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new HttpException(
        'Error: Invalid user email.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!user.isActivated) {
      throw new HttpException('User is deactivated.', HttpStatus.BAD_REQUEST);
    }

    if (user.isDeleted) {
      throw new HttpException('User is deleted.', HttpStatus.BAD_REQUEST);
    }

    // const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await this.hashFunction(resetToken);

    await this.createResetToken(user, hashedToken, 10);

    // const mailPayload: SendPasswordResetDto = {
    //   receiverEmail: user.email,
    //   receiverName: user.first_name,
    //   resetToken,
    // };

    return 'Check Mail for next steps';
  }

  async activateAccount(
    token: string,
    passwordResetDto: PasswordResetDto,
    req: any,
  ): Promise<User | null> {
    const { password } = passwordResetDto;

    const activationToken = await this.prisma.activationToken.findFirst({
      where: { token },
      include: { user: true },
    });

    if (!activationToken || activationToken.expiryDate < new Date()) {
      throw new BadRequestException('Invalid or expired activation token.');
    }

    if (!password) {
      throw new BadRequestException('Please provide an activation password.');
    }

    const updatedUser = await this.resetUserPassword(
      activationToken.user.email,
      password,
      req,
    );

    await this.prisma.activationToken.delete({
      where: { id: activationToken.id },
    });

    return updatedUser;
  }

  async passwordReset(
    token: string,
    passwordResetDto: PasswordResetDto,
    req: any,
  ): Promise<User | null> {
    const { password } = passwordResetDto;

    const resetToken = await this.prisma.resetToken.findFirst({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.expiryDate < new Date()) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    if (!password) {
      throw new BadRequestException('Please provide a reset password.');
    }

    const updatedUser = await this.resetUserPassword(
      resetToken.user.email,
      password,
      req,
    );

    await this.prisma.resetToken.deleteMany({
      where: { userId: resetToken.user.id },
    });

    return updatedUser;
  }

  //v1
  // async createActivationToken(
  //   user: User,
  //   token: string,
  //   duration: number,
  // ): Promise<ActivationToken> {
  //   const expiryDate = new Date(Date.now() + duration * 60000);

  //   return this.prisma.activationToken.create({
  //     data: { user: { connect: { id: user.id } }, token, expiryDate },
  //   });
  // }

  //v2
  async createActivationToken(
    user: User,
    token: string,
    duration: number,
  ): Promise<ActivationToken> {
    const expiryDate = new Date(Date.now() + duration * 60000);

    try {
      return await this.prisma.activationToken.create({
        data: { user: { connect: { id: user.id } }, token, expiryDate },
      });
    } catch (error) {
      console.error('Error creating activation token:', error);
      throw new Error('Failed to create activation token');
    }
  }

  //v3
  // async createActivationToken(
  //   user: User,
  //   token: string,
  //   expiryDate: Date,
  // ): Promise<ActivationToken> {
  //   try {
  //     return await this.prisma.activationToken.create({
  //       data: {
  //         token,
  //         expiryDate,
  //         user: { connect: { id: user.id } },
  //       },
  //     });
  //   } catch (error) {
  //     console.error('Error creating activation token:', error);
  //     throw new Error('Failed to create activation token');
  //   }
  // }
  async createResetToken(
    user: User,
    token: string,
    duration: number,
  ): Promise<ResetToken> {
    const expiryDate = new Date(Date.now() + duration * 60000);

    return this.prisma.resetToken.create({
      data: { user: { connect: { id: user.id } }, token, expiryDate },
    });
  }

  async getAllResetTokenByEmail(email: string): Promise<ResetToken[]> {
    return this.prisma.resetToken.findMany({
      where: { user: { email: { contains: email } } },
    });
  }

  async getAllResetToken(): Promise<ResetToken[]> {
    return this.prisma.resetToken.findMany();
  }

  async getAllActivationToken(): Promise<ActivationToken[]> {
    return this.prisma.activationToken.findMany();
  }

  async deleteAllResetTokenByUser(
    resetTokenObjects: ResetToken[],
  ): Promise<void> {
    await this.prisma.resetToken.deleteMany({
      where: { id: { in: resetTokenObjects.map((rt) => rt.id) } },
    });
  }

  async resetUserPassword(
    email: string,
    password: string,
    req: any,
  ): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new BadRequestException('Invalid email.');
    }

    const hashedPassword = await this.hashFunction(password);
    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    delete updatedUser.password;
    return updatedUser;
  }

  async activateAccountHelper(
    email: string,
    password: string,
    req: any,
  ): Promise<User | null> {
    const userFromDb = await this.prisma.user.findUnique({ where: { email } });

    if (!userFromDb) {
      throw new BadRequestException('Invalid email.');
    }

    const hashedPassword = await this.hashFunction(password);
    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword, isActivated: true },
    });

    delete updatedUser.password;
    return updatedUser;
  }

  async hashFunction(password: string) {
    const salt = await bcrypt.genSaltSync(10);
    return await bcrypt.hashSync(password, salt);
  }
}
