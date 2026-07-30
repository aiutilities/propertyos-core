import { Injectable } from "@nestjs/common";
import {
  AiScheduleInvalidIdentifierError,
  AiScheduleInvalidManifestError,
  AiScheduleInvalidRecurrenceError,
  AiScheduleInvalidRetryPolicyError,
  AiScheduleInvalidTimeError,
  AiScheduleInvalidTimezoneError,
  AiScheduleUnsafePayloadError,
} from "../errors/ai-schedule.error";
import { AiScheduleManifest } from "../types/ai-schedule.types";

@Injectable()
export class AiScheduleManifestValidator {
  private readonly identifierPattern = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

  private readonly prohibitedPayloadFields = new Set([
    "apikey",
    "api_key",
    "password",
    "secret",
    "token",
    "accesstoken",
    "access_token",
    "shell",
    "command",
    "javascript",
    "script",
  ]);

  validate(manifest: AiScheduleManifest): AiScheduleManifest {
    if (!manifest || typeof manifest !== "object") {
      throw new AiScheduleInvalidManifestError(
        "AI schedule manifest must be an object",
      );
    }

    if (
      typeof manifest.id !== "string" ||
      !this.identifierPattern.test(manifest.id) ||
      manifest.id.length > 160
    ) {
      throw new AiScheduleInvalidIdentifierError(manifest.id);
    }

    this.requireText(manifest.name, "name");
    this.requireText(manifest.commandName, "commandName");
    this.requireText(manifest.createdBy, "createdBy");

    if (!["once", "interval"].includes(manifest.scheduleType)) {
      throw new AiScheduleInvalidManifestError(
        `Unsupported AI schedule type: "${manifest.scheduleType}"`,
      );
    }

    if (!["active", "paused", "cancelled", "completed"].includes(
      manifest.status,
    )) {
      throw new AiScheduleInvalidManifestError(
        `Unsupported AI schedule status: "${manifest.status}"`,
      );
    }

    this.validateTimestamp(manifest.createdAt);
    this.validateTimezone(manifest.timezone);
    this.validateSchedule(manifest);
    this.validateRetryPolicy(manifest);
    this.validatePayload(manifest.commandPayload);

    return this.clone(manifest);
  }

  private validateSchedule(manifest: AiScheduleManifest): void {
    if (manifest.scheduleType === "once") {
      if (!manifest.runAt) {
        throw new AiScheduleInvalidTimeError(String(manifest.runAt));
      }

      this.validateTimestamp(manifest.runAt);

      if (manifest.intervalSeconds !== undefined) {
        throw new AiScheduleInvalidRecurrenceError();
      }

      return;
    }

    if (
      !Number.isInteger(manifest.intervalSeconds) ||
      Number(manifest.intervalSeconds) < 60
    ) {
      throw new AiScheduleInvalidRecurrenceError();
    }

    if (manifest.runAt !== undefined) {
      throw new AiScheduleInvalidRecurrenceError();
    }
  }

  private validateRetryPolicy(manifest: AiScheduleManifest): void {
    const policy = manifest.retryPolicy;

    if (!policy) {
      throw new AiScheduleInvalidRetryPolicyError(
        "AI schedule retry policy is required",
      );
    }

    if (
      !Number.isInteger(policy.maximumAttempts) ||
      policy.maximumAttempts < 1 ||
      policy.maximumAttempts > 20
    ) {
      throw new AiScheduleInvalidRetryPolicyError(
        "maximumAttempts must be between 1 and 20",
      );
    }

    if (
      !Number.isInteger(policy.initialDelaySeconds) ||
      policy.initialDelaySeconds < 0
    ) {
      throw new AiScheduleInvalidRetryPolicyError(
        "initialDelaySeconds must be a non-negative integer",
      );
    }

    if (
      !Number.isInteger(policy.maximumDelaySeconds) ||
      policy.maximumDelaySeconds < policy.initialDelaySeconds
    ) {
      throw new AiScheduleInvalidRetryPolicyError(
        "maximumDelaySeconds must not be less than initialDelaySeconds",
      );
    }

    if (!["fixed", "exponential"].includes(policy.backoffStrategy)) {
      throw new AiScheduleInvalidRetryPolicyError(
        "Unsupported retry backoff strategy",
      );
    }
  }

  private validatePayload(payload: Record<string, unknown>): void {
    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    ) {
      throw new AiScheduleInvalidManifestError(
        "commandPayload must be an object",
      );
    }

    this.inspectPayload(payload);
  }

  private inspectPayload(
    value: unknown,
    path = "commandPayload",
  ): void {
    if (typeof value === "function" || typeof value === "symbol") {
      throw new AiScheduleUnsafePayloadError(path);
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) =>
        this.inspectPayload(item, `${path}[${index}]`),
      );
      return;
    }

    if (!value || typeof value !== "object") {
      return;
    }

    for (const [key, child] of Object.entries(value)) {
      const normalized = key.toLowerCase();

      if (this.prohibitedPayloadFields.has(normalized)) {
        throw new AiScheduleUnsafePayloadError(`${path}.${key}`);
      }

      this.inspectPayload(child, `${path}.${key}`);
    }
  }

  private validateTimestamp(value: string): void {
    if (
      typeof value !== "string" ||
      value.trim() === "" ||
      Number.isNaN(Date.parse(value))
    ) {
      throw new AiScheduleInvalidTimeError(String(value));
    }
  }

  private validateTimezone(timezone: string): void {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    } catch {
      throw new AiScheduleInvalidTimezoneError(timezone);
    }
  }

  private requireText(value: string, field: string): void {
    if (typeof value !== "string" || value.trim() === "") {
      throw new AiScheduleInvalidManifestError(
        `${field} must be a non-empty string`,
      );
    }
  }

  private clone(manifest: AiScheduleManifest): AiScheduleManifest {
    return JSON.parse(JSON.stringify(manifest)) as AiScheduleManifest;
  }
}
