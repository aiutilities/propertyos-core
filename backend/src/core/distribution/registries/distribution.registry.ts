import { Injectable } from '@nestjs/common';
import { Distribution } from '../types/distribution.types';

@Injectable()
export class DistributionRegistry {
  private readonly distributions = new Map<string, Distribution>();
  private activeDistributionId?: string;

  register(distribution: Distribution): void {
    this.distributions.set(distribution.id, distribution);
  }

  list(): Distribution[] {
    return Array.from(this.distributions.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  get(id: string): Distribution | undefined {
    return this.distributions.get(id);
  }

  getByName(name: string): Distribution | undefined {
    return this.list().find((distribution) => distribution.name === name);
  }

  activate(id: string): Distribution | undefined {
    const distribution = this.distributions.get(id);

    if (!distribution) {
      return undefined;
    }

    for (const existing of this.distributions.values()) {
      if (existing.status === 'ACTIVE') {
        existing.status = 'INACTIVE';
        existing.updatedAt = new Date();
      }
    }

    distribution.status = 'ACTIVE';
    distribution.activatedAt = new Date();
    distribution.updatedAt = new Date();
    this.activeDistributionId = id;

    return distribution;
  }

  getActive(): Distribution | undefined {
    if (!this.activeDistributionId) {
      return undefined;
    }

    return this.distributions.get(this.activeDistributionId);
  }
}
