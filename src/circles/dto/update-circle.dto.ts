import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateCircleDto {
  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  circleName?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  circleDescription?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  wellbeingScore?: number;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  activityLevel?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  circleStatus?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  circleNos?: number;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  circleImage: Express.Multer.File;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  circleScoreDetail?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  circleMembersEmail: string[];
}

// export class UpdateCircleDto {
//   @ApiProperty()
//   @IsNotEmpty()
//   @IsString()
//   circleName: string;

//   @ApiProperty({ required: false, nullable: true })
//   @IsOptional()
//   @IsString()
//   circleDescription?: string;

//   @ApiProperty({ required: false, nullable: true })
//   @IsOptional()
//   @IsNumber()
//   wellbeingScore?: number;

//   @ApiProperty({ required: false, nullable: true })
//   @IsOptional()
//   @IsString()
//   activityLevel?: string;

//   @ApiProperty({ required: false, nullable: true })
//   @IsOptional()
//   @IsString()
//   circleStatus?: string;

//   @ApiProperty({ required: false, nullable: true })
//   @IsOptional()
//   @IsNumber()
//   circleNos?: number;

//   @ApiProperty({ type: 'string', format: 'binary', required: false })
//   @IsOptional()
//   circleImage?: Express.Multer.File;

//   @ApiProperty({ required: false, nullable: true })
//   @IsOptional()
//   @IsString()
//   circleScoreDetail?: string;

//   @ApiProperty({ required: false, nullable: true })
//   @IsOptional()
//   @IsArray()
//   @IsEmail({}, { each: true })
//   circleMembersEmail?: string[];
// }

// import { PartialType } from '@nestjs/swagger';
// import { CreateCircleWithMembersDto } from './create-circle-with-members.dto';

// export class UpdateCircleDto extends PartialType(CreateCircleWithMembersDto) {}

// // import { PartialType } from '@nestjs/swagger';
// // import { CreateCircleWithMembersDto } from './create-circle-with-members.dto';

// // export class UpdateCircleDto extends PartialType(CreateCircleWithMembersDto) {}
