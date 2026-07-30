import { Injectable } from "@nestjs/common";

import {
  AiPromptInvalidVariableTypeError,
  AiPromptMissingVariableError,
  AiPromptUnknownVariableError,
  AiPromptUnresolvedVariableError,
} from "../errors/ai-prompt.error";
import { AiPromptRegistry } from "../registry/ai-prompt.registry";
import {
  AiPromptVariableDefinition,
  AiRenderedPrompt,
} from "../types/ai-prompt.types";

@Injectable()
export class AiPromptRendererService {
  private static readonly PLACEHOLDER_PATTERN = /{{\s*([A-Za-z][A-Za-z0-9_]*)\s*}}/g;

  constructor(private readonly registry: AiPromptRegistry) {}

  render(
    promptId: string,
    variables: Readonly<Record<string, unknown>>,
    version?: string,
  ): AiRenderedPrompt {
    const manifest = this.registry.resolve(promptId, version);
    const definitions = new Map(manifest.variables.map((item) => [item.name, item]));

    for (const suppliedName of Object.keys(variables)) {
      if (!definitions.has(suppliedName)) {
        throw new AiPromptUnknownVariableError(suppliedName);
      }
    }

    const resolved: Record<string, unknown> = {};
    for (const definition of manifest.variables) {
      const supplied = Object.prototype.hasOwnProperty.call(variables, definition.name);
      const value = supplied ? variables[definition.name] : definition.defaultValue;
      if (value === undefined) {
        if (definition.required) throw new AiPromptMissingVariableError(definition.name);
        continue;
      }
      if (!this.matchesType(value, definition)) {
        throw new AiPromptInvalidVariableTypeError(definition.name, definition.type);
      }
      resolved[definition.name] = value;
    }

    const messages = manifest.messages.map((message) => ({
      role: message.role,
      content: this.renderTemplate(message.template, resolved),
    }));

    return {
      promptId: manifest.id,
      version: manifest.version,
      messages,
      ...(manifest.metadata ? { metadata: JSON.parse(JSON.stringify(manifest.metadata)) } : {}),
    };
  }

  private renderTemplate(template: string, values: Record<string, unknown>): string {
    AiPromptRendererService.PLACEHOLDER_PATTERN.lastIndex = 0;
    const content = template.replace(
      AiPromptRendererService.PLACEHOLDER_PATTERN,
      (_match, variableName: string) => {
        if (!Object.prototype.hasOwnProperty.call(values, variableName)) {
          throw new AiPromptUnresolvedVariableError(variableName);
        }
        return this.serialize(values[variableName]);
      },
    );
    AiPromptRendererService.PLACEHOLDER_PATTERN.lastIndex = 0;
    const unresolved = AiPromptRendererService.PLACEHOLDER_PATTERN.exec(content);
    if (unresolved) throw new AiPromptUnresolvedVariableError(unresolved[1]);
    return content;
  }

  private serialize(value: unknown): string {
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return JSON.stringify(value);
  }

  private matchesType(value: unknown, definition: AiPromptVariableDefinition): boolean {
    if (definition.type === "string") return typeof value === "string";
    if (definition.type === "number") return typeof value === "number" && Number.isFinite(value);
    if (definition.type === "boolean") return typeof value === "boolean";
    if (definition.type === "string[]") return Array.isArray(value) && value.every((item) => typeof item === "string");
    if (definition.type === "json") return this.isJsonValue(value);
    return false;
  }

  private isJsonValue(value: unknown): boolean {
    if (value === null || ["string", "boolean"].includes(typeof value)) return true;
    if (typeof value === "number") return Number.isFinite(value);
    if (Array.isArray(value)) return value.every((item) => this.isJsonValue(item));
    if (typeof value === "object") return Object.values(value as Record<string, unknown>).every((item) => this.isJsonValue(item));
    return false;
  }
}
