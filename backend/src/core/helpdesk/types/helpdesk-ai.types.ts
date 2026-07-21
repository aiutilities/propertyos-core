import {
  HelpdeskPriority,
} from './helpdesk.types';

export interface HelpdeskAiTriageResult {
  suggestedPriority: HelpdeskPriority;
  suggestedCategory?: string;
  summary: string;
  confidence: number;
  reasons: string[];
  correlationId: string;
  providerName: string;
  model?: string;
}
