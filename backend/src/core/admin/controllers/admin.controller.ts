import { Controller, Get } from '@nestjs/common';
import { AdminService } from '../services/admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('platform')
  async platform() {
    return {
      success: true,
      data: await this.adminService.getPlatformDiagnostics(),
    };
  }

  @Get('dashboard')
  dashboard() {
    return {
      success: true,
      data: this.adminService.getDashboard(),
    };
  }

  @Get('menu')
  menu() {
    return {
      success: true,
      data: this.adminService.getMenu(),
    };
  }

  @Get('widgets')
  widgets() {
    return {
      success: true,
      data: this.adminService.getWidgets(),
    };
  }
}
