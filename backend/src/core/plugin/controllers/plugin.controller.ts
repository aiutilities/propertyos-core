import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PluginService } from '../services/plugin.service';
import { CreatePluginDto } from '../dto/create-plugin.dto';
import { PluginTransitionDto } from '../dto/plugin-transition.dto';

@Controller('plugins')
export class PluginController {
  constructor(private readonly service: PluginService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  install(@Body() dto: CreatePluginDto) {
    return this.service.install(dto);
  }

  @Post(':id/lifecycle')
  lifecycle(
    @Param('id') id: string,
    @Body() dto: PluginTransitionDto,
  ) {
    switch (dto.action) {
      case 'ACTIVATE':
        return this.service.activate(id);
      case 'DEACTIVATE':
        return this.service.deactivate(id);
      case 'UNINSTALL':
        return this.service.uninstall(id);
    }
  }
}
