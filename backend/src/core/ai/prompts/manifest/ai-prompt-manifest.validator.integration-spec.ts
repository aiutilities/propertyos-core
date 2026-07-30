import { describe, expect, it } from "@jest/globals";
import { AiPromptInvalidManifestError } from "../errors/ai-prompt.error";
import { AiPromptManifest } from "../types/ai-prompt.types";
import { AiPromptManifestValidator } from "./ai-prompt-manifest.validator";

const valid = (overrides: Partial<AiPromptManifest> = {}): AiPromptManifest => ({
  id: "helpdesk.ticket.triage",
  version: "1.0.0",
  name: "Triage",
  description: "Triage a ticket",
  scope: "core",
  status: "active",
  messages: [{ role: "user", template: "Ticket {{ticket}}" }],
  variables: [{ name: "ticket", required: true, type: "string" }],
  ...overrides,
});

describe("AiPromptManifestValidator", () => {
  const validator = new AiPromptManifestValidator();
  it("accepts a core manifest", () => expect(() => validator.validate(valid())).not.toThrow());
  it("accepts a plugin manifest", () => expect(() => validator.validate(valid({ scope: "plugin", pluginId: "helpdesk" }))).not.toThrow());
  it.each([
    ["invalid id", { id: "Invalid Prompt" }],
    ["invalid version", { version: "v1" }],
    ["empty messages", { messages: [] }],
    ["unsupported status", { status: "draft" as any }],
    ["unsupported scope", { scope: "tenant" as any }],
    ["missing plugin id", { scope: "plugin", pluginId: undefined }],
    ["plugin id on core", { scope: "core", pluginId: "helpdesk" }],
  ])("rejects %s", (_name, overrides) => {
    expect(() => validator.validate(valid(overrides as Partial<AiPromptManifest>))).toThrow(AiPromptInvalidManifestError);
  });
  it("rejects duplicate variables", () => expect(() => validator.validate(valid({ variables: [
    { name: "ticket", required: true, type: "string" },
    { name: "ticket", required: false, type: "string" },
  ] }))).toThrow(AiPromptInvalidManifestError));
  it("rejects undeclared placeholders", () => expect(() => validator.validate(valid({ messages: [{ role: "user", template: "{{missing}}" }] }))).toThrow(AiPromptInvalidManifestError));
  it("rejects unsupported roles", () => expect(() => validator.validate(valid({ messages: [{ role: "tool" as any, template: "x" }] }))).toThrow(AiPromptInvalidManifestError));
  it("rejects unsupported variable types", () => expect(() => validator.validate(valid({ variables: [{ name: "ticket", required: true, type: "date" as any }] }))).toThrow(AiPromptInvalidManifestError));
  it("rejects invalid default values", () => expect(() => validator.validate(valid({ variables: [{ name: "ticket", required: false, type: "number", defaultValue: "x" }] }))).toThrow(AiPromptInvalidManifestError));
  it("accepts JSON defaults", () => expect(() => validator.validate(valid({ variables: [{ name: "ticket", required: false, type: "json", defaultValue: { ok: true } }], messages: [{ role: "user", template: "{{ticket}}" }] }))).not.toThrow());
});
