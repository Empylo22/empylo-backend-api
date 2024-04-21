import { ApiProperty } from '@nestjs/swagger';
import {
  IsAlpha,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MinLength,
} from 'class-validator';

export class CreateCircleWithMembersDto {
  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  circleName: string;

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

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  circleImg?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  circleScoreDetail?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsArray()
  // @IsEmail()
  circleMembersEmail: string[];
}
