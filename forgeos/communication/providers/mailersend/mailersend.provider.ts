import {
  CommunicationProvider,
  ProviderDeliveryRequest,
  ProviderDeliveryResult,
} from '../../contracts';

import {
  resolveMailerSendConfiguration,
} from './mailersend.configuration';

import {
  validateMailerSendEmail,
} from './mailersend-email';

import {
  classifyMailerSendFailure,
} from './mailersend.errors';

import {
  MailerSendConfiguration,
  MailerSendConfigurationResult,
  MailerSendWarningResponse,
} from './mailersend.types';

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
      'mailersend',
    errorCode,
    errorMessage,
    retryable,
    metadata,
  };
}

function readHeader(
  headers: Headers,
  name: string,
): string | undefined {
  const value =
    headers.get(name)?.trim();

  return value
    ? value
    : undefined;
}

export class MailerSendProvider
  implements CommunicationProvider
{
  readonly name =
    'mailersend';

  readonly channel =
    'EMAIL' as const;

  constructor(
    private readonly configuration:
      MailerSendConfiguration,
  ) {}

  validateConfiguration():
    MailerSendConfigurationResult {
    return resolveMailerSendConfiguration(
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
        `MAILERSEND_CONFIGURATION_BLOCKED: ${configuration.errors.join('; ')}`,
        false,
      );
    }

    const recipientResult =
      validateMailerSendEmail(
        request.request.recipient.email ??
          '',
      );

    if (
      recipientResult.status ===
        'BLOCKED' ||
      !recipientResult.email
    ) {
      return failedResult(
        'INVALID_RECIPIENT',
        recipientResult.error ??
          'MailerSend recipient is invalid',
        false,
      );
    }

    const subject =
      request.renderedTemplate
        .subject
        ?.trim();

    if (!subject) {
      return failedResult(
        'SUBJECT_REQUIRED',
        'MailerSend email subject is required',
        false,
      );
    }

    const metadata =
      request.request.metadata ??
      {};

    const html =
      typeof metadata.html ===
        'string' &&
      metadata.html.trim()
        .length > 0
        ? metadata.html
        : undefined;

    const payload:
      Record<string, unknown> = {
        from: {
          email:
            configuration.fromEmail!,
          ...(configuration.fromName
            ? {
                name:
                  configuration.fromName,
              }
            : {}),
        },

        to: [
          {
            email:
              recipientResult.email,
            ...(request.request
              .recipient.name
              ? {
                  name:
                    request.request
                      .recipient.name,
                }
              : {}),
          },
        ],

        subject,

        text:
          request.renderedTemplate
            .body,

        ...(html
          ? {
              html,
            }
          : {}),
    };

    if (
      configuration.replyToEmail
    ) {
      payload.reply_to = {
        email:
          configuration.replyToEmail,
        ...(configuration.replyToName
          ? {
              name:
                configuration.replyToName,
            }
          : {}),
      };
    }

    const settings =
      Object.fromEntries(
        Object.entries({
          track_clicks:
            configuration.trackClicks,
          track_opens:
            configuration.trackOpens,
          track_content:
            configuration.trackContent,
        }).filter(
          (
            entry,
          ): entry is [
            string,
            boolean,
          ] =>
            typeof entry[1] ===
            'boolean',
        ),
      );

    if (
      Object.keys(settings)
        .length > 0
    ) {
      payload.settings =
        settings;
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
          configuration.endpoint,
          {
            method: 'POST',
            redirect: 'error',
            headers: {
              accept:
                'application/json',
              authorization:
                `Bearer ${configuration.apiToken!}`,
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

      const messageId =
        readHeader(
          response.headers,
          'x-message-id',
        );

      const safeMetadata:
        Record<string, unknown> = {
          httpStatus:
            response.status,
          endpointHost:
            new URL(
              configuration.endpoint,
            ).host,
        };

      if (!response.ok) {
        const classification =
          classifyMailerSendFailure(
            response.status,
          );

        return failedResult(
          classification.errorCode,
          `MailerSend returned HTTP ${response.status}`,
          classification.retryable,
          safeMetadata,
        );
      }

      if (
        response.status !== 202
      ) {
        return failedResult(
          'INVALID_ACKNOWLEDGEMENT',
          `MailerSend returned unexpected HTTP ${response.status}`,
          false,
          safeMetadata,
        );
      }

      if (!messageId) {
        let warning:
          MailerSendWarningResponse | undefined;

        try {
          warning =
            await response.json() as
              MailerSendWarningResponse;
        } catch {
          warning = undefined;
        }

        const allSuppressed =
          warning?.warnings?.some(
            (item) =>
              item.type ===
              'ALL_SUPPRESSED',
          ) ?? false;

        return failedResult(
          allSuppressed
            ? 'ALL_RECIPIENTS_SUPPRESSED'
            : 'INVALID_ACKNOWLEDGEMENT',
          allSuppressed
            ? 'MailerSend suppressed all recipients'
            : 'MailerSend response did not contain x-message-id',
          false,
          safeMetadata,
        );
      }

      return {
        success: true,
        providerName:
          this.name,
        providerMessageId:
          messageId,
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
          'MailerSend request timed out',
          true,
        );
      }

      return failedResult(
        'PROVIDER_UNAVAILABLE',
        'MailerSend request failed',
        true,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
