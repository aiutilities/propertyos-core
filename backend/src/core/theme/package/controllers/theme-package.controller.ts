import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RegisterThemePackageDto } from '../dto/register-theme-package.dto';
import { ThemePackageService } from '../services/theme-package.service';

@Controller('theme-packages')
export class ThemePackageController {
  constructor(private readonly themePackageService: ThemePackageService) {}

  @Post()
  register(@Body() dto: RegisterThemePackageDto) {
    return this.themePackageService.register(dto);
  }

  @Get()
  list() {
    return this.themePackageService.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.themePackageService.get(id);
  }

  @Patch(':id/install')
  install(@Param('id') id: string) {
    return this.themePackageService.install(id);
  }

  @Patch(':id/archive')
  archive(@Param('id') id: string) {
    return this.themePackageService.archive(id);
  }
}
