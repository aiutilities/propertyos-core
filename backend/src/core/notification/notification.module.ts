import { Module } from '@nestjs/common';
import { EventBusModule } from '../eventbus/eventbus.module';
import { IdentityModule } from '../identity/identity.module';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { NotificationSubscriber } from './notification.subscriber';

@Module({
  imports: [EventBusModule, IdentityModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationSubscriber],
  exports: [NotificationService],
})
export class NotificationModule {}
