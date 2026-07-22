import { Injectable } from "@nestjs/common";

import { AiToolInvalidManifestError } from "../errors/ai-tool.error";
import { AiToolManifest } from "./ai-tool-manifest";

@Injectable()
export class AiToolManifestValidator {
  private static readonly TOOL_ID_PATTERN =
    /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;

  private static readonly VERSION_PATTERN =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

  private static readonly PERMISSION_PATTERN =
    /^[a-z][a-z0-9]*(?:[._:-][a-z0-9]+)*$/;

  validate(manifest: AiToolManifest): void {
    const violations: string[] = [];

    if (!manifest || typeof manifest !== "object") {
      throw new AiToolInvalidManifestError(["manifest must be an object"]);
    }

    this.validateRequiredString(manifest.id, "id", violations);

    if (
      typeof manifest.id === "string" &&
      manifest.id.trim().length > 0 &&
      !AiToolManifestValidator.TOOL_ID_PATTERN.test(manifest.id)
    ) {
      violations.push(
        "id must use lowercase letters, numbers, dots, underscores, or hyphens",
      );
    }

    this.validateRequiredString(manifest.name, "name", violations);

    this.validateRequiredString(
      manifest.description,
      "description",
      violations,
    );

    this.validateRequiredString(manifest.version, "version", violations);

    if (
      typeof manifest.version === "string" &&
      manifest.version.trim().length > 0 &&
      !AiToolManifestValidator.VERSION_PATTERN.test(manifest.version)
    ) {
      violations.push("version must be valid semantic versioning");
    }

    if (
      !manifest.inputSchema ||
      typeof manifest.inputSchema !== "object" ||
      Array.isArray(manifest.inputSchema)
    ) {
      violations.push("inputSchema must be an object");
    }

    if (
      manifest.outputSchema !== undefined &&
      (!manifest.outputSchema ||
        typeof manifest.outputSchema !== "object" ||
        Array.isArray(manifest.outputSchema))
    ) {
      violations.push("outputSchema must be an object when provided");
    }

    if (!Array.isArray(manifest.requiredPermissions)) {
      violations.push("requiredPermissions must be an array");
    } else {
      const seenPermissions = new Set<string>();

      manifest.requiredPermissions.forEach((permission, index) => {
        if (typeof permission !== "string" || permission.trim().length === 0) {
          violations.push(
            `requiredPermissions[${index}] must be a non-empty string`,
          );
          return;
        }

        if (!AiToolManifestValidator.PERMISSION_PATTERN.test(permission)) {
          violations.push(
            `requiredPermissions[${index}] has an invalid format`,
          );
        }

        if (seenPermissions.has(permission)) {
          violations.push(
            `requiredPermissions contains duplicate "${permission}"`,
          );
        }

        seenPermissions.add(permission);
      });
    }

    if (
      manifest.sideEffect !== "none" &&
      manifest.sideEffect !== "read" &&
      manifest.sideEffect !== "write"
    ) {
      violations.push("sideEffect must be one of: none, read, write");
    }

    if (
      manifest.timeoutMs !== undefined &&
      (!Number.isInteger(manifest.timeoutMs) || manifest.timeoutMs <= 0)
    ) {
      violations.push("timeoutMs must be a positive integer when provided");
    }

    if (manifest.tags !== undefined) {
      if (!Array.isArray(manifest.tags)) {
        violations.push("tags must be an array when provided");
      } else {
        const seenTags = new Set<string>();

        manifest.tags.forEach((tag, index) => {
          if (typeof tag !== "string" || tag.trim().length === 0) {
            violations.push(`tags[${index}] must be a non-empty string`);
            return;
          }

          if (seenTags.has(tag)) {
            violations.push(`tags contains duplicate "${tag}"`);
          }

          seenTags.add(tag);
        });
      }
    }

    if (violations.length > 0) {
      throw new AiToolInvalidManifestError(violations);
    }
  }

  private validateRequiredString(
    value: unknown,
    field: string,
    violations: string[],
  ): void {
    if (typeof value !== "string" || value.trim().length === 0) {
      violations.push(`${field} must be a non-empty string`);
    }
  }
}
