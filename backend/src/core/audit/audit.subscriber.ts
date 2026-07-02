import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBusService } from '../eventbus/services/eventbus.service';
import { PropertyOSEvent } from '../eventbus/types/event.types';
import { AuditService } from './audit.service';
import { AuditEventType } from './audit.types';

@Injectable()
export class AuditSubscriber implements OnModuleInit {
  constructor(
    private readonly eventBusService: EventBusService,
    private readonly auditService: AuditService,
  ) {}

  onModuleInit(): void {
    this.eventBusService.subscribeAll((event) => this.handleEvent(event));
  }

  private handleEvent(event: PropertyOSEvent): void {
    this.auditService.record(
      event.type as AuditEventType,
      event.source,
      event.payload,
    );
  }
}
