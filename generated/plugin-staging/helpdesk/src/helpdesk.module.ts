import { Module } from '@nestjs/common';

import { PostgresModule } from '@propertyos/core-contracts';
import { AuditModule } from '@propertyos/core-contracts';
import { AuthModule } from '@propertyos/core-contracts';
import { EventBusModule } from '@propertyos/core-contracts';
import { PluginModule } from '@propertyos/core-contracts';

import {
  SearchModule,
} from '@propertyos/core-contracts';
import {
  SchedulerModule,
} from '@propertyos/core-contracts';
import { HelpdeskBootstrapService } from './bootstrap/helpdesk-bootstrap.service';
import { HelpdeskController } from './controllers/helpdesk.controller';
import {
  HELPDESK_REPOSITORY,
} from './repositories/helpdesk.repository';
import { PostgresHelpdeskRepository } from './repositories/postgres-helpdesk.repository';
import { HelpdeskService } from './services/helpdesk.service';
import { HelpdeskSlaService } from './services/helpdesk-sla.service';
import { HelpdeskSlaWarningJobHandler } from './handlers/helpdesk-sla-warning-job.handler';
import { HelpdeskSlaBreachJobHandler } from './handlers/helpdesk-sla-breach-job.handler';


import {
  HelpdeskSearchProviderService,
} from './helpdesk-search-provider.service';
@Module({
  imports: [
    AuditModule,
    AuthModule,
    PostgresModule,
    EventBusModule,
    PluginModule,
    SearchModule,
    SchedulerModule,
  ],
  controllers: [
    HelpdeskController,
  ],
  providers: [
    HelpdeskBootstrapService,
    HelpdeskSearchProviderService,
    HelpdeskSlaService,
    HelpdeskSlaWarningJobHandler,
    HelpdeskSlaBreachJobHandler,
    HelpdeskService,
    {
      provide: HELPDESK_REPOSITORY,
      useClass: PostgresHelpdeskRepository,
    },
  ],
  exports: [
    HelpdeskService,
    HelpdeskSlaService,
    HelpdeskSlaWarningJobHandler,
    HelpdeskSlaBreachJobHandler,
  ],
})
export class HelpdeskModule {}
