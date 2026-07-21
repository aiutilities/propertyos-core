export interface HelpdeskKnowledgeEvidence {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  description?: string;
  score?: number;
  providerName?: string;
  metadata?: Record<string, unknown>;
}

export interface HelpdeskKnowledgeRetrievalResult {
  query: string;
  evidence: HelpdeskKnowledgeEvidence[];
  evidenceCount: number;
}
