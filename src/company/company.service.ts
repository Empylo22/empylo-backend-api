import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GettingStartedUpdateProfileDto } from 'src/auth/dto/auth.dto';
import { Prisma } from '@prisma/client';

// interface ExistingMember {
//   id: number;
//   firstName?: string;
//   // Add other properties as needed to match the User model
//   accountType?: string;
// }

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}
  private async isCompany(companyId: number): Promise<boolean> {
    const company = await this.prisma.user.findUnique({
      where: { id: companyId },
      select: { accountType: true },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company.accountType === 'company';
  }

  // Get all members of a company
  async getAllMembersOfCompany(companyId: number) {
    const isCompany = await this.isCompany(companyId);

    if (!isCompany) {
      throw new UnauthorizedException(
        'Only company accounts can perform this operation',
      );
    }

    return this.prisma.user.findUnique({
      where: { id: companyId },
      select: { members: true },
    });
  }

  // Get a member of a company by ID
  async getMemberOfCompanyById(companyId: number, memberId: number) {
    const isCompany = await this.isCompany(companyId);

    if (!isCompany) {
      throw new UnauthorizedException(
        'Only company accounts can perform this operation',
      );
    }

    const member = await this.prisma.user.findUnique({
      where: { id: companyId },
      select: { members: { where: { id: memberId } } },
    });

    if (!member || member.members.length === 0) {
      throw new NotFoundException('Member not found');
    }

    return member.members[0];
  }

  // Update a member of a company
  async updateMemberOfCompany(
    companyId: number,
    memberId: number,
    updateUserDto: GettingStartedUpdateProfileDto,
  ) {
    const isCompany = await this.isCompany(companyId);

    if (!isCompany) {
      throw new UnauthorizedException(
        'Only company accounts can perform this operation',
      );
    }

    const member = await this.prisma.user.findUnique({
      where: { id: companyId },
      select: { members: { where: { id: memberId } } },
    });

    if (!member || member.members.length === 0) {
      throw new NotFoundException('Member not found');
    }

    return this.prisma.user.update({
      where: { id: memberId },
      data: updateUserDto,
    });
  }

  // Delete a member from a company
  async deleteMemberOfCompany(companyId: number, memberId: number) {
    const isCompany = await this.isCompany(companyId);

    if (!isCompany) {
      throw new UnauthorizedException(
        'Only company accounts can perform this operation',
      );
    }

    const member = await this.prisma.user.findUnique({
      where: { id: companyId },
      select: { members: { where: { id: memberId } } },
    });

    if (!member || member.members.length === 0) {
      throw new NotFoundException('Member not found');
    }

    return this.prisma.user.update({
      where: { id: memberId },
      data: { companyId: null },
    });
  }

  // Create a new member for a company
  // async createMemberOfCompany(companyId: number, memberId: number) {
  //   const isCompany = await this.isCompany(companyId);

  //   if (!isCompany) {
  //     throw new UnauthorizedException(
  //       'Only company accounts can perform this operation',
  //     );
  //   }

  //   if (companyId === memberId) {
  //     throw new BadRequestException(
  //       'Cannot add the company itself as a member.',
  //     );
  //   }

  //   return this.prisma.user.update({
  //     where: { id: memberId },
  //     data: { companyId },
  //   });
  // }

  async createMemberOfCompany(companyId: number, memberId: number) {
    const isCompany = await this.isCompany(companyId);

    if (!isCompany) {
      throw new UnauthorizedException(
        'Only company accounts can perform this operation',
      );
    }

    if (companyId === memberId) {
      throw new BadRequestException(
        'Cannot add the company itself as a member.',
      );
    }

    // Check if the member is already part of the company
    const existingMember = await this.prisma.user.findUnique({
      where: { id: memberId },
      select: { companyId: true },
    });

    if (existingMember && existingMember.companyId === companyId) {
      throw new ConflictException('Member is already part of the company.');
    }

    if (
      existingMember &&
      existingMember.companyId &&
      existingMember.companyId !== companyId
    ) {
      throw new ConflictException('Member is already part of another company.');
    }

    // if (existingMember.accountType === 'company') {
    //   throw new ConflictException(
    //     'Companies cannot be added as part of a company member.',
    //   );
    // }

    try {
      return await this.prisma.user.update({
        where: { id: memberId },
        data: { companyId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Member with the specified ID not found.');
      }
      throw error;
    }
  }
}
