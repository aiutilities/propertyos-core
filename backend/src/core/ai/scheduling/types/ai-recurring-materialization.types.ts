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

export type AiRecurringMaterializationServiceDecision =
  | "materialized"
  | "not_due"
  | "paused"
  | "cancelled"
  | "terminal";

export interface AiRecurringMaterializationRequest {
  scheduleId: string;
  materializedAt: string;
  maximumCatchUpOccurrences: number;
}

export interface AiRecurringMaterializationResult {
  scheduleId: string;
  scheduleStatus: import("./ai-schedule.types").AiScheduleStatus;
  anchor: string;
  intervalSeconds: number;
  materializedAt: string;
  createdOccurrences:
    import("./ai-schedule.types").AiScheduledOccurrence[];
  existingOccurrences:
    import("./ai-schedule.types").AiScheduledOccurrence[];
  skippedIntervals: number;
  nextScheduledFor?: string;
  decision: AiRecurringMaterializationServiceDecision;
}
