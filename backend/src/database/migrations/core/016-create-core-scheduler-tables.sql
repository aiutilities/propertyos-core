CREATE TABLE IF NOT EXISTS scheduler_jobs (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    job_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    schedule_type VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
    run_at TIMESTAMP NULL,
    cron_expression VARCHAR(255) NULL,
    last_run_at TIMESTAMP NULL,
    next_run_at TIMESTAMP NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    error_message TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduler_jobs_status
ON scheduler_jobs(status);

CREATE INDEX IF NOT EXISTS idx_scheduler_jobs_job_type
ON scheduler_jobs(job_type);

CREATE INDEX IF NOT EXISTS idx_scheduler_jobs_next_run_at
ON scheduler_jobs(next_run_at);

CREATE INDEX IF NOT EXISTS idx_scheduler_jobs_run_at
ON scheduler_jobs(run_at);
