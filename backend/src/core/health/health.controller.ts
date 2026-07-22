import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { HealthService } from './health.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Health')
@ApiBearerAuth('JWT')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth() {
    return this.healthService.getHealth();
  }

  @Get('live')
  getLiveness() {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  async getReadiness(
    @Res({
      passthrough: true,
    })
    response: Response,
  ) {
    const readiness =
      await this.healthService.getReadiness();

    if (
      readiness.status !== 'ok'
    ) {
      response.status(
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return readiness;
  }

  @Get('database')
  getDatabaseHealth() {
    return this.healthService.getDatabaseHealth();
  }
}
