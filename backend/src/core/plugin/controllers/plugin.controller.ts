import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { PluginService } from '../services/plugin.service';
import { CreatePluginDto } from '../dto/create-plugin.dto';
import { PluginTransitionDto } from '../dto/plugin-transition.dto';
import { UpgradePluginDto } from '../dto/upgrade-plugin.dto';
import { RollbackPluginDto } from '../dto/rollback-plugin.dto';

@Controller('plugins')
export class PluginController {
  constructor(private readonly service: PluginService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get('installed')
  installed() {
    return this.service.installedPlugins();
  }

  @Post()
  install(@Body() dto: CreatePluginDto) {
    return this.service.install(dto);
  }

  @Get(':id')
  getInstalled(@Param('id') id: string) {
    return this.service.getInstalledPlugin(id);
  }

  @Get(':id/capabilities')
  capabilities(@Param('id') id: string) {
    return this.service.getPluginCapabilities(id);
  }

  @Get(':id/diagnostics')
  diagnostics(@Param('id') id: string) {
    return this.service.getPluginDiagnostics(id);
  }

  @Get(':id/load-report')
  async loadReport(@Param('id') id: string) {
    const diagnostics = await this.service.getPluginDiagnostics(id);

    return {
      success: true,
      data: diagnostics.loadReport ?? [],
    };
  }

  @Get(':id/lifecycle')
  lifecycleStatus(@Param('id') id: string) {
    return this.service.getPluginLifecycle(id);
  }

  @Post(':id/upgrade')
  upgrade(
    @Param('id') id: string,
    @Body() dto: UpgradePluginDto,
  ) {
    return this.service.upgrade(id, dto);
  }

  @Post(':id/rollback')
  rollback(
    @Param('id') id: string,
    @Body() dto: RollbackPluginDto,
  ) {
    return this.service.rollback(id, dto);
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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
