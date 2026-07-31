export type AiRecurringMaterializationDecision =
  | "materialized"
  | "not_due";

export interface AiRecurringOccurrenceCandidate {
  intervalIndex: number;
  scheduledFor: string;
}

export interface AiRecurringOccurrenceCalculationRequest {
  anchor: string;
  intervalSeconds: number;
  materializedAt: string;
  latestScheduledFor?: string;
  maximumCatchUpOccurrences: number;
}

export interface AiRecurringOccurrenceCalculationResult {
  anchor: string;
  intervalSeconds: number;
  materializedAt: string;
  latestRepresentedIntervalIndex: number;
  latestDueIntervalIndex: number;
  createdCandidates: AiRecurringOccurrenceCandidate[];
  skippedIntervals: number;
  nextScheduledFor: string;
  decision: AiRecurringMaterializationDecision;
}
