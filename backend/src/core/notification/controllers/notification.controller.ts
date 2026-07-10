import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { NotificationService } from '../services/notification.service';

@ApiTags('Notifications')
@ApiBearerAuth('JWT')
@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}


  @Get('templates')
  @RequirePermission('notification.read')
  listTemplates() {
    return {
      success: true,
      data: {
        templates: this.notificationService.listTemplates(),
      },
    };
  }

  @Get()
  @RequirePermission('notification.read')
  async listNotifications() {
    return {
      success: true,
      data: {
        notifications: await this.notificationService.listNotifications(),
      },
    };
  }
}
