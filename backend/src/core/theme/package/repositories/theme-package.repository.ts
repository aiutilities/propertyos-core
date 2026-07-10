import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ThemePackage, ThemePackageStatus } from '../types/theme-package.types';

@Injectable()
export class ThemePackageRepository {
  private readonly packages = new Map<string, ThemePackage>();

  create(
    input: Omit<ThemePackage, 'id' | 'createdAt' | 'updatedAt'>,
  ): ThemePackage {
    const now = new Date();

    const themePackage: ThemePackage = {
      ...input,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    this.packages.set(themePackage.id, themePackage);

    return themePackage;
  }

  list(): ThemePackage[] {
    return Array.from(this.packages.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  findById(id: string): ThemePackage | undefined {
    return this.packages.get(id);
  }

  updateStatus(
    id: string,
    status: ThemePackageStatus,
    validationErrors: string[] = [],
  ): ThemePackage | undefined {
    const existing = this.packages.get(id);

    if (!existing) {
      return undefined;
    }

    const updated: ThemePackage = {
      ...existing,
      status,
      validationErrors,
      updatedAt: new Date(),
    };

    this.packages.set(id, updated);

    return updated;
  }
}
