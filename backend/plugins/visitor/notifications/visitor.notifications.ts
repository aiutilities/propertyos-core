export const visitorNotifications = [
  {
    code: 'visitor.invited.host',
    event: 'visitor.invited',
    channel: 'WHATSAPP',
    subject: 'Visitor invited',
    template: 'Visitor {{visitorName}} has been invited to {{propertyName}}.',
  },
  {
    code: 'visitor.approved.visitor',
    event: 'visitor.approved',
    channel: 'WHATSAPP',
    subject: 'Visit approved',
    template: 'Your visit to {{propertyName}} has been approved.',
  },
  {
    code: 'visitor.checked_in.host',
    event: 'visitor.checked_in',
    channel: 'WHATSAPP',
    subject: 'Visitor checked in',
    template: '{{visitorName}} has checked in at {{checkedInAt}}.',
  },
  {
    code: 'visitor.checked_out.host',
    event: 'visitor.checked_out',
    channel: 'WHATSAPP',
    subject: 'Visitor checked out',
    template: '{{visitorName}} has checked out at {{checkedOutAt}}.',
  },
];
