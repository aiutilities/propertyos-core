import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Permissions } from '../../auth/constants/permissions';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { CreateJobDto } from '../dto/create-job.dto';
import { SchedulerService } from '../services/scheduler.service';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @RequirePermission(Permissions.SCHEDULER_MANAGE)
  @Post('jobs')
  async createJob(@Body() dto: CreateJobDto) {
    return {
      success: true,
      data: {
        job: await this.schedulerService.createJob(dto),
      },
    };
  }

  @RequirePermission(Permissions.SCHEDULER_READ)
  @Get('jobs')
  async listJobs() {
    return {
      success: true,
      data: {
        jobs: await this.schedulerService.listJobs(),
      },
    };
  }

  @RequirePermission(Permissions.SCHEDULER_READ)
  @Get('jobs/:id')
  async getJob(@Param('id') id: string) {
    return {
      success: true,
      data: {
        job: await this.schedulerService.getJob(id),
      },
    };
  }

  @RequirePermission(Permissions.SCHEDULER_MANAGE)
  @Post('jobs/:id/run')
  async runJob(@Param('id') id: string) {
    return {
      success: true,
      data: {
        job: await this.schedulerService.runJob(id),
      },
    };
  }

  @RequirePermission(Permissions.SCHEDULER_READ)
  @Get('handlers')
  async listHandlers() {
    return {
      success: true,
      data: {
        handlers: this.schedulerService.listHandlers(),
      },
    };
  }
}
