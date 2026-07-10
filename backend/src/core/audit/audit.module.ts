import { Module } from '@nestjs/common';

import { PostgresModule } from '../../database/postgres/postgres.module';
import { EventBusModule } from '../eventbus/eventbus.module';
import { IdentityModule } from '../identity/identity.module';
import { AuditService } from './audit.service';
import { AuditSubscriber } from './audit.subscriber';
import { AuditController } from './controllers/audit.controller';

@Module({
  imports: [EventBusModule, IdentityModule, PostgresModule],
  controllers: [AuditController],
  providers: [AuditService, AuditSubscriber],
  exports: [AuditService],
})
export class AuditModule {}
