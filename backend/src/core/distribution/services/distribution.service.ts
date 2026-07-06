import { Injectable } from '@nestjs/common';
import { EventBusService } from '../../eventbus/services/eventbus.service';
import { InstallDistributionDto } from '../dto/install-distribution.dto';
import { RegisterDistributionDto } from '../dto/register-distribution.dto';
import { DistributionRegistry } from '../registries/distribution.registry';
import { DistributionRepository } from '../repositories/distribution.repository';
import { Distribution } from '../types/distribution.types';

@Injectable()
export class DistributionService {
  private readonly eventSource = 'core.distribution';

  constructor(
    private readonly repository: DistributionRepository,
    private readonly registry: DistributionRegistry,
    private readonly eventBus: EventBusService,
  ) {}

  async register(dto: RegisterDistributionDto): Promise<Distribution> {
    const existing = this.repository.findByName(dto.manifest.name);

    if (existing) {
      return existing;
    }

    const distribution = this.repository.create(dto.manifest);
    this.registry.register(distribution);

    await this.eventBus.publish('distribution.registered', this.eventSource, {
      distributionId: distribution.id,
      name: distribution.name,
      version: distribution.version,
      category: distribution.category,
    });

    return distribution;
  }

  list(): Distribution[] {
    return this.repository.list();
  }

  get(id: string): Distribution | undefined {
    return this.repository.findById(id);
  }

  getActive(): Distribution | undefined {
    return this.registry.getActive();
  }

  async install(dto: InstallDistributionDto): Promise<Distribution | undefined> {
    const distribution = this.repository.updateStatus(
      dto.distributionId,
      'INSTALLED',
    );

    if (!distribution) {
      return undefined;
    }

    this.registry.register(distribution);

    await this.eventBus.publish('distribution.installed', this.eventSource, {
      distributionId: distribution.id,
      name: distribution.name,
      installedByPersonId: dto.installedByPersonId,
      requiredPlugins: distribution.manifest.requiredPlugins ?? [],
      requiredThemes: distribution.manifest.requiredThemes ?? [],
      options: dto.options ?? {},
    });

    return distribution;
  }

  async activate(id: string): Promise<Distribution | undefined> {
    const distribution = this.repository.updateStatus(id, 'ACTIVE');

    if (!distribution) {
      return undefined;
    }

    this.registry.register(distribution);
    const active = this.registry.activate(id);

    await this.eventBus.publish('distribution.activated', this.eventSource, {
      distributionId: id,
      name: distribution.name,
      defaultTheme: distribution.manifest.defaultTheme,
      defaultSettings: distribution.manifest.defaultSettings ?? {},
    });

    return active ?? distribution;
  }

  async archive(id: string): Promise<Distribution | undefined> {
    const distribution = this.repository.updateStatus(id, 'ARCHIVED');

    if (distribution) {
      await this.eventBus.publish('distribution.archived', this.eventSource, {
        distributionId: id,
        name: distribution.name,
      });
    }

    return distribution;
  }
}
