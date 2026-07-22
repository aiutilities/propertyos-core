import { describe, expect, it, jest } from "@jest/globals";

import { AiToolPort } from "../contracts/ai-tool.contract";
import { AiToolManifestValidator } from "../manifest/ai-tool-manifest.validator";
import { AiToolRegistry } from "../registry/ai-tool.registry";
import {
  AiJsonValue,
  AiToolExecutionContext,
  AiToolInvocation,
} from "../types/ai-tool.types";
import { AiToolExecutionService } from "./ai-tool-execution.service";

function createContext(
  permissions: readonly string[] = ["property.read"],
): AiToolExecutionContext {
  return {
    actorId: "user-1",
    correlationId: "correlation-1",
    permissions,
    propertyId: "property-1",
    requestId: "request-1",
  };
}

function createTool(
  overrides: Partial<AiToolPort> = {},
  options: {
    readonly requiredPermissions?: readonly string[];
    readonly timeoutMs?: number;
    readonly execute?: (
      input: AiJsonValue,
      context: AiToolExecutionContext,
    ) => Promise<AiJsonValue>;
  } = {},
): AiToolPort {
  return {
    manifest: {
      id: "property.lookup",
      name: "Property lookup",
      description: "Looks up a PropertyOS property",
      version: "1.0.0",
      inputSchema: {
        type: "object",
      },
      outputSchema: {
        type: "object",
      },
      requiredPermissions: options.requiredPermissions ?? ["property.read"],
      sideEffect: "read",
      ...(options.timeoutMs === undefined
        ? {}
        : {
            timeoutMs: options.timeoutMs,
          }),
    },
    execute:
      options.execute ??
      (async (input) => ({
        received: input,
      })),
    ...overrides,
  };
}

function createRuntime(): {
  readonly registry: AiToolRegistry;
  readonly service: AiToolExecutionService;
} {
  const registry = new AiToolRegistry(new AiToolManifestValidator());

  return {
    registry,
    service: new AiToolExecutionService(registry),
  };
}

function invocation(
  overrides: Partial<AiToolInvocation> = {},
): AiToolInvocation {
  return {
    toolId: "property.lookup",
    input: {
      propertyId: "property-1",
    },
    context: createContext(),
    ...overrides,
  };
}

describe("AiToolExecutionService", () => {
  it("executes a registered authorized tool", async () => {
    const { registry, service } = createRuntime();

    const execute = jest.fn(
      async (
        input: AiJsonValue,
        context: AiToolExecutionContext,
      ): Promise<AiJsonValue> => ({
        input,
        actorId: context.actorId,
      }),
    );

    registry.register(
      createTool(undefined, {
        execute,
      }),
    );

    const result = await service.execute(invocation());

    expect(result.success).toBe(true);
    expect(execute).toHaveBeenCalledTimes(1);

    if (result.success) {
      expect(result.output).toEqual({
        input: {
          propertyId: "property-1",
        },
        actorId: "user-1",
      });

      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns a typed failure for an unknown tool", async () => {
    const { service } = createRuntime();

    const result = await service.execute(
      invocation({
        toolId: "property.missing",
      }),
    );

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errorCode: "AI_TOOL_NOT_FOUND",
        retryable: false,
      }),
    );
  });

  it("denies execution when permissions are missing", async () => {
    const { registry, service } = createRuntime();

    const execute = jest.fn(async (): Promise<AiJsonValue> => ({
      ok: true,
    }));

    registry.register(
      createTool(undefined, {
        requiredPermissions: ["property.read", "tenant.read"],
        execute,
      }),
    );

    const result = await service.execute(
      invocation({
        context: createContext([]),
      }),
    );

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errorCode: "AI_TOOL_PERMISSION_DENIED",
        errorMessage:
          "Missing required AI tool permissions: property.read, tenant.read",
        retryable: false,
      }),
    );

    expect(execute).not.toHaveBeenCalled();
  });

  it("executes when every required permission is present", async () => {
    const { registry, service } = createRuntime();

    registry.register(
      createTool(undefined, {
        requiredPermissions: ["property.read", "tenant.read"],
      }),
    );

    const result = await service.execute(
      invocation({
        context: createContext([
          "tenant.read",
          "property.read",
          "unrelated.permission",
        ]),
      }),
    );

    expect(result.success).toBe(true);
  });

  it("maps tool exceptions to deterministic failures", async () => {
    const { registry, service } = createRuntime();

    registry.register(
      createTool(undefined, {
        execute: async () => {
          throw new Error("lookup dependency unavailable");
        },
      }),
    );

    const result = await service.execute(invocation());

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errorCode: "AI_TOOL_EXECUTION_FAILED",
        errorMessage: "lookup dependency unavailable",
        retryable: false,
      }),
    );
  });

  it("enforces the manifest execution timeout", async () => {
    const { registry, service } = createRuntime();

    registry.register(
      createTool(undefined, {
        timeoutMs: 10,
        execute: async () =>
          new Promise<AiJsonValue>((resolve) => {
            setTimeout(() => {
              resolve({
                completed: true,
              });
            }, 100);
          }),
      }),
    );

    const result = await service.execute(invocation());

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errorCode: "AI_TOOL_EXECUTION_TIMEOUT",
        retryable: true,
      }),
    );
  });

  it("rejects structurally invalid invocations before resolution", async () => {
    const { service } = createRuntime();

    const result = await service.execute({
      toolId: "",
      input: null,
      context: createContext(),
    });

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errorCode: "AI_TOOL_INVALID_INVOCATION",
        errorMessage: "AI tool invocation requires a non-empty toolId",
        retryable: false,
      }),
    );
  });

  it("rejects invalid permission entries", async () => {
    const { service } = createRuntime();

    const result = await service.execute(
      invocation({
        context: {
          ...createContext(),
          permissions: ["property.read", ""],
        },
      }),
    );

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errorCode: "AI_TOOL_INVALID_INVOCATION",
        retryable: false,
      }),
    );
  });
});
