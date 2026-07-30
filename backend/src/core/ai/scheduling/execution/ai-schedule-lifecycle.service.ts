import {
  Inject,
  Injectable,
} from "@nestjs/common";

import {
  randomUUID,
} from "crypto";

import {
  AiScheduleAlreadyExistsError,
  AiScheduleInvalidStateTransitionError,
  AiScheduleNotFoundError,
  AiScheduleOccurrenceAlreadyClaimedError,
} from "../errors/ai-schedule.error";

import {
  AI_SCHEDULE_REPOSITORY,
  AiScheduleListFilter,
  AiScheduleRepository,
} from "../repositories/ai-schedule.repository";

import {
  AiOccurrenceClaim,
  AiScheduleManifest,
  AiScheduledOccurrence,
} from "../types/ai-schedule.types";

import {
  AiScheduleManifestValidator,
} from "../validation/ai-schedule-manifest.validator";

@Injectable()
export class AiScheduleLifecycleService {
  constructor(
    @Inject(AI_SCHEDULE_REPOSITORY)
    private readonly repository:
      AiScheduleRepository,

    private readonly validator:
      AiScheduleManifestValidator,
  ) {}

  async registerSchedule(
    manifest: AiScheduleManifest,
  ): Promise<AiScheduleManifest> {
    const validated =
      this.validator.validate(manifest);

    const existing =
      await this.repository.getSchedule(
        validated.id,
      );

    if (existing) {
      throw new AiScheduleAlreadyExistsError(
        validated.id,
      );
    }

    return this.repository.createSchedule(
      validated,
    );
  }

  async getSchedule(
    id: string,
  ): Promise<AiScheduleManifest> {
    const schedule =
      await this.repository.getSchedule(id);

    if (!schedule) {
      throw new AiScheduleNotFoundError(id);
    }

    return schedule;
  }

  async listSchedules(
    filter?: AiScheduleListFilter,
  ): Promise<AiScheduleManifest[]> {
    return this.repository.listSchedules(
      filter,
    );
  }

  async pauseSchedule(
    id: string,
    now: string,
  ): Promise<AiScheduleManifest> {
    return this.transition(
      id,
      "paused",
      now,
      ["active"],
    );
  }

  async resumeSchedule(
    id: string,
    now: string,
  ): Promise<AiScheduleManifest> {
    return this.transition(
      id,
      "active",
      now,
      ["paused"],
    );
  }

  async cancelSchedule(
    id: string,
    now: string,
  ): Promise<AiScheduleManifest> {
    return this.transition(
      id,
      "cancelled",
      now,
      [
        "active",
        "paused",
      ],
    );
  }

  async createOccurrence(
    scheduleId: string,
    sequence: number,
    scheduledFor: string,
    now: string,
  ): Promise<AiScheduledOccurrence> {
    const schedule =
      await this.getSchedule(scheduleId);

    if (schedule.status !== "active") {
      throw new AiScheduleInvalidStateTransitionError(
        schedule.status,
        "occurrence_created",
      );
    }

    const occurrence:
      AiScheduledOccurrence = {
        id: randomUUID(),
        scheduleId,
        sequence,
        scheduledFor,
        status: "pending",
        attemptCount: 0,
        createdAt: now,
        updatedAt: now,
      };

    return this.repository.createOccurrence(
      occurrence,
    );
  }

  async findDueOccurrences(
    now: string,
    limit = 100,
  ): Promise<AiScheduledOccurrence[]> {
    return this.repository.findDueOccurrences(
      now,
      limit,
    );
  }

  async claimOccurrence(
    occurrenceId: string,
    workerId: string,
    claimedAt: string,
    claimExpiresAt: string,
  ): Promise<AiScheduledOccurrence> {
    const claim:
      AiOccurrenceClaim = {
        occurrenceId,
        workerId,
        claimedAt,
        claimExpiresAt,
      };

    const claimed =
      await this.repository.claimOccurrence(
        occurrenceId,
        claim,
      );

    if (!claimed) {
      throw new AiScheduleOccurrenceAlreadyClaimedError(
        occurrenceId,
      );
    }

    return claimed;
  }

  async recoverExpiredClaim(
    occurrenceId: string,
    workerId: string,
    claimedAt: string,
    claimExpiresAt: string,
  ): Promise<AiScheduledOccurrence> {
    return this.claimOccurrence(
      occurrenceId,
      workerId,
      claimedAt,
      claimExpiresAt,
    );
  }

  private async transition(
    id: string,
    target: AiScheduleManifest["status"],
    now: string,
    allowed: AiScheduleManifest["status"][],
  ): Promise<AiScheduleManifest> {
    const schedule =
      await this.getSchedule(id);

    if (!allowed.includes(schedule.status)) {
      throw new AiScheduleInvalidStateTransitionError(
        schedule.status,
        target,
      );
    }

    const updated =
      await this.repository.updateScheduleStatus(
        id,
        target,
        now,
      );

    if (!updated) {
      throw new AiScheduleNotFoundError(id);
    }

    return updated;
  }
}
