import { Injectable, OnModuleInit } from '@nestjs/common';

import { SearchProviderRegistry } from '../search/registries/search-provider.registry';
import {
  SearchProvider,
  SearchQuery,
  SearchResult,
} from '../search/types/search.types';
import { WorkflowService } from './services/workflow.service';

@Injectable()
export class WorkflowSearchProviderService implements OnModuleInit {
  constructor(
    private readonly searchProviderRegistry: SearchProviderRegistry,
    private readonly workflowService: WorkflowService,
  ) {}

  onModuleInit(): void {
    const provider: SearchProvider = {
      name: 'core-workflow-search',
      entityType: 'WORKFLOW',
      search: (query) => this.search(query),
    };

    this.searchProviderRegistry.register(provider);
  }

  private async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!query.query?.trim()) {
      return [];
    }

    const workflowDefinitions = await this.workflowService.listDefinitions();
    const normalizedQuery = query.query.toLowerCase();
    const limit = query.limit ?? 25;

    return workflowDefinitions
      .filter((definition: any) => {
        const code = String(definition.code ?? '').toLowerCase();
        const name = String(definition.name ?? '').toLowerCase();
        const entityType = String(definition.entityType ?? '').toLowerCase();

        return (
          code.includes(normalizedQuery) ||
          name.includes(normalizedQuery) ||
          entityType.includes(normalizedQuery)
        );
      })
      .map((definition: any) => ({
        id: `WORKFLOW:${definition.id}`,
        entityType: 'WORKFLOW',
        entityId: definition.id,
        title: definition.name,
        description: [
          definition.code,
          definition.entityType,
          definition.isActive ? 'Active' : 'Inactive',
        ]
          .filter(Boolean)
          .join(' | '),
        score: this.scoreWorkflowDefinition(query.query, definition),
        metadata: {
          code: definition.code,
          entityType: definition.entityType,
          initialState: definition.initialState,
          isActive: definition.isActive,
        },
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, limit);
  }

  private scoreWorkflowDefinition(query: string, definition: any): number {
    const normalizedQuery = query.toLowerCase();
    const code = String(definition.code ?? '').toLowerCase();
    const name = String(definition.name ?? '').toLowerCase();
    const entityType = String(definition.entityType ?? '').toLowerCase();

    if (code === normalizedQuery || name === normalizedQuery) {
      return 100;
    }

    if (code.includes(normalizedQuery) || name.includes(normalizedQuery)) {
      return 80;
    }

    if (entityType.includes(normalizedQuery)) {
      return 60;
    }

    return 50;
  }
}
