import {
  Injectable,
} from '@nestjs/common';

import {
  PluginPermissionRegistry,
} from '../../plugin/registries/plugin-permission.registry';
import {
  PluginNotificationRegistry,
} from '../../plugin/registries/plugin-notification.registry';

import {
  COMMUNICATIONS_EVENTS,
  COMMUNICATIONS_PERMISSIONS,
  COMMUNICATIONS_REGISTRY_ID,
} from '../communications.constants';

@Injectable()
export class CommunicationsBootstrapService {
  constructor(
    permissionRegistry:
      PluginPermissionRegistry,
    notificationRegistry:
      PluginNotificationRegistry,
  ) {
    permissionRegistry.register(
      COMMUNICATIONS_REGISTRY_ID,
      [
        {
          key:
            COMMUNICATIONS_PERMISSIONS.READ,
          description:
            'View communications, notices, categories and metrics',
        },
        {
          key:
            COMMUNICATIONS_PERMISSIONS.CREATE,
          description:
            'Create communications and audience targets',
        },
        {
          key:
            COMMUNICATIONS_PERMISSIONS.MANAGE,
          description:
            'Edit draft communications',
        },
        {
          key:
            COMMUNICATIONS_PERMISSIONS.PUBLISH,
          description:
            'Schedule and publish communications',
        },
        {
          key:
            COMMUNICATIONS_PERMISSIONS.ARCHIVE,
          description:
            'Archive and cancel communications',
        },
        {
          key:
            COMMUNICATIONS_PERMISSIONS.READ_RECEIPTS,
          description:
            'View communication read receipts and acknowledgement data',
        },
        {
          key:
            COMMUNICATIONS_PERMISSIONS.CONFIGURE,
          description:
            'Configure communication categories and delivery settings',
        },
      ],
    );

    notificationRegistry.register(
      COMMUNICATIONS_REGISTRY_ID,
      [
        {
          code:
            'communications.inapp.scheduled',
          event:
            COMMUNICATIONS_EVENTS.SCHEDULED,
          channel:
            'IN_APP',
          subject:
            'Communication scheduled: {{communicationNumber}}',
          template:
            '{{title}} is scheduled for publication at {{publishAt}}.',
          metadata: {
            recipientField:
              'createdByPersonId',
            module:
              'communications',
            audience:
              'author',
          },
        },
        {
          code:
            'communications.inapp.published',
          event:
            COMMUNICATIONS_EVENTS.PUBLISHED,
          channel:
            'IN_APP',
          subject:
            '{{title}}',
          template:
            '{{summary}}',
          metadata: {
            recipientField:
              'createdByPersonId',
            module:
              'communications',
            audience:
              'publisher',
          },
        },
        {
          code:
            'communications.inapp.urgent',
          event:
            COMMUNICATIONS_EVENTS.PUBLISHED,
          channel:
            'IN_APP',
          subject:
            'Urgent community alert: {{title}}',
          template:
            '{{content}}',
          metadata: {
            recipientField:
              'createdByPersonId',
            module:
              'communications',
            audience:
              'community',
            priority:
              'urgent',
          },
        },
        {
          code:
            'communications.email.published',
          event:
            COMMUNICATIONS_EVENTS.PUBLISHED,
          channel:
            'EMAIL',
          subject:
            '{{title}}',
          template:
            '{{content}}',
          metadata: {
            recipientField:
              'createdByPersonId',
            module:
              'communications',
            audience:
              'community',
          },
        },
        {
          code:
            'communications.whatsapp.published',
          event:
            COMMUNICATIONS_EVENTS.PUBLISHED,
          channel:
            'WHATSAPP',
          subject:
            '{{title}}',
          template:
            '*{{title}}*\n\n{{content}}',
          metadata: {
            recipientField:
              'createdByPersonId',
            module:
              'communications',
            audience:
              'community',
          },
        },
        {
          code:
            'communications.inapp.acknowledgement_required',
          event:
            COMMUNICATIONS_EVENTS.PUBLISHED,
          channel:
            'IN_APP',
          subject:
            'Acknowledgement required: {{title}}',
          template:
            'Please read and acknowledge communication {{communicationNumber}}.',
          metadata: {
            recipientField:
              'createdByPersonId',
            module:
              'communications',
            audience:
              'community',
            acknowledgementRequired:
              true,
          },
        },
        {
          code:
            'communications.inapp.expired',
          event:
            COMMUNICATIONS_EVENTS.EXPIRED,
          channel:
            'IN_APP',
          subject:
            'Communication expired: {{communicationNumber}}',
          template:
            '{{title}} has expired.',
          metadata: {
            recipientField:
              'createdByPersonId',
            module:
              'communications',
            audience:
              'author',
          },
        },
        {
          code:
            'communications.inapp.archived',
          event:
            COMMUNICATIONS_EVENTS.ARCHIVED,
          channel:
            'IN_APP',
          subject:
            'Communication archived: {{communicationNumber}}',
          template:
            '{{title}} has been archived.',
          metadata: {
            recipientField:
              'createdByPersonId',
            module:
              'communications',
            audience:
              'author',
          },
        },
        {
          code:
            'communications.inapp.cancelled',
          event:
            COMMUNICATIONS_EVENTS.CANCELLED,
          channel:
            'IN_APP',
          subject:
            'Communication cancelled: {{communicationNumber}}',
          template:
            '{{title}} has been cancelled.',
          metadata: {
            recipientField:
              'createdByPersonId',
            module:
              'communications',
            audience:
              'author',
          },
        },
      ],
    );
  }
}
