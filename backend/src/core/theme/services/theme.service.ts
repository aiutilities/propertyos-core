import { Injectable } from '@nestjs/common';
import { EventBusService } from '../../eventbus/services/eventbus.service';
import { InstallThemeDto } from '../dto/install-theme.dto';
import { ThemeRegistry } from '../registries/theme.registry';
import { ThemeEntity } from '../types/theme.types';

@Injectable()
export class ThemeService {
  private readonly eventSource = 'core.theme';

  constructor(
    private readonly registry: ThemeRegistry,
    private readonly eventBus: EventBusService,
  ) {}

  async install(dto: InstallThemeDto): Promise<ThemeEntity> {
    const theme: ThemeEntity = {
      id: dto.manifest.id,
      manifest: dto.manifest,
      status: 'INSTALLED',
      installedAt: new Date(),
    };

    this.registry.register(theme);

    await this.eventBus.publish('theme.installed', this.eventSource, {
      id: theme.id,
      name: theme.manifest.name,
      version: theme.manifest.version,
    });

    return theme;
  }

  list(): ThemeEntity[] {
    return this.registry.list();
  }

  getActive(): ThemeEntity | undefined {
    return this.registry.getActive();
  }

  async activate(id: string): Promise<ThemeEntity | undefined> {
    const theme = this.registry.activate(id);

    if (theme) {
      await this.eventBus.publish('theme.activated', this.eventSource, {
        id: theme.id,
        name: theme.manifest.name,
      });
    }

    return theme;
  }
}
