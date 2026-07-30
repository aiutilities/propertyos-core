import { describe, expect, it } from "@jest/globals";
import {
  AiScheduleInvalidIdentifierError,
  AiScheduleInvalidRecurrenceError,
  AiScheduleInvalidRetryPolicyError,
  AiScheduleInvalidTimeError,
  AiScheduleInvalidTimezoneError,
  AiScheduleUnsafePayloadError,
} from "../errors/ai-schedule.error";
import { AiScheduleManifest } from "../types/ai-schedule.types";
import { AiScheduleManifestValidator } from "./ai-schedule-manifest.validator";

const createManifest = (
  overrides: Partial<AiScheduleManifest> = {},
): AiScheduleManifest => ({
  id: "property.daily.summary",
  name: "Property daily summary",
  description: "Creates the daily property operations summary",
  commandName: "property.operations.summary",
  commandPayload: {
    propertyId: "property-1",
  },
  scheduleType: "once",
  runAt: "2026-08-01T08:00:00.000Z",
  timezone: "Asia/Kolkata",
  status: "active",
  retryPolicy: {
    maximumAttempts: 3,
    initialDelaySeconds: 60,
    maximumDelaySeconds: 900,
    backoffStrategy: "exponential",
  },
  governanceContext: {
    propertyId: "property-1",
    requiresHumanApproval: false,
  },
  createdBy: "user-1",
  createdAt: "2026-07-30T12:00:00.000Z",
  ...overrides,
});

describe("AiScheduleManifestValidator", () => {
  const validator = new AiScheduleManifestValidator();

  it("accepts a valid one-time schedule", () => {
    expect(validator.validate(createManifest())).toEqual(createManifest());
  });

  it("returns a defensive copy", () => {
    const manifest = createManifest();
    expect(validator.validate(manifest)).not.toBe(manifest);
  });

  it("accepts a valid recurring interval schedule", () => {
    const manifest = createManifest({
      scheduleType: "interval",
      runAt: undefined,
      intervalSeconds: 3600,
    });

    expect(validator.validate(manifest)).toEqual(manifest);
  });

  it("rejects invalid identifiers", () => {
    expect(() =>
      validator.validate(createManifest({ id: "Invalid Schedule" })),
    ).toThrow(AiScheduleInvalidIdentifierError);
  });

  it("rejects invalid one-time execution timestamps", () => {
    expect(() =>
      validator.validate(createManifest({ runAt: "not-a-date" })),
    ).toThrow(AiScheduleInvalidTimeError);
  });

  it("rejects one-time schedules without runAt", () => {
    expect(() =>
      validator.validate(createManifest({ runAt: undefined })),
    ).toThrow(AiScheduleInvalidTimeError);
  });

  it("rejects recurring schedules below the minimum interval", () => {
    expect(() =>
      validator.validate(
        createManifest({
          scheduleType: "interval",
          runAt: undefined,
          intervalSeconds: 30,
        }),
      ),
    ).toThrow(AiScheduleInvalidRecurrenceError);
  });

  it("rejects recurring schedules that also declare runAt", () => {
    expect(() =>
      validator.validate(
        createManifest({
          scheduleType: "interval",
          intervalSeconds: 3600,
        }),
      ),
    ).toThrow(AiScheduleInvalidRecurrenceError);
  });

  it("rejects invalid timezones", () => {
    expect(() =>
      validator.validate(createManifest({ timezone: "Invalid/Timezone" })),
    ).toThrow(AiScheduleInvalidTimezoneError);
  });

  it("rejects unbounded retry attempts", () => {
    expect(() =>
      validator.validate(
        createManifest({
          retryPolicy: {
            maximumAttempts: 1000,
            initialDelaySeconds: 60,
            maximumDelaySeconds: 900,
            backoffStrategy: "fixed",
          },
        }),
      ),
    ).toThrow(AiScheduleInvalidRetryPolicyError);
  });

  it("rejects maximum delay below initial delay", () => {
    expect(() =>
      validator.validate(
        createManifest({
          retryPolicy: {
            maximumAttempts: 3,
            initialDelaySeconds: 120,
            maximumDelaySeconds: 60,
            backoffStrategy: "fixed",
          },
        }),
      ),
    ).toThrow(AiScheduleInvalidRetryPolicyError);
  });

  it("rejects secret-like payload fields", () => {
    expect(() =>
      validator.validate(
        createManifest({
          commandPayload: {
            propertyId: "property-1",
            apiKey: "secret-value",
          },
        }),
      ),
    ).toThrow(AiScheduleUnsafePayloadError);
  });

  it("rejects nested executable payload fields", () => {
    expect(() =>
      validator.validate(
        createManifest({
          commandPayload: {
            nested: {
              script: "dangerous",
            },
          },
        }),
      ),
    ).toThrow(AiScheduleUnsafePayloadError);
  });
});
