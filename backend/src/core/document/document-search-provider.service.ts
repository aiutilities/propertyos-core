import { Injectable, OnModuleInit } from '@nestjs/common';

import { SearchProviderRegistry } from '../search/registries/search-provider.registry';
import {
  SearchProvider,
  SearchQuery,
  SearchResult,
} from '../search/types/search.types';
import { DocumentService } from './services/document.service';

@Injectable()
export class DocumentSearchProviderService implements OnModuleInit {
  constructor(
    private readonly searchProviderRegistry: SearchProviderRegistry,
    private readonly documentService: DocumentService,
  ) {}

  onModuleInit(): void {
    this.searchProviderRegistry.register({
      name: 'core-document-search',
      entityType: 'DOCUMENT',
      search: (query) => this.search(query),
    });
  }

  private async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!query.query?.trim()) {
      return [];
    }

    const documents = await this.documentService.listDocuments();
    const normalizedQuery = query.query.toLowerCase();

    return documents
      .filter((document: any) => {
        const title = String(document.title ?? '').toLowerCase();
        const status = String(document.status ?? '').toLowerCase();
        const entityType = String(document.entityType ?? '').toLowerCase();
        const entityId = String(document.entityId ?? '').toLowerCase();

        return (
          title.includes(normalizedQuery) ||
          status.includes(normalizedQuery) ||
          entityType.includes(normalizedQuery) ||
          entityId.includes(normalizedQuery)
        );
      })
      .map((document: any) => ({
        id: `DOCUMENT:${document.id}`,
        entityType: 'DOCUMENT',
        entityId: document.id,
        title: document.title,
        description: [
          document.status,
          document.entityType,
          document.entityId,
        ]
          .filter(Boolean)
          .join(' | '),
        score: this.scoreDocument(query.query, document),
        metadata: {
          templateId: document.templateId,
          entityType: document.entityType,
          entityId: document.entityId,
          status: document.status,
        },
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, query.limit ?? 25);
  }

  private scoreDocument(query: string, document: any): number {
    const normalizedQuery = query.toLowerCase();
    const title = String(document.title ?? '').toLowerCase();

    if (title === normalizedQuery) {
      return 100;
    }

    if (title.includes(normalizedQuery)) {
      return 80;
    }

    return 50;
  }
}
