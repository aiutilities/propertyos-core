import { Injectable } from '@nestjs/common';

import { AuditService } from '../../audit/audit.service';
import { EventBusService } from '../../eventbus/services/eventbus.service';
import {
  MAINTENANCE_EVENTS,
} from '../maintenance.constants';
import {
  MaintenanceStatus,
  MaintenanceTicket,
} from '../types/maintenance.types';
import { MaintenanceService } from './maintenance.service';

@Injectable()
export class MaintenanceSlaService {
  constructor(
    private readonly maintenanceService:
      MaintenanceService,
    private readonly eventBus: EventBusService,
    private readonly auditService: AuditService,
  ) {}

  async processWarning(ticketId: string): Promise<void> {
    const ticket = await this.getActiveTicket(ticketId);

    if (!ticket) {
      return;
    }

    await this.publishEscalation(
      MAINTENANCE_EVENTS.SLA_WARNING,
      ticket,
      'WARNING',
    );
  }

  async processOverdue(ticketId: string): Promise<void> {
    const ticket = await this.getActiveTicket(ticketId);

    if (!ticket) {
      return;
    }

    if (
      !ticket.slaDueAt ||
      ticket.slaDueAt.getTime() > Date.now()
    ) {
      return;
    }

    await this.publishEscalation(
      MAINTENANCE_EVENTS.SLA_OVERDUE,
      ticket,
      'OVERDUE',
    );
  }

  private async getActiveTicket(
    ticketId: string,
  ): Promise<MaintenanceTicket | undefined> {
    const details =
      await this.maintenanceService.get(ticketId);

    if (
      [
        MaintenanceStatus.RESOLVED,
        MaintenanceStatus.CLOSED,
        MaintenanceStatus.CANCELLED,
        MaintenanceStatus.REJECTED,
      ].includes(details.status)
    ) {
      return undefined;
    }

    return details;
  }

  private async publishEscalation(
    eventType: string,
    ticket: MaintenanceTicket,
    escalationLevel: 'WARNING' | 'OVERDUE',
  ): Promise<void> {
    const payload = {
      entityType: 'maintenance.ticket',
      entityId: ticket.id,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      propertyId: ticket.propertyId,
      spaceId: ticket.spaceId,
      reporterPersonId: ticket.reporterPersonId,
      assigneePersonId: ticket.assigneePersonId,
      priority: ticket.priority,
      status: ticket.status,
      slaDueAt: ticket.slaDueAt,
      escalationLevel,
    };

    await this.eventBus.publish(
      eventType,
      'scheduler.maintenance-sla',
      payload,
      {
        correlationId: ticket.id,
        metadata: {
          module: 'maintenance',
          escalationLevel,
        },
      },
    );

    await this.auditService.record(
      eventType,
      'scheduler.maintenance-sla',
      payload,
    );
  }
}
