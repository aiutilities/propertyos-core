export interface SearchQuery {
  query: string;
  entityTypes?: string[];
  limit?: number;
}

export interface SearchResult {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  description?: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface SearchProvider {
  name: string;
  entityType: string;
  search(query: SearchQuery): Promise<SearchResult[]>;
}
