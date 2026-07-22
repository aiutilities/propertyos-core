import { beforeEach, describe, expect, it } from "@jest/globals";

import { AiToolPort } from "../contracts/ai-tool.contract";
import {
  AiToolDuplicateRegistrationError,
  AiToolNotFoundError,
} from "../errors/ai-tool.error";
import { AiToolManifestValidator } from "../manifest/ai-tool-manifest.validator";
import { AiJsonValue, AiToolExecutionContext } from "../types/ai-tool.types";
import { AiToolRegistry } from "./ai-tool.registry";

class TestTool implements AiToolPort {
  constructor(
    readonly manifest: AiToolPort["manifest"],
    private readonly response: AiJsonValue,
  ) {}

  async execute(
    _input: AiJsonValue,
    _context: AiToolExecutionContext,
  ): Promise<AiJsonValue> {
    return this.response;
  }
}

describe("AiToolRegistry", () => {
  let registry: AiToolRegistry;

  const createTool = (
    id: string,
    response: AiJsonValue = {
      id,
    },
  ): AiToolPort =>
    new TestTool(
      {
        id,
        name: `Tool ${id}`,
        description: `Test tool ${id}`,
        version: "1.0.0",
        inputSchema: {
          type: "object",
        },
        requiredPermissions: [],
        sideEffect: "none",
      },
      response,
    );

  beforeEach(() => {
    registry = new AiToolRegistry(new AiToolManifestValidator());
  });

  it("registers and resolves a tool", () => {
    const tool = createTool("test.alpha");

    registry.register(tool);

    expect(registry.has("test.alpha")).toBe(true);
    expect(registry.get("test.alpha")).toBe(tool);
    expect(registry.size).toBe(1);
  });

  it("rejects duplicate tool identifiers", () => {
    registry.register(createTool("test.alpha"));

    expect(() => registry.register(createTool("test.alpha"))).toThrow(
      AiToolDuplicateRegistrationError,
    );
  });

  it("returns tools in deterministic identifier order", () => {
    registry.register(createTool("test.zulu"));
    registry.register(createTool("test.alpha"));
    registry.register(createTool("test.middle"));

    expect(registry.list().map((tool) => tool.manifest.id)).toEqual([
      "test.alpha",
      "test.middle",
      "test.zulu",
    ]);
  });

  it("throws a typed error for an unknown tool", () => {
    expect(() => registry.get("test.missing")).toThrow(AiToolNotFoundError);

    expect(() => registry.get("test.missing")).toThrow(
      expect.objectContaining({
        code: "AI_TOOL_NOT_FOUND",
        toolId: "test.missing",
      }),
    );
  });

  it("supports unregistering and clearing tools", () => {
    registry.register(createTool("test.alpha"));
    registry.register(createTool("test.beta"));

    expect(registry.unregister("test.alpha")).toBe(true);
    expect(registry.unregister("test.alpha")).toBe(false);
    expect(registry.has("test.alpha")).toBe(false);
    expect(registry.size).toBe(1);

    registry.clear();

    expect(registry.size).toBe(0);
    expect(registry.list()).toEqual([]);
  });

  it("validates manifests before registration", () => {
    const invalidTool = createTool("INVALID TOOL");

    expect(() => registry.register(invalidTool)).toThrow(
      expect.objectContaining({
        code: "AI_TOOL_INVALID_MANIFEST",
      }),
    );

    expect(registry.size).toBe(0);
  });
});
