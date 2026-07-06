import { Module } from '@nestjs/common';
import { PluginController } from './controllers/plugin.controller';
import { PluginService } from './services/plugin.service';
import { PostgresPluginRepository } from './repositories/postgres-plugin.repository';

@Module({
  controllers: [PluginController],
  providers: [PluginService, PostgresPluginRepository],
  exports: [PluginService],
})
export class PluginModule {}
