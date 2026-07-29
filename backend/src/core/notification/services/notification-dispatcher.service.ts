import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';

import {
  CommunicationDispatcher,
  CommunicationProviderRegistry,
  StoredCommunicationDelivery,
  UpdateDeliveryStateInput,
} from '@forgeos/communication';

import {
  EventBusService,
} from '../../eventbus/services/eventbus.service';

import {
  PropertyOSNotificationEventPublisherAdapter,
  PropertyOSNotificationProviderAdapter,
} from '../adapters/forgeos';

import {
  InAppNotificationProvider,
} from '../providers/in-app-notification.provider';

import {
  MockWhatsAppNotificationProvider,
} from '../providers/mock-whatsapp-notification.provider';

import {
  WhatsAppWebhookNotificationProvider,
} from '../providers/whatsapp-webhook-notification.provider';

import {
  currentWhatsAppEnvironmentClass,
  resolveWhatsAppProviderSelection,
} from '../providers/whatsapp-provider-selection';

import {
  NotificationProviderRegistry,
} from '../registries/notification-provider.registry';

import {
  NotificationMessage,
} from '../types/notification.types';

import {
  NotificationService,
} from './notification.service';

@Injectable()
export class NotificationDispatcherService
  implements OnModuleInit
{
  private readonly logger = new Logger(
    NotificationDispatcherService.name,
  );

  constructor(
    private readonly registry:
      NotificationProviderRegistry,
    private readonly notificationService:
      NotificationService,
    private readonly eventBus:
      EventBusService,
    private readonly mockWhatsAppProvider:
      MockWhatsAppNotificationProvider,
    private readonly webhookWhatsAppProvider:
      WhatsAppWebhookNotificationProvider,
    private readonly inAppProvider:
      InAppNotificationProvider,
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
    const forgeosProviders =
      new CommunicationProviderRegistry();

    for (
      const provider
      of this.registry.list()
    ) {
      forgeosProviders.register(
        new PropertyOSNotificationProviderAdapter(
          provider,
        ),
      );
    }

    let updatedNotification:
      NotificationMessage | null = null;

    const dispatcher =
      new CommunicationDispatcher({
        providers: forgeosProviders,

        deliveryStateStore: {
          updateDeliveryState:
            async (
              input:
                UpdateDeliveryStateInput,
            ): Promise<
              StoredCommunicationDelivery | null
            > => {
              updatedNotification =
                await this.notificationService
                  .updateDeliveryStatus(
                    input.communicationId,
                    input.status,
                    input.metadata ?? {},
                  );

              if (!updatedNotification) {
                return null;
              }

              return {
                id:
                  updatedNotification.id,
                status:
                  updatedNotification.status,
                metadata:
                  updatedNotification.metadata,
              };
            },
        },

        eventPublisher:
          new PropertyOSNotificationEventPublisherAdapter(
            this.eventBus,
          ),

        logger: {
          error: (
            message,
            metadata,
          ): void => {
            this.logger.error(
              metadata
                ? `${message} ${JSON.stringify(metadata)}`
                : message,
            );
          },
        },
      });

    await dispatcher.dispatch({
      communicationId:
        notification.id,
      channel:
        notification.channel,
      recipient:
        notification.recipient,
      subject:
        notification.subject,
      message:
        notification.message,
      metadata:
        notification.metadata,
      correlationId:
        typeof notification.metadata
          .correlationId === 'string'
          ? notification.metadata
              .correlationId
          : undefined,
      causationId:
        typeof notification.metadata
          .causationId === 'string'
          ? notification.metadata
              .causationId
          : undefined,
    });

    return (
      updatedNotification ??
      notification
    );
  }
}
