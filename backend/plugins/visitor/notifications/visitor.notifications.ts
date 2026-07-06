import { defineNotifications } from '../../src/core/plugin/sdk';

export const visitorNotifications = defineNotifications([
  {
    code: 'visitor.invited.host',
    event: 'visitor.invited',
    channel: 'WHATSAPP',
    subject: 'Visitor invited',
    template: 'Visitor {{visitorId}} has been invited to property {{propertyId}}.',
    metadata: {
      recipientField: 'hostPersonId',
    },
  },
  {
    code: 'visitor.approved.visitor',
    event: 'visitor.approved',
    channel: 'WHATSAPP',
    subject: 'Visit approved',
    template: 'Your visit {{visitId}} has been approved.',
    metadata: {
      recipientField: 'visitorId',
    },
  },
  {
    code: 'visitor.checked_in.host',
    event: 'visitor.checked_in',
    channel: 'WHATSAPP',
    subject: 'Visitor checked in',
    template: 'Visit {{visitId}} has checked in at {{checkedInAt}}.',
    metadata: {
      recipientField: 'hostPersonId',
    },
  },
  {
    code: 'visitor.checked_out.host',
    event: 'visitor.checked_out',
    channel: 'WHATSAPP',
    subject: 'Visitor checked out',
    template: 'Visit {{visitId}} has checked out at {{checkedOutAt}}.',
    metadata: {
      recipientField: 'hostPersonId',
    },
  },
]);
