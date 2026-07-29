import { CommunicationChannel } from './channel';
import { CommunicationRequest } from './request';
import { RenderedCommunicationTemplate } from './template';

export interface ProviderDeliveryRequest {
  communicationId: string;
  attemptId: string;
  channel: CommunicationChannel;
  request: CommunicationRequest;
  renderedTemplate: RenderedCommunicationTemplate;
}

export interface ProviderDeliveryResult {
  success: boolean;
  providerName: string;
  providerMessageId?: string;
  acceptedAt?: string;
  errorCode?: string;
  errorMessage?: string;
  retryable?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CommunicationProvider {
  readonly name: string;
  readonly channel: CommunicationChannel;

  validateConfiguration():
    | unknown
    | Promise<unknown>;

  send(
    request: ProviderDeliveryRequest,
  ): Promise<ProviderDeliveryResult>;
}
