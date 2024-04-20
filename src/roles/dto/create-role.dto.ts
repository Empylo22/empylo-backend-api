import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty()
  @IsNotEmpty()
  roleName: string;

  @ApiProperty({
    type: () => [Number],
  })
  @IsNotEmpty()
  permissionId: number[];
}

export class CreatePermissionDto {
  @ApiProperty()
  @IsNotEmpty()
  permissionName: string;

  @ApiProperty()
  @IsNotEmpty()
  moduleId: number;
}

export class CreateModuleDto {
  @ApiProperty()
  @IsNotEmpty()
  moduleName: string;

  @ApiProperty()
  @IsNotEmpty()
  moduleDescription: string;
}
