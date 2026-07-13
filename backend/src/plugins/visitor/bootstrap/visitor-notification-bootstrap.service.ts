import {
  Injectable,
  OnModuleInit,
} from '@nestjs/common';

import { NotificationService } from '../../../core/notification/services/notification.service';
import { VISITOR_EVENTS } from '../visitor.constants';

@Injectable()
export class VisitorNotificationBootstrapService
  implements OnModuleInit
{
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  onModuleInit(): void {
    this.notificationService.registerTemplates([
      {
        code: 'visitor.whatsapp.invited',
        event: VISITOR_EVENTS.INVITED,
        channel: 'WHATSAPP',
        template:
          'Hello {{visitorName}}, your visit is scheduled for {{visitDate}}. Visit reference: {{visitId}}.',
        metadata: {
          recipientField: 'visitorMobile',
          module: 'visitor',
        },
      },
      {
        code: 'visitor.whatsapp.approved',
        event: VISITOR_EVENTS.APPROVED,
        channel: 'WHATSAPP',
        template:
          'Hello {{visitorName}}, your visit {{visitId}} has been approved.',
        metadata: {
          recipientField: 'visitorMobile',
          module: 'visitor',
        },
      },
      {
        code: 'visitor.whatsapp.rejected',
        event: VISITOR_EVENTS.REJECTED,
        channel: 'WHATSAPP',
        template:
          'Hello {{visitorName}}, your visit {{visitId}} was not approved. Reason: {{reason}}.',
        metadata: {
          recipientField: 'visitorMobile',
          module: 'visitor',
        },
      },
      {
        code: 'visitor.whatsapp.qr-generated',
        event: VISITOR_EVENTS.QR_GENERATED,
        channel: 'WHATSAPP',
        template:
          'Your PropertyOS visitor QR credential is ready. Token: {{qrToken}}. It expires at {{expiresAt}}.',
        metadata: {
          recipientField: 'visitorMobile',
          module: 'visitor',
          containsCredential: true,
        },
      },
      {
        code: 'visitor.whatsapp.arrived',
        event: VISITOR_EVENTS.ARRIVED,
        channel: 'WHATSAPP',
        template:
          'Visitor {{visitorName}} has arrived for visit {{visitId}}.',
        metadata: {
          recipientField: 'hostMobile',
          module: 'visitor',
        },
      },
      {
        code: 'visitor.whatsapp.checked-in',
        event: VISITOR_EVENTS.CHECKED_IN,
        channel: 'WHATSAPP',
        template:
          'Visitor {{visitorName}} checked in at {{checkedInAt}} through {{gate}}.',
        metadata: {
          recipientField: 'hostMobile',
          module: 'visitor',
        },
      },
      {
        code: 'visitor.whatsapp.checked-out',
        event: VISITOR_EVENTS.CHECKED_OUT,
        channel: 'WHATSAPP',
        template:
          'Visitor {{visitorName}} checked out at {{checkedOutAt}} through {{gate}}.',
        metadata: {
          recipientField: 'hostMobile',
          module: 'visitor',
        },
      },
    ]);
  }
}
