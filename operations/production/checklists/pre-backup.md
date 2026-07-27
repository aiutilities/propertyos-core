# PropertyOS Pre-Backup Checklist

## Authorization

- [ ] Backup operation is authorized.
- [ ] Backup owner is identified.
- [ ] Source environment is confirmed.
- [ ] Backup purpose is recorded.
- [ ] Retention policy is confirmed.

## Source Validation

- [ ] Database identity is confirmed without exposing credentials.
- [ ] Application release commit is recorded.
- [ ] Applied migration state is recorded.
- [ ] Plugin inventory is recorded.
- [ ] Theme inventory is recorded.
- [ ] Upload storage location is confirmed.

## Destination Validation

- [ ] Backup destination is approved.
- [ ] Available storage capacity is sufficient.
- [ ] Destination access is restricted.
- [ ] Encryption requirements are satisfied.
- [ ] Existing last known-good backup will not be overwritten.
- [ ] Backup filename convention is confirmed.

## Backup Scope

- [ ] PostgreSQL database is included.
- [ ] Upload data is included when required.
- [ ] Plugin inventory is included.
- [ ] Configuration keys are recorded without secret values.
- [ ] Artifact identities are recorded.
- [ ] Migration state is included.

## Verification Plan

- [ ] Backup digest method is selected.
- [ ] Non-empty file validation is planned.
- [ ] Backup format inspection is planned.
- [ ] Restore exercise destination is identified.
- [ ] Evidence storage location is identified.

## Safety Boundary

This checklist does not authorize database mutation, secret publication, production deployment, restore execution or deletion of previous backups.
