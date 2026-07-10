import { Injectable, OnModuleInit } from '@nestjs/common';

import { EventBusService } from '../eventbus/services/eventbus.service';
import { PropertyOSEvent } from '../eventbus/types/event.types';
import { WorkflowService } from './services/workflow.service';

type WorkflowEventMapping = {
  workflowCode: string;
  entityType: string;
  actionCode?: string;
  startOnEvent?: boolean;
};

@Injectable()
export class WorkflowEventSubscriber implements OnModuleInit {
  private readonly mappings = new Map<string, WorkflowEventMapping>([
    [
      'visitor.invited',
      {
        workflowCode: 'visitor.visit.lifecycle',
        entityType: 'visitor.visit',
        startOnEvent: true,
      },
    ],
    [
      'visitor.approved',
      {
        workflowCode: 'visitor.visit.lifecycle',
        entityType: 'visitor.visit',
        actionCode: 'APPROVE',
      },
    ],
    [
      'visitor.rejected',
      {
        workflowCode: 'visitor.visit.lifecycle',
        entityType: 'visitor.visit',
        actionCode: 'REJECT',
      },
    ],
    [
      'visitor.cancelled',
      {
        workflowCode: 'visitor.visit.lifecycle',
        entityType: 'visitor.visit',
        actionCode: 'CANCEL',
      },
    ],
    [
      'visitor.qr_generated',
      {
        workflowCode: 'visitor.visit.lifecycle',
        entityType: 'visitor.visit',
        actionCode: 'GENERATE_QR',
      },
    ],
    [
      'visitor.arrived',
      {
        workflowCode: 'visitor.visit.lifecycle',
        entityType: 'visitor.visit',
        actionCode: 'ARRIVE',
      },
    ],
    [
      'visitor.checked_in',
      {
        workflowCode: 'visitor.visit.lifecycle',
        entityType: 'visitor.visit',
        actionCode: 'CHECK_IN',
      },
    ],
    [
      'visitor.checked_out',
      {
        workflowCode: 'visitor.visit.lifecycle',
        entityType: 'visitor.visit',
        actionCode: 'CHECK_OUT',
      },
    ],
  ]);

  constructor(
    private readonly eventBusService: EventBusService,
    private readonly workflowService: WorkflowService,
  ) {}

  onModuleInit(): void {
    for (const eventType of this.mappings.keys()) {
      this.eventBusService.subscribe(eventType, (event) =>
        this.handleWorkflowEvent(event),
      );
    }
  }

  private async handleWorkflowEvent(event: PropertyOSEvent): Promise<void> {
    const mapping = this.mappings.get(event.type);

    if (!mapping) {
      return;
    }

    const entityId = this.resolveEntityId(event);

    if (!entityId) {
      return;
    }

    if (mapping.startOnEvent) {
      await this.workflowService.startWorkflowByCode({
        workflowCode: mapping.workflowCode,
        entityType: mapping.entityType,
        entityId,
        metadata: {
          sourceEventId: event.id,
          sourceEventType: event.type,
          source: event.source,
          payload: event.payload,
        },
      });

      return;
    }

    if (!mapping.actionCode) {
      return;
    }

    await this.workflowService.transitionWorkflowByEntity({
      entityType: mapping.entityType,
      entityId,
      actionCode: mapping.actionCode,
      metadata: {
        sourceEventId: event.id,
        sourceEventType: event.type,
        source: event.source,
        payload: event.payload,
      },
    });
  }

  private resolveEntityId(event: PropertyOSEvent): string | undefined {
    const payload = event.payload as {
      visitId?: unknown;
      entityId?: unknown;
    };

    if (typeof payload.visitId === 'string') {
      return payload.visitId;
    }

    if (typeof payload.entityId === 'string') {
      return payload.entityId;
    }

    return undefined;
  }
}
