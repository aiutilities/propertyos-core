import { Injectable } from '@nestjs/common';

import { AuditService } from '@propertyos/core-contracts';
import { EventBusService } from '@propertyos/core-contracts';
import {
  HELPDESK_EVENTS,
} from '../helpdesk.constants';
import {
  HelpdeskStatus,
  HelpdeskTicket,
} from '../types/helpdesk.types';
import { HelpdeskService } from './helpdesk.service';

@Injectable()
export class HelpdeskSlaService {
  constructor(
    private readonly helpdeskService:
      HelpdeskService,
    private readonly eventBus:
      EventBusService,
    private readonly auditService:
      AuditService,
  ) {}

  async processWarning(
    ticketId: string,
  ): Promise<void> {
    const ticket =
      await this.getActiveTicket(ticketId);

    if (!ticket) {
      return;
    }

    if (
      !ticket.resolutionDueAt ||
      ticket.resolutionDueAt.getTime() <=
        Date.now()
    ) {
      return;
    }

    await this.publishSlaEvent(
      HELPDESK_EVENTS.SLA_WARNING,
      ticket,
      'WARNING',
    );
  }

  async processBreach(
    ticketId: string,
  ): Promise<void> {
    let ticket =
      await this.getActiveTicket(ticketId);

    if (!ticket) {
      return;
    }

    if (
      !ticket.resolutionDueAt ||
      ticket.resolutionDueAt.getTime() >
        Date.now()
    ) {
      return;
    }

    if (
      ticket.status !==
      HelpdeskStatus.ESCALATED
    ) {
      ticket =
        await this.helpdeskService.escalate(
          ticket.id,
          {
            changedByPersonId:
              ticket.requesterPersonId,
            remarks:
              'Automatically escalated after SLA breach',
          },
        );
    }

    await this.publishSlaEvent(
      HELPDESK_EVENTS.SLA_BREACHED,
      ticket,
      'BREACHED',
    );
  }

  private async getActiveTicket(
    ticketId: string,
  ): Promise<HelpdeskTicket | undefined> {
    const details =
      await this.helpdeskService.get(ticketId);

    if (
      [
        HelpdeskStatus.RESOLVED,
        HelpdeskStatus.CLOSED,
        HelpdeskStatus.CANCELLED,
      ].includes(details.status)
    ) {
      return undefined;
    }

    return details;
  }

  private async publishSlaEvent(
    eventType: string,
    ticket: HelpdeskTicket,
    escalationLevel:
      | 'WARNING'
      | 'BREACHED',
  ): Promise<void> {
    const payload = {
      entityType: 'helpdesk.ticket',
      entityId: ticket.id,
      ticketId: ticket.id,
      ticketNumber:
        ticket.ticketNumber,
      title: ticket.title,
      propertyId:
        ticket.propertyId,
      spaceId:
        ticket.spaceId,
      requesterPersonId:
        ticket.requesterPersonId,
      assigneePersonId:
        ticket.assigneePersonId,
      priority:
        ticket.priority,
      status:
        ticket.status,
      responseDueAt:
        ticket.responseDueAt,
      resolutionDueAt:
        ticket.resolutionDueAt,
      escalationLevel,
    };

    await this.eventBus.publish(
      eventType,
      'scheduler.helpdesk-sla',
      payload,
      {
        correlationId: ticket.id,
        metadata: {
          module: 'helpdesk',
          escalationLevel,
        },
      },
    );

    await this.auditService.record(
      eventType,
      'scheduler.helpdesk-sla',
      payload,
    );
  }
}
