import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateCircleDto } from './dto/update-circle.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import { Circle, Prisma } from '@prisma/client';
import * as exceljs from 'exceljs';
import { Response } from 'express';
import * as path from 'path';
import { CreateCircleWithMembersDto } from './dto/create-circle-with-members.dto';
import { S3UploadService } from 'src/upload-service/upload.service';

@Injectable()
export class CirclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly s3UploadService: S3UploadService,
  ) {}

  async createCircleWithMembers(
    circleOwnerId: number,
    circleImg: any,
    createCircleWithMembersDto: CreateCircleWithMembersDto,
  ) {
    const { circleMembersEmail, ...circleData } = createCircleWithMembersDto;

    try {
      let existingUserIds: number[] = [];

      // Find the circle owner
      const circleOwner = await this.prisma.user.findUnique({
        where: { id: circleOwnerId },
      });

      if (!circleOwner) {
        throw new NotFoundException('Circle owner not found.');
      }

      // Check if the circle owner's accountType is not 'company'
      if (circleOwner.accountType !== 'company') {
        // Add the circle owner to the members
        existingUserIds = [circleOwnerId];
      }

      if (
        circleMembersEmail &&
        circleMembersEmail.length > 0 &&
        typeof circleMembersEmail === 'string'
      ) {
        const circleMembersEmailArray = (circleMembersEmail as string)
          .split(',')
          .map(String);
        // Find existing users by email
        const users = await this.prisma.user.findMany({
          where: {
            email: {
              in: circleMembersEmailArray,
            },
          },
        });

        const additionalUserIds = users.map((user) => user.id);
        existingUserIds = [...existingUserIds, ...additionalUserIds];
      }

      const baseUrl = 'https://empylo.com';
      const shareLink = await this.generateUniqueCircleShareLink(baseUrl);

      let circleImageUrl: string;
      if (circleImg) {
        circleImageUrl = await this.s3UploadService.uploadFile(circleImg);
      }

      // Create the circle without members first
      const createdCircle = await this.prisma.circle.create({
        data: {
          ...circleData,
          wellbeingScore: circleData.wellbeingScore || null,
          circleStatus: circleData.circleStatus || 'active',
          circleNos: circleData.circleNos || null,
          circleDescription: circleData.circleDescription || '',
          circleScoreDetail: circleData.circleScoreDetail || '',
          activityLevel: circleData.activityLevel || 'Moderate',
          circleName: circleData.circleName || null,
          circleShareLink: shareLink,
          circleOwner: { connect: { id: circleOwnerId } },
          circleImg: circleImageUrl,
        },
      });

      // Obtain the created circle's ID
      const circleId = createdCircle.id;

      // Connect members to the created circle
      await Promise.all(
        existingUserIds.map((userId) =>
          this.prisma.circleMember.create({
            data: {
              userId,
              circleId,
            },
          }),
        ),
      );

      // Include members in the response
      const circleWithMembers = await this.prisma.circle.findUnique({
        where: { id: circleId },
        include: {
          members: true,
        },
      });

      return circleWithMembers;
    } catch (error) {
      throw error;
    }
  }

  async addMemberToCircle(userEmail: string, circleId: number) {
    // Find the user by email
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });

    // Throw an error if the user is not found
    if (!user) {
      throw new NotFoundException(`User with email ${userEmail} not found`);
    }

    try {
      // Check if the user is already a member of the circle
      const existingMember = await this.prisma.circleMember.findFirst({
        where: {
          userId: user.id,
          circleId: circleId,
        },
      });

      // If the user is already a member, throw an error
      if (existingMember) {
        throw new ConflictException(
          `User with email ${userEmail} is already a member of this circle`,
        );
      }

      // Create a new CircleMember entry for the user
      return await this.prisma.circleMember.create({
        data: {
          userId: user.id,
          circleId: circleId,
        },
      });
    } catch (error) {
      // Handle specific Prisma errors and rethrow others
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Circle with id ${circleId} not found`);
        }
      }
      throw error;
    }
  }

  async removeMemberFromCircle(memberId: number, circleId: number) {
    try {
      return await this.prisma.circleMember.delete({
        where: {
          userId_circleId: {
            userId: memberId,
            circleId: circleId,
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Circle or member not found`);
        }
      }
      throw error;
    }
  }

  async getAllMembersOfCircle(circleId: number) {
    try {
      const circle = await this.prisma.circle.findUnique({
        where: { id: circleId },
        include: {
          members: {
            where: { leftAt: null },
            include: {
              user: true,
            },
          },
        },
      });
      if (!circle) {
        throw new NotFoundException(`Circle with id ${circleId} not found`);
      }
      return circle.members;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Circle with id ${circleId} not found`);
        }
      }
      throw error;
    }
  }

  async getAllCirclesUserIsMemberOf(memberId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: memberId },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${memberId} not found`);
    }

    try {
      const circles = await this.prisma.circleMember.findMany({
        where: { userId: memberId },
        include: { circle: true },
      });
      return circles.map((circleMember) => circleMember.circle);
    } catch (error) {
      throw error;
    }
  }

  async getAllCirclesCreatedByUser(memberId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: memberId },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${memberId} not found`);
    }

    try {
      return await this.prisma.circle.findMany({
        where: { circleOwncerId: memberId },
      });
    } catch (error) {
      throw error;
    }
  }

  async joinCircleByShareLink(
    shareLink: string,
    userEmail: string,
  ): Promise<Circle | null> {
    try {
      // Verify the validity of the share link and fetch the corresponding circle
      const circle = await this.prisma.circle.findUnique({
        where: {
          circleShareLink: shareLink,
        },
        include: {
          members: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!circle) {
        throw new NotFoundException('Invalid share link');
      }

      // Check if the user exists
      const user = await this.prisma.user.findUnique({
        where: {
          email: userEmail,
        },
        select: {
          id: true,
        },
      });

      if (!user) {
        throw new NotFoundException(
          'User not found. Only empylo platform user can join a circle',
        );
      }

      // Check if the user is already a member of the circle
      if (circle.members.some((member) => member.userId === user.id)) {
        throw new ConflictException('User is already a member of the circle');
      }

      // Connect the user to the circle as a member
      await this.prisma.circleMember.create({
        data: {
          userId: user.id,
          circleId: circle.id,
        },
      });

      // Return the updated circle with members
      return await this.prisma.circle.findUnique({
        where: {
          id: circle.id,
        },
        include: {
          members: true,
        },
      });
    } catch (error) {
      throw error; // Let NestJS handle the caught error
    }
  }

  // async batchAddMembersToCircle(circleId: number, file: Express.Multer.File) {
  //   // Check if the file is an XLSX file
  //   const fileExtension = path.extname(file.originalname).toLowerCase();
  //   if (fileExtension !== '.xlsx') {
  //     throw new HttpException(
  //       'Invalid file format. Please upload an XLSX file.',
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }

  //   try {
  //     const excelData = excelToJson({
  //       sourceFile: file.path,
  //       sheets: [
  //         {
  //           name: 'Sheet1',
  //           header: { rows: 1 },
  //           columnToKey: { A: 'email' },
  //         },
  //       ],
  //     });

  //     const userEmails = excelData.Sheet1.map((row) => row.email);

  //     const users = await this.prisma.user.findMany({
  //       where: {
  //         email: { in: userEmails },
  //       },
  //       select: { id: true },
  //     });

  //     const existingUserIds = users.map((user) => user.id);

  //     await this.prisma.circleMember.createMany({
  //       data: existingUserIds.map((userId) => ({
  //         userId: userId,
  //         circleId: circleId,
  //       })),
  //       skipDuplicates: true,
  //     });

  //     const circle = await this.prisma.circle.findUnique({
  //       where: { id: circleId },
  //       include: { members: true },
  //     });

  //     fs.unlinkSync(file.path);

  //     return circle.members;
  //   } catch (error) {
  //     if (
  //       error instanceof Prisma.PrismaClientKnownRequestError &&
  //       error.code === 'P2025'
  //     ) {
  //       throw new NotFoundException(`Circle with id ${circleId} not found`);
  //     }
  //     throw error;
  //   }
  // }

  // async batchAddMembersToCircleWithNotFoundMailError(
  //   circleId: number,
  //   file: Express.Multer.File,
  // ) {
  //   if (!file.mimetype.includes('excel')) {
  //     throw new BadRequestException(
  //       'Invalid file type. Please upload an Excel file.',
  //     );
  //   }

  //   try {
  //     const excelData = excelToJson({
  //       sourceFile: file.path,
  //       sheets: [
  //         {
  //           name: 'Sheet1',
  //           header: { rows: 1 },
  //           columnToKey: { A: 'email' },
  //         },
  //       ],
  //     });

  //     const userEmails = excelData.Sheet1.map((row) => row.email);

  //     const users = await this.prisma.user.findMany({
  //       where: {
  //         email: { in: userEmails },
  //       },
  //       select: { id: true, email: true },
  //     });

  //     const existingUserIds = users.map((user) => user.id);
  //     const nonExistingEmails = userEmails.filter(
  //       (email) => !users.some((user) => user.email === email),
  //     );

  //     if (nonExistingEmails.length > 0) {
  //       throw new BadRequestException(
  //         `The following emails are not registered in the system: ${nonExistingEmails.join(', ')}`,
  //       );
  //     }

  //     await this.prisma.circleMember.createMany({
  //       data: existingUserIds.map((userId) => ({
  //         userId: userId,
  //         circleId: circleId,
  //       })),
  //       skipDuplicates: true,
  //     });

  //     const circle = await this.prisma.circle.findUnique({
  //       where: { id: circleId },
  //       include: { members: true },
  //     });

  //     fs.unlinkSync(file.path);

  //     return circle.members;
  //   } catch (error) {
  //     if (
  //       error instanceof Prisma.PrismaClientKnownRequestError &&
  //       error.code === 'P2025'
  //     ) {
  //       throw new NotFoundException(`Circle with id ${circleId} not found`);
  //     }
  //     throw error;
  //   }
  // }

  // async batchAddMembersToCircleWithAutoCreateNotFoundEmail(
  //   circleId: number,
  //   file: Express.Multer.File,
  // ) {
  //   if (!file.mimetype.includes('excel')) {
  //     throw new BadRequestException(
  //       'Invalid file type. Please upload an Excel file.',
  //     );
  //   }

  //   try {
  //     const excelData = excelToJson({
  //       sourceFile: file.path,
  //       sheets: [
  //         {
  //           name: 'Sheet1',
  //           header: { rows: 1 },
  //           columnToKey: { A: 'email' },
  //         },
  //       ],
  //     });

  //     const userEmails = excelData.Sheet1.map((row) => row.email);

  //     const users = await this.prisma.user.findMany({
  //       where: {
  //         email: { in: userEmails },
  //       },
  //       select: { id: true, email: true },
  //     });

  //     const existingUserIds = users.map((user) => user.id);
  //     const nonExistingEmails = userEmails.filter(
  //       (email) => !users.some((user) => user.email === email),
  //     );

  //     const createdUsers = await Promise.all(
  //       nonExistingEmails.map(async (email) => {
  //         const user = await this.prisma.user.create({
  //           data: {
  //             email,
  //             password: 'password', // Or generate a random password
  //             isActivated: true,
  //           },
  //         });

  //         // Send email with account creation details and password
  //         // await this.mailService.sendEmail(
  //         //   email,
  //         //   'Account Created for Empylo Circle',
  //         //   `Hi there,

  //         //   An account has been created for you on the Empylo platform to join a circle. Your login credentials are:

  //         //   Email: ${email}
  //         //   Password: password

  //         //   Please download the Empylo app from the Google Play Store or the Apple App Store to continue using the platform.

  //         //   Thank you,
  //         //   The Empylo Team`,
  //         // );

  //         return user;
  //       }),
  //     );

  //     const createdUserIds = createdUsers.map((user) => user.id);

  //     await this.prisma.circleMember.createMany({
  //       data: [
  //         ...existingUserIds.map((userId) => ({
  //           userId: userId,
  //           circleId: circleId,
  //         })),
  //         ...createdUserIds.map((userId) => ({
  //           userId: userId,
  //           circleId: circleId,
  //         })),
  //       ],
  //       skipDuplicates: true,
  //     });

  //     const circle = await this.prisma.circle.findUnique({
  //       where: { id: circleId },
  //       include: { members: true },
  //     });

  //     fs.unlinkSync(file.path);

  //     return circle.members;
  //   } catch (error) {
  //     if (
  //       error instanceof Prisma.PrismaClientKnownRequestError &&
  //       error.code === 'P2025'
  //     ) {
  //       throw new NotFoundException(`Circle with id ${circleId} not found`);
  //     }
  //     throw error;
  //   }
  // }

  // async batchAddMembersToCircle(circleId: number, file: Express.Multer.File) {
  //   // Check if the file is an XLSX file
  //   const fileExtension = path.extname(file.originalname).toLowerCase();
  //   if (fileExtension !== '.xlsx') {
  //     throw new HttpException(
  //       'Invalid file format. Please upload an XLSX file.',
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }

  //   console.log(file);

  //   try {
  //     const workbook = new exceljs.Workbook();
  //     await workbook.xlsx.load(file.buffer);
  //     const worksheet = workbook.getWorksheet('Sheet1');

  //     const userEmails = worksheet
  //       .getColumn('A')
  //       .values.slice(1)
  //       .map((value) => value.toString());

  //     const users = await this.prisma.user.findMany({
  //       where: {
  //         email: { in: userEmails },
  //       },
  //       select: { id: true },
  //     });

  //     const existingUserIds = users.map((user) => user.id);

  //     await this.prisma.circleMember.createMany({
  //       data: existingUserIds.map((userId) => ({
  //         userId: userId,
  //         circleId: circleId,
  //       })),
  //       skipDuplicates: true,
  //     });

  //     const circle = await this.prisma.circle.findUnique({
  //       where: { id: circleId },
  //       include: { members: true },
  //     });

  //     fs.unlinkSync(file.path);

  //     return circle.members;
  //   } catch (error) {
  //     if (
  //       error instanceof Prisma.PrismaClientKnownRequestError &&
  //       error.code === 'P2025'
  //     ) {
  //       throw new NotFoundException(`Circle with id ${circleId} not found`);
  //     }
  //     throw error;
  //   }
  // }

  // async batchAddMembersToCircleWithNotFoundMailError(
  //   circleId: number,
  //   file: Express.Multer.File,
  // ) {
  //   if (!file.mimetype.includes('excel')) {
  //     throw new BadRequestException(
  //       'Invalid file type. Please upload an Excel file.',
  //     );
  //   }

  //   try {
  //     const workbook = new exceljs.Workbook();
  //     await workbook.xlsx.readFile(file.path);
  //     const worksheet = workbook.getWorksheet('Sheet1');

  //     const userEmails = worksheet
  //       .getColumn('A')
  //       .values.slice(1)
  //       .map((value) => value.toString());

  //     const users = await this.prisma.user.findMany({
  //       where: {
  //         email: { in: userEmails },
  //       },
  //       select: { id: true, email: true },
  //     });

  //     const existingUserIds = users.map((user) => user.id);
  //     const nonExistingEmails = userEmails.filter(
  //       (email) => !users.some((user) => user.email === email),
  //     );

  //     if (nonExistingEmails.length > 0) {
  //       throw new BadRequestException(
  //         `The following emails are not registered in the system: ${nonExistingEmails.join(', ')}`,
  //       );
  //     }

  //     await this.prisma.circleMember.createMany({
  //       data: existingUserIds.map((userId) => ({
  //         userId: userId,
  //         circleId: circleId,
  //       })),
  //       skipDuplicates: true,
  //     });

  //     const circle = await this.prisma.circle.findUnique({
  //       where: { id: circleId },
  //       include: { members: true },
  //     });

  //     fs.unlinkSync(file.path);

  //     return circle.members;
  //   } catch (error) {
  //     if (
  //       error instanceof Prisma.PrismaClientKnownRequestError &&
  //       error.code === 'P2025'
  //     ) {
  //       throw new NotFoundException(`Circle with id ${circleId} not found`);
  //     }
  //     throw error;
  //   }
  // }

  // async batchAddMembersToCircleWithAutoCreateNotFoundEmail(
  //   circleId: number,
  //   file: Express.Multer.File,
  // ) {
  //   if (!file.mimetype.includes('excel')) {
  //     throw new BadRequestException(
  //       'Invalid file type. Please upload an Excel file.',
  //     );
  //   }

  //   try {
  //     const workbook = new exceljs.Workbook();
  //     await workbook.xlsx.readFile(file.path);
  //     const worksheet = workbook.getWorksheet('Sheet1');

  //     const userEmails = worksheet
  //       .getColumn('A')
  //       .values.slice(1)
  //       .map((value) => value.toString());

  //     const users = await this.prisma.user.findMany({
  //       where: {
  //         email: { in: userEmails },
  //       },
  //       select: { id: true, email: true },
  //     });

  //     const existingUserIds = users.map((user) => user.id);
  //     const nonExistingEmails = userEmails.filter(
  //       (email) => !users.some((user) => user.email === email),
  //     );

  //     const createdUsers = await Promise.all(
  //       nonExistingEmails.map(async (email: any) => {
  //         const user = await this.prisma.user.create({
  //           data: {
  //             email,
  //             password: 'password', // Or generate a random password
  //             isActivated: true,
  //           },
  //         });

  //         // Send email with account creation details and password
  //         // await this.mailService.sendEmail(
  //         //   email,
  //         //   'Account Created for Empylo Circle',
  //         //   `Hi there,

  //         //   An account has been created for you on the Empylo platform to join a circle. Your login credentials are:

  //         //   Email: ${email}
  //         //   Password: password

  //         //   Please download the Empylo app from the Google Play Store or the Apple App Store to continue using the platform.

  //         //   Thank you,
  //         //   The Empylo Team`,
  //         // );

  //         return user;
  //       }),
  //     );

  //     const createdUserIds = createdUsers.map((user) => user.id);

  //     await this.prisma.circleMember.createMany({
  //       data: [
  //         ...existingUserIds.map((userId) => ({
  //           userId: userId,
  //           circleId: circleId,
  //         })),
  //         ...createdUserIds.map((userId) => ({
  //           userId: userId,
  //           circleId: circleId,
  //         })),
  //       ],
  //       skipDuplicates: true,
  //     });

  //     const circle = await this.prisma.circle.findUnique({
  //       where: { id: circleId },
  //       include: { members: true },
  //     });

  //     fs.unlinkSync(file.path);

  //     return circle.members;
  //   } catch (error) {
  //     if (
  //       error instanceof Prisma.PrismaClientKnownRequestError &&
  //       error.code === 'P2025'
  //     ) {
  //       throw new NotFoundException(`Circle with id ${circleId} not found`);
  //     }
  //     throw error;
  //   }
  // }

  async batchAddMembersToCircle(circleId: number, file: Express.Multer.File) {
    // Validate the file format
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (fileExtension !== '.xlsx' && fileExtension !== '.xls') {
      throw new BadRequestException(
        'Invalid file format. Please upload an Excel file.',
      );
    }

    try {
      const workbook = new exceljs.Workbook();
      await workbook.xlsx.load(file.buffer);
      const worksheet = workbook.getWorksheet(1);

      if (!worksheet) {
        throw new BadRequestException(
          'The Excel file does not contain any worksheets.',
        );
      }

      // const userEmails = worksheet.getColumn(1).values.slice(1); // Exclude header row

      const userEmails = worksheet.getColumn(1).values.slice(1).map(String); // Convert CellValue to string

      const users = await this.prisma.user.findMany({
        where: {
          email: { in: userEmails },
        },
        select: { id: true },
      });

      const existingUserIds = users.map((user) => user.id);

      await this.prisma.circleMember.createMany({
        data: existingUserIds.map((userId) => ({
          userId: userId,
          circleId: circleId,
        })),
        skipDuplicates: true,
      });

      const circle = await this.prisma.circle.findUnique({
        where: { id: circleId },
        include: { members: true },
      });

      // fs.unlinkSync(file.path);

      return circle.members;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Circle with id ${circleId} not found`);
      }
      throw error;
    }
  }

  async batchAddMembersToCircleWithNotFoundMailError(
    circleId: number,
    file: Express.Multer.File,
  ) {
    // Validate the file format
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (fileExtension !== '.xlsx' && fileExtension !== '.xls') {
      throw new BadRequestException(
        'Invalid file format. Please upload an Excel file.',
      );
    }

    try {
      const workbook = new exceljs.Workbook();
      await workbook.xlsx.load(file.buffer);
      const worksheet = workbook.getWorksheet(1);

      if (!worksheet) {
        throw new BadRequestException(
          'The Excel file does not contain any worksheets.',
        );
      }

      // const userEmails = worksheet.getColumn(1).values.slice(1); // Exclude header row

      const userEmails = worksheet.getColumn(1).values.slice(1).map(String); // Convert CellValue to string

      const users = await this.prisma.user.findMany({
        where: {
          email: { in: userEmails },
        },
        select: { id: true, email: true },
      });

      const existingUserIds = users.map((user) => user.id);
      const nonExistingEmails = userEmails.filter(
        (email) => !users.some((user) => user.email === email),
      );

      if (nonExistingEmails.length > 0) {
        throw new BadRequestException(
          `The following emails are not registered in the system: ${nonExistingEmails.join(', ')}`,
        );
      }

      await this.prisma.circleMember.createMany({
        data: existingUserIds.map((userId) => ({
          userId: userId,
          circleId: circleId,
        })),
        skipDuplicates: true,
      });

      const circle = await this.prisma.circle.findUnique({
        where: { id: circleId },
        include: { members: true },
      });

      // fs.unlinkSync(file.path);

      return circle.members;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Circle with id ${circleId} not found`);
      }
      throw error;
    }
  }

  async batchAddMembersToCircleWithAutoCreateNotFoundEmail(
    circleId: number,
    file: Express.Multer.File,
  ) {
    // Validate the file format
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (fileExtension !== '.xlsx' && fileExtension !== '.xls') {
      throw new BadRequestException(
        'Invalid file format. Please upload an Excel file.',
      );
    }

    try {
      const workbook = new exceljs.Workbook();
      await workbook.xlsx.load(file.buffer);
      const worksheet = workbook.getWorksheet(1);

      if (!worksheet) {
        throw new BadRequestException(
          'The Excel file does not contain any worksheets.',
        );
      }

      const userEmails = worksheet.getColumn(1).values.slice(1).map(String); // Convert CellValue to string

      const users = await this.prisma.user.findMany({
        where: {
          email: { in: userEmails },
        },
        select: { id: true, email: true },
      });

      const existingUserIds = users.map((user) => user.id);
      const nonExistingEmails = userEmails.filter(
        (email) => !users.some((user) => user.email === email),
      );

      const createdUsers = await Promise.all(
        nonExistingEmails.map(async (email) => {
          const user = await this.prisma.user.create({
            data: {
              email,
              password: 'password', // Or generate a random password
              isActivated: true,
            },
          });

          // Send email with account creation details and password
          // await this.mailService.sendEmail(
          //   email,
          //   'Account Created for Empylo Circle',
          //   `Hi there,
          //
          //   An account has been created for you on the Empylo platform to join a circle. Your login credentials are:
          //
          //   Email: ${email}
          //   Password: password
          //
          //   Please download the Empylo app from the Google Play Store or the Apple App Store to continue using the platform.
          //
          //   Thank you,
          //   The Empylo Team`,
          // );

          return user;
        }),
      );

      const createdUserIds = createdUsers.map((user) => user.id);

      await this.prisma.circleMember.createMany({
        data: [
          ...existingUserIds.map((userId) => ({
            userId: userId,
            circleId: circleId,
          })),
          ...createdUserIds.map((userId) => ({
            userId: userId,
            circleId: circleId,
          })),
        ],
        skipDuplicates: true,
      });

      const circle = await this.prisma.circle.findUnique({
        where: { id: circleId },
        include: { members: true },
      });

      // fs.unlinkSync(file.path);

      return circle.members;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Circle with id ${circleId} not found`);
      }
      throw error;
    }
  }

  async getAllCircles() {
    try {
      return await this.prisma.circle.findMany();
    } catch (error) {
      throw error;
    }
  }

  async getCircleById(circleId: number) {
    try {
      const circle = await this.prisma.circle.findUnique({
        where: { id: circleId },
      });
      if (!circle) {
        throw new NotFoundException(`Circle with id ${circleId} not found`);
      }
      return circle;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Circle with id ${circleId} not found`);
      }
      throw error;
    }
  }

  async updateCircle(
    circleId: number,
    circleImg: any,
    updateData: UpdateCircleDto,
  ) {
    const { circleMembersEmail, ...circleData } = updateData;

    try {
      let existingUserIds: number[] = [];
      // if (circleMembersEmail && circleMembersEmail.length > 0) {
      //   const users = await this.prisma.user.findMany({
      //     where: {
      //       email: { in: circleMembersEmail },
      //     },
      //     select: { id: true },
      //   });
      if (
        circleMembersEmail &&
        circleMembersEmail.length > 0 &&
        typeof circleMembersEmail === 'string'
      ) {
        const circleMembersEmailArray = (circleMembersEmail as string)
          .split(',')
          .map(String);
        // Find existing users by email
        const users = await this.prisma.user.findMany({
          where: {
            email: {
              in: circleMembersEmailArray,
            },
          },
        });
        existingUserIds = users.map((user) => user.id);
      }

      const baseUrl = 'https://empylo.com';
      const shareLink = await this.generateUniqueCircleShareLink(baseUrl);

      const existingCircle = await this.prisma.circle.findUnique({
        where: { id: circleId },
        include: { members: true },
      });

      if (!existingCircle) {
        throw new NotFoundException(`Circle with id ${circleId} not found`);
      }

      let circleImageUrl: string | undefined;
      if (circleImg) {
        circleImageUrl = await this.s3UploadService.uploadFile(circleImg);
      }

      const updateDataObj: any = {
        circleImg: circleImageUrl || existingCircle.circleImg,
        circleShareLink: shareLink,
      };

      // Conditionally add other parameters to updateDataObj based on their presence
      if (circleData.circleName)
        updateDataObj.circleName = circleData.circleName;
      if (circleData.circleDescription)
        updateDataObj.circleDescription = circleData.circleDescription;
      if (circleData.wellbeingScore)
        updateDataObj.wellbeingScore = circleData.wellbeingScore;
      if (circleData.activityLevel)
        updateDataObj.activityLevel = circleData.activityLevel;
      if (circleData.circleStatus)
        updateDataObj.circleStatus = circleData.circleStatus;
      if (circleData.circleNos) updateDataObj.circleNos = circleData.circleNos;
      if (circleData.circleScoreDetail)
        updateDataObj.circleScoreDetail = circleData.circleScoreDetail;

      const membersToKeep = existingCircle.members.filter((member) =>
        existingUserIds.includes(member.userId),
      );
      const membersToCreate = existingUserIds.filter(
        (userId) => !membersToKeep.some((member) => member.userId === userId),
      );

      const updatedCircle = await this.prisma.circle.update({
        where: { id: circleId },
        data: {
          members: {
            updateMany: {
              where: {
                OR: membersToKeep.map((member) => ({
                  userId: member.userId,
                  circleId: member.circleId,
                })),
              },
              data: {},
            },
            createMany: {
              data: membersToCreate.map((userId) => ({
                userId,
                circleId,
              })),
            },
          },
          ...updateDataObj,
        },
        include: { members: true },
      });

      return updatedCircle;
    } catch (error) {
      throw error;
    }
  }

  async deleteCircle(circleId: number) {
    try {
      const deletedCircle = await this.prisma.circle.delete({
        where: { id: circleId },
      });
      return deletedCircle;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Circle with id ${circleId} not found`);
      }
      throw error;
    }
  }

  async activateCircle(circleId: number) {
    try {
      const circle = await this.prisma.circle.findUnique({
        where: { id: circleId },
      });

      if (!circle) {
        throw new NotFoundException(`Circle with id ${circleId} not found`);
      }

      if (circle.circleStatus === 'active') {
        throw new HttpException(
          'Circle is already activated.',
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.prisma.circle.update({
        where: { id: circleId },
        data: { circleStatus: 'active' },
      });
    } catch (error) {
      throw error;
    }
  }

  async deactivateCircle(circleId: number) {
    try {
      const circle = await this.prisma.circle.findUnique({
        where: { id: circleId },
      });

      if (!circle) {
        throw new NotFoundException(`Circle with id ${circleId} not found`);
      }

      if (circle.circleStatus === 'inactive') {
        throw new HttpException(
          'Circle is already deactivated.',
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.prisma.circle.update({
        where: { id: circleId },
        data: { circleStatus: 'inactive' },
      });
    } catch (error) {
      throw error;
    }
  }

  // async generateSampleTemplate(): Promise<Buffer> {
  //   // Create a new Excel workbook and worksheet
  //   const workbook = new exceljs.Workbook();
  //   const worksheet = workbook.addWorksheet('Sample Template');

  //   // Add sample data to the worksheet (you can customize this based on your requirements)
  //   worksheet.columns = [
  //     { header: 'Circle Members Email', key: 'email', width: 30 },
  //     // { header: 'First Name', key: 'firstName', width: 20 },
  //     // { header: 'Last Name', key: 'lastName', width: 20 },
  //     // { header: 'Phone Number', key: 'phoneNumber', width: 15 },
  //     // Add more columns as needed
  //   ];

  //   // Example data rows (you can generate more rows as needed)
  //   const data = [
  //     {
  //       email: 'example1@example.com',
  //       // firstName: 'John',
  //       // lastName: 'Doe',
  //       // phoneNumber: '123-456-7890',
  //     },
  //     {
  //       email: 'example2@example.com',
  //       // firstName: 'Jane',
  //       // lastName: 'Smith',
  //       // phoneNumber: '987-654-3210',
  //     },
  //   ];

  //   data.forEach((row) => {
  //     worksheet.addRow(row);
  //   });

  //   // Generate the Excel file and return the file buffer
  //   const buffer = await workbook.xlsx.writeBuffer();
  //   return Buffer.from(buffer);
  // }

  async generateSampleTemplate(res: Response) {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Sample Template');

    // Add headers to the worksheet
    // worksheet.addRow(['Name', 'Email']);
    // worksheet.addRow(['John Doe', 'john.doe@example.com']);
    // worksheet.addRow(['Jane Smith', 'jane.smith@example.com']);

    // Add sample data to the worksheet (you can customize this based on your requirements)
    worksheet.columns = [
      { header: 'Circle Members Email', key: 'email', width: 30 },
      // { header: 'First Name', key: 'firstName', width: 20 },
      // { header: 'Last Name', key: 'lastName', width: 20 },
      // { header: 'Phone Number', key: 'phoneNumber', width: 15 },
      // Add more columns as needed
    ];

    // Example data rows (you can generate more rows as needed)
    const data = [
      {
        email: 'example1@example.com',
        // firstName: 'John',
        // lastName: 'Doe',
        // phoneNumber: '123-456-7890',
      },
      {
        email: 'example2@example.com',
        // firstName: 'Jane',
        // lastName: 'Smith',
        // phoneNumber: '987-654-3210',
      },
    ];

    data.forEach((row) => {
      worksheet.addRow(row);
    });

    // Set response headers for Excel download
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=batch_upload_sample_template.xlsx',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    // Generate and send the Excel file to the client
    return workbook.xlsx.write(res).then(() => {
      res.end();
    });
  }

  generateRandomString(length: number): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  }

  async generateUniqueCircleShareLink(baseUrl: string): Promise<string> {
    const randomString = this.generateRandomString(12); // Generate a 12-character random string
    return `${baseUrl}/circle/${randomString}`;
  }
}
