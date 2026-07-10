CREATE TABLE IF NOT EXISTS metric_samples (
    id UUID PRIMARY KEY,
    metric_name VARCHAR(255) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    help TEXT NOT NULL,
    labels JSONB NOT NULL DEFAULT '{}'::jsonb,
    value DOUBLE PRECISION NOT NULL,
    sampled_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metric_samples_name
ON metric_samples(metric_name);

CREATE INDEX IF NOT EXISTS idx_metric_samples_type
ON metric_samples(metric_type);

CREATE INDEX IF NOT EXISTS idx_metric_samples_sampled_at
ON metric_samples(sampled_at);
