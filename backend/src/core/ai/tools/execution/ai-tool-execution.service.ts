import { Injectable } from "@nestjs/common";

import { AiToolNotFoundError } from "../errors/ai-tool.error";
import { AiToolRegistry } from "../registry/ai-tool.registry";
import {
  AiToolExecutionFailure,
  AiToolExecutionResult,
  AiToolInvocation,
} from "../types/ai-tool.types";

const DEFAULT_TOOL_TIMEOUT_MS = 30_000;

class AiToolExecutionTimeoutSignal extends Error {
  constructor(readonly timeoutMs: number) {
    super(`AI tool execution exceeded ${timeoutMs}ms`);
    this.name = "AiToolExecutionTimeoutSignal";

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

@Injectable()
export class AiToolExecutionService {
  constructor(private readonly registry: AiToolRegistry) {}

  async execute(invocation: AiToolInvocation): Promise<AiToolExecutionResult> {
    const startedAt = Date.now();

    const validationFailure = this.validateInvocation(invocation, startedAt);

    if (validationFailure) {
      return validationFailure;
    }

    let tool;

    try {
      tool = this.registry.get(invocation.toolId);
    } catch (error) {
      if (error instanceof AiToolNotFoundError) {
        return this.failure(
          "AI_TOOL_NOT_FOUND",
          error.message,
          startedAt,
          false,
        );
      }

      return this.failure(
        "AI_TOOL_RESOLUTION_FAILED",
        "AI tool could not be resolved",
        startedAt,
        false,
      );
    }

    const grantedPermissions = new Set(invocation.context.permissions);

    const missingPermissions = tool.manifest.requiredPermissions
      .filter((permission) => !grantedPermissions.has(permission))
      .sort((left, right) => left.localeCompare(right));

    if (missingPermissions.length > 0) {
      return this.failure(
        "AI_TOOL_PERMISSION_DENIED",
        `Missing required AI tool permissions: ${missingPermissions.join(", ")}`,
        startedAt,
        false,
      );
    }

    const timeoutMs =
      tool.manifest.timeoutMs === undefined
        ? DEFAULT_TOOL_TIMEOUT_MS
        : tool.manifest.timeoutMs;

    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    try {
      const output = await Promise.race([
        tool.execute(invocation.input, invocation.context),
        new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(new AiToolExecutionTimeoutSignal(timeoutMs));
          }, timeoutMs);
        }),
      ]);

      return {
        success: true,
        output,
        durationMs: this.duration(startedAt),
      };
    } catch (error) {
      if (error instanceof AiToolExecutionTimeoutSignal) {
        return this.failure(
          "AI_TOOL_EXECUTION_TIMEOUT",
          `AI tool "${invocation.toolId}" exceeded its ${timeoutMs}ms timeout`,
          startedAt,
          true,
        );
      }

      return this.failure(
        "AI_TOOL_EXECUTION_FAILED",
        error instanceof Error
          ? error.message
          : `AI tool "${invocation.toolId}" execution failed`,
        startedAt,
        false,
      );
    } finally {
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private validateInvocation(
    invocation: AiToolInvocation,
    startedAt: number,
  ): AiToolExecutionFailure | undefined {
    if (!invocation || typeof invocation !== "object") {
      return this.failure(
        "AI_TOOL_INVALID_INVOCATION",
        "AI tool invocation is required",
        startedAt,
        false,
      );
    }

    if (
      typeof invocation.toolId !== "string" ||
      invocation.toolId.trim().length === 0
    ) {
      return this.failure(
        "AI_TOOL_INVALID_INVOCATION",
        "AI tool invocation requires a non-empty toolId",
        startedAt,
        false,
      );
    }

    if (!invocation.context || typeof invocation.context !== "object") {
      return this.failure(
        "AI_TOOL_INVALID_INVOCATION",
        "AI tool execution context is required",
        startedAt,
        false,
      );
    }

    if (
      typeof invocation.context.actorId !== "string" ||
      invocation.context.actorId.trim().length === 0
    ) {
      return this.failure(
        "AI_TOOL_INVALID_INVOCATION",
        "AI tool execution context requires actorId",
        startedAt,
        false,
      );
    }

    if (
      typeof invocation.context.correlationId !== "string" ||
      invocation.context.correlationId.trim().length === 0
    ) {
      return this.failure(
        "AI_TOOL_INVALID_INVOCATION",
        "AI tool execution context requires correlationId",
        startedAt,
        false,
      );
    }

    if (
      !Array.isArray(invocation.context.permissions) ||
      invocation.context.permissions.some(
        (permission) =>
          typeof permission !== "string" || permission.trim().length === 0,
      )
    ) {
      return this.failure(
        "AI_TOOL_INVALID_INVOCATION",
        "AI tool execution context permissions must be non-empty strings",
        startedAt,
        false,
      );
    }

    return undefined;
  }

  private failure(
    errorCode: string,
    errorMessage: string,
    startedAt: number,
    retryable: boolean,
  ): AiToolExecutionFailure {
    return {
      success: false,
      errorCode,
      errorMessage,
      durationMs: this.duration(startedAt),
      retryable,
    };
  }

  private duration(startedAt: number): number {
    return Math.max(0, Date.now() - startedAt);
  }
}
