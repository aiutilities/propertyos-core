export type AiToolErrorCode =
  | "AI_TOOL_INVALID_MANIFEST"
  | "AI_TOOL_DUPLICATE_REGISTRATION"
  | "AI_TOOL_NOT_FOUND";

export class AiToolError extends Error {
  constructor(
    readonly code: AiToolErrorCode,
    message: string,
    readonly details?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
    this.name = "AiToolError";

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AiToolInvalidManifestError extends AiToolError {
  constructor(readonly violations: readonly string[]) {
    super(
      "AI_TOOL_INVALID_MANIFEST",
      `AI tool manifest is invalid: ${violations.join("; ")}`,
      {
        violations: [...violations],
      },
    );

    this.name = "AiToolInvalidManifestError";
  }
}

export class AiToolDuplicateRegistrationError extends AiToolError {
  constructor(readonly toolId: string) {
    super(
      "AI_TOOL_DUPLICATE_REGISTRATION",
      `AI tool "${toolId}" is already registered`,
      {
        toolId,
      },
    );

    this.name = "AiToolDuplicateRegistrationError";
  }
}

export class AiToolNotFoundError extends AiToolError {
  constructor(readonly toolId: string) {
    super("AI_TOOL_NOT_FOUND", `AI tool "${toolId}" is not registered`, {
      toolId,
    });

    this.name = "AiToolNotFoundError";
  }
}
