import { Module } from '@nestjs/common';
import { EventBusService } from './eventbus.service';

@Module({
  providers: [EventBusService],
  exports: [EventBusService],
})
export class EventBusModule {}
