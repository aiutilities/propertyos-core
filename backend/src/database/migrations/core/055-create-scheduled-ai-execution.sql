BEGIN;

CREATE TABLE IF NOT EXISTS ai_schedules (
  id VARCHAR(160) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  command_name VARCHAR(255) NOT NULL,
  command_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schedule_type VARCHAR(32) NOT NULL,
  run_at TIMESTAMPTZ,
  interval_seconds INTEGER,
  timezone VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL,
  retry_policy JSONB NOT NULL,
  governance_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by VARCHAR(255) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT ai_schedules_schedule_type_check
    CHECK (schedule_type IN ('once', 'interval')),
  CONSTRAINT ai_schedules_status_check
    CHECK (status IN ('active', 'paused', 'cancelled', 'completed')),
  CONSTRAINT ai_schedules_once_check
    CHECK (
      (schedule_type = 'once' AND run_at IS NOT NULL
        AND interval_seconds IS NULL)
      OR
      (schedule_type = 'interval' AND run_at IS NULL
        AND interval_seconds >= 60)
    )
);

CREATE TABLE IF NOT EXISTS ai_schedule_occurrences (
  id UUID PRIMARY KEY,
  schedule_id VARCHAR(160) NOT NULL
    REFERENCES ai_schedules(id) ON DELETE RESTRICT,
  sequence INTEGER NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status VARCHAR(32) NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ,
  worker_id VARCHAR(255),
  claimed_at TIMESTAMPTZ,
  claim_expires_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  outcome JSONB,
  error_code VARCHAR(255),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT ai_schedule_occurrences_status_check
    CHECK (
      status IN (
        'pending',
        'claimed',
        'running',
        'succeeded',
        'failed',
        'retry_scheduled',
        'skipped',
        'cancelled',
        'approval_required'
      )
    ),
  CONSTRAINT ai_schedule_occurrences_sequence_unique
    UNIQUE (schedule_id, sequence),
  CONSTRAINT ai_schedule_occurrences_time_unique
    UNIQUE (schedule_id, scheduled_for)
);

CREATE TABLE IF NOT EXISTS ai_schedule_attempts (
  id UUID PRIMARY KEY,
  occurrence_id UUID NOT NULL
    REFERENCES ai_schedule_occurrences(id) ON DELETE RESTRICT,
  attempt_number INTEGER NOT NULL,
  worker_id VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL,
  retryable BOOLEAN,
  error_code VARCHAR(255),
  error_message TEXT,
  outcome JSONB,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  CONSTRAINT ai_schedule_attempts_status_check
    CHECK (status IN ('running', 'succeeded', 'failed')),
  CONSTRAINT ai_schedule_attempts_number_unique
    UNIQUE (occurrence_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_ai_schedules_status
  ON ai_schedules(status);

CREATE INDEX IF NOT EXISTS idx_ai_schedules_command
  ON ai_schedules(command_name);

CREATE INDEX IF NOT EXISTS idx_ai_schedule_occurrences_due
  ON ai_schedule_occurrences(status, scheduled_for, next_attempt_at);

CREATE INDEX IF NOT EXISTS idx_ai_schedule_occurrences_claim
  ON ai_schedule_occurrences(status, claim_expires_at);

CREATE INDEX IF NOT EXISTS idx_ai_schedule_attempts_occurrence
  ON ai_schedule_attempts(occurrence_id, attempt_number);

COMMIT;
