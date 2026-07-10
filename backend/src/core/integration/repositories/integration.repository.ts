import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  Integration,
  IntegrationStatus,
} from '../types/integration.types';

@Injectable()
export class IntegrationRepository {
  private readonly integrations = new Map<string, Integration>();

  create(input: Omit<Integration, 'id' | 'createdAt' | 'updatedAt'>): Integration {
    const now = new Date();

    const integration: Integration = {
      ...input,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    this.integrations.set(integration.id, integration);

    return integration;
  }

  list(): Integration[] {
    return Array.from(this.integrations.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  findById(id: string): Integration | undefined {
    return this.integrations.get(id);
  }

  findByName(name: string): Integration | undefined {
    return this.list().find((integration) => integration.name === name);
  }

  updateStatus(id: string, status: IntegrationStatus): Integration | undefined {
    const existing = this.integrations.get(id);

    if (!existing) {
      return undefined;
    }

    const updated: Integration = {
      ...existing,
      status,
      updatedAt: new Date(),
    };

    this.integrations.set(id, updated);

    return updated;
  }
}
