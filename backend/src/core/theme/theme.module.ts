import { ThemePackageValidator } from './package/validator/theme-package.validator';
import { ThemePackageService } from './package/services/theme-package.service';
import { ThemePackageRepository } from './package/repositories/theme-package.repository';
import { ThemePackageArchiveService } from './package/archive/theme-package-archive.service';
import { ThemePackageController } from './package/controllers/theme-package.controller';
import { Module } from '@nestjs/common';
import { EventBusModule } from '../eventbus/eventbus.module';
import { ThemeController } from './controllers/theme.controller';
import { ThemeRegistry } from './registries/theme.registry';
import { ThemeService } from './services/theme.service';

@Module({
  imports: [EventBusModule],
  controllers: [ThemeController, ThemePackageController],
  providers: [ThemeService, ThemeRegistry, ThemePackageService, ThemePackageRepository, ThemePackageValidator, ThemePackageArchiveService],
  exports: [ThemeService, ThemeRegistry, ThemePackageService],
})
export class ThemeModule {}
