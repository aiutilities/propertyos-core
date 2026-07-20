import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  readFileSync,
} from 'fs';
import {
  join,
} from 'path';

import {
  ACCESS_CONTROL_CORRECTIVE_MIGRATIONS,
  CONTROLLED_DEPLOYMENT_MIGRATIONS,
  migrationSha256,
} from './migration-readiness';

describe(
  'Access-control credential corrective migration',
  () => {
    const migrationName =
      'core/049-correct-access-event-credential-reference.sql';

    const migrationPath = join(
      process.cwd(),
      'src',
      'database',
      'migrations',
      migrationName,
    );

    const sql = readFileSync(
      migrationPath,
      'utf8',
    );

    const normalized = sql
      .replace(/\s+/g, ' ')
      .trim();

    it(
      'pins migration 049 in the controlled rollout',
      () => {
        expect(
          ACCESS_CONTROL_CORRECTIVE_MIGRATIONS,
        ).toEqual([
          expect.objectContaining({
            name: migrationName,
            sha256:
              '83ecdc2f9eb18af52eb4805252584cdfa1ccf59cdecf0c91469b718eacac6845',
            transactional: true,
            reversible: false,
            recovery: 'BACKUP_RESTORE',
          }),
        ]);

        expect(
          migrationSha256(sql),
        ).toBe(
          ACCESS_CONTROL_CORRECTIVE_MIGRATIONS[0]
            .sha256,
        );

        expect(
          CONTROLLED_DEPLOYMENT_MIGRATIONS[
            CONTROLLED_DEPLOYMENT_MIGRATIONS.length - 1
          ]?.name,
        ).toBe(migrationName);
      },
    );

    it(
      'preserves the legacy identity credential reference',
      () => {
        expect(normalized).toContain(
          'ALTER TABLE access_events ' +
            'RENAME COLUMN credential_id ' +
            'TO identity_credential_id;',
        );

        expect(normalized).toContain(
          'RENAME CONSTRAINT ' +
            'access_events_credential_id_fkey ' +
            'TO access_events_identity_credential_id_fkey;',
        );

        expect(normalized).toContain(
          'ALTER INDEX idx_access_event_credential ' +
            'RENAME TO ' +
            'idx_access_event_identity_credential;',
        );
      },
    );

    it(
      'binds runtime access events to access_credentials',
      () => {
        expect(normalized).toContain(
          'ADD COLUMN credential_id UUID ' +
            'REFERENCES access_credentials(id) ' +
            'ON DELETE SET NULL;',
        );

        expect(normalized).toContain(
          'CREATE INDEX ' +
            'idx_access_event_access_credential ' +
            'ON access_events(credential_id);',
        );

        expect(normalized).not.toContain(
          'DROP COLUMN',
        );

        expect(normalized).not.toContain(
          'DELETE FROM',
        );
      },
    );
  },
);
