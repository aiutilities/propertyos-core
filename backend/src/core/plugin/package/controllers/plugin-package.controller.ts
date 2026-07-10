import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RegisterPluginPackageDto } from '../dto/register-plugin-package.dto';
import { PluginPackageService } from '../services/plugin-package.service';

@ApiTags('Plugin Packages')
@ApiBearerAuth('JWT')
@Controller('plugin-packages')
export class PluginPackageController {
  constructor(private readonly service: PluginPackageService) {}

  @Post()
  register(@Body() dto: RegisterPluginPackageDto) {
    return {
      success: true,
      data: this.service.register(dto),
    };
  }

  @Get()
  list() {
    return {
      success: true,
      data: this.service.list(),
    };
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return {
      success: true,
      data: this.service.get(id),
    };
  }

  @Post(':id/validate')
  validate(@Param('id') id: string) {
    return {
      success: true,
      data: this.service.validate(id),
    };
  }
}
