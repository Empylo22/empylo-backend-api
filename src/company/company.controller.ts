import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { GettingStartedUpdateProfileDto } from 'src/auth/dto/auth.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard.guard';
import { BaseResponse } from 'src/common/utils';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('company')
@ApiTags('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post('add-company-member/:companyId/members/:memberId')
  public async createMemberOfCompany(
    @Param('companyId') companyId: string,
    @Param('memberId') memberId: string,
  ): Promise<BaseResponse> {
    const result = await this.companyService.createMemberOfCompany(
      +companyId,
      +memberId,
    );

    return {
      message: 'Company member added successfully.',
      status: HttpStatus.OK,
      result,
    };
  }

  @Get('get-all-companies-members/:companyId/members')
  public async getAllMembersOfCompany(
    @Param('companyId') companyId: string,
  ): Promise<BaseResponse> {
    const result = await this.companyService.getAllMembersOfCompany(+companyId);

    return {
      message: 'All Company members retrived successfully.',
      status: HttpStatus.OK,
      result,
    };
  }

  @Get('get-company-member/:companyId/members/:memberId')
  public async getMemberOfCompanyById(
    @Param('companyId') companyId: string,
    @Param('memberId') memberId: string,
  ): Promise<BaseResponse> {
    const result = await this.companyService.getMemberOfCompanyById(
      +companyId,
      +memberId,
    );

    return {
      message: 'Company member retrieved successfully.',
      status: HttpStatus.OK,
      result,
    };
  }

  @Patch('update-company-member/:companyId/members/:memberId')
  public async updateMemberOfCompany(
    @Param('companyId') companyId: string,
    @Param('memberId') memberId: string,
    @Body() updateUserDto: GettingStartedUpdateProfileDto,
  ): Promise<BaseResponse> {
    const result = await this.companyService.updateMemberOfCompany(
      +companyId,
      +memberId,
      updateUserDto,
    );

    return {
      message: 'Company member updated successfully.',
      status: HttpStatus.OK,
      result,
    };
  }

  @Delete('delete-company-member/:companyId/members/:memberId')
  public async deleteMemberOfCompany(
    @Param('companyId') companyId: string,
    @Param('memberId') memberId: string,
  ): Promise<BaseResponse> {
    const result = await this.companyService.deleteMemberOfCompany(
      +companyId,
      +memberId,
    );

    return {
      message: 'Company member deleted successfully.',
      status: HttpStatus.OK,
      result,
    };
  }
}
