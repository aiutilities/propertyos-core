import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { SetupAdminDto } from '../dto/setup-admin.dto';
import { BootstrapService } from '../services/bootstrap.service';

@ApiTags('Bootstrap')
@Controller('bootstrap')
export class BootstrapController {
  constructor(private readonly bootstrapService: BootstrapService) {}

  @Get('status')
  async status() {
    return this.bootstrapService.getStatus();
  }

  @Post('setup')
  async setup(@Body() body: SetupAdminDto) {
    return this.bootstrapService.setupAdmin(body);
  }
}
