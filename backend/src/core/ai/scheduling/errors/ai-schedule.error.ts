export class AiScheduleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class AiScheduleInvalidManifestError extends AiScheduleError {
  constructor(message: string) {
    super("AI_SCHEDULE_INVALID_MANIFEST", message);
  }
}

export class AiScheduleInvalidIdentifierError extends AiScheduleError {
  constructor(identifier: string) {
    super(
      "AI_SCHEDULE_INVALID_IDENTIFIER",
      `Invalid AI schedule identifier: "${identifier}"`,
    );
  }
}

export class AiScheduleInvalidTimeError extends AiScheduleError {
  constructor(value: string) {
    super("AI_SCHEDULE_INVALID_TIME", `Invalid AI schedule time: "${value}"`);
  }
}

export class AiScheduleInvalidRecurrenceError extends AiScheduleError {
  constructor() {
    super(
      "AI_SCHEDULE_INVALID_RECURRENCE",
      "The AI schedule recurrence is invalid",
    );
  }
}

export class AiScheduleInvalidTimezoneError extends AiScheduleError {
  constructor(timezone: string) {
    super(
      "AI_SCHEDULE_INVALID_TIMEZONE",
      `Invalid AI schedule timezone: "${timezone}"`,
    );
  }
}

export class AiScheduleInvalidRetryPolicyError extends AiScheduleError {
  constructor(message: string) {
    super("AI_SCHEDULE_INVALID_RETRY_POLICY", message);
  }
}

export class AiScheduleUnsafePayloadError extends AiScheduleError {
  constructor(field: string) {
    super(
      "AI_SCHEDULE_UNSAFE_PAYLOAD",
      `AI schedule payload contains prohibited field: "${field}"`,
    );
  }
}

export class AiScheduleNotFoundError extends AiScheduleError {
  constructor(id: string) {
    super("AI_SCHEDULE_NOT_FOUND", `AI schedule not found: "${id}"`);
  }
}

export class AiScheduleAlreadyExistsError extends AiScheduleError {
  constructor(id: string) {
    super("AI_SCHEDULE_ALREADY_EXISTS", `AI schedule already exists: "${id}"`);
  }
}

export class AiScheduleInvalidStateTransitionError extends AiScheduleError {
  constructor(from: string, to: string) {
    super(
      "AI_SCHEDULE_INVALID_STATE_TRANSITION",
      `Invalid AI schedule state transition from "${from}" to "${to}"`,
    );
  }
}

export class AiScheduleOccurrenceAlreadyClaimedError extends AiScheduleError {
  constructor(id: string) {
    super(
      "AI_SCHEDULE_OCCURRENCE_ALREADY_CLAIMED",
      `AI schedule occurrence already claimed: "${id}"`,
    );
  }
}
