import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateJobDto } from '../dto/create-job.dto';
import { SchedulerService } from '../services/scheduler.service';

@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post('jobs')
  async createJob(@Body() dto: CreateJobDto) {
    return {
      success: true,
      data: {
        job: await this.schedulerService.createJob(dto),
      },
    };
  }

  @Get('jobs')
  async listJobs() {
    return {
      success: true,
      data: {
        jobs: await this.schedulerService.listJobs(),
      },
    };
  }

  @Get('jobs/:id')
  async getJob(@Param('id') id: string) {
    return {
      success: true,
      data: {
        job: await this.schedulerService.getJob(id),
      },
    };
  }

  @Post('jobs/:id/run')
  async runJob(@Param('id') id: string) {
    return {
      success: true,
      data: {
        job: await this.schedulerService.runJob(id),
      },
    };
  }

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
