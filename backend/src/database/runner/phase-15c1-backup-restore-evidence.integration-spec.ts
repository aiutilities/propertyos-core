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
  DeploymentBackupEvidence,
  validateDeploymentBackupEvidence,
} from './deployment-backup-evidence';

interface Phase15C1Evidence
  extends DeploymentBackupEvidence {
  scope: string;
  status: string;
  sourceState: string;
  productionAuthorizationGranted: false;
  databaseMutationAuthorized: false;
  migrationApplyAuthorized: false;
  liveAuthorizationPresent: false;
  externalMessageSent: false;
  storage: DeploymentBackupEvidence['storage'] & {
    uploads: {
      sha256: string;
      sizeBytes: number;
      fileCount: number;
      archiveReadable: boolean;
    };
    installedPlugins: {
      sha256: string;
      sizeBytes: number;
      fileCount: number;
      archiveReadable: boolean;
    };
  };
  isolatedRestore:
    DeploymentBackupEvidence['isolatedRestore'] & {
      restoredSourceState: string;
      publicTableCount: number;
      temporaryDatabaseRemoved: boolean;
    };
  limitations: string[];
}

describe(
  'Phase 15C1 backup and restore evidence',
  () => {
    const evidencePath = join(
      process.cwd(),
      '..',
      'generated',
      'knowledge',
      'phase-15c1-local-backup-restore-evidence.json',
    );

    const evidence = JSON.parse(
      readFileSync(
        evidencePath,
        'utf8',
      ),
    ) as Phase15C1Evidence;

    it(
      'validates commit-bound backup evidence without authorizing apply',
      () => {
        const result =
          validateDeploymentBackupEvidence(
            evidence,
            '16e8a868bf367131310c0001ff013c0b71859a0c',
          );

        expect(result.status).toBe(
          'VALID',
        );

        expect(result.applyAuthorized)
          .toBe(false);

        expect(result.errors).toEqual(
          [],
        );
      },
    );

    it(
      'records the complete 037 through 049 pending range',
      () => {
        expect(
          evidence.controlledPendingMigrations,
        ).toHaveLength(13);

        expect(
          evidence
            .controlledPendingMigrations[0],
        ).toBe(
          'core/037-create-core-inventory-material-issue.sql',
        );

        expect(
          evidence
            .controlledPendingMigrations[12],
        ).toBe(
          'core/049-correct-access-event-credential-reference.sql',
        );
      },
    );

    it(
      'records verified database and storage artifacts',
      () => {
        expect(
          evidence.dump.restoreListVerified,
        ).toBe(true);

        expect(
          evidence.dump.sizeBytes,
        ).toBeGreaterThan(0);

        expect(
          evidence.storage.verified,
        ).toBe(true);

        expect(
          evidence.storage.uploads
            .archiveReadable,
        ).toBe(true);

        expect(
          evidence.storage.installedPlugins
            .archiveReadable,
        ).toBe(true);

        expect(
          evidence.isolatedRestore.verified,
        ).toBe(true);

        expect(
          evidence.isolatedRestore
            .temporaryDatabaseRemoved,
        ).toBe(true);
      },
    );

    it(
      'remains fail-closed and explicitly non-production',
      () => {
        expect(evidence.scope).toBe(
          'PHASE_15C1_LOCAL_PILOT_SOURCE_BACKUP_RESTORE_REHEARSAL',
        );

        expect(evidence.status).toBe(
          'VALID_LOCAL_REHEARSAL',
        );

        expect(
          evidence.sourceState,
        ).toBe('1|37|0');

        expect(
          evidence.productionAuthorizationGranted,
        ).toBe(false);

        expect(
          evidence.databaseMutationAuthorized,
        ).toBe(false);

        expect(
          evidence.migrationApplyAuthorized,
        ).toBe(false);

        expect(
          evidence.liveAuthorizationPresent,
        ).toBe(false);

        expect(
          evidence.externalMessageSent,
        ).toBe(false);
      },
    );
  },
);
