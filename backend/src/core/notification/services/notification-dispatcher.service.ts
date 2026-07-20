import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';

import { EventBusService } from '../../eventbus/services/eventbus.service';
import { InAppNotificationProvider } from '../providers/in-app-notification.provider';
import { MockWhatsAppNotificationProvider } from '../providers/mock-whatsapp-notification.provider';
import { WhatsAppWebhookNotificationProvider } from '../providers/whatsapp-webhook-notification.provider';
import {
  currentWhatsAppEnvironmentClass,
  resolveWhatsAppProviderSelection,
} from '../providers/whatsapp-provider-selection';
import { NotificationProviderRegistry } from '../registries/notification-provider.registry';
import { NotificationMessage } from '../types/notification.types';
import { NotificationService } from './notification.service';

@Injectable()
export class NotificationDispatcherService
  implements OnModuleInit
{
  private readonly logger = new Logger(
    NotificationDispatcherService.name,
  );

  constructor(
    private readonly registry: NotificationProviderRegistry,
    private readonly notificationService: NotificationService,
    private readonly eventBus: EventBusService,
    private readonly mockWhatsAppProvider:
      MockWhatsAppNotificationProvider,
    private readonly webhookWhatsAppProvider:
      WhatsAppWebhookNotificationProvider,
    private readonly inAppProvider: InAppNotificationProvider,
  ) {}

  onModuleInit(): void {
    const whatsappSelection =
      resolveWhatsAppProviderSelection({
        environmentClass:
          currentWhatsAppEnvironmentClass(
            process.env.NODE_ENV,
          ),
        configuredProvider:
          process.env.WHATSAPP_PROVIDER,
      });

    if (
      whatsappSelection.status ===
      'BLOCKED'
    ) {
      throw new Error(
        `WHATSAPP_PROVIDER_SELECTION_BLOCKED: ` +
          whatsappSelection.errors.join(
            '; ',
          ),
      );
    }

    if (whatsappSelection.mockAllowed) {
      this.registry.register(
        this.mockWhatsAppProvider,
      );
    }

    if (
      whatsappSelection.mode ===
      'WEBHOOK'
    ) {
      const webhookConfiguration =
        this.webhookWhatsAppProvider
          .validateConfiguration();

      if (
        webhookConfiguration.status ===
        'BLOCKED'
      ) {
        throw new Error(
          `WHATSAPP_WEBHOOK_CONFIGURATION_BLOCKED: ${webhookConfiguration.errors.join('; ')}`,
        );
      }

      this.registry.register(
        this.webhookWhatsAppProvider,
      );
    }

    this.registry.register(
      this.inAppProvider,
    );
  }

  async dispatch(
    notification: NotificationMessage,
  ): Promise<NotificationMessage> {
    const provider = this.registry.get(notification.channel);

    if (!provider) {
      const failed =
        await this.notificationService.updateDeliveryStatus(
          notification.id,
          'FAILED',
          {
            deliveryError:
              `No notification provider registered for ${notification.channel}`,
          },
        );

      await this.eventBus.publish(
        'notification.failed',
        'core.notification.dispatcher',
        {
          notificationId: notification.id,
          channel: notification.channel,
          recipient: notification.recipient,
          reason:
            `No provider registered for ${notification.channel}`,
        },
      );

      return failed ?? notification;
    }

    try {
      const result = await provider.send(notification);

      if (!result.success) {
        const failed =
          await this.notificationService.updateDeliveryStatus(
            notification.id,
            'FAILED',
            {
              providerName: result.providerName,
              deliveryError:
                result.error ?? 'Provider delivery failed',
              providerMetadata: result.metadata ?? {},
            },
          );

        await this.eventBus.publish(
          'notification.failed',
          'core.notification.dispatcher',
          {
            notificationId: notification.id,
            channel: notification.channel,
            recipient: notification.recipient,
            providerName: result.providerName,
            reason:
              result.error ?? 'Provider delivery failed',
          },
        );

        return failed ?? notification;
      }

      const sent =
        await this.notificationService.updateDeliveryStatus(
          notification.id,
          'SENT',
          {
            providerName: result.providerName,
            providerMessageId: result.providerMessageId,
            providerMetadata: result.metadata ?? {},
            deliveredAt: new Date().toISOString(),
          },
        );

      await this.eventBus.publish(
        'notification.sent',
        'core.notification.dispatcher',
        {
          notificationId: notification.id,
          channel: notification.channel,
          recipient: notification.recipient,
          providerName: result.providerName,
          providerMessageId: result.providerMessageId,
        },
      );

      return sent ?? notification;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown provider error';

      this.logger.error(
        `Notification dispatch failed: ${notification.id}`,
        error instanceof Error ? error.stack : undefined,
      );

      const failed =
        await this.notificationService.updateDeliveryStatus(
          notification.id,
          'FAILED',
          {
            providerName: provider.name,
            deliveryError: message,
          },
        );

      await this.eventBus.publish(
        'notification.failed',
        'core.notification.dispatcher',
        {
          notificationId: notification.id,
          channel: notification.channel,
          recipient: notification.recipient,
          providerName: provider.name,
          reason: message,
        },
      );

      return failed ?? notification;
    }
  }
}
