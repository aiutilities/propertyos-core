import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { EventBusModule } from '../eventbus/eventbus.module';
import { IdentityModule } from '../identity/identity.module';
import { PluginModule } from '../plugin/plugin.module';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { NotificationSubscriber } from './notification.subscriber';
import { NotificationBootstrapService } from './bootstrap/notification-bootstrap.service';
import { NotificationDispatcherService } from './services/notification-dispatcher.service';
import { NotificationProviderRegistry } from './registries/notification-provider.registry';
import { MockWhatsAppNotificationProvider } from './providers/mock-whatsapp-notification.provider';
import { InAppNotificationProvider } from './providers/in-app-notification.provider';

@Module({
  imports: [DatabaseModule, EventBusModule, IdentityModule, PluginModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationSubscriber,
    NotificationBootstrapService,
    NotificationDispatcherService,
    NotificationProviderRegistry,
    MockWhatsAppNotificationProvider,
    InAppNotificationProvider,
  ],
  exports: [
    NotificationService,
    NotificationDispatcherService,
    NotificationProviderRegistry,
  ],
})
export class NotificationModule {}
