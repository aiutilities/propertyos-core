export type AiPromptErrorCode =
  | "AI_PROMPT_INVALID_MANIFEST"
  | "AI_PROMPT_CONFLICTING_VERSION"
  | "AI_PROMPT_NOT_FOUND"
  | "AI_PROMPT_VERSION_NOT_FOUND"
  | "AI_PROMPT_NO_ACTIVE_VERSION"
  | "AI_PROMPT_DEPRECATED_VERSION"
  | "AI_PROMPT_CORE_OWNERSHIP_CONFLICT"
  | "AI_PROMPT_MISSING_VARIABLE"
  | "AI_PROMPT_UNKNOWN_VARIABLE"
  | "AI_PROMPT_INVALID_VARIABLE_TYPE"
  | "AI_PROMPT_UNRESOLVED_VARIABLE";

export class AiPromptError extends Error {
  constructor(
    readonly code: AiPromptErrorCode,
    message: string,
    readonly details?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
    this.name = "AiPromptError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AiPromptInvalidManifestError extends AiPromptError {
  constructor(readonly violations: readonly string[]) {
    super(
      "AI_PROMPT_INVALID_MANIFEST",
      `AI prompt manifest is invalid: ${violations.join("; ")}`,
      { violations: [...violations] },
    );
    this.name = "AiPromptInvalidManifestError";
  }
}

export class AiPromptConflictingVersionError extends AiPromptError {
  constructor(readonly promptId: string, readonly version: string) {
    super(
      "AI_PROMPT_CONFLICTING_VERSION",
      `AI prompt "${promptId}" version "${version}" conflicts with an immutable registration`,
      { promptId, version },
    );
    this.name = "AiPromptConflictingVersionError";
  }
}

export class AiPromptNotFoundError extends AiPromptError {
  constructor(readonly promptId: string) {
    super("AI_PROMPT_NOT_FOUND", `AI prompt "${promptId}" is not registered`, {
      promptId,
    });
    this.name = "AiPromptNotFoundError";
  }
}

export class AiPromptVersionNotFoundError extends AiPromptError {
  constructor(readonly promptId: string, readonly version: string) {
    super(
      "AI_PROMPT_VERSION_NOT_FOUND",
      `AI prompt "${promptId}" version "${version}" is not registered`,
      { promptId, version },
    );
    this.name = "AiPromptVersionNotFoundError";
  }
}

export class AiPromptNoActiveVersionError extends AiPromptError {
  constructor(readonly promptId: string) {
    super(
      "AI_PROMPT_NO_ACTIVE_VERSION",
      `AI prompt "${promptId}" has no active version`,
      { promptId },
    );
    this.name = "AiPromptNoActiveVersionError";
  }
}

export class AiPromptDeprecatedVersionError extends AiPromptError {
  constructor(readonly promptId: string, readonly version: string) {
    super(
      "AI_PROMPT_DEPRECATED_VERSION",
      `AI prompt "${promptId}" version "${version}" is deprecated`,
      { promptId, version },
    );
    this.name = "AiPromptDeprecatedVersionError";
  }
}

export class AiPromptCoreOwnershipConflictError extends AiPromptError {
  constructor(readonly promptId: string) {
    super(
      "AI_PROMPT_CORE_OWNERSHIP_CONFLICT",
      `Plugin prompt cannot replace core prompt identity "${promptId}"`,
      { promptId },
    );
    this.name = "AiPromptCoreOwnershipConflictError";
  }
}

export class AiPromptMissingVariableError extends AiPromptError {
  constructor(readonly variableName: string) {
    super(
      "AI_PROMPT_MISSING_VARIABLE",
      `Required AI prompt variable "${variableName}" is missing`,
      { variableName },
    );
    this.name = "AiPromptMissingVariableError";
  }
}

export class AiPromptUnknownVariableError extends AiPromptError {
  constructor(readonly variableName: string) {
    super(
      "AI_PROMPT_UNKNOWN_VARIABLE",
      `Unknown AI prompt variable "${variableName}" was supplied`,
      { variableName },
    );
    this.name = "AiPromptUnknownVariableError";
  }
}

export class AiPromptInvalidVariableTypeError extends AiPromptError {
  constructor(readonly variableName: string, readonly expectedType: string) {
    super(
      "AI_PROMPT_INVALID_VARIABLE_TYPE",
      `AI prompt variable "${variableName}" must be of type "${expectedType}"`,
      { variableName, expectedType },
    );
    this.name = "AiPromptInvalidVariableTypeError";
  }
}

export class AiPromptUnresolvedVariableError extends AiPromptError {
  constructor(readonly variableName: string) {
    super(
      "AI_PROMPT_UNRESOLVED_VARIABLE",
      `AI prompt variable "${variableName}" remains unresolved`,
      { variableName },
    );
    this.name = "AiPromptUnresolvedVariableError";
  }
}
