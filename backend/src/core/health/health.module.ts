import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ConfigurationModule } from '../configuration';
import { PluginModule } from '../plugin';
import { PluginLoaderService } from '../plugin/loader/plugin-loader.service';
import { SchedulerModule } from '../scheduler';
import { StorageModule } from '../storage';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [
    DatabaseModule,
    ConfigurationModule,
    PluginModule,
    SchedulerModule,
    StorageModule,
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
