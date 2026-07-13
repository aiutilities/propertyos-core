import {
  Module,
} from '@nestjs/common';

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
  CommunicationsSchedulerService,
} from './services/communications-scheduler.service';

import {
  PublishCommunicationJobHandler,
} from './handlers/publish-communication-job.handler';

import {
  ExpireCommunicationJobHandler,
} from './handlers/expire-communication-job.handler';

import {
  CommunicationsBootstrapService,
} from './bootstrap/communications-bootstrap.service';
import {
  CommunicationsController,
} from './controllers/communications.controller';
import {
  COMMUNICATIONS_REPOSITORY,
} from './repositories/communications.repository';
import {
  PostgresCommunicationsRepository,
} from './repositories/postgres-communications.repository';
import {
  CommunicationsService,
} from './services/communications.service';
import {
  CommunicationsSearchProviderService,
} from './communications-search-provider.service';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    EventBusModule,
    PluginModule,
    PostgresModule,
    SearchModule,
    SchedulerModule,
  ],
  controllers: [
    CommunicationsController,
  ],
  providers: [
    CommunicationsBootstrapService,
    CommunicationsSearchProviderService,
    CommunicationsService,
    {
      provide:
        COMMUNICATIONS_REPOSITORY,
      useClass:
        PostgresCommunicationsRepository,
    },
    CommunicationsSchedulerService,
    PublishCommunicationJobHandler,
    ExpireCommunicationJobHandler,],
  exports: [
    CommunicationsService,
  ],
})
export class CommunicationsModule {}
