import { Module } from '@nestjs/common';

import { PostgresModule } from '../../database/postgres/postgres.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EventBusModule } from '../eventbus/eventbus.module';
import { PluginModule } from '../plugin/plugin.module';
import { HelpdeskBootstrapService } from './bootstrap/helpdesk-bootstrap.service';
import { HelpdeskController } from './controllers/helpdesk.controller';
import {
  HELPDESK_REPOSITORY,
} from './repositories/helpdesk.repository';
import { PostgresHelpdeskRepository } from './repositories/postgres-helpdesk.repository';
import { HelpdeskService } from './services/helpdesk.service';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    PostgresModule,
    EventBusModule,
    PluginModule,
  ],
  controllers: [
    HelpdeskController,
  ],
  providers: [
    HelpdeskBootstrapService,
    HelpdeskService,
    {
      provide: HELPDESK_REPOSITORY,
      useClass: PostgresHelpdeskRepository,
    },
  ],
  exports: [
    HelpdeskService,
  ],
})
export class HelpdeskModule {}
