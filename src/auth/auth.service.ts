import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import {
  hashFunction,
  comparePassword,
  createOTPToken,
} from 'src/common/utils';
import { UserService } from 'src/users/user.service';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CompanySignUpDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  UserGettingStartedDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    // @Inject(forwardRef(() => UserService))
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  //v2
  async userGettingStarted(dto: UserGettingStartedDto): Promise<string> {
    const { email, password, termsConditions } = dto;

    const foundUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (foundUser) {
      throw new BadRequestException(
        'User with the specified email already exists.',
      );
    }

    const otpToken = await createOTPToken();
    // const hashedToken = await hashFunction(otpToken);
    const hashedPassword = await hashFunction(password);

    try {
      await this.prisma.$transaction(async (prisma) => {
        const createdUser = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            termsConditions,
          },
        });

        const expiryDate = new Date(Date.now() + 10 * 60000); // 2880 minutes = 2 days

        const activationToken = await prisma.tokenManager.create({
          data: {
            token: otpToken,
            expiryDate,
            user: { connect: { id: createdUser.id } },
            operationType: 'Email Verification',
          },
        });

        await this.mailService.userSignUp({
          to: email,
          data: {
            code: otpToken.toString(),
          },
        });

        return { createdUser, activationToken };
      });

      // await this.mailService.userSignUp({
      //   to: email,
      //   data: {
      //     code: otpToken.toString(),
      //   },
      // });

      return 'Account successfully created. Check email for verification code';
    } catch (error) {
      console.error('Error creating user or activation token:', error);
      // throw new BadRequestException(
      //   'An error occurred during account creation',
      // );
      throw error;
    }
  }

  async companySignUp(dto: CompanySignUpDto): Promise<string> {
    const { email, password, ...companyDto } = dto;

    const foundUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (foundUser) {
      throw new BadRequestException(
        'User with the specified email already exists.',
      );
    }

    const otpToken = await createOTPToken();
    const hashedPassword = await hashFunction(password);
    console.log(hashedPassword);
    try {
      await this.prisma.$transaction(
        async (prisma) => {
          const createdUser = await prisma.user.create({
            data: {
              password: hashedPassword,
              accountType: 'company',
              email,
              ...companyDto,
            },
          });

          const expiryDate = new Date(Date.now() + 10 * 60000); // 2880 minutes = 2 days

          const activationToken = await prisma.tokenManager.create({
            data: {
              token: otpToken,
              expiryDate,
              user: { connect: { id: createdUser.id } },
              operationType: 'Email Verification',
            },
          });

          await this.mailService.userSignUp({
            to: email,
            data: {
              code: otpToken.toString(),
            },
          });

          return { createdUser, activationToken };
        },
        {
          timeout: 30000, // Increase timeout to 10000 milliseconds (10 seconds)
        },
      );

      // await this.mailService.userSignUp({
      //   to: email,
      //   data: {
      //     code: otpToken.toString(),
      //   },
      // });

      return 'Account successfully created. Check email for verification code';
    } catch (error) {
      console.error('Error creating user or activation token:', error);
      // throw new BadRequestException(
      //   'An error occurred during account creation',
      // );
      throw error;
    }
  }

  async resendVerificationOtp(dto: ForgotPasswordDto): Promise<string> {
    const { email } = dto;

    const foundUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!foundUser) {
      throw new BadRequestException(
        'User with the specified email does not exist.',
      );
    }

    const existingToken = await this.prisma.tokenManager.findFirst({
      where: {
        userId: foundUser.id,
        operationType: 'Email Verification',
      },
    });

    if (existingToken) {
      await this.prisma.tokenManager.delete({
        where: { id: existingToken.id },
      });
    }

    const otpToken = await createOTPToken();
    const expiryDate = new Date(Date.now() + 10 * 60000); // 10 minutes

    await this.prisma.tokenManager.create({
      data: {
        token: otpToken,
        expiryDate,
        user: { connect: { id: foundUser.id } },
        operationType: 'Email Verification',
      },
    });

    await this.mailService.userSignUp({
      to: email,
      data: {
        code: otpToken.toString(),
      },
    });

    return 'Verification code resent successfully. Check your email.';
  }

  //v3
  // async userGettingStarted(dto: UserGettingStartedDto): Promise<any> {
  //   const { email, password, termsConditions } = dto;

  //   const foundUser = await this.prisma.user.findUnique({
  //     where: { email },
  //   });

  //   if (foundUser) {
  //     throw new BadRequestException('Email is already exist');
  //   }

  //   const otpToken = await createOTPToken();
  //   const hashedToken = await hashFunction(otpToken);
  //   const hashedPassword = await hashFunction(password);

  //   try {
  //     const createdUser = await this.prisma.$transaction(async (prisma) => {
  //       const newUser = await prisma.user.create({
  //         data: {
  //           email,
  //           createdAt: new Date(),
  //           password: hashedPassword,
  //           status: 'pending',
  //           isEmailVerified: false,
  //           termsConditions,
  //         },
  //       });

  //       // Create the ActivationToken after the User record has been created
  //       const expiryDate = new Date(Date.now() + 2880 * 60000); // 2880 minutes = 2 days
  //       const activationToken = await this.userService.createActivationToken(
  //         newUser,
  //         hashedToken,
  //         288,
  //       );

  //       return newUser;
  //     });

  //     await this.mailService.userSignUp({
  //       to: email,
  //       data: {
  //         code: otpToken.toString(),
  //       },
  //     });

  //     return {
  //       message:
  //         'Account successfully created. Check email for verification code',
  //     };
  //   } catch (error) {
  //     console.error('Error creating user or activation token:', error);
  //     throw new BadRequestException(
  //       'An error occurred during account creation',
  //     );
  //   }
  // }

  //v1
  // async userGettingStarted(dto: UserGettingStartedDto): Promise<any> {
  //   const { email, password, termsConditions } = dto;

  //   const foundUser = await this.prisma.user.findUnique({
  //     where: { email },
  //   });

  //   console.log(foundUser);

  //   if (foundUser) {
  //     throw new BadRequestException('Email is already exist');
  //   }

  //   // const code = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

  //   const otpToken = await createOTPToken();
  //   console.log(otpToken);
  //   const hashedToken = await hashFunction(otpToken);

  //   const hashedPassword = await hashFunction(password);

  //   try {
  //     await this.prisma.$transaction(async (prisma) => {
  //       const newUser = await prisma.user.create({
  //         data: {
  //           email,
  //           createdAt: new Date(),
  //           password: hashedPassword,
  //           status: 'pending',
  //           isEmailVerified: false,
  //           // verificationCode: otpToken.toString(),
  //           termsConditions,
  //         },
  //       });

  //       console.log(newUser);

  //       await this.userService.createActivationToken(
  //         newUser,
  //         hashedToken,
  //         2880,
  //       );

  //       try {
  //         await this.mailService.userSignUp({
  //           to: email,
  //           data: {
  //             code: otpToken.toString(),
  //           },
  //         });

  //         return newUser;
  //       } catch (error) {
  //         // If there's an error sending the mail, rollback the user creation
  //         // throw new BadRequestException('Error sending verification email');
  //         throw new BadRequestException(
  //           'An error occured! Please try again later',
  //         );
  //       }
  //     });

  //     return {
  //       message:
  //         'Account successfully created. Check email for verification code',
  //     };
  //   } catch (error) {
  //     // If there's an error during the transaction, return the error message
  //     throw new BadRequestException(error.message);
  //   }
  // }

  async verifyEmailOtp(token: string): Promise<any> {
    const emailToken = await this.prisma.tokenManager.findFirst({
      where: {
        token,
        expiryDate: { gt: new Date() },
        operationType: 'Email Verification',
      },
    });

    if (!emailToken) {
      throw new BadRequestException('Token is invalid or has expired');
    }

    if (emailToken.isUsed) {
      throw new BadRequestException('Token has been used');
    }

    const data = {
      isEmailVerified: true,
      status: 'active',
      isActivated: true,
      // updatedAt: new Date(),
    };

    const updatedUser = await this.prisma.user.update({
      where: { id: emailToken.userId },
      data,
    });

    if (!updatedUser) {
      throw new BadRequestException('Failed to verify token');
    }

    await this.prisma.tokenManager.update({
      where: { id: emailToken.id },
      data: { isUsed: true },
    });

    return 'Email verification successful';
    // const payload = {
    //   sub: updatedUser,
    // };
    // delete updatedUser.password;
    // return {
    //   accessToken: await this.jwtService.signAsync(payload),
    //   user: updatedUser,
    // };
  }

  async generateAndTwoStepOTP(user: User): Promise<any> {
    const otpToken = await createOTPToken();

    try {
      await this.prisma.$transaction(async (prisma) => {
        const expiryDate = new Date(Date.now() + 10 * 60000); // 2880 minutes = 2 days

        const activationToken = await prisma.tokenManager.create({
          data: {
            token: otpToken,
            expiryDate,
            user: { connect: { id: user.id } },
            operationType: 'Two Step Verification',
          },
        });

        return { activationToken };
      });

      await this.mailService.userSignUp({
        to: user?.email,
        data: {
          code: otpToken.toString(),
        },
      });

      return 'Check your mail for two step verification code';
    } catch (error) {
      console.error('Error creating user or activation token:', error);
      // throw new BadRequestException('An error occurred! Try again later');
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: User }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (
      !existingUser ||
      !(await comparePassword(dto.password, existingUser.password))
    ) {
      throw new BadRequestException(
        'Invalid email or password. Please check your credentials and try again.',
      );
    }

    if (existingUser.isEmailVerified == false) {
      throw new BadRequestException(
        'Kindly verify your email to continue login.',
      );
    }

    if (existingUser.isDeleted == true) {
      throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
    }

    if (existingUser.isActivated == false) {
      throw new HttpException(
        'Your account has been deactivated. Please contact support for assistance.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (existingUser.twoStepVerification) {
      return await this.generateAndTwoStepOTP(existingUser);
    } else {
      const payload = {
        sub: existingUser,
      };
      delete existingUser.password;
      return {
        accessToken: await this.jwtService.signAsync(payload),
        user: existingUser,
      };
    }
  }

  async loginWithTwoStepVerication(
    token: string,
  ): Promise<{ accessToken: string; user: User }> {
    const twoStepToken = await this.prisma.tokenManager.findFirst({
      where: {
        token,
        expiryDate: { gt: new Date() },
        operationType: 'Two Step Verification',
      },
    });

    // console.log(twoStepToken);

    if (!twoStepToken) {
      throw new BadRequestException(
        'Two step verification code is invalid or has expired',
      );
    }

    if (twoStepToken.isUsed) {
      throw new BadRequestException('Two step verification code has been used');
    }

    const foundUserWithCode = await this.prisma.user.findFirst({
      where: { id: twoStepToken.userId },
    });

    if (foundUserWithCode.isDeleted == true) {
      throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
    }

    if (foundUserWithCode.isActivated == false) {
      throw new HttpException(
        'Your account has been deactivated. Please contact support for assistance.',
        HttpStatus.NOT_FOUND,
      );
    }

    const payload = {
      sub: foundUserWithCode,
    };
    delete foundUserWithCode.password;
    await this.prisma.tokenManager.update({
      where: { id: twoStepToken.id },
      data: { isUsed: true },
    });

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: foundUserWithCode,
    };
  }

  async forgetPassword(forgotPasswordDto: ForgotPasswordDto): Promise<string> {
    const { email } = forgotPasswordDto;
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new HttpException(
        'There is no user with email address.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (user.isDeleted) {
      throw new HttpException('User is deleted.', HttpStatus.BAD_REQUEST);
    }

    if (!user.isActivated) {
      throw new HttpException(
        'Your account has been deactivated. Please contact support for assistance',
        HttpStatus.BAD_REQUEST,
      );
    }

    const otpToken = await createOTPToken();

    try {
      await this.userService.generateOTP(otpToken, 10, 'Password Reset', user);

      const email = await this.mailService.forgotPassword({
        to: user.email,
        data: {
          name: user.firstName,
          code: otpToken,
        },
      });

      console.log(email);

      return 'Check Mail for next steps';
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'An error occurred! Try again later',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async resetPassword(
    dto: ResetPasswordDto,
  ): Promise<{ message: string; accessToken: string; user: User }> {
    const { token, newPassword } = dto;
    const passwordResetToken = await this.prisma.tokenManager.findFirst({
      where: {
        token,
        expiryDate: { gt: new Date() },
        operationType: 'Password Reset',
      },
    });

    // console.log(passwordResetToken);

    if (!passwordResetToken) {
      throw new BadRequestException(
        'Password Reset code is invalid or has expired',
      );
    }

    if (passwordResetToken.isUsed) {
      throw new BadRequestException('Password Reset code has been used');
    }

    const foundUserWithCode = await this.prisma.user.findFirst({
      where: { id: passwordResetToken.userId },
    });

    if (foundUserWithCode.isEmailVerified == false) {
      throw new BadRequestException(
        'Kindly verify your email to continue login.',
      );
    }

    if (foundUserWithCode.isDeleted == true) {
      throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
    }

    if (foundUserWithCode.isActivated == false) {
      throw new HttpException(
        'Your account has been deactivated. Please contact support for assistance.',
        HttpStatus.NOT_FOUND,
      );
    }

    const hashedPassword = await hashFunction(newPassword);

    const userUpatedPassword = await this.prisma.user.update({
      where: { id: foundUserWithCode.id },
      data: { password: hashedPassword },
    });
    delete userUpatedPassword.password;

    const payload = {
      sub: userUpatedPassword,
    };

    await this.prisma.tokenManager.update({
      where: { id: passwordResetToken.id },
      data: { isUsed: true },
    });

    return {
      message: 'Your password has been successfully reset',
      accessToken: await this.jwtService.signAsync(payload),
      user: userUpatedPassword,
    };
  }
}
