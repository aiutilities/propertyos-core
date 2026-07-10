import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post } from '@nestjs/common';
import { InstallPluginPackageDto } from '../dto/install-plugin-package.dto';
import { PluginInstallerService } from '../services/plugin-installer.service';

@ApiTags('Plugin Installer')
@ApiBearerAuth('JWT')
@Controller('plugin-installer')
export class PluginInstallerController {
  constructor(
    private readonly pluginInstallerService: PluginInstallerService,
  ) {}

  @Post('install')
  install(@Body() dto: InstallPluginPackageDto) {
    return this.pluginInstallerService.install(dto);
  }
}
