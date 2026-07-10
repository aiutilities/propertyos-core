import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { InstallDistributionDto } from '../dto/install-distribution.dto';
import { RegisterDistributionDto } from '../dto/register-distribution.dto';
import { DistributionService } from '../services/distribution.service';

@ApiTags('Distributions')
@ApiBearerAuth('JWT')
@Controller('distributions')
export class DistributionController {
  constructor(private readonly distributionService: DistributionService) {}

  @Post()
  register(@Body() dto: RegisterDistributionDto) {
    return this.distributionService.register(dto);
  }

  @Get()
  list() {
    return this.distributionService.list();
  }

  @Get('active')
  getActive() {
    return this.distributionService.getActive();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.distributionService.get(id);
  }

  @Patch('install')
  install(@Body() dto: InstallDistributionDto) {
    return this.distributionService.install(dto);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.distributionService.activate(id);
  }

  @Patch(':id/archive')
  archive(@Param('id') id: string) {
    return this.distributionService.archive(id);
  }
}
