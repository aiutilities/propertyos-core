import { Injectable } from '@nestjs/common';

import { PluginNotificationRegistry } from '../../plugin/registries/plugin-notification.registry';
import { PluginPermissionRegistry } from '../../plugin/registries/plugin-permission.registry';
import {
  HELPDESK_EVENTS,
  HELPDESK_PERMISSIONS,
  HELPDESK_REGISTRY_ID,
} from '../helpdesk.constants';

@Injectable()
export class HelpdeskBootstrapService {
  constructor(
    permissionRegistry: PluginPermissionRegistry,
    notificationRegistry: PluginNotificationRegistry,
  ) {
    permissionRegistry.register(
      HELPDESK_REGISTRY_ID,
      [
        {
          key: HELPDESK_PERMISSIONS.READ,
          description:
            'View helpdesk tickets, history, metrics, and categories',
        },
        {
          key: HELPDESK_PERMISSIONS.CREATE,
          description:
            'Create helpdesk tickets',
        },
        {
          key: HELPDESK_PERMISSIONS.MANAGE,
          description:
            'Update and administer helpdesk tickets',
        },
        {
          key: HELPDESK_PERMISSIONS.COMMENT,
          description:
            'Add public and internal helpdesk comments',
        },
        {
          key: HELPDESK_PERMISSIONS.ASSIGN,
          description:
            'Assign helpdesk tickets',
        },
        {
          key: HELPDESK_PERMISSIONS.RESOLVE,
          description:
            'Resolve, close, reopen, and cancel helpdesk tickets',
        },
        {
          key: HELPDESK_PERMISSIONS.CONFIGURE,
          description:
            'Configure helpdesk categories and SLA policies',
        },
      ],
    );

    notificationRegistry.register(
      HELPDESK_REGISTRY_ID,
      [
        {
          code: 'helpdesk.inapp.created',
          event: HELPDESK_EVENTS.CREATED,
          channel: 'IN_APP',
          subject:
            'Helpdesk ticket created: {{ticketNumber}}',
          template:
            'Ticket {{ticketNumber}} was created: {{title}}.',
          metadata: {
            recipientField: 'requesterPersonId',
            module: 'helpdesk',
            audience: 'requester',
          },
        },
        {
          code: 'helpdesk.inapp.assigned.requester',
          event: HELPDESK_EVENTS.ASSIGNED,
          channel: 'IN_APP',
          subject:
            'Helpdesk ticket assigned: {{ticketNumber}}',
          template:
            'Ticket {{ticketNumber}} has been assigned for action.',
          metadata: {
            recipientField: 'requesterPersonId',
            module: 'helpdesk',
            audience: 'requester',
          },
        },
        {
          code: 'helpdesk.inapp.assigned.assignee',
          event: HELPDESK_EVENTS.ASSIGNED,
          channel: 'IN_APP',
          subject:
            'New helpdesk assignment: {{ticketNumber}}',
          template:
            'Ticket {{ticketNumber}} has been assigned to you: {{title}}.',
          metadata: {
            recipientField: 'assigneePersonId',
            module: 'helpdesk',
            audience: 'assignee',
          },
        },
        {
          code: 'helpdesk.inapp.updated',
          event: HELPDESK_EVENTS.UPDATED,
          channel: 'IN_APP',
          subject:
            'Helpdesk ticket updated: {{ticketNumber}}',
          template:
            'Ticket {{ticketNumber}} was updated.',
          metadata: {
            recipientField: 'requesterPersonId',
            module: 'helpdesk',
            audience: 'requester',
          },
        },
        {
          code: 'helpdesk.inapp.in_progress',
          event: HELPDESK_EVENTS.IN_PROGRESS,
          channel: 'IN_APP',
          subject:
            'Work started: {{ticketNumber}}',
          template:
            'Work has started on ticket {{ticketNumber}}.',
          metadata: {
            recipientField: 'requesterPersonId',
            module: 'helpdesk',
            audience: 'requester',
          },
        },
        {
          code: 'helpdesk.inapp.escalated.requester',
          event: HELPDESK_EVENTS.ESCALATED,
          channel: 'IN_APP',
          subject:
            'Helpdesk ticket escalated: {{ticketNumber}}',
          template:
            'Ticket {{ticketNumber}} has been escalated for priority attention.',
          metadata: {
            recipientField: 'requesterPersonId',
            module: 'helpdesk',
            audience: 'requester',
          },
        },
        {
          code: 'helpdesk.inapp.escalated.assignee',
          event: HELPDESK_EVENTS.ESCALATED,
          channel: 'IN_APP',
          subject:
            'Assigned ticket escalated: {{ticketNumber}}',
          template:
            'Ticket {{ticketNumber}} has been escalated.',
          metadata: {
            recipientField: 'assigneePersonId',
            module: 'helpdesk',
            audience: 'assignee',
          },
        },
        {
          code: 'helpdesk.inapp.resolved',
          event: HELPDESK_EVENTS.RESOLVED,
          channel: 'IN_APP',
          subject:
            'Helpdesk ticket resolved: {{ticketNumber}}',
          template:
            'Ticket {{ticketNumber}} has been resolved. Resolution: {{resolutionSummary}}',
          metadata: {
            recipientField: 'requesterPersonId',
            module: 'helpdesk',
            audience: 'requester',
          },
        },
        {
          code: 'helpdesk.inapp.reopened',
          event: HELPDESK_EVENTS.REOPENED,
          channel: 'IN_APP',
          subject:
            'Helpdesk ticket reopened: {{ticketNumber}}',
          template:
            'Ticket {{ticketNumber}} has been reopened.',
          metadata: {
            recipientField: 'assigneePersonId',
            module: 'helpdesk',
            audience: 'assignee',
          },
        },
        {
          code: 'helpdesk.inapp.closed',
          event: HELPDESK_EVENTS.CLOSED,
          channel: 'IN_APP',
          subject:
            'Helpdesk ticket closed: {{ticketNumber}}',
          template:
            'Ticket {{ticketNumber}} has been closed.',
          metadata: {
            recipientField: 'requesterPersonId',
            module: 'helpdesk',
            audience: 'requester',
          },
        },
        {
          code: 'helpdesk.inapp.cancelled',
          event: HELPDESK_EVENTS.CANCELLED,
          channel: 'IN_APP',
          subject:
            'Helpdesk ticket cancelled: {{ticketNumber}}',
          template:
            'Ticket {{ticketNumber}} has been cancelled.',
          metadata: {
            recipientField: 'requesterPersonId',
            module: 'helpdesk',
            audience: 'requester',
          },
        },
        {
          code: 'helpdesk.inapp.comment_added',
          event: HELPDESK_EVENTS.COMMENT_ADDED,
          channel: 'IN_APP',
          subject:
            'New update on ticket {{ticketNumber}}',
          template:
            'A new comment was added to ticket {{ticketNumber}}.',
          metadata: {
            recipientField: 'requesterPersonId',
            module: 'helpdesk',
            audience: 'requester',
          },
        },
        {
          code: 'helpdesk.inapp.sla_warning',
          event: HELPDESK_EVENTS.SLA_WARNING,
          channel: 'IN_APP',
          subject:
            'SLA warning: {{ticketNumber}}',
          template:
            'Ticket {{ticketNumber}} is approaching its resolution deadline.',
          metadata: {
            recipientField: 'assigneePersonId',
            module: 'helpdesk',
            audience: 'assignee',
            severity: 'warning',
          },
        },
        {
          code: 'helpdesk.inapp.sla_breached',
          event: HELPDESK_EVENTS.SLA_BREACHED,
          channel: 'IN_APP',
          subject:
            'SLA breached: {{ticketNumber}}',
          template:
            'Ticket {{ticketNumber}} has breached its resolution deadline and was escalated.',
          metadata: {
            recipientField: 'assigneePersonId',
            module: 'helpdesk',
            audience: 'assignee',
            severity: 'critical',
          },
        },
        {
          code: 'helpdesk.inapp.feedback_submitted',
          event: HELPDESK_EVENTS.FEEDBACK_SUBMITTED,
          channel: 'IN_APP',
          subject:
            'Feedback received: {{ticketNumber}}',
          template:
            'Customer feedback was submitted for ticket {{ticketNumber}}.',
          metadata: {
            recipientField: 'assigneePersonId',
            module: 'helpdesk',
            audience: 'assignee',
          },
        },
      ],
    );
  }
}
