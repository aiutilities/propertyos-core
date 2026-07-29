import {
  CommunicationRequest,
  ProviderDeliveryRequest,
} from '../contracts';

import {
  DispatchCommunicationInput,
} from './communication-dispatcher.types';

export function createProviderDeliveryRequest(
  input: DispatchCommunicationInput,
  attemptId: string,
): ProviderDeliveryRequest {
  const request: CommunicationRequest = {
    id: input.communicationId,
    correlationId: input.correlationId,
    templateKey:
      'forgeos.communication.direct-message',
    recipient: {
      phone:
        input.channel === 'WHATSAPP' ||
        input.channel === 'SMS'
          ? input.recipient
          : undefined,
      email:
        input.channel === 'EMAIL'
          ? input.recipient
          : undefined,
      id:
        input.channel === 'IN_APP' ||
        input.channel === 'PUSH'
          ? input.recipient
          : undefined,
    },
    channels: [
      input.channel,
    ],
    variables: {},
    source: 'forgeos.communication.dispatcher',
    metadata: input.metadata,
  };

  return {
    communicationId: input.communicationId,
    attemptId,
    channel: input.channel,
    request,
    renderedTemplate: {
      key:
        'forgeos.communication.direct-message',
      version: '1.0.0',
      channel: input.channel,
      subject: input.subject,
      body: input.message,
      metadata: input.metadata,
    },
  };
}
