import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InstallThemeDto } from '../dto/install-theme.dto';
import { ThemeService } from '../services/theme.service';

@ApiTags('Themes')
@ApiBearerAuth('JWT')
@Controller('themes')
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Get()
  list() {
    return {
      success: true,
      data: this.themeService.list(),
    };
  }

  @Get('active')
  active() {
    return {
      success: true,
      data: this.themeService.getActive(),
    };
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return {
      success: true,
      data: this.themeService.get(id),
    };
  }

  @Post()
  install(@Body() dto: InstallThemeDto) {
    return this.themeService.install(dto);
  }

  @Post(':id/activate')
  activate(@Param('id') id: string) {
    return this.themeService.activate(id);
  }
}
