import { Injectable } from '@nestjs/common';

import {
  PluginNotificationRegistry,
} from '../../plugin/registries/plugin-notification.registry';
import {
  PluginPermissionRegistry,
} from '../../plugin/registries/plugin-permission.registry';
import {
  PluginWorkflowRegistry,
} from '../../plugin/registries/plugin-workflow.registry';
import {
  RESERVATION_EVENTS,
  RESERVATION_PERMISSIONS,
  RESERVATION_REGISTRY_ID,
} from '../reservation.constants';
import {
  RESERVATION_WORKFLOW_DEFINITION,
} from '../reservation-workflow.definition';

@Injectable()
export class ReservationBootstrapService {
  constructor(
    permissionRegistry:
      PluginPermissionRegistry,
    workflowRegistry:
      PluginWorkflowRegistry,
    notificationRegistry:
      PluginNotificationRegistry,
  ) {
    permissionRegistry.register(
      RESERVATION_REGISTRY_ID,
      [
        {
          key: RESERVATION_PERMISSIONS.READ,
          description:
            'View reservation resources, bookings, availability, history, and metrics',
        },
        {
          key: RESERVATION_PERMISSIONS.CREATE,
          description:
            'Create reservation resources, bookings, and resource blocks',
        },
        {
          key: RESERVATION_PERMISSIONS.UPDATE,
          description:
            'Update reservation resources and editable bookings',
        },
        {
          key: RESERVATION_PERMISSIONS.CANCEL,
          description:
            'Cancel pending or approved reservations',
        },
        {
          key:
            RESERVATION_PERMISSIONS.APPROVE,
          description:
            'Approve or reject reservation requests',
        },
        {
          key: RESERVATION_PERMISSIONS.MANAGE,
          description:
            'Manage reservation lifecycle, check-in, completion, and no-show actions',
        },
      ],
    );

    workflowRegistry.register(
      RESERVATION_REGISTRY_ID,
      [RESERVATION_WORKFLOW_DEFINITION],
    );

    notificationRegistry.register(
      RESERVATION_REGISTRY_ID,
      [
        {
          code:
            'reservation.inapp.created.requester',
          event: RESERVATION_EVENTS.CREATED,
          channel: 'IN_APP',
          subject:
            'Reservation created: {{reservationNumber}}',
          template:
            'Your reservation {{reservationNumber}} for {{title}} has been created for {{startAt}}.',
          metadata: {
            recipientField:
              'requesterPersonId',
            module: 'reservation',
          },
        },

        {
          code:
            'reservation.inapp.reminder.requester',
          event:
            RESERVATION_EVENTS.REMINDER,
          channel: 'IN_APP',
          subject:
            'Upcoming reservation: {{reservationNumber}}',
          template:
            'Reminder: reservation {{reservationNumber}} for {{title}} begins at {{startAt}}.',
          metadata: {
            recipientField:
              'requesterPersonId',
            module: 'reservation',
            automation: 'reminder',
          },
        },
        {
          code:
            'reservation.inapp.submitted.requester',
          event:
            RESERVATION_EVENTS.SUBMITTED,
          channel: 'IN_APP',
          subject:
            'Reservation awaiting approval: {{reservationNumber}}',
          template:
            'Reservation {{reservationNumber}} has been submitted and is awaiting approval.',
          metadata: {
            recipientField:
              'requesterPersonId',
            module: 'reservation',
          },
        },
        {
          code:
            'reservation.inapp.approved.requester',
          event:
            RESERVATION_EVENTS.APPROVED,
          channel: 'IN_APP',
          subject:
            'Reservation approved: {{reservationNumber}}',
          template:
            'Reservation {{reservationNumber}} has been approved for {{startAt}}.',
          metadata: {
            recipientField:
              'requesterPersonId',
            module: 'reservation',
          },
        },
        {
          code:
            'reservation.inapp.approved.beneficiary',
          event:
            RESERVATION_EVENTS.APPROVED,
          channel: 'IN_APP',
          subject:
            'Reservation approved: {{reservationNumber}}',
          template:
            'Reservation {{reservationNumber}} has been approved for you for {{startAt}}.',
          metadata: {
            recipientField:
              'beneficiaryPersonId',
            module: 'reservation',
          },
        },
        {
          code:
            'reservation.inapp.rejected.requester',
          event:
            RESERVATION_EVENTS.REJECTED,
          channel: 'IN_APP',
          subject:
            'Reservation rejected: {{reservationNumber}}',
          template:
            'Reservation {{reservationNumber}} was rejected. Reason: {{rejectionReason}}.',
          metadata: {
            recipientField:
              'requesterPersonId',
            module: 'reservation',
          },
        },
        {
          code:
            'reservation.inapp.cancelled.requester',
          event:
            RESERVATION_EVENTS.CANCELLED,
          channel: 'IN_APP',
          subject:
            'Reservation cancelled: {{reservationNumber}}',
          template:
            'Reservation {{reservationNumber}} has been cancelled.',
          metadata: {
            recipientField:
              'requesterPersonId',
            module: 'reservation',
          },
        },
        {
          code:
            'reservation.inapp.checked-in.requester',
          event:
            RESERVATION_EVENTS.CHECKED_IN,
          channel: 'IN_APP',
          subject:
            'Reservation checked in: {{reservationNumber}}',
          template:
            'Reservation {{reservationNumber}} has been checked in.',
          metadata: {
            recipientField:
              'requesterPersonId',
            module: 'reservation',
          },
        },
        {
          code:
            'reservation.inapp.completed.requester',
          event:
            RESERVATION_EVENTS.COMPLETED,
          channel: 'IN_APP',
          subject:
            'Reservation completed: {{reservationNumber}}',
          template:
            'Reservation {{reservationNumber}} has been completed.',
          metadata: {
            recipientField:
              'requesterPersonId',
            module: 'reservation',
          },
        },
        {
          code:
            'reservation.inapp.no-show.requester',
          event:
            RESERVATION_EVENTS.NO_SHOW,
          channel: 'IN_APP',
          subject:
            'Reservation marked no-show: {{reservationNumber}}',
          template:
            'Reservation {{reservationNumber}} has been marked as a no-show.',
          metadata: {
            recipientField:
              'requesterPersonId',
            module: 'reservation',
          },
        },
      ],
    );
  }
}
