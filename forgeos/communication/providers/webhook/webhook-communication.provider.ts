import {
  CommunicationProvider,
  ProviderDeliveryRequest,
  ProviderDeliveryResult,
} from '../../contracts';

import {
  isWebhookAcknowledgement,
} from './webhook-acknowledgement';

import {
  resolveWebhookProviderConfiguration,
} from './webhook-provider.configuration';

import {
  WebhookCommunicationProviderConfiguration,
  WebhookProviderConfigurationResult,
} from './webhook-provider.types';

function failedResult(
  providerName: string,
  errorMessage: string,
  metadata:
    Record<string, unknown> = {},
): ProviderDeliveryResult {
  return {
    success: false,
    providerName,
    errorMessage,
    retryable: false,
    metadata,
  };
}

export class WebhookCommunicationProvider
  implements CommunicationProvider
{
  readonly name: string;
  readonly channel;

  constructor(
    private readonly configuration:
      WebhookCommunicationProviderConfiguration,
    private readonly normalizeRecipient?:
      (
        recipient: string,
      ) => {
        status:
          | 'READY'
          | 'BLOCKED';
        recipient?: string;
        error?: string;
      },
  ) {
    this.name =
      configuration.providerName;

    this.channel =
      configuration.channel;
  }

  validateConfiguration():
    WebhookProviderConfigurationResult {
    return resolveWebhookProviderConfiguration(
      this.configuration,
    );
  }

  async send(
    request: ProviderDeliveryRequest,
  ): Promise<ProviderDeliveryResult> {
    const configuration =
      this.validateConfiguration();

    if (
      configuration.status ===
      'BLOCKED'
    ) {
      return failedResult(
        this.name,
        `WEBHOOK_CONFIGURATION_BLOCKED: ${configuration.errors.join('; ')}`,
      );
    }

    const rawRecipient =
      request.request.recipient.phone ??
      request.request.recipient.email ??
      request.request.recipient.id ??
      '';

    const normalized =
      this.normalizeRecipient
        ? this.normalizeRecipient(
            rawRecipient,
          )
        : {
            status:
              'READY' as const,
            recipient:
              rawRecipient,
          };

    if (
      normalized.status ===
        'BLOCKED' ||
      !normalized.recipient
    ) {
      return failedResult(
        this.name,
        normalized.error ??
          'Webhook recipient is invalid',
      );
    }

    const payload = {
      event:
        this.configuration.eventName,
      version:
        this.configuration
          .payloadVersion ??
        '1.0',
      communication: {
        id:
          request.communicationId,
        recipient:
          normalized.recipient,
        message:
          request.renderedTemplate
            .body,
        ...(request
          .renderedTemplate
          .subject
          ? {
              subject:
                request
                  .renderedTemplate
                  .subject,
            }
          : {}),
      },
    };

    const endpoint =
      new URL(
        configuration.endpoint!,
      );

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () =>
          controller.abort(),
        configuration
          .timeoutMilliseconds,
      );

    try {
      const headers:
        Record<string, string> = {
          accept:
            'application/json',
          'content-type':
            'application/json',
        };

      if (
        configuration
          .bearerToken
      ) {
        headers.authorization =
          `Bearer ${configuration.bearerToken}`;
      }

      const response =
        await fetch(
          configuration.endpoint!,
          {
            method: 'POST',
            redirect: 'error',
            headers,
            body:
              JSON.stringify(
                payload,
              ),
            signal:
              controller.signal,
          },
        );

      const safeMetadata = {
        httpStatus:
          response.status,
        endpointHost:
          endpoint.host,
      };

      if (!response.ok) {
        return failedResult(
          this.name,
          `Webhook returned HTTP ${response.status}`,
          safeMetadata,
        );
      }

      let responseBody:
        unknown;

      try {
        responseBody =
          await response.json();
      } catch {
        return failedResult(
          this.name,
          'Webhook returned invalid JSON',
          safeMetadata,
        );
      }

      if (
        !isWebhookAcknowledgement(
          responseBody,
        )
      ) {
        return failedResult(
          this.name,
          'Webhook returned an invalid delivery acknowledgement',
          safeMetadata,
        );
      }

      return {
        success: true,
        providerName:
          this.name,
        providerMessageId:
          responseBody
            .messageId
            .trim(),
        acceptedAt:
          new Date()
            .toISOString(),
        metadata:
          safeMetadata,
      };
    } catch (error) {
      if (
        error instanceof
          Error &&
        error.name ===
          'AbortError'
      ) {
        return failedResult(
          this.name,
          'Webhook request timed out',
          {
            endpointHost:
              endpoint.host,
          },
        );
      }

      return failedResult(
        this.name,
        'Webhook request failed',
        {
          endpointHost:
            endpoint.host,
        },
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
