export class SchedulerHandlerNotFoundError
  extends Error
{
  readonly code =
    "SCHEDULER_HANDLER_NOT_FOUND";

  constructor(
    readonly jobType: string,
  ) {
    super(
      `No handler registered for job type: ${jobType}`,
    );
    this.name =
      "SchedulerHandlerNotFoundError";
  }
}

export class SchedulerHandlerAlreadyRegisteredError
  extends Error
{
  readonly code =
    "SCHEDULER_HANDLER_ALREADY_REGISTERED";

  constructor(
    readonly jobType: string,
  ) {
    super(
      `A different handler is already registered for job type: ${jobType}`,
    );
    this.name =
      "SchedulerHandlerAlreadyRegisteredError";
  }
}
