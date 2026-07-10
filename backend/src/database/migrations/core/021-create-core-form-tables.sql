CREATE TABLE IF NOT EXISTS form_definitions (
  id UUID PRIMARY KEY,
  code VARCHAR(120) UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_definitions_code
  ON form_definitions(code);

CREATE INDEX IF NOT EXISTS idx_form_definitions_status
  ON form_definitions(status);

CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES form_definitions(id) ON DELETE CASCADE,
  values JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_by_person_id UUID,
  subject_type VARCHAR(120),
  subject_id UUID,
  property_id UUID,
  space_id UUID,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id
  ON form_submissions(form_id);

CREATE INDEX IF NOT EXISTS idx_form_submissions_subject
  ON form_submissions(subject_type, subject_id);

CREATE INDEX IF NOT EXISTS idx_form_submissions_property_id
  ON form_submissions(property_id);
