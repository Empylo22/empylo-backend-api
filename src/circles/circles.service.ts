import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCircleDto } from './dto/create-circle.dto';
import { UpdateCircleDto } from './dto/update-circle.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import { Circle, Prisma } from '@prisma/client';
// import * as excelToJson from 'convert-excel-to-json';
import excelToJson from 'convert-excel-to-json';
import * as fs from 'fs';
import { CreateCircleWithMembersDto } from './dto/create-circle-with-members.dto';
// import path from 'path';

@Injectable()
export class CirclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async addMemberToCircle(userEmail: string, circleId: number) {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });
    if (!user) {
      throw new NotFoundException(`User with email ${userEmail} not found`);
    }

    try {
      return await this.prisma.circle.update({
        where: { id: circleId },
        data: {
          members: {
            connect: {
              id: user.id,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Circle with id ${circleId} not found`);
        }
      }
      throw error;
    }
  }

  async removeMemberFromCircle(userEmail: string, circleId: number) {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });
    if (!user) {
      throw new NotFoundException(`User with email ${userEmail} not found`);
    }

    try {
      return await this.prisma.circle.update({
        where: { id: circleId },
        data: {
          members: {
            disconnect: {
              id: user.id,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Circle with id ${circleId} not found`);
        }
      }
      throw error;
    }
  }

  async getAllMembersOfCircle(circleId: number) {
    try {
      const circle = await this.prisma.circle.findUnique({
        where: { id: circleId },
        include: { members: true },
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

  async getAllCirclesUserIsMemberOf(userEmail: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });
    if (!user) {
      throw new NotFoundException(`User with email ${userEmail} not found`);
    }

    try {
      const userWithCircles = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { circles: true },
      });
      return userWithCircles.circles;
    } catch (error) {
      throw error;
    }
  }

  async getAllCirclesCreatedByUser(userEmail: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });
    if (!user) {
      throw new NotFoundException(`User with email ${userEmail} not found`);
    }

    try {
      const userWithCircles = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { ownedCircles: true },
      });
      return userWithCircles.ownedCircles;
    } catch (error) {
      throw error;
    }
  }

  // async createCircle(createCircleDto: CreateCircleDto, userEmail: string) {
  //   const user = await this.prisma.user.findUnique({
  //     where: { email: userEmail },
  //   });
  //   if (!user) {
  //     throw new NotFoundException(`User with email ${userEmail} not found`);
  //   }

  //   try {
  //     return await this.prisma.circle.create({
  //       data: {
  //         ...createCircleDto,
  //         circleOwncerId: user.id,
  //       },
  //     });
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  async deleteCircle(circleId: number) {
    try {
      const deletedCircle = await this.prisma.circle.delete({
        where: { id: circleId },
      });
      if (!deletedCircle) {
        throw new NotFoundException(`Circle with id ${circleId} not found`);
      }
      return deletedCircle;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Circle with id ${circleId} not found`);
        }
      }
      throw error;
    }
  }

  async updateCircle(circleId: number, updateCircleDto: UpdateCircleDto) {
    try {
      const updatedCircle = await this.prisma.circle.update({
        where: { id: circleId },
        data: updateCircleDto,
      });
      if (!updatedCircle) {
        throw new NotFoundException(`Circle with id ${circleId} not found`);
      }
      return updatedCircle;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Circle with id ${circleId} not found`);
        }
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
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Circle with id ${circleId} not found`);
        }
      }
      throw error;
    }
  }

  async batchAddMembersToCircle(circleId: number, file: Express.Multer.File) {
    // Check if the file is an Excel file
    if (!file.mimetype.includes('excel')) {
      throw new BadRequestException(
        'Invalid file type. Please upload an Excel file.',
      );
    }

    try {
      // Convert the Excel file to JSON
      const excelData = excelToJson({
        sourceFile: file.path,
        sheets: [
          {
            name: 'Sheet1', // Specify the sheet name you want to read
            header: {
              rows: 1, // Assuming the header row is at row 1
            },
            columnToKey: {
              A: 'email', // Assuming the email column is at column A
            },
          },
        ],
      });

      const userEmails = excelData.Sheet1.map((row) => row.email);

      // Find existing users by email
      const users = await this.prisma.user.findMany({
        where: {
          email: {
            in: userEmails,
          },
        },
      });

      const existingUserIds = users.map((user) => user.id);

      // Add members to the circle
      const circle = await this.prisma.circle.update({
        where: { id: circleId },
        data: {
          members: {
            connect: existingUserIds.map((userId) => ({ id: userId })),
          },
        },
        include: {
          members: true,
        },
      });

      // Remove the uploaded file after processing
      // You might want to move this to a separate file cleanup process
      // based on your requirements
      fs.unlinkSync(file.path);
      // require('fs').unlinkSync(file.path);

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

  async batchAddMembersToCircleWithNotFoundMailError(
    circleId: number,
    file: Express.Multer.File,
  ) {
    // Check if the file is an Excel file
    if (!file.mimetype.includes('excel')) {
      throw new BadRequestException(
        'Invalid file type. Please upload an Excel file.',
      );
    }

    try {
      // Convert the Excel file to JSON
      const excelData = excelToJson({
        sourceFile: file.path,
        sheets: [
          {
            name: 'Sheet1', // Specify the sheet name you want to read
            header: {
              rows: 1, // Assuming the header row is at row 1
            },
            columnToKey: {
              A: 'email', // Assuming the email column is at column A
            },
          },
        ],
      });

      const userEmails = excelData.Sheet1.map((row) => row.email);

      // Find existing users by email
      const users = await this.prisma.user.findMany({
        where: {
          email: {
            in: userEmails,
          },
        },
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

      // Add members to the circle
      const circle = await this.prisma.circle.update({
        where: { id: circleId },
        data: {
          members: {
            connect: existingUserIds.map((userId) => ({ id: userId })),
          },
        },
        include: {
          members: true,
        },
      });

      // Remove the uploaded file after processing
      // You might want to move this to a separate file cleanup process
      // based on your requirements
      fs.unlinkSync(file.path);

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

  async batchAddMembersToCircleWithAutoCreateNotFoundEmail(
    circleId: number,
    file: Express.Multer.File,
  ) {
    // Check if the file is an Excel file
    if (!file.mimetype.includes('excel')) {
      throw new BadRequestException(
        'Invalid file type. Please upload an Excel file.',
      );
    }

    try {
      // Convert the Excel file to JSON
      const excelData = excelToJson({
        sourceFile: file.path,
        sheets: [
          {
            name: 'Sheet1', // Specify the sheet name you want to read
            header: {
              rows: 1, // Assuming the header row is at row 1
            },
            columnToKey: {
              A: 'email', // Assuming the email column is at column A
            },
          },
        ],
      });

      const userEmails = excelData.Sheet1.map((row) => row.email);

      // Find existing users by email
      const users = await this.prisma.user.findMany({
        where: {
          email: {
            in: userEmails,
          },
        },
      });

      const existingUserIds = users.map((user) => user.id);
      const nonExistingEmails = userEmails.filter(
        (email) => !users.some((user) => user.email === email),
      );

      // Create users for non-existing emails
      const createdUsers = await Promise.all(
        nonExistingEmails.map(async (email) => {
          // const password = generatePassword(); // Generate a random password
          const password = 'passport';
          const user = await this.prisma.user.create({
            data: {
              email,
              password,
              isActivated: true, // Set isActivated to true for newly created users
            },
          });

          // Send email with account creation details and password
          // await this.mailService.sendEmail(
          //   email,
          //   'Account Created for Empylo Circle',
          //   `Hi there,

          //   An account has been created for you on the Empylo platform to join a circle. Your login credentials are:

          //   Email: ${email}
          //   Password: ${password}

          //   Please download the Empylo app from the Google Play Store (https://play.google.com/store/apps/details?id=com.empylo) or the Apple App Store (https://apps.apple.com/us/app/empylo/id1234567890) to continue using the platform.

          //   Thank you,
          //   The Empylo Team
          //   `,
          // );

          return user;
        }),
      );

      // const existingUserIds = users.map((user) => user.id);
      const createdUserIds = createdUsers.map((user) => user.id);

      // Add members (existing and newly created) to the circle
      const circle = await this.prisma.circle.update({
        where: { id: circleId },
        data: {
          members: {
            connect: [
              ...existingUserIds.map((userId) => ({ id: userId })),
              ...createdUserIds.map((userId) => ({ id: userId })),
            ],
          },
        },
        include: {
          members: true,
        },
      });

      // Remove the uploaded file after processing
      // You might want to move this to a separate file cleanup process
      // based on your requirements
      fs.unlinkSync(file.path);

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

  async createCircleWithMembers(
    circleOwnerId: number,
    createCircleWithMembersDto: CreateCircleWithMembersDto,
  ) {
    const { circleMembersEmail, ...circleData } = createCircleWithMembersDto;

    try {
      let existingUserIds: number[] = [];
      let createdUserIds: number[] = [];

      if (circleMembersEmail && circleMembersEmail.length > 0) {
        // Find existing users by email
        const users = await this.prisma.user.findMany({
          where: {
            email: {
              in: createCircleWithMembersDto.circleMembersEmail,
            },
          },
        });

        existingUserIds = users.map((user) => user.id);
        const nonExistingEmails = circleMembersEmail.filter(
          (email) => !users.some((user) => user.email === email),
        );

        // Create users for non-existing emails
        const createdUsers = await Promise.all(
          nonExistingEmails.map(async (email) => {
            const password = 'generatePassword'; // Generate a random password
            const user = await this.prisma.user.create({
              data: {
                email,
                password,
                isActivated: true, // Set isActivated to true for newly created users
              },
            });

            // Send email with account creation details and password
            // await this.mailService.sendEmail(
            //   email,
            //   'Account Created for Empylo Circle',
            //   `Hi there,

            //   An account has been created for you on the Empylo platform to join a circle. Your login credentials are:

            //   Email: ${email}
            //   Password: ${password}

            //   Please download the Empylo app from the Google Play Store (https://play.google.com/store/apps/details?id=com.empylo) or the Apple App Store (https://apps.apple.com/us/app/empylo/id1234567890) to continue using the platform.

            //   Thank you,
            //   The Empylo Team
            //   `,
            // );

            return user.id; // Return only the user ID
          }),
        );

        createdUserIds = createdUsers;
      }

      const baseUrl = 'https://empylo.com';
      const shareLink = await this.generateUniqueCircleShareLink(baseUrl);

      // Create the circle and add members (existing and newly created)
      const circle = await this.prisma.circle.create({
        data: {
          ...circleData,
          circleShareLink: shareLink, // Include circleShareLink
          circleOwner: { connect: { id: circleOwnerId } }, // Include circleOwner
          members: {
            connect: [
              ...existingUserIds.map((userId) => ({ id: userId })),
              ...createdUserIds.map((userId) => ({ id: userId })),
            ],
          },
        },
        include: {
          members: true,
        },
      });

      return circle;
    } catch (error) {
      throw error;
    }
  }

  // async createCircleWithMembers(
  //   circleOwnerId: number,
  //   createCircleDto: CreateCircleDto,
  //   userEmails: string[],
  // ) {
  //   try {
  //     // Find existing users by email
  //     const users = await this.prisma.user.findMany({
  //       where: {
  //         email: {
  //           in: userEmails,
  //         },
  //       },
  //     });

  //     const existingUserIds = users.map((user) => user.id);
  //     const nonExistingEmails = userEmails.filter(
  //       (email) => !users.some((user) => user.email === email),
  //     );

  //     // Create users for non-existing emails
  //     const createdUsers = await Promise.all(
  //       nonExistingEmails.map(async (email) => {
  //         const password = 'generatePassword()'; // Generate a random password
  //         const user = await this.prisma.user.create({
  //           data: {
  //             email,
  //             password,
  //             isActivated: true, // Set isActivated to true for newly created users
  //           },
  //         });

  //         // Send email with account creation details and password
  //         // await this.mailService.sendEmail(
  //         //   email,
  //         //   'Account Created for Empylo Circle',
  //         //   `Hi there,

  //         //   An account has been created for you on the Empylo platform to join a circle. Your login credentials are:

  //         //   Email: ${email}
  //         //   Password: ${password}

  //         //   Please download the Empylo app from the Google Play Store (https://play.google.com/store/apps/details?id=com.empylo) or the Apple App Store (https://apps.apple.com/us/app/empylo/id1234567890) to continue using the platform.

  //         //   Thank you,
  //         //   The Empylo Team
  //         //   `,
  //         // );

  //         return user;
  //       }),
  //     );

  //     const createdUserIds = createdUsers.map((user) => user.id);

  //     const baseUrl = 'https://empylo.com';
  //     const shareLink = await this.generateUniqueCircleShareLink(baseUrl);

  //     // Create the circle and add members (existing and newly created)
  //     const circle = await this.prisma.circle.create({
  //       data: {
  //         ...createCircleDto,
  //         circleShareLink: shareLink, // Include circleShareLink
  //         circleOwner: { connect: { id: circleOwnerId } }, // Include circleOwner
  //         members: {
  //           connect: [
  //             ...existingUserIds.map((userId) => ({ id: userId })),
  //             ...createdUserIds.map((userId) => ({ id: userId })),
  //           ],
  //         },
  //       },
  //       include: {
  //         members: true,
  //       },
  //     });

  //     return circle;
  //   } catch (error) {
  //     throw error;
  //   }
  // }

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
          members: true,
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
      if (circle.members.some((member) => member.id === user.id)) {
        throw new ConflictException('User is already a member of the circle');
      }

      // Connect the user to the circle as a member
      const updatedCircle = await this.prisma.circle.update({
        where: {
          id: circle.id,
        },
        data: {
          members: {
            connect: {
              id: user.id,
            },
          },
        },
        include: {
          members: true,
        },
      });

      return updatedCircle;
    } catch (error) {
      throw error; // Let NestJS handle the caught error
    }
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

  // async generateUniqueCircleShareLink(): Promise<string> {
  //   const randomString = this.generateRandomString(12); // Generate a 12-character random string
  //   return `https://example.com/circle/${randomString}`;
  // }
}
