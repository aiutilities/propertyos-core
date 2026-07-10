import { Injectable } from '@nestjs/common';
import { EventBusService } from '../../eventbus/services/eventbus.service';
import { PlatformEventNames } from '../../platform';
import { PluginEntity } from '../entities/plugin.entity';
import { RollbackPluginDto } from '../dto/rollback-plugin.dto';
import { UpgradePluginDto } from '../dto/upgrade-plugin.dto';

export interface PluginLifecycleResult {
  success: boolean;
  plugin: PluginEntity;
  status: string;
  previousStatus?: string;
  fromVersion?: string;
  toVersion?: string;
}

@Injectable()
export class PluginLifecycleService {
  private readonly eventSource = 'core.plugin.lifecycle';

  constructor(private readonly eventBus: EventBusService) {}

  async activate(plugin: PluginEntity): Promise<Partial<PluginEntity>> {
    await this.eventBus.publish('plugin.lifecycle.before_activate', this.eventSource, {
      id: plugin.id,
      name: plugin.name,
      status: plugin.status,
    });

    return {
      status: 'ACTIVE',
      activatedAt: new Date(),
    };
  }

  async deactivate(plugin: PluginEntity): Promise<Partial<PluginEntity>> {
    await this.eventBus.publish('plugin.lifecycle.before_deactivate', this.eventSource, {
      id: plugin.id,
      name: plugin.name,
      status: plugin.status,
    });

    return {
      status: 'INACTIVE',
      deactivatedAt: new Date(),
    };
  }

  async uninstall(plugin: PluginEntity): Promise<Partial<PluginEntity>> {
    await this.eventBus.publish('plugin.lifecycle.before_uninstall', this.eventSource, {
      id: plugin.id,
      name: plugin.name,
      status: plugin.status,
      version: plugin.version,
    });

    return {
      status: 'UNINSTALLED',
      deactivatedAt: new Date(),
    };
  }

  async upgrade(
    plugin: PluginEntity,
    dto: UpgradePluginDto,
  ): Promise<Partial<PluginEntity>> {
    const nextManifest = dto.manifest ?? {
      ...plugin.manifest,
      version: dto.version,
    };

    await this.eventBus.publish('plugin.lifecycle.before_upgrade', this.eventSource, {
      id: plugin.id,
      name: plugin.name,
      fromVersion: plugin.version,
      toVersion: dto.version,
      notes: dto.notes,
    });

    return {
      version: dto.version,
      manifest: nextManifest,
      status: 'INSTALLED',
      deactivatedAt: new Date(),
    };
  }

  async rollback(
    plugin: PluginEntity,
    dto: RollbackPluginDto,
  ): Promise<Partial<PluginEntity>> {
    const nextManifest = {
      ...plugin.manifest,
      version: dto.targetVersion,
    };

    await this.eventBus.publish('plugin.lifecycle.before_rollback', this.eventSource, {
      id: plugin.id,
      name: plugin.name,
      fromVersion: plugin.version,
      toVersion: dto.targetVersion,
      notes: dto.notes,
    });

    return {
      version: dto.targetVersion,
      manifest: nextManifest,
      status: 'INSTALLED',
      deactivatedAt: new Date(),
    };
  }

  buildResult(
    plugin: PluginEntity,
    status: string,
    previousStatus?: string,
    fromVersion?: string,
    toVersion?: string,
  ): PluginLifecycleResult {
    return {
      success: true,
      plugin,
      status,
      previousStatus,
      fromVersion,
      toVersion,
    };
  }
}
