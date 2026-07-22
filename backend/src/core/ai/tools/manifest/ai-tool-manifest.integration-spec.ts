import { beforeEach, describe, expect, it } from "@jest/globals";

import { AiToolInvalidManifestError } from "../errors/ai-tool.error";
import { AiToolManifest } from "./ai-tool-manifest";
import { AiToolManifestValidator } from "./ai-tool-manifest.validator";

describe("AiToolManifestValidator", () => {
  let validator: AiToolManifestValidator;

  const validManifest = (): AiToolManifest => ({
    id: "property.read-summary",
    name: "Read property summary",
    description: "Returns a summary for one property",
    version: "1.0.0",
    inputSchema: {
      type: "object",
      properties: {
        propertyId: {
          type: "string",
        },
      },
      required: ["propertyId"],
      additionalProperties: false,
    },
    outputSchema: {
      type: "object",
    },
    requiredPermissions: ["property.read"],
    sideEffect: "read",
    timeoutMs: 5000,
    tags: ["property", "summary"],
  });

  beforeEach(() => {
    validator = new AiToolManifestValidator();
  });

  it("accepts a valid manifest", () => {
    expect(() => validator.validate(validManifest())).not.toThrow();
  });

  it("rejects an invalid identifier deterministically", () => {
    const manifest: AiToolManifest = {
      ...validManifest(),
      id: "Property Read Summary",
    };

    expect(() => validator.validate(manifest)).toThrow(
      AiToolInvalidManifestError,
    );

    try {
      validator.validate(manifest);
      throw new Error("Expected manifest validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(AiToolInvalidManifestError);

      expect((error as AiToolInvalidManifestError).violations).toEqual([
        "id must use lowercase letters, numbers, dots, underscores, or hyphens",
      ]);
    }
  });

  it("rejects duplicate permissions", () => {
    const manifest: AiToolManifest = {
      ...validManifest(),
      requiredPermissions: ["property.read", "property.read"],
    };

    expect(() => validator.validate(manifest)).toThrow(
      expect.objectContaining({
        code: "AI_TOOL_INVALID_MANIFEST",
        violations: ['requiredPermissions contains duplicate "property.read"'],
      }),
    );
  });

  it("reports multiple violations in stable field order", () => {
    const manifest = {
      ...validManifest(),
      id: "",
      name: "",
      version: "version-one",
      inputSchema: null,
      requiredPermissions: ["INVALID PERMISSION"],
      sideEffect: "external",
      timeoutMs: 0,
    } as unknown as AiToolManifest;

    try {
      validator.validate(manifest);
      throw new Error("Expected manifest validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(AiToolInvalidManifestError);

      expect((error as AiToolInvalidManifestError).violations).toEqual([
        "id must be a non-empty string",
        "name must be a non-empty string",
        "version must be valid semantic versioning",
        "inputSchema must be an object",
        "requiredPermissions[0] has an invalid format",
        "sideEffect must be one of: none, read, write",
        "timeoutMs must be a positive integer when provided",
      ]);
    }
  });
});
