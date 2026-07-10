import { Injectable } from '@nestjs/common';
import { EventBusService } from '../../../eventbus/services/eventbus.service';
import { ThemeService } from '../../services/theme.service';
import { RegisterThemePackageDto } from '../dto/register-theme-package.dto';
import { ThemePackageArchiveService } from '../archive/theme-package-archive.service';
import { ThemePackageRepository } from '../repositories/theme-package.repository';
import { ThemePackageValidator } from '../validator/theme-package.validator';
import { ThemePackage } from '../types/theme-package.types';

@Injectable()
export class ThemePackageService {
  private readonly eventSource = 'core.theme.package';

  constructor(
    private readonly repository: ThemePackageRepository,
    private readonly validator: ThemePackageValidator,
    private readonly archiveService: ThemePackageArchiveService,
    private readonly themeService: ThemeService,
    private readonly eventBus: EventBusService,
  ) {}

  async register(dto: RegisterThemePackageDto): Promise<ThemePackage> {
    const validationErrors = this.validator.validate(dto);
    const status = validationErrors.length ? 'INVALID' : 'VALIDATED';

    const themePackage = this.repository.create({
      name: dto.name,
      version: dto.version,
      sourcePath: this.archiveService.normalizeSourcePath(dto.sourcePath),
      manifest: dto.manifest,
      status,
      validationErrors,
      metadata: dto.metadata ?? {},
    });

    await this.eventBus.publish('theme.package.registered', this.eventSource, {
      themePackageId: themePackage.id,
      name: themePackage.name,
      version: themePackage.version,
      status: themePackage.status,
    });

    return themePackage;
  }

  list(): ThemePackage[] {
    return this.repository.list();
  }

  get(id: string): ThemePackage | undefined {
    return this.repository.findById(id);
  }

  async install(id: string): Promise<ThemePackage | undefined> {
    const themePackage = this.repository.findById(id);

    if (!themePackage) {
      return undefined;
    }

    if (themePackage.status === 'INVALID') {
      return themePackage;
    }

    await this.themeService.install({
      manifest: themePackage.manifest,
    });

    const updated = this.repository.updateStatus(id, 'INSTALLED');

    await this.eventBus.publish('theme.package.installed', this.eventSource, {
      themePackageId: id,
      name: themePackage.name,
      version: themePackage.version,
    });

    return updated;
  }

  async archive(id: string): Promise<ThemePackage | undefined> {
    const updated = this.repository.updateStatus(id, 'ARCHIVED');

    if (updated) {
      await this.eventBus.publish('theme.package.archived', this.eventSource, {
        themePackageId: id,
      });
    }

    return updated;
  }
}
