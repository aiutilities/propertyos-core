-- Correct Access Event Credential Reference
-- Migration: 049-correct-access-event-credential-reference.sql
--
-- Migration 027 linked access_events.credential_id to the identity
-- authentication table credentials. AccessControlService actually persists
-- credential identifiers returned by CredentialService, which owns the
-- access_credentials table.
--
-- Preserve the historical identity-credential column and its data. Introduce
-- a correctly constrained access-credential column for runtime evaluations.

ALTER TABLE access_events
RENAME COLUMN credential_id
TO identity_credential_id;

ALTER TABLE access_events
RENAME CONSTRAINT access_events_credential_id_fkey
TO access_events_identity_credential_id_fkey;

ALTER INDEX idx_access_event_credential
RENAME TO idx_access_event_identity_credential;

ALTER TABLE access_events
ADD COLUMN credential_id UUID
REFERENCES access_credentials(id)
ON DELETE SET NULL;

CREATE INDEX idx_access_event_access_credential
ON access_events(credential_id);
