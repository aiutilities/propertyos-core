import { Injectable } from '@nestjs/common';

import {
  NotificationDeliveryResult,
  NotificationProvider,
} from '../contracts/notification-provider.contract';
import { NotificationMessage } from '../types/notification.types';
import {
  resolveWhatsAppWebhookConfiguration,
  WhatsAppWebhookConfiguration,
} from './whatsapp-webhook-configuration';
import { currentWhatsAppEnvironmentClass } from './whatsapp-provider-selection';

interface WhatsAppWebhookSuccessResponse {
  success: true;
  messageId: string;
}

export interface WhatsAppWebhookPayload {
  event:
    'propertyos.notification.whatsapp';
  version: '1.0';
  notification: {
    id: string;
    recipient: string;
    message: string;
    subject?: string;
  };
}

export interface WhatsAppRecipientNormalization {
  status: 'READY' | 'BLOCKED';
  recipient?: string;
  error?: string;
}

export function normalizeWhatsAppRecipient(
  rawRecipient: string,
): WhatsAppRecipientNormalization {
  const compact = rawRecipient
    .trim()
    .replace(/[\s().-]/g, '');

  const international = compact.startsWith(
    '00',
  )
    ? `+${compact.slice(2)}`
    : compact;

  if (
    !/^\+[1-9]\d{7,14}$/.test(
      international,
    )
  ) {
    return {
      status: 'BLOCKED',
      error:
        'WhatsApp recipient must use international E.164 format',
    };
  }

  return {
    status: 'READY',
    recipient: international,
  };
}

function isSuccessResponse(
  value: unknown,
): value is WhatsAppWebhookSuccessResponse {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false;
  }

  const candidate = value as Record<
    string,
    unknown
  >;

  return (
    candidate.success === true &&
    typeof candidate.messageId ===
      'string' &&
    candidate.messageId.trim().length > 0 &&
    candidate.messageId.trim().length <= 200
  );
}

function blockedResult(
  providerName: string,
  error: string,
  metadata: Record<string, unknown> = {},
): NotificationDeliveryResult {
  return {
    success: false,
    providerName,
    error,
    metadata,
  };
}

@Injectable()
export class WhatsAppWebhookNotificationProvider
  implements NotificationProvider
{
  readonly name = 'whatsapp-webhook';
  readonly channel = 'WHATSAPP' as const;

  validateConfiguration():
    WhatsAppWebhookConfiguration {
    return resolveWhatsAppWebhookConfiguration({
      environmentClass:
        currentWhatsAppEnvironmentClass(
          process.env.NODE_ENV,
        ),
      webhookUrl:
        process.env.WHATSAPP_WEBHOOK_URL,
      webhookToken:
        process.env.WHATSAPP_WEBHOOK_TOKEN,
      timeoutMs:
        process.env
          .WHATSAPP_WEBHOOK_TIMEOUT_MS,
    });
  }

  async send(
    notification: NotificationMessage,
  ): Promise<NotificationDeliveryResult> {
    const configuration =
      this.validateConfiguration();

    if (
      configuration.status ===
      'BLOCKED'
    ) {
      return blockedResult(
        this.name,
        `WHATSAPP_WEBHOOK_CONFIGURATION_BLOCKED: ${configuration.errors.join('; ')}`,
      );
    }

    const normalizedRecipient =
      normalizeWhatsAppRecipient(
        notification.recipient,
      );

    if (
      normalizedRecipient.status ===
        'BLOCKED' ||
      !normalizedRecipient.recipient
    ) {
      return blockedResult(
        this.name,
        normalizedRecipient.error ??
          'WhatsApp recipient is invalid',
      );
    }

    const payload: WhatsAppWebhookPayload = {
      event:
        'propertyos.notification.whatsapp',
      version: '1.0',
      notification: {
        id: notification.id,
        recipient:
          normalizedRecipient.recipient,
        message: notification.message,
        ...(notification.subject
          ? {
              subject:
                notification.subject,
            }
          : {}),
      },
    };

    const controller =
      new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      configuration.timeoutMs,
    );

    const endpoint = new URL(
      configuration.webhookUrl!,
    );

    try {
      const response = await fetch(
        configuration.webhookUrl!,
        {
          method: 'POST',
          redirect: 'error',
          headers: {
            accept: 'application/json',
            authorization:
              `Bearer ${configuration.webhookToken!}`,
            'content-type':
              'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        },
      );

      const safeMetadata = {
        httpStatus: response.status,
        endpointHost: endpoint.host,
      };

      if (!response.ok) {
        return blockedResult(
          this.name,
          `WhatsApp webhook returned HTTP ${response.status}`,
          safeMetadata,
        );
      }

      let responseBody: unknown;

      try {
        responseBody =
          await response.json();
      } catch {
        return blockedResult(
          this.name,
          'WhatsApp webhook returned invalid JSON',
          safeMetadata,
        );
      }

      if (!isSuccessResponse(responseBody)) {
        return blockedResult(
          this.name,
          'WhatsApp webhook returned an invalid delivery acknowledgement',
          safeMetadata,
        );
      }

      return {
        success: true,
        providerName: this.name,
        providerMessageId:
          responseBody.messageId.trim(),
        metadata: safeMetadata,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'AbortError'
      ) {
        return blockedResult(
          this.name,
          'WhatsApp webhook request timed out',
          {
            endpointHost: endpoint.host,
          },
        );
      }

      return blockedResult(
        this.name,
        'WhatsApp webhook request failed',
        {
          endpointHost: endpoint.host,
        },
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
