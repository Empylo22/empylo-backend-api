import { Module, forwardRef } from '@nestjs/common';
import { RolePermissionService } from './roles.service';
import { RolesController } from './roles.controller';
import { UserModule } from 'src/user/user.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule, forwardRef(() => UserModule)],
  controllers: [RolesController],
  providers: [RolePermissionService],
  exports: [RolePermissionService],
})
export class RolesModule {}
