import { Injectable } from '@nestjs/common';

import { NotificationProvider } from '../contracts/notification-provider.contract';
import { NotificationChannel } from '../types/notification.types';

@Injectable()
export class NotificationProviderRegistry {
  private readonly providers = new Map<
    NotificationChannel,
    NotificationProvider
  >();

  register(provider: NotificationProvider): void {
    this.providers.set(provider.channel, provider);
  }

  get(
    channel: NotificationChannel,
  ): NotificationProvider | undefined {
    return this.providers.get(channel);
  }

  list(): NotificationProvider[] {
    return Array.from(this.providers.values());
  }
}
