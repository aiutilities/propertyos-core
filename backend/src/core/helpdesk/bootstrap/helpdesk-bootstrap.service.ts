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
            'Helpdesk ticket {{ticketNumber}} was created: {{title}}.',
          metadata: {
            recipientField: 'requesterPersonId',
            module: 'helpdesk',
          },
        },
        {
          code: 'helpdesk.inapp.assigned',
          event: HELPDESK_EVENTS.ASSIGNED,
          channel: 'IN_APP',
          subject:
            'Helpdesk ticket assigned: {{ticketNumber}}',
          template:
            'Helpdesk ticket {{ticketNumber}} was assigned to you.',
          metadata: {
            recipientField: 'assigneePersonId',
            module: 'helpdesk',
          },
        },
        {
          code: 'helpdesk.inapp.updated',
          event: HELPDESK_EVENTS.UPDATED,
          channel: 'IN_APP',
          subject:
            'Helpdesk ticket updated: {{ticketNumber}}',
          template:
            'Helpdesk ticket {{ticketNumber}} was updated.',
          metadata: {
            recipientField: 'requesterPersonId',
            module: 'helpdesk',
          },
        },
      ],
    );
  }
}
