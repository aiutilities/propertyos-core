import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  AiPromptConflictingVersionError,
  AiPromptCoreOwnershipConflictError,
  AiPromptDeprecatedVersionError,
  AiPromptNoActiveVersionError,
  AiPromptNotFoundError,
  AiPromptVersionNotFoundError,
} from "../errors/ai-prompt.error";
import { AiPromptManifestValidator } from "../manifest/ai-prompt-manifest.validator";
import { AiPromptManifest } from "../types/ai-prompt.types";
import { AiPromptRegistry } from "./ai-prompt.registry";

const manifest = (id = "test.prompt", version = "1.0.0", overrides: Partial<AiPromptManifest> = {}): AiPromptManifest => ({
  id, version, name: id, description: id, scope: "core", status: "active",
  messages: [{ role: "user", template: "Hello {{name}}" }],
  variables: [{ name: "name", required: true, type: "string" }], ...overrides,
});

describe("AiPromptRegistry", () => {
  let registry: AiPromptRegistry;
  beforeEach(() => registry = new AiPromptRegistry(new AiPromptManifestValidator()));
  it("registers and gets an exact version", () => { registry.register(manifest()); expect(registry.get("test.prompt", "1.0.0")).toEqual(manifest()); });
  it("supports identical idempotent registration", () => { registry.register(manifest()); registry.register(manifest()); expect(registry.size).toBe(1); });
  it("rejects conflicting immutable registration", () => { registry.register(manifest()); expect(() => registry.register(manifest("test.prompt", "1.0.0", { name: "Changed" }))).toThrow(AiPromptConflictingVersionError); });
  it("resolves the highest semantic version", () => { registry.register(manifest("test.prompt", "1.9.0")); registry.register(manifest("test.prompt", "1.10.0")); expect(registry.resolve("test.prompt").version).toBe("1.10.0"); });
  it("resolves an exact active version", () => { registry.register(manifest()); expect(registry.resolve("test.prompt", "1.0.0").version).toBe("1.0.0"); });
  it("lists deterministically", () => { registry.register(manifest("z.prompt")); registry.register(manifest("a.prompt", "2.0.0")); registry.register(manifest("a.prompt", "1.0.0")); expect(registry.list().map((item) => `${item.id}@${item.version}`)).toEqual(["a.prompt@1.0.0", "a.prompt@2.0.0", "z.prompt@1.0.0"]); });
  it("filters list results", () => { registry.register(manifest("a.prompt")); registry.register(manifest("b.prompt", "1.0.0", { scope: "plugin", pluginId: "b" })); expect(registry.list({ scope: "plugin" }).map((item) => item.id)).toEqual(["b.prompt"]); });
  it("deprecates only the selected version", () => { registry.register(manifest()); registry.register(manifest("test.prompt", "2.0.0")); registry.deprecate("test.prompt", "1.0.0"); expect(registry.get("test.prompt", "1.0.0").status).toBe("deprecated"); expect(registry.resolve("test.prompt").version).toBe("2.0.0"); });
  it("preserves deprecated versions for get", () => { registry.register(manifest()); registry.deprecate("test.prompt", "1.0.0"); expect(registry.get("test.prompt", "1.0.0").status).toBe("deprecated"); });
  it("rejects explicit deprecated resolution", () => { registry.register(manifest()); registry.deprecate("test.prompt", "1.0.0"); expect(() => registry.resolve("test.prompt", "1.0.0")).toThrow(AiPromptDeprecatedVersionError); });
  it("rejects default resolution without active versions", () => { registry.register(manifest()); registry.deprecate("test.prompt", "1.0.0"); expect(() => registry.resolve("test.prompt")).toThrow(AiPromptNoActiveVersionError); });
  it("rejects unknown prompt identities", () => expect(() => registry.get("missing.prompt", "1.0.0")).toThrow(AiPromptNotFoundError));
  it("rejects unknown versions", () => { registry.register(manifest()); expect(() => registry.get("test.prompt", "9.0.0")).toThrow(AiPromptVersionNotFoundError); });
  it("prevents plugin replacement of a core identity", () => { registry.register(manifest()); expect(() => registry.register(manifest("test.prompt", "2.0.0", { scope: "plugin", pluginId: "plugin" }))).toThrow(AiPromptCoreOwnershipConflictError); });
  it("returns defensive copies", () => { registry.register(manifest()); const result = registry.get("test.prompt", "1.0.0") as any; result.name = "mutated"; expect(registry.get("test.prompt", "1.0.0").name).toBe("test.prompt"); });
  it("supports has and clear", () => { registry.register(manifest()); expect(registry.has("test.prompt", "1.0.0")).toBe(true); registry.clear(); expect(registry.size).toBe(0); });
});
