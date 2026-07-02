import { Module } from '@nestjs/common';
import { EventBusModule } from '../eventbus/eventbus.module';
import { AuditService } from './audit.service';
import { AuditSubscriber } from './audit.subscriber';

@Module({
  imports: [EventBusModule],
  providers: [AuditService, AuditSubscriber],
  exports: [AuditService],
})
export class AuditModule {}
