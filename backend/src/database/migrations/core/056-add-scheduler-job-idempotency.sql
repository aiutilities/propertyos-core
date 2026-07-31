BEGIN;

ALTER TABLE scheduler_jobs
  ADD COLUMN IF NOT EXISTS
    idempotency_key VARCHAR(500);

CREATE UNIQUE INDEX IF NOT EXISTS
  uq_scheduler_jobs_idempotency_key
ON scheduler_jobs(idempotency_key)
WHERE idempotency_key IS NOT NULL;

COMMIT;
