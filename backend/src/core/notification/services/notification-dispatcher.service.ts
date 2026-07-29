import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';

import {
  CommunicationDispatcher,
  CommunicationProvider,
  CommunicationProviderRegistry,
  StoredCommunicationDelivery,
  UpdateDeliveryStateInput,
} from '@forgeos/communication';

import {
  EventBusService,
} from '../../eventbus/services/eventbus.service';

import {
  createPropertyOSMailerSendProvider,
  createPropertyOSMetaWhatsAppCloudProvider,
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
  currentCommunicationEnvironmentClass,
  resolveEmailCommunicationProvider,
} from '../provider-selection';

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

  private readonly directForgeOSProviders:
    CommunicationProvider[] = [];

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

    if (
      whatsappSelection.mode ===
      'META_CLOUD'
    ) {
      const metaProvider =
        createPropertyOSMetaWhatsAppCloudProvider({
          graphApiVersion:
            process.env
              .WHATSAPP_META_GRAPH_API_VERSION,
          phoneNumberId:
            process.env
              .WHATSAPP_META_PHONE_NUMBER_ID,
          accessToken:
            process.env
              .WHATSAPP_META_ACCESS_TOKEN,
          timeoutMilliseconds:
            process.env
              .WHATSAPP_META_TIMEOUT_MS,
          previewUrl:
            process.env
              .WHATSAPP_META_PREVIEW_URL,
        });

      const metaConfiguration =
        metaProvider
          .validateConfiguration();

      if (
        metaConfiguration.status ===
        'BLOCKED'
      ) {
        throw new Error(
          `WHATSAPP_META_CONFIGURATION_BLOCKED: ${metaConfiguration.errors.join('; ')}`,
        );
      }

      this.directForgeOSProviders.push(
        metaProvider,
      );
    }

    const emailSelection =
      resolveEmailCommunicationProvider({
        environmentClass:
          currentCommunicationEnvironmentClass(
            process.env.NODE_ENV,
          ),
        configuredProvider:
          process.env.EMAIL_PROVIDER,
      });

    if (
      emailSelection.status ===
      'BLOCKED'
    ) {
      throw new Error(
        `EMAIL_PROVIDER_SELECTION_BLOCKED: ${emailSelection.errors.join('; ')}`,
      );
    }

    if (
      emailSelection.provider ===
      'MAILERSEND'
    ) {
      const mailerSendProvider =
        createPropertyOSMailerSendProvider({
          apiToken:
            process.env
              .MAILERSEND_API_TOKEN,

          fromEmail:
            process.env
              .MAILERSEND_FROM_EMAIL,

          fromName:
            process.env
              .MAILERSEND_FROM_NAME,

          replyToEmail:
            process.env
              .MAILERSEND_REPLY_TO_EMAIL,

          replyToName:
            process.env
              .MAILERSEND_REPLY_TO_NAME,

          timeoutMilliseconds:
            process.env
              .MAILERSEND_TIMEOUT_MS,

          trackClicks:
            process.env
              .MAILERSEND_TRACK_CLICKS,

          trackOpens:
            process.env
              .MAILERSEND_TRACK_OPENS,

          trackContent:
            process.env
              .MAILERSEND_TRACK_CONTENT,
        });

      const mailerSendConfiguration =
        mailerSendProvider
          .validateConfiguration();

      if (
        mailerSendConfiguration.status ===
        'BLOCKED'
      ) {
        throw new Error(
          `MAILERSEND_CONFIGURATION_BLOCKED: ${mailerSendConfiguration.errors.join('; ')}`,
        );
      }

      this.directForgeOSProviders.push(
        mailerSendProvider,
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

    for (
      const provider
      of this.directForgeOSProviders
    ) {
      forgeosProviders.register(
        provider,
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
