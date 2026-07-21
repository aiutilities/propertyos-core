import {
  HelpdeskKnowledgeEvidence,
} from './helpdesk-ai-knowledge.types';

export interface HelpdeskAiReplySuggestion {
  subject: string;
  reply: string;
  confidence: number;
  tone: 'professional' | 'friendly' | 'empathetic';
  correlationId: string;
  providerName?: string;
  model?: string;
  grounded: boolean;
  evidence: HelpdeskKnowledgeEvidence[];
  evidenceCount: number;
}
