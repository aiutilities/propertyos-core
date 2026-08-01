import { Module } from '@nestjs/common';

import {
  PostgresModule,
} from '@propertyos/core-contracts';
import {
  AuditModule,
} from '@propertyos/core-contracts';
import {
  AuthModule,
} from '@propertyos/core-contracts';
import {
  EventBusModule,
} from '@propertyos/core-contracts';
import {
  PluginModule,
} from '@propertyos/core-contracts';
import {
  SearchModule,
} from '@propertyos/core-contracts';
import {
  SchedulerModule,
} from '@propertyos/core-contracts';
import {
  WorkflowModule,
} from '@propertyos/core-contracts';
import {
  ReservationBootstrapService,
} from './bootstrap/reservation-bootstrap.service';
import {
  ReservationWorkflowBootstrapService,
} from './bootstrap/reservation-workflow-bootstrap.service';
import {
  ReservationController,
} from './controllers/reservation.controller';
import {
  PostgresReservationRepository,
} from './repositories/postgres-reservation.repository';
import {
  RESERVATION_REPOSITORY,
} from './repositories/reservation.repository';
import {
  ReservationSearchProviderService,
} from './reservation-search-provider.service';
import {
  ReservationService,
} from './services/reservation.service';
import {
  ReservationSchedulerService,
} from './services/reservation-scheduler.service';
import {
  ReservationReminderJobHandler,
} from './handlers/reservation-reminder-job.handler';
import {
  ReservationEndJobHandler,
} from './handlers/reservation-end-job.handler';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    EventBusModule,
    PluginModule,
    PostgresModule,
    SearchModule,
    SchedulerModule,
    WorkflowModule,
  ],
  controllers: [
    ReservationController,
  ],
  providers: [
    ReservationBootstrapService,
    ReservationWorkflowBootstrapService,
    ReservationSearchProviderService,
    ReservationSchedulerService,
    ReservationReminderJobHandler,
    ReservationEndJobHandler,
    ReservationService,
    {
      provide:
        RESERVATION_REPOSITORY,
      useClass:
        PostgresReservationRepository,
    },
  ],
  exports: [
    ReservationService,
  ],
})
export class ReservationModule {}
