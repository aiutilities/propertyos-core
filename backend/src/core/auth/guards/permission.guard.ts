import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IdentityService } from '../../identity/services/identity.service';
import { REQUIRED_PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { AuthRequest } from '../types/auth-request.type';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly identityService: IdentityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      REQUIRED_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = request.user;

    if (!user?.sub) {
      throw new ForbiddenException('User context missing');
    }

    const roles = await this.identityService.listPersonRoles(user.sub);

    for (const role of roles) {
      const permissions = await this.identityService.listRolePermissions(role.id);

      const hasPermission = permissions.some(
        (permission) => permission.key === requiredPermission,
      );

      if (hasPermission) {
        return true;
      }
    }

    throw new ForbiddenException('Permission denied');
  }
}
