import { Module } from '@nestjs/common';
import { PostgresModule } from '../../database/postgres/postgres.module';
import { EVENTBUS_REPOSITORY } from './repositories/eventbus.repository';
import { PostgresEventBusRepository } from './repositories/postgres-eventbus.repository';
import { EventBusService } from './services/eventbus.service';

@Module({
  imports: [PostgresModule],
  providers: [
    EventBusService,
    {
      provide: EVENTBUS_REPOSITORY,
      useClass: PostgresEventBusRepository,
    },
  ],
  exports: [EventBusService],
})
export class EventBusModule {}
