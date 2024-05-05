import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  NotFoundException,
  InternalServerErrorException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';

import { CirclesService } from './circles.service';
// import { CreateCircleDto } from './dto/create-circle.dto';
import { UpdateCircleDto } from './dto/update-circle.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BaseResponse } from 'src/common/utils';
import { CreateCircleWithMembersDto } from './dto/create-circle-with-members.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard.guard';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('circles')
@ApiTags('circle')
export class CirclesController {
  constructor(private readonly circleService: CirclesService) {}

  @Post('create-circle/:circleOwnerId')
  @ApiBody({ type: CreateCircleWithMembersDto })
  async createCircleWithMembers(
    @Param('circleOwnerId', ParseIntPipe) circleOwnerId: number,
    @Body() createCircleDto: CreateCircleWithMembersDto,
  ): Promise<BaseResponse> {
    try {
      const circle = await this.circleService.createCircleWithMembers(
        circleOwnerId,
        createCircleDto,
      );
      return {
        message: 'Circle created successfully',
        status: HttpStatus.CREATED,
        result: circle,
      };
    } catch (error) {
      return {
        message: error.message || 'An error occurred.',
        status: HttpStatus.BAD_REQUEST,
        // error: error.stack,
      };
      // if (error instanceof NotFoundException) {
      //   throw new NotFoundException({
      //     message: error.message || 'Circle owner not found',
      //   });
      // } else if (error instanceof BadRequestException) {
      //   throw new BadRequestException({
      //     message: error.message || 'Bad request, invalid data provided',
      //   });
      // }
      // throw error; // Let NestJS handle any unexpected errors
    }
  }

  // @Post()
  // async createCircleWithMembers(
  //   @Param('circleOwnerId') circleOwnerId: number,
  //   @Body('createCircleDto') createCircleDto: CreateCircleDto,
  //   @Body('userEmails') userEmails: string[],
  // ) {
  //   try {
  //     return await this.circleService.createCircleWithMembers(
  //       circleOwnerId,
  //       createCircleDto,
  //       userEmails,
  //     );
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       throw error;
  //     } else if (error instanceof BadRequestException) {
  //       // Handle the BadRequestException, e.g., return the error message
  //       return { error: error.message };
  //     }
  //     throw new InternalServerErrorException();
  //   }
  // }
  @Post('add-circle-member/:circleId/members/:userEmail')
  async addMemberToCircle(
    @Param('circleId', ParseIntPipe) circleId: number,
    @Param('userEmail') userEmail: string,
  ) {
    const result = await this.circleService.addMemberToCircle(
      userEmail,
      circleId,
    );
    return {
      message: 'Circle member added successfully',
      status: HttpStatus.CREATED,
      result,
    };
  }

  @Post('remove-circle-member/:circleId/members/:memberId/remove')
  async removeMemberFromCircle(
    @Param('circleId') circleId: number,
    @Param('memberId') memberId: number,
  ) {
    const result = await this.circleService.removeMemberFromCircle(
      +memberId,
      +circleId,
    );

    return {
      message: 'Circle member removed successfully',
      status: HttpStatus.OK,
      result,
    };
  }

  @Get('get-all-circle-members/:circleId/members')
  async getAllMembersOfCircle(@Param('circleId') circleId: number) {
    const result = await this.circleService.getAllMembersOfCircle(+circleId);
    return {
      message: 'All circle members retrieved successfully',
      status: HttpStatus.OK,
      result,
    };
  }

  @Get('get-all-circles-user-belong/members/:memberId')
  async getAllCirclesUserIsMemberOf(@Param('memberId') memberId: number) {
    const result =
      await this.circleService.getAllCirclesUserIsMemberOf(+memberId);
    return {
      message: 'All user circles retrieved successfully',
      status: HttpStatus.OK,
      result,
    };
  }

  @Get('get-all-circles-user-created/owned/:memberId')
  async getAllCirclesCreatedByUser(@Param('memberId') memberId: number) {
    const result =
      await this.circleService.getAllCirclesCreatedByUser(+memberId);
    return {
      message: 'All circles created by user retrieved successfully',
      status: HttpStatus.OK,
      result,
    };
  }

  // @Post()
  // async createCircle(
  //   @Body() createCircleDto: CreateCircleDto,
  //   @Param('userEmail') userEmail: string,
  // ) {
  //   try {
  //     return await this.circleService.createCircle(createCircleDto, userEmail);
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       throw error;
  //     }
  //     throw new InternalServerErrorException();
  //   }
  // }

  @Delete('delete-circle/:circleId')
  async deleteCircle(@Param('circleId') circleId: number) {
    const result = await this.circleService.deleteCircle(+circleId);
    return {
      message: 'Circle deleted successfully',
      status: HttpStatus.OK,
      result,
    };
  }

  @Patch('update-circle/:circleId')
  async updateCircle(
    @Param('circleId') circleId: number,
    @Body() updateCircleDto: UpdateCircleDto,
  ) {
    const result = await this.circleService.updateCircle(
      +circleId,
      updateCircleDto,
    );
    return {
      message: 'Circle updated successfully',
      status: HttpStatus.CREATED,
      result,
    };
  }

  @Get('get-all-circles')
  async getAllCircles() {
    const result = await this.circleService.getAllCircles();
    return {
      message: 'All circles retrived successfully',
      status: HttpStatus.OK,
      result,
    };
  }

  @Get('get-circle-by-id/:circleId')
  async getCircleById(@Param('circleId') circleId: number) {
    const result = await this.circleService.getCircleById(+circleId);
    return {
      message: 'Circle retrived successfully',
      status: HttpStatus.OK,
      result,
    };
  }

  // @Post('batch-upload-add-circle-member/:circleId/members/batch')
  // @UseInterceptors(
  //   FileInterceptor('file', {
  //     storage: diskStorage({
  //       destination: './uploads',
  //       filename: (req, file, cb) => {
  //         const uniqueSuffix =
  //           Date.now() + '-' + Math.round(Math.random() * 1e9);
  //         const ext = extname(file.originalname);
  //         const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
  //         cb(null, filename);
  //       },
  //     }),
  //   }),
  // )
  // async batchAddMembersToCircle(
  //   @Param('circleId') circleId: number,
  //   @UploadedFile() file: Express.Multer.File,
  // ) {
  //   const result = await this.circleService.batchAddMembersToCircle(
  //     circleId,
  //     file,
  //   );

  //   return {
  //     message: 'Circle members batch upload added successfully',
  //     status: HttpStatus.CREATED,
  //     result,
  //   };
  // }

  @ApiConsumes('multipart/form-data') // Specify the content type
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary', // Specify binary format for file upload
        },
      },
    },
  })
  @Post('batch-upload-add-circle-members/:circleId/members/batch')
  // @UseInterceptors(
  //   FileInterceptor('file', {
  //     storage: diskStorage({
  //       destination: './uploads',
  //       filename: (req, file, cb) => {
  //         const uniqueSuffix =
  //           Date.now() + '-' + Math.round(Math.random() * 1e9);
  //         const ext = extname(file.originalname);
  //         const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
  //         cb(null, filename);
  //       },
  //     }),
  //   }),
  // )
  @UseInterceptors(FileInterceptor('file'))
  public async batchAddMembersToCircleWithNotFoundMailError(
    @UploadedFile()
    file: Express.Multer.File,
    @Param('circleId', ParseIntPipe) circleId: number,
  ) {
    try {
      return await this.circleService.batchAddMembersToCircle(circleId, file);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof BadRequestException) {
        // Handle the BadRequestException, e.g., return the error message
        return { error: error.message };
      }
      throw new InternalServerErrorException();
    }
  }

  @Get('join-circle-with-sharelink/:shareLink')
  @ApiOperation({ summary: 'Join a circle using a share link' })
  @ApiParam({
    name: 'shareLink',
    description: 'Share link of the circle',
    example: 'https://empylo.com/circle/abc123',
  })
  @ApiQuery({
    name: 'userEmail',
    description: 'User email for joining the circle',
    example: 'user@example.com',
  })
  @ApiNotFoundResponse({ description: 'Invalid share link or user not found' })
  @ApiConflictResponse({
    description: 'User is already a member of the circle',
  })
  async joinCircleByShareLink(
    @Param('shareLink') shareLink: string,
    @Query('userEmail') userEmail: string,
  ): Promise<BaseResponse | null> {
    const result = await this.circleService.joinCircleByShareLink(
      shareLink,
      userEmail,
    );
    return {
      message: 'Circle joined successfully',
      status: HttpStatus.OK,
      result,
    };
  }
}
