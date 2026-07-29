import {
  CommunicationProvider,
  ProviderDeliveryRequest,
  ProviderDeliveryResult,
} from '../../contracts';

import {
  resolveMetaWhatsAppCloudConfiguration,
} from './meta-whatsapp-cloud.configuration';

import {
  classifyMetaWhatsAppFailure,
} from './meta-whatsapp-cloud.errors';

import {
  isMetaWhatsAppCloudSuccessResponse,
} from './meta-whatsapp-cloud.response';

import {
  normalizeMetaWhatsAppRecipient,
} from './meta-whatsapp-recipient';

import {
  MetaWhatsAppCloudConfiguration,
  MetaWhatsAppCloudConfigurationResult,
  MetaWhatsAppCloudErrorResponse,
} from './meta-whatsapp-cloud.types';

function failedResult(
  errorCode: string,
  errorMessage: string,
  retryable: boolean,
  metadata:
    Record<string, unknown> = {},
): ProviderDeliveryResult {
  return {
    success: false,
    providerName:
      'meta-whatsapp-cloud',
    errorCode,
    errorMessage,
    retryable,
    metadata,
  };
}

export class MetaWhatsAppCloudProvider
  implements CommunicationProvider
{
  readonly name =
    'meta-whatsapp-cloud';

  readonly channel =
    'WHATSAPP' as const;

  constructor(
    private readonly configuration:
      MetaWhatsAppCloudConfiguration,
  ) {}

  validateConfiguration():
    MetaWhatsAppCloudConfigurationResult {
    return resolveMetaWhatsAppCloudConfiguration(
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
        'CONFIGURATION_BLOCKED',
        `META_WHATSAPP_CONFIGURATION_BLOCKED: ${configuration.errors.join('; ')}`,
        false,
      );
    }

    const rawRecipient =
      request.request.recipient.phone ??
      request.request.recipient.id ??
      '';

    const recipient =
      normalizeMetaWhatsAppRecipient(
        rawRecipient,
      );

    if (
      recipient.status ===
        'BLOCKED' ||
      !recipient.recipient
    ) {
      return failedResult(
        'INVALID_RECIPIENT',
        recipient.error ??
          'Meta WhatsApp recipient is invalid',
        false,
      );
    }

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
      const response =
        await fetch(
          configuration.endpoint!,
          {
            method: 'POST',
            redirect: 'error',
            headers: {
              accept:
                'application/json',
              authorization:
                `Bearer ${configuration.accessToken!}`,
              'content-type':
                'application/json',
            },
            body:
              JSON.stringify({
                messaging_product:
                  'whatsapp',
                recipient_type:
                  'individual',
                to:
                  recipient.recipient,
                type:
                  'text',
                text: {
                  preview_url:
                    configuration.previewUrl,
                  body:
                    request
                      .renderedTemplate
                      .body,
                },
              }),
            signal:
              controller.signal,
          },
        );

      const safeMetadata:
        Record<string, unknown> = {
          httpStatus:
            response.status,
          graphApiVersion:
            configuration
              .graphApiVersion,
          phoneNumberId:
            configuration
              .phoneNumberId,
        };

      let responseBody:
        unknown;

      try {
        responseBody =
          await response.json();
      } catch {
        if (response.ok) {
          return failedResult(
            'INVALID_ACKNOWLEDGEMENT',
            'Meta WhatsApp returned invalid JSON',
            false,
            safeMetadata,
          );
        }

        const classification =
          classifyMetaWhatsAppFailure(
            response.status,
          );

        return failedResult(
          classification.errorCode,
          `Meta WhatsApp returned HTTP ${response.status}`,
          classification.retryable,
          safeMetadata,
        );
      }

      if (!response.ok) {
        const providerError =
          (
            responseBody as
              MetaWhatsAppCloudErrorResponse
          ).error;

        const classification =
          classifyMetaWhatsAppFailure(
            response.status,
            providerError?.code,
          );

        return failedResult(
          classification.errorCode,
          `Meta WhatsApp returned HTTP ${response.status}`,
          classification.retryable,
          {
            ...safeMetadata,
            providerErrorCode:
              providerError?.code,
            providerErrorSubcode:
              providerError
                ?.error_subcode,
          },
        );
      }

      if (
        !isMetaWhatsAppCloudSuccessResponse(
          responseBody,
        )
      ) {
        return failedResult(
          'INVALID_ACKNOWLEDGEMENT',
          'Meta WhatsApp returned an invalid delivery acknowledgement',
          false,
          safeMetadata,
        );
      }

      return {
        success: true,
        providerName:
          this.name,
        providerMessageId:
          responseBody
            .messages[0]
            .id
            .trim(),
        acceptedAt:
          new Date()
            .toISOString(),
        metadata:
          safeMetadata,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.name ===
          'AbortError'
      ) {
        return failedResult(
          'PROVIDER_TIMEOUT',
          'Meta WhatsApp request timed out',
          true,
        );
      }

      return failedResult(
        'PROVIDER_UNAVAILABLE',
        'Meta WhatsApp request failed',
        true,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
