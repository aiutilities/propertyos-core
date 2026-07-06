import { Module } from '@nestjs/common';
import { EventBusModule } from '../eventbus/eventbus.module';
import { ThemeController } from './controllers/theme.controller';
import { ThemeRegistry } from './registries/theme.registry';
import { ThemeService } from './services/theme.service';

@Module({
  imports: [EventBusModule],
  controllers: [ThemeController],
  providers: [ThemeService, ThemeRegistry],
  exports: [ThemeService, ThemeRegistry],
})
export class ThemeModule {}
