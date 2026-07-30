import { Injectable } from "@nestjs/common";
import semver from "semver";

import { AiPromptInvalidManifestError } from "../errors/ai-prompt.error";
import {
  AiPromptManifest,
  AiPromptVariableDefinition,
} from "../types/ai-prompt.types";

@Injectable()
export class AiPromptManifestValidator {
  private static readonly PROMPT_ID_PATTERN =
    /^[a-z][a-z0-9]*(?:\.[a-z0-9]+)*$/;
  private static readonly PLUGIN_ID_PATTERN =
    /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;
  private static readonly VARIABLE_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;
  private static readonly PLACEHOLDER_PATTERN = /{{\s*([A-Za-z][A-Za-z0-9_]*)\s*}}/g;
  private static readonly ALLOWED_VARIABLE_TYPES = new Set([
    "string",
    "number",
    "boolean",
    "string[]",
    "json",
  ]);

  validate(manifest: AiPromptManifest): void {
    const violations: string[] = [];

    if (!manifest || typeof manifest !== "object") {
      throw new AiPromptInvalidManifestError(["manifest must be an object"]);
    }

    this.requiredString(manifest.id, "id", violations);
    if (
      typeof manifest.id === "string" &&
      !AiPromptManifestValidator.PROMPT_ID_PATTERN.test(manifest.id)
    ) {
      violations.push("id must be lowercase and dot-separated");
    }

    this.requiredString(manifest.version, "version", violations);
    if (typeof manifest.version === "string" && !semver.valid(manifest.version)) {
      violations.push("version must be valid semantic versioning");
    }

    this.requiredString(manifest.name, "name", violations);
    this.requiredString(manifest.description, "description", violations);

    if (manifest.scope !== "core" && manifest.scope !== "plugin") {
      violations.push("scope must be one of: core, plugin");
    }

    if (manifest.scope === "plugin") {
      this.requiredString(manifest.pluginId, "pluginId", violations);
      if (
        typeof manifest.pluginId === "string" &&
        !AiPromptManifestValidator.PLUGIN_ID_PATTERN.test(manifest.pluginId)
      ) {
        violations.push("pluginId has an invalid format");
      }
    } else if (manifest.pluginId !== undefined) {
      violations.push("pluginId is only valid for plugin prompts");
    }

    if (manifest.status !== "active" && manifest.status !== "deprecated") {
      violations.push("status must be one of: active, deprecated");
    }

    if (!Array.isArray(manifest.messages) || manifest.messages.length === 0) {
      violations.push("messages must be a non-empty array");
    } else {
      manifest.messages.forEach((message, index) => {
        if (!message || typeof message !== "object") {
          violations.push(`messages[${index}] must be an object`);
          return;
        }
        if (!['system', 'user', 'assistant'].includes(message.role)) {
          violations.push(`messages[${index}].role is unsupported`);
        }
        this.requiredString(message.template, `messages[${index}].template`, violations);
      });
    }

    if (!Array.isArray(manifest.variables)) {
      violations.push("variables must be an array");
    } else {
      const names = new Set<string>();
      manifest.variables.forEach((variable, index) => {
        this.validateVariable(variable, index, violations);
        if (names.has(variable?.name)) {
          violations.push(`variables contains duplicate "${variable.name}"`);
        }
        if (variable?.name) names.add(variable.name);
      });

      const placeholders = this.collectPlaceholders(manifest);
      placeholders.forEach((placeholder) => {
        if (!names.has(placeholder)) {
          violations.push(`template contains undeclared variable "${placeholder}"`);
        }
      });
    }

    if (
      manifest.metadata !== undefined &&
      (!manifest.metadata || typeof manifest.metadata !== "object" || Array.isArray(manifest.metadata))
    ) {
      violations.push("metadata must be an object when provided");
    }

    if (violations.length > 0) {
      throw new AiPromptInvalidManifestError(violations);
    }
  }

  private validateVariable(
    variable: AiPromptVariableDefinition,
    index: number,
    violations: string[],
  ): void {
    if (!variable || typeof variable !== "object") {
      violations.push(`variables[${index}] must be an object`);
      return;
    }
    this.requiredString(variable.name, `variables[${index}].name`, violations);
    if (
      typeof variable.name === "string" &&
      !AiPromptManifestValidator.VARIABLE_NAME_PATTERN.test(variable.name)
    ) {
      violations.push(`variables[${index}].name has an invalid format`);
    }
    if (typeof variable.required !== "boolean") {
      violations.push(`variables[${index}].required must be boolean`);
    }
    if (!AiPromptManifestValidator.ALLOWED_VARIABLE_TYPES.has(variable.type)) {
      violations.push(`variables[${index}].type is unsupported`);
    }
    if (variable.description !== undefined && typeof variable.description !== "string") {
      violations.push(`variables[${index}].description must be a string`);
    }
    if (variable.defaultValue !== undefined && !this.matchesType(variable.defaultValue, variable.type)) {
      violations.push(`variables[${index}].defaultValue does not match type`);
    }
  }

  private collectPlaceholders(manifest: AiPromptManifest): Set<string> {
    const placeholders = new Set<string>();
    for (const message of manifest.messages ?? []) {
      AiPromptManifestValidator.PLACEHOLDER_PATTERN.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = AiPromptManifestValidator.PLACEHOLDER_PATTERN.exec(message.template)) !== null) {
        placeholders.add(match[1]);
      }
    }
    return placeholders;
  }

  private matchesType(value: unknown, type: string): boolean {
    if (type === "string") return typeof value === "string";
    if (type === "number") return typeof value === "number" && Number.isFinite(value);
    if (type === "boolean") return typeof value === "boolean";
    if (type === "string[]") return Array.isArray(value) && value.every((item) => typeof item === "string");
    if (type === "json") return this.isJsonValue(value);
    return false;
  }

  private isJsonValue(value: unknown): boolean {
    if (value === null || ["string", "boolean"].includes(typeof value)) return true;
    if (typeof value === "number") return Number.isFinite(value);
    if (Array.isArray(value)) return value.every((item) => this.isJsonValue(item));
    if (typeof value === "object") return Object.values(value as Record<string, unknown>).every((item) => this.isJsonValue(item));
    return false;
  }

  private requiredString(value: unknown, field: string, violations: string[]): void {
    if (typeof value !== "string" || value.trim().length === 0) {
      violations.push(`${field} must be a non-empty string`);
    }
  }
}
