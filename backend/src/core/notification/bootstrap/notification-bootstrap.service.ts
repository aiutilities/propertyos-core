import { Injectable, OnModuleInit } from '@nestjs/common';

import { RegistryBootstrapRunner } from '../../plugin/bootstrap/registry-bootstrap.runner';
import { PluginNotificationRegistry } from '../../plugin/registries/plugin-notification.registry';
import {
  NotificationService,
  NotificationTemplate,
} from '../services/notification.service';

@Injectable()
export class NotificationBootstrapService
  extends RegistryBootstrapRunner<NotificationTemplate>
  implements OnModuleInit
{
  constructor(
    private readonly pluginNotificationRegistry: PluginNotificationRegistry,
    private readonly notificationService: NotificationService,
  ) {
    super(NotificationBootstrapService.name);
  }

  async onModuleInit(): Promise<void> {
    await this.run();
  }

  load(): NotificationTemplate[] {
    return this.pluginNotificationRegistry.list() as NotificationTemplate[];
  }

  async synchronize(templates: NotificationTemplate[]): Promise<void> {
    this.notificationService.registerTemplates(templates);
  }
}
