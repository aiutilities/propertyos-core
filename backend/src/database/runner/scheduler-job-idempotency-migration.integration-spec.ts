import {
  describe,
  expect,
  it,
} from "@jest/globals";

import {
  readFileSync,
} from "fs";
import {
  resolve,
} from "path";

describe(
  "Migration 056 scheduler job idempotency",
  () => {
    const migrationPath =
      resolve(
        __dirname,
        "../migrations/core/056-add-scheduler-job-idempotency.sql",
      );

    const migration =
      readFileSync(
        migrationPath,
        "utf8",
      );

    it("adds a nullable scheduler idempotency key", () => {
      expect(migration).toMatch(
        /ALTER TABLE scheduler_jobs[\s\S]*ADD COLUMN IF NOT EXISTS[\s\S]*idempotency_key VARCHAR\(500\)/i,
      );

      expect(migration).not.toMatch(
        /idempotency_key VARCHAR\(500\)\s+NOT NULL/i,
      );
    });

    it("adds a partial unique index", () => {
      expect(migration).toMatch(
        /CREATE UNIQUE INDEX IF NOT EXISTS[\s\S]*uq_scheduler_jobs_idempotency_key[\s\S]*ON scheduler_jobs\s*\(\s*idempotency_key\s*\)[\s\S]*WHERE idempotency_key IS NOT NULL/i,
      );
    });

    it("contains schema changes only", () => {
      expect(migration).not.toMatch(
        /\bINSERT\s+INTO\b/i,
      );
      expect(migration).not.toMatch(
        /\bUPDATE\b/i,
      );
      expect(migration).not.toMatch(
        /\bDELETE\s+FROM\b/i,
      );
      expect(migration).not.toMatch(
        /\bTRUNCATE\b/i,
      );
    });

    it("is transaction bounded", () => {
      expect(migration.trim()).toMatch(
        /^BEGIN;[\s\S]*COMMIT;$/i,
      );
    });
  },
);
