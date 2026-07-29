import {
  CommunicationProvider,
  ProviderDeliveryRequest,
  ProviderDeliveryResult,
} from '../../contracts';

import {
  resolveFast2SmsConfiguration,
} from './fast2sms.configuration';

import {
  classifyFast2SmsFailure,
} from './fast2sms.errors';

import {
  normalizeFast2SmsRecipient,
} from './fast2sms-recipient';

import {
  isFast2SmsSuccessResponse,
} from './fast2sms.response';

import {
  Fast2SmsConfiguration,
  Fast2SmsConfigurationResult,
  Fast2SmsFailureResponse,
} from './fast2sms.types';

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
      'fast2sms',
    errorCode,
    errorMessage,
    retryable,
    metadata,
  };
}

function resolveVariables(
  metadata:
    Record<string, unknown> | undefined,
): string[] | null {
  const value =
    metadata?.smsVariables;

  if (value === undefined) {
    return [];
  }

  if (
    !Array.isArray(value) ||
    !value.every(
      (item) =>
        typeof item === 'string' ||
        typeof item === 'number',
    )
  ) {
    return null;
  }

  return value.map(
    (item) =>
      String(item),
  );
}

export class Fast2SmsProvider
  implements CommunicationProvider
{
  readonly name =
    'fast2sms';

  readonly channel =
    'SMS' as const;

  constructor(
    private readonly configuration:
      Fast2SmsConfiguration,
  ) {}

  validateConfiguration():
    Fast2SmsConfigurationResult {
    return resolveFast2SmsConfiguration(
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
        `FAST2SMS_CONFIGURATION_BLOCKED: ${configuration.errors.join('; ')}`,
        false,
      );
    }

    const recipient =
      normalizeFast2SmsRecipient(
        request.request.recipient.phone ??
        request.request.recipient.id ??
        '',
      );

    if (
      recipient.status ===
        'BLOCKED' ||
      !recipient.recipient
    ) {
      return failedResult(
        'INVALID_RECIPIENT',
        recipient.error ??
          'Fast2SMS recipient is invalid',
        false,
      );
    }

    const messageId =
      request.renderedTemplate
        .providerTemplateId
        ?.trim();

    if (
      !messageId ||
      !/^\d{1,30}$/.test(
        messageId,
      )
    ) {
      return failedResult(
        'DLT_MESSAGE_ID_REQUIRED',
        'Fast2SMS DLT message ID is required',
        false,
      );
    }

    const variables =
      resolveVariables(
        request.request.metadata,
      );

    if (!variables) {
      return failedResult(
        'INVALID_TEMPLATE_VARIABLES',
        'Fast2SMS smsVariables must be an array of strings or numbers',
        false,
      );
    }

    const payload:
      Record<string, unknown> = {
        sender_id:
          configuration.senderId,
        message:
          messageId,
        variables_values:
          variables.join('|'),
        route:
          'dlt',
        numbers:
          recipient.recipient,
        sms_details:
          configuration
            .includeSmsDetails
            ? '1'
            : '0',
        udf1:
          request.communicationId,
      };

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
          configuration.endpoint,
          {
            method: 'POST',
            redirect: 'error',
            headers: {
              accept:
                'application/json',
              authorization:
                configuration.apiKey!,
              'content-type':
                'application/json',
            },
            body:
              JSON.stringify(
                payload,
              ),
            signal:
              controller.signal,
          },
        );

      const safeMetadata:
        Record<string, unknown> = {
          httpStatus:
            response.status,
          endpointHost:
            new URL(
              configuration.endpoint,
            ).host,
          senderId:
            configuration.senderId,
          messageId,
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
            'Fast2SMS returned invalid JSON',
            false,
            safeMetadata,
          );
        }

        const classification =
          classifyFast2SmsFailure(
            response.status,
          );

        return failedResult(
          classification.errorCode,
          `Fast2SMS returned HTTP ${response.status}`,
          classification.retryable,
          safeMetadata,
        );
      }

      if (!response.ok) {
        const providerFailure =
          responseBody as
            Fast2SmsFailureResponse;

        const classification =
          classifyFast2SmsFailure(
            response.status,
            providerFailure
              .status_code,
          );

        return failedResult(
          classification.errorCode,
          `Fast2SMS returned HTTP ${response.status}`,
          classification.retryable,
          {
            ...safeMetadata,
            providerStatusCode:
              providerFailure
                .status_code,
          },
        );
      }

      if (
        !isFast2SmsSuccessResponse(
          responseBody,
        )
      ) {
        const providerFailure =
          responseBody as
            Fast2SmsFailureResponse;

        const classification =
          classifyFast2SmsFailure(
            response.status,
            providerFailure
              .status_code,
          );

        return failedResult(
          classification.errorCode,
          'Fast2SMS rejected the SMS request',
          classification.retryable,
          {
            ...safeMetadata,
            providerStatusCode:
              providerFailure
                .status_code,
          },
        );
      }

      return {
        success: true,
        providerName:
          this.name,
        providerMessageId:
          responseBody
            .request_id
            ?.trim() ??
          request.attemptId,
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
          'Fast2SMS request timed out',
          true,
        );
      }

      return failedResult(
        'PROVIDER_UNAVAILABLE',
        'Fast2SMS request failed',
        true,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
