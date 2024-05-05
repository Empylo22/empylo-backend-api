import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber, Min, IsString } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiProperty({ example: 0, description: 'page number' })
  pageNo?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiProperty({ example: 10, description: 'page size' })
  pageSize?: number = 10;
}

export class UserPaginationDto extends PaginationDto {
  @IsOptional()
  @Type(() => String)
  @IsString()
  @ApiProperty({ required: false, description: 'Search keyword' })
  keyword: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({
    required: false,
    description: 'Status, 0 for deactivated, 1 for activated',
  })
  status: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ required: false, description: 'survey type id' })
  roleId: number;

  // @IsOptional()
  // @Type(() => Number)
  // @IsNumber()
  // @ApiProperty({
  //   required: false,
  //   description: 'sort by; 0 for oldest, 1 for most recent',
  // })
  // sort: number;
}

export class RolePaginationDto extends PaginationDto {
  @IsOptional()
  @Type(() => String)
  @IsString()
  @ApiProperty({ required: false, description: 'Search keyword' })
  keyword: string;
}
export interface PaginationResponseDto {
  data: any;
  count: number;
}
