import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { NotificationService } from '../services/notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  @Get()
  @RequirePermission('notification.read')
  listNotifications() {
    return {
      success: true,
      data: {
        notifications: this.notificationService.listNotifications(),
      },
    };
  }
}
