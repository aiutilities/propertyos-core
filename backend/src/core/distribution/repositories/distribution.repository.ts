import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  Distribution,
  DistributionManifest,
  DistributionStatus,
} from '../types/distribution.types';

@Injectable()
export class DistributionRepository {
  private readonly distributions = new Map<string, Distribution>();

  create(manifest: DistributionManifest): Distribution {
    const now = new Date();

    const distribution: Distribution = {
      id: randomUUID(),
      name: manifest.name,
      displayName: manifest.displayName,
      version: manifest.version,
      category: manifest.category,
      manifest,
      status: 'REGISTERED',
      createdAt: now,
      updatedAt: now,
    };

    this.distributions.set(distribution.id, distribution);

    return distribution;
  }

  list(): Distribution[] {
    return Array.from(this.distributions.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  findById(id: string): Distribution | undefined {
    return this.distributions.get(id);
  }

  findByName(name: string): Distribution | undefined {
    return this.list().find((distribution) => distribution.name === name);
  }

  updateStatus(id: string, status: DistributionStatus): Distribution | undefined {
    const distribution = this.distributions.get(id);

    if (!distribution) {
      return undefined;
    }

    const updated: Distribution = {
      ...distribution,
      status,
      installedAt: status === 'INSTALLED' ? new Date() : distribution.installedAt,
      activatedAt: status === 'ACTIVE' ? new Date() : distribution.activatedAt,
      updatedAt: new Date(),
    };

    this.distributions.set(id, updated);

    return updated;
  }
}
