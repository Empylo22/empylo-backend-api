import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateModuleDto,
  CreatePermissionDto,
  // CreateRoleDto,
} from './dto/create-role.dto';
import {
  PaginationResponseDto,
  RolePaginationDto,
} from 'src/users/dto/pagination.dto';
import { UserService } from 'src/users/user.service';
import { Permissions, Role, Modules } from '@prisma/client';

@Injectable()
export class RolePermissionService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async getAllPermission(): Promise<Permissions[]> {
    const permissions = await this.prisma.permissions.findMany({
      where: {
        isDeleted: false,
      },
    });
    if (permissions.length > 0) {
      return permissions;
    }
    throw new HttpException(
      'No permissions found for specified module.',
      HttpStatus.NOT_FOUND,
    );
  }

  async createPermission(
    createPermissionDto: CreatePermissionDto,
  ): Promise<Permissions> {
    const { moduleId, permissionName } = createPermissionDto;
    const moduleFromDb = await this.prisma.modules.findUnique({
      where: {
        id: moduleId,
      },
    });
    if (!moduleFromDb) {
      throw new HttpException(
        `No module found for id ${moduleId}`,
        HttpStatus.NOT_FOUND,
      );
    }
    const permissionFromDb = await this.prisma.permissions.findFirst({
      where: {
        permissionTitle: permissionName,
      },
    });
    if (permissionFromDb) {
      throw new HttpException(
        `Permission name not unique`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const permission = await this.prisma.permissions.create({
      data: {
        permissionTitle: permissionName.toUpperCase(),
        modules: {
          connect: {
            id: moduleFromDb.id,
          },
        },
      },
    });

    return permission;
  }

  // async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
  //   const { roleName, permissionId } = createRoleDto;

  //   const roleFromDb = await this.prisma.role.findFirst({
  //     where: {
  //       roleName,
  //     },
  //   });
  //   if (roleFromDb) {
  //     throw new HttpException(`Role name not unique`, HttpStatus.BAD_REQUEST);
  //   }

  //   const permissions = await this.prisma.permissions.findMany({
  //     where: {
  //       id: {
  //         in: permissionId,
  //       },
  //     },
  //   });

  //   if (permissions.length !== permissionId.length) {
  //     throw new HttpException(
  //       `One or more permissions not found`,
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }

  //   const role = await this.prisma.role.create({
  //     data: {
  //       roleName,
  //       permissions: {
  //         connect: permissions.map((permission) => ({
  //           id: permission.id,
  //         })),
  //       },
  //     },
  //   });

  //   return role;
  // }

  async createModule(createModuleDto: CreateModuleDto): Promise<Modules> {
    const { moduleName, moduleDescription } = createModuleDto;

    const module = await this.prisma.modules.create({
      data: {
        moduleName,
        moduleDescription,
      },
    });

    return module;
  }

  // async updateRole(
  //   roleId: number,
  //   createRoleDto: CreateRoleDto,
  // ): Promise<Role> {
  //   const { roleName, permissionId } = createRoleDto;

  //   const permissions = await this.prisma.permissions.findMany({
  //     where: {
  //       id: {
  //         in: permissionId,
  //       },
  //     },
  //   });

  //   if (permissions.length !== permissionId.length) {
  //     throw new HttpException(
  //       `One or more permissions not found`,
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }

  //   const updatedRole = await this.prisma.role.update({
  //     where: {
  //       id: roleId,
  //     },
  //     data: {
  //       roleName,
  //       permissions: {
  //         connect: permissions.map((permission) => ({
  //           id: permission.id,
  //         })),
  //       },
  //     },
  //   });

  //   return updatedRole;
  // }

  async getAllRoles(): Promise<Role[]> {
    const roles = await this.prisma.role.findMany({
      where: {
        isDeleted: false,
      },
    });
    if (roles.length > 0) {
      return roles;
    }
    throw new HttpException('No roles found.', HttpStatus.NOT_FOUND);
  }

  async getAllModules(): Promise<Modules[]> {
    const modules = await this.prisma.modules.findMany({
      where: {
        isDeleted: false,
      },
    });
    if (modules.length > 0) {
      return modules;
    }
    throw new HttpException('No modules found.', HttpStatus.NOT_FOUND);
  }

  // async getAllUserModuleAccess(userId: number): Promise<Modules[]> {
  //   const userFromDb = await this.userService.findById(userId);
  //   if (userFromDb == null) {
  //     throw new HttpException('Invalid user id.', HttpStatus.NOT_FOUND);
  //   }
  //   if (userFromDb.role == null) {
  //     throw new HttpException(
  //       'No role assigned to this user.',
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }

  //   const modulesFromDb = await this.getAllModules();

  //   const permissionArray = [];
  //   for (const module of modulesFromDb) {
  //     let obj = {
  //       moduleName: module.moduleName,
  //       fullAccess: false,
  //       limitedAccess: false,
  //       noAccess: false,
  //     };
  //     // Check if user's permissions include all required permissions
  //     const hasPermission = module.permissions.every((permission) =>
  //       userFromDb.role.permissions.some(
  //         (userPermission) => userPermission.id === permission.id,
  //       ),
  //     );

  //     if (hasPermission) {
  //       obj = {
  //         ...obj,
  //         fullAccess: true,
  //       };
  //     } else if (
  //       userFromDb.role.permissions.some((permission) =>
  //         module.permissions.some(
  //           (modulePermission) => modulePermission.id === permission.id,
  //         ),
  //       )
  //     ) {
  //       obj = {
  //         ...obj,
  //         limitedAccess: true,
  //       };
  //     } else {
  //       obj = {
  //         ...obj,
  //         noAccess: true,
  //       };
  //     }
  //     permissionArray.push(obj);
  //   }

  //   return permissionArray;
  // }

  async getAllRolesPaginated(
    filter: RolePaginationDto,
  ): Promise<PaginationResponseDto> {
    const { pageNo, pageSize, keyword } = filter;
    const where = {
      isDeleted: false,
      ...(keyword && {
        roleName: {
          contains: keyword.toLowerCase(),
        },
      }),
    };

    const [roles, total] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        where,
        skip: pageNo * pageSize,
        take: pageSize,
        orderBy: {
          id: 'asc',
        },
      }),
      this.prisma.role.count({
        where,
      }),
    ]);

    if (roles.length === 0) {
      throw new HttpException('No roles found.', HttpStatus.NOT_FOUND);
    }

    return {
      data: roles,
      count: total,
    };
  }

  async getRoleById(id: number): Promise<Role> {
    const roleFromDb = await this.prisma.role.findUnique({ where: { id } });
    if (roleFromDb) {
      return roleFromDb;
    }
    throw new HttpException(
      'No role found for specified id.',
      HttpStatus.NOT_FOUND,
    );
  }

  async bulkDeleteRoles(roleIds: number[]): Promise<string> {
    const deletedRoles = await this.prisma.role.updateMany({
      where: {
        id: {
          in: roleIds,
        },
      },
      data: {
        isDeleted: true,
      },
    });

    if (deletedRoles.count > 0) {
      return 'Roles deleted successfully';
    }
    throw new HttpException('Unable to delete roles', HttpStatus.BAD_REQUEST);
  }
}
