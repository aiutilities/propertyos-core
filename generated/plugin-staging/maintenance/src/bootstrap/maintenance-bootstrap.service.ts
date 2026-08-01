import { Injectable } from '@nestjs/common';

import { PluginNotificationRegistry } from '@propertyos/core-contracts';
import { PluginPermissionRegistry } from '@propertyos/core-contracts';
import { PluginWorkflowRegistry } from '@propertyos/core-contracts';

import {
  MAINTENANCE_EVENTS,
  MAINTENANCE_PERMISSIONS,
  MAINTENANCE_REGISTRY_ID,
  MAINTENANCE_WORKFLOW_CODE,
} from '../maintenance.constants';
import {
  MAINTENANCE_WORKFLOW_DEFINITION,
} from '../maintenance-workflow.definition';

@Injectable()
export class MaintenanceBootstrapService {
  constructor(
    permissionRegistry: PluginPermissionRegistry,
    workflowRegistry: PluginWorkflowRegistry,
    notificationRegistry: PluginNotificationRegistry,
  ) {
    permissionRegistry.register(MAINTENANCE_REGISTRY_ID, [
      {
        key: MAINTENANCE_PERMISSIONS.READ,
        description: 'View maintenance tickets and maintenance history',
      },
      {
        key: MAINTENANCE_PERMISSIONS.CREATE,
        description: 'Create maintenance tickets',
      },
      {
        key: MAINTENANCE_PERMISSIONS.MANAGE,
        description:
          'Assign, update, resolve, close, cancel, or reject maintenance tickets',
      },
    ]);

    workflowRegistry.register(
      MAINTENANCE_REGISTRY_ID,
      [MAINTENANCE_WORKFLOW_DEFINITION],
    );

    notificationRegistry.register(MAINTENANCE_REGISTRY_ID, [
      {
        code: 'maintenance.inapp.created',
        event: MAINTENANCE_EVENTS.CREATED,
        channel: 'IN_APP',
        template:
          'Maintenance ticket {{ticketNumber}} was created: {{title}}.',
        metadata: {
          recipientField: 'reporterPersonId',
          module: 'maintenance',
        },
      },
      {
        code: 'maintenance.inapp.assigned',
        event: MAINTENANCE_EVENTS.ASSIGNED,
        channel: 'IN_APP',
        template:
          'Maintenance ticket {{ticketNumber}} was assigned to you.',
        metadata: {
          recipientField: 'assigneePersonId',
          module: 'maintenance',
        },
      },
      {
        code: 'maintenance.inapp.in-progress',
        event: MAINTENANCE_EVENTS.IN_PROGRESS,
        channel: 'IN_APP',
        template:
          'Work has started on maintenance ticket {{ticketNumber}}.',
        metadata: {
          recipientField: 'reporterPersonId',
          module: 'maintenance',
        },
      },
      {
        code: 'maintenance.inapp.resolved',
        event: MAINTENANCE_EVENTS.RESOLVED,
        channel: 'IN_APP',
        template:
          'Maintenance ticket {{ticketNumber}} has been marked resolved.',
        metadata: {
          recipientField: 'reporterPersonId',
          module: 'maintenance',
        },
      },
      {
        code: 'maintenance.inapp.sla-warning.reporter',
        event: MAINTENANCE_EVENTS.SLA_WARNING,
        channel: 'IN_APP',
        subject:
          'Maintenance SLA warning: {{ticketNumber}}',
        template:
          'Maintenance ticket {{ticketNumber}} is approaching its SLA deadline at {{slaDueAt}}.',
        metadata: {
          recipientField: 'reporterPersonId',
          module: 'maintenance',
          escalationLevel: 'WARNING',
        },
      },
      {
        code: 'maintenance.inapp.sla-warning.assignee',
        event: MAINTENANCE_EVENTS.SLA_WARNING,
        channel: 'IN_APP',
        subject:
          'Assigned ticket approaching SLA: {{ticketNumber}}',
        template:
          'Assigned maintenance ticket {{ticketNumber}} is approaching its SLA deadline at {{slaDueAt}}.',
        metadata: {
          recipientField: 'assigneePersonId',
          module: 'maintenance',
          escalationLevel: 'WARNING',
        },
      },
      {
        code: 'maintenance.inapp.sla-overdue.reporter',
        event: MAINTENANCE_EVENTS.SLA_OVERDUE,
        channel: 'IN_APP',
        subject:
          'Maintenance ticket overdue: {{ticketNumber}}',
        template:
          'Maintenance ticket {{ticketNumber}} has exceeded its SLA deadline.',
        metadata: {
          recipientField: 'reporterPersonId',
          module: 'maintenance',
          escalationLevel: 'OVERDUE',
        },
      },
      {
        code: 'maintenance.inapp.sla-overdue.assignee',
        event: MAINTENANCE_EVENTS.SLA_OVERDUE,
        channel: 'IN_APP',
        subject:
          'Assigned maintenance ticket overdue: {{ticketNumber}}',
        template:
          'Assigned maintenance ticket {{ticketNumber}} has exceeded its SLA deadline.',
        metadata: {
          recipientField: 'assigneePersonId',
          module: 'maintenance',
          escalationLevel: 'OVERDUE',
        },
      },
      {
        code: 'maintenance.inapp.closed',
        event: MAINTENANCE_EVENTS.CLOSED,
        channel: 'IN_APP',
        template:
          'Maintenance ticket {{ticketNumber}} has been closed.',
        metadata: {
          recipientField: 'reporterPersonId',
          module: 'maintenance',
        },
      },
    ]);
  }
}
