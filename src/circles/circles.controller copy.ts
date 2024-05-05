import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  NotFoundException,
  InternalServerErrorException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiCreatedResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { CirclesService } from './circles.service';
// import { CreateCircleDto } from './dto/create-circle.dto';
import { UpdateCircleDto } from './dto/update-circle.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Circle } from '@prisma/client';
import { CreateCircleDto } from './dto/create-circle.dto';
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
        message: 'Circle created with members successfully',
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
    @Param('circleId') circleId: number,
    @Param('userEmail') userEmail: string,
  ) {
    // return {
    //   message: 'Circle created with members successfully',
    //   status: HttpStatus.CREATED,
    //   result: circle,
    // };
    try {
      return await this.circleService.addMemberToCircle(userEmail, circleId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }

  @Post('/:circleId/members/:userEmail/remove')
  async removeMemberFromCircle(
    @Param('circleId') circleId: number,
    @Param('memberId') memberId: number,
  ) {
    try {
      return await this.circleService.removeMemberFromCircle(
        memberId,
        circleId,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }

  @Get('/:circleId/members')
  async getAllMembersOfCircle(@Param('circleId') circleId: number) {
    try {
      return await this.circleService.getAllMembersOfCircle(+circleId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }

  @Get('/members/:userEmail')
  async getAllCirclesUserIsMemberOf(@Param('memberId') memberId: number) {
    try {
      return await this.circleService.getAllCirclesUserIsMemberOf(+memberId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }

  @Get('/owned/:userEmail')
  async getAllCirclesCreatedByUser(@Param('memberId') memberId: number) {
    try {
      return await this.circleService.getAllCirclesCreatedByUser(+memberId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
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

  @Delete('/:circleId')
  async deleteCircle(@Param('circleId') circleId: number) {
    try {
      return await this.circleService.deleteCircle(circleId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }

  @Put('/:circleId')
  async updateCircle(
    @Param('circleId') circleId: number,
    @Body() updateCircleDto: UpdateCircleDto,
  ) {
    try {
      return await this.circleService.updateCircle(circleId, updateCircleDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }

  @Get()
  async getAllCircles() {
    try {
      return await this.circleService.getAllCircles();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  @Get('/:circleId')
  async getCircleById(@Param('circleId') circleId: number) {
    try {
      return await this.circleService.getCircleById(circleId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }

  @Post('/:circleId/members/batch')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
          cb(null, filename);
        },
      }),
    }),
  )
  async batchAddMembersToCircle(
    @Param('circleId') circleId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      return await this.circleService.batchAddMembersToCircle(circleId, file);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }

  @Post('/:circleId/members/batchWithNotFoundEMailError')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
          cb(null, filename);
        },
      }),
    }),
  )
  async batchAddMembersToCircleWithNotFoundMailError(
    @Param('circleId') circleId: number,
    @UploadedFile() file: Express.Multer.File,
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

  @Get('join/:shareLink')
  @ApiOperation({ summary: 'Join a circle using a share link' })
  @ApiParam({
    name: 'shareLink',
    description: 'Share link of the circle',
    example: 'https://example.com/circle/abc123',
  })
  @ApiQuery({
    name: 'userEmail',
    description: 'User email for joining the circle',
    example: 'user@example.com',
  })
  // @ApiOkResponse({
  //   description: 'Successfully joined the circle',
  //   type: Circle,
  // })
  @ApiNotFoundResponse({ description: 'Invalid share link or user not found' })
  @ApiConflictResponse({
    description: 'User is already a member of the circle',
  })
  async joinCircleByShareLink(
    @Param('shareLink') shareLink: string,
    @Query('userEmail') userEmail: string,
  ): Promise<Circle | null> {
    try {
      const circle = await this.circleService.joinCircleByShareLink(
        shareLink,
        userEmail,
      );
      return circle;
    } catch (error) {
      throw error; // Let NestJS handle the caught error with appropriate status code
    }
  }
}
