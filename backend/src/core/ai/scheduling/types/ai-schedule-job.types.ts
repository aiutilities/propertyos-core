export interface AiScheduleOccurrenceJobPayload {
  occurrenceId: string;
}

export interface AiRecurringScheduleMaterializeJobPayload {
  scheduleId: string;
  requestedAt: string;
  maximumCatchUpOccurrences: number;
}
