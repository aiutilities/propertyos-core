import { Injectable } from '@nestjs/common';
import { EventBusService } from '../../eventbus/services/eventbus.service';
import { PlatformEventNames } from '../../platform';
import { CreatePluginDto } from '../dto/create-plugin.dto';

@Injectable()
export class PluginService {
  private readonly eventSource = 'core.plugin';

  constructor(private readonly eventBus: EventBusService) {}

  async install(dto: CreatePluginDto) {
    await this.eventBus.publish(
      PlatformEventNames.PLUGIN_INSTALLED,
      this.eventSource,
      { manifest: dto.manifest },
    );

    return {
      success: true,
      plugin: dto.manifest,
      status: 'INSTALLED',
    };
  }

  async activate(id: string) {
    await this.eventBus.publish(
      PlatformEventNames.PLUGIN_ACTIVATED,
      this.eventSource,
      { id },
    );

    return { success: true, id, status: 'ACTIVE' };
  }

  async deactivate(id: string) {
    await this.eventBus.publish(
      PlatformEventNames.PLUGIN_DEACTIVATED,
      this.eventSource,
      { id },
    );

    return { success: true, id, status: 'INACTIVE' };
  }

  async uninstall(id: string) {
    await this.eventBus.publish(
      PlatformEventNames.PLUGIN_UNINSTALLED,
      this.eventSource,
      { id },
    );

    return { success: true, id, status: 'UNINSTALLED' };
  }

  async list() {
    return [];
  }
}
