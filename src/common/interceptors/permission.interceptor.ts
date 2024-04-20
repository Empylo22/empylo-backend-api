import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class PermissionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Perform permission check logic here
    const permissions = Reflect.getMetadata(
      'permissions',
      context.getHandler(),
    );
    const userHeader = context.switchToHttp().getRequest().headers.user;
    const user = JSON.parse(userHeader);
    const userPermissions = user.role.permissions.map(
      (permission) => permission.permission_title,
    );

    console.log('user', userPermissions);

    // Check if user's permissions include all required permissions
    const hasPermission = permissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      // Handle unauthorized access
      throw new UnauthorizedException('Access denied.');
    }

    // Proceed with the request handling
    return next.handle();
  }
}
