import { Module } from '@nestjs/common';

import {
  PostgresModule,
} from '../../database/postgres/postgres.module';
import {
  AuditModule,
} from '../audit/audit.module';
import {
  AuthModule,
} from '../auth/auth.module';
import {
  EventBusModule,
} from '../eventbus/eventbus.module';
import {
  PluginModule,
} from '../plugin/plugin.module';
import {
  SearchModule,
} from '../search';
import {
  SchedulerModule,
} from '../scheduler';
import {
  WorkflowModule,
} from '../workflow';
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
