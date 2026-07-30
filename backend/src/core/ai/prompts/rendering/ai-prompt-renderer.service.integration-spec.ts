import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  AiPromptInvalidVariableTypeError,
  AiPromptMissingVariableError,
  AiPromptUnknownVariableError,
} from "../errors/ai-prompt.error";
import { AiPromptManifestValidator } from "../manifest/ai-prompt-manifest.validator";
import { AiPromptRegistry } from "../registry/ai-prompt.registry";
import { AiPromptRendererService } from "./ai-prompt-renderer.service";

describe("AiPromptRendererService", () => {
  let registry: AiPromptRegistry;
  let renderer: AiPromptRendererService;
  beforeEach(() => {
    registry = new AiPromptRegistry(new AiPromptManifestValidator());
    renderer = new AiPromptRendererService(registry);
    registry.register({
      id: "test.render", version: "1.0.0", name: "Render", description: "Render", scope: "core", status: "active",
      messages: [
        { role: "system", template: "System {{enabled}}" },
        { role: "user", template: "{{name}} {{count}} {{tags}} {{payload}} {{optional}}" },
      ],
      variables: [
        { name: "enabled", required: true, type: "boolean" },
        { name: "name", required: true, type: "string" },
        { name: "count", required: true, type: "number" },
        { name: "tags", required: true, type: "string[]" },
        { name: "payload", required: true, type: "json" },
        { name: "optional", required: false, type: "string", defaultValue: "default" },
      ], metadata: { source: "test" },
    });
  });
  const variables = { enabled: true, name: "Anand", count: 2, tags: ["a", "b"], payload: { ok: true } };
  it("renders all supported variable types deterministically", () => expect(renderer.render("test.render", variables).messages).toEqual([
    { role: "system", content: "System true" },
    { role: "user", content: 'Anand 2 ["a","b"] {"ok":true} default' },
  ]));
  it("returns resolved identity and version", () => expect(renderer.render("test.render", variables)).toEqual(expect.objectContaining({ promptId: "test.render", version: "1.0.0" })));
  it("preserves message order and roles", () => expect(renderer.render("test.render", variables).messages.map((item) => item.role)).toEqual(["system", "user"]));
  it("applies an explicit optional value", () => expect(renderer.render("test.render", { ...variables, optional: "custom" }).messages[1].content).toContain("custom"));
  it("rejects missing required variables", () => { const { name, ...rest } = variables; expect(() => renderer.render("test.render", rest)).toThrow(AiPromptMissingVariableError); });
  it("rejects unknown supplied variables", () => expect(() => renderer.render("test.render", { ...variables, extra: true })).toThrow(AiPromptUnknownVariableError));
  it("rejects invalid string types", () => expect(() => renderer.render("test.render", { ...variables, name: 1 })).toThrow(AiPromptInvalidVariableTypeError));
  it("rejects invalid number types", () => expect(() => renderer.render("test.render", { ...variables, count: "2" })).toThrow(AiPromptInvalidVariableTypeError));
  it("rejects invalid boolean types", () => expect(() => renderer.render("test.render", { ...variables, enabled: "true" })).toThrow(AiPromptInvalidVariableTypeError));
  it("rejects invalid string arrays", () => expect(() => renderer.render("test.render", { ...variables, tags: ["a", 2] })).toThrow(AiPromptInvalidVariableTypeError));
  it("rejects non-JSON values", () =>
    expect(() =>
      renderer.render("test.render", {
        ...variables,
        payload: (() => "not-json") as unknown,
      }),
    ).toThrow(AiPromptInvalidVariableTypeError));
  it("does not dispatch providers", () => expect(Object.keys(renderer)).toEqual(["registry"]));
});
