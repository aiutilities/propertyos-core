import { Module } from '@nestjs/common';
import { EventBusModule } from '../eventbus/eventbus.module';
import { NotificationService } from './services/notification.service';
import { NotificationSubscriber } from './notification.subscriber';

@Module({
  imports: [EventBusModule],
  providers: [NotificationService, NotificationSubscriber],
  exports: [NotificationService],
})
export class NotificationModule {}
