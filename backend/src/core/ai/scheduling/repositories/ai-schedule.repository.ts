import {
  AiOccurrenceClaim,
  AiScheduleAttempt,
  AiScheduleManifest,
  AiScheduledOccurrence,
  AiScheduleStatus,
} from "../types/ai-schedule.types";

export const AI_SCHEDULE_REPOSITORY = Symbol("AI_SCHEDULE_REPOSITORY");

export interface AiScheduleListFilter {
  status?: AiScheduleStatus;
  commandName?: string;
  propertyId?: string;
  organizationId?: string;
}

export interface AiScheduleHistoryFilter {
  scheduleId?: string;
  occurrenceId?: string;
  limit?: number;
}

export interface AiScheduleRepository {
  createSchedule(schedule: AiScheduleManifest): Promise<AiScheduleManifest>;

  getSchedule(id: string): Promise<AiScheduleManifest | null>;

  listSchedules(
    filter?: AiScheduleListFilter,
  ): Promise<AiScheduleManifest[]>;

  updateScheduleStatus(
    id: string,
    status: AiScheduleStatus,
    updatedAt: string,
  ): Promise<AiScheduleManifest | null>;

  createOccurrence(
    occurrence: AiScheduledOccurrence,
  ): Promise<AiScheduledOccurrence>;

  getOccurrence(id: string): Promise<AiScheduledOccurrence | null>;

  findDueOccurrences(
    now: string,
    limit: number,
  ): Promise<AiScheduledOccurrence[]>;

  claimOccurrence(
    occurrenceId: string,
    claim: AiOccurrenceClaim,
  ): Promise<AiScheduledOccurrence | null>;

  updateOccurrence(
    occurrence: AiScheduledOccurrence,
  ): Promise<AiScheduledOccurrence>;

  createAttempt(attempt: AiScheduleAttempt): Promise<AiScheduleAttempt>;

  updateAttempt(attempt: AiScheduleAttempt): Promise<AiScheduleAttempt>;

  listExecutionHistory(
    filter?: AiScheduleHistoryFilter,
  ): Promise<AiScheduledOccurrence[]>;
}
