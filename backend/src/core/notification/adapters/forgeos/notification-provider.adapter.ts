import {
  CommunicationProvider,
  ProviderDeliveryRequest,
  ProviderDeliveryResult,
} from '@forgeos/communication';

import {
  NotificationProvider,
} from '../../contracts/notification-provider.contract';

import {
  NotificationMessage,
} from '../../types/notification.types';

export class PropertyOSNotificationProviderAdapter
  implements CommunicationProvider
{
  readonly name: string;
  readonly channel;

  constructor(
    private readonly provider:
      NotificationProvider,
  ) {
    this.name = provider.name;
    this.channel = provider.channel;
  }

  validateConfiguration(): void {
    return;
  }

  async send(
    request: ProviderDeliveryRequest,
  ): Promise<ProviderDeliveryResult> {
    const notification:
      NotificationMessage = {
        id: request.communicationId,
        channel: request.channel,
        recipient:
          request.request.recipient.phone ??
          request.request.recipient.email ??
          request.request.recipient.id ??
          '',
        subject:
          request.renderedTemplate.subject,
        message:
          request.renderedTemplate.body,
        status: 'PENDING',
        metadata:
          request.request.metadata ?? {},
        createdAt: new Date(),
      };

    const result =
      await this.provider.send(notification);

    return {
      success: result.success,
      providerName: result.providerName,
      providerMessageId:
        result.providerMessageId,
      errorMessage: result.error,
      retryable: false,
      metadata: result.metadata,
    };
  }
}
