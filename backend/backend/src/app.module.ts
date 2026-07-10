import { Module } from '@nestjs/common';

import { EventBusModule } from './core/eventbus/eventbus.module';
import { PluginEngineModule } from './core/plugin-engine/plugin-engine.module';

@Module({
  imports: [
    EventBusModule,
    PluginEngineModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
