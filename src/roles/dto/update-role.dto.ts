import { PartialType } from '@nestjs/swagger';
import {
  CreateRoleDto,
  CreateModuleDto,
  CreatePermissionDto,
} from './create-role.dto';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}

export class UpdateModuleDto extends PartialType(CreateModuleDto) {}

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}
