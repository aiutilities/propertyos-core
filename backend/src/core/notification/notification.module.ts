import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { EventBusModule } from '../eventbus/eventbus.module';
import { IdentityModule } from '../identity/identity.module';
import { PluginModule } from '../plugin/plugin.module';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { NotificationSubscriber } from './notification.subscriber';
import { NotificationBootstrapService } from './bootstrap/notification-bootstrap.service';

@Module({
  imports: [DatabaseModule, EventBusModule, IdentityModule, PluginModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationSubscriber, NotificationBootstrapService],
  exports: [NotificationService],
})
export class NotificationModule {}
