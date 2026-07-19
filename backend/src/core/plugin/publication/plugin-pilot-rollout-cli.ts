import {
  readFileSync,
} from 'fs';
import {
  basename,
  relative,
  resolve,
} from 'path';
import {
  execFileSync,
} from 'child_process';
import {
  NestFactory,
} from '@nestjs/core';
import {
  Pool,
} from 'pg';
import {
  AppModule,
} from '../../../app.module';
import {
  POSTGRES_POOL,
} from '../../../database/postgres';
import {
  StorageService,
} from '../../storage/services/storage.service';
import {
  PluginMarketplaceService,
} from '../marketplace/services/plugin-marketplace.service';
import {
  PluginTrustBootstrapExecutor,
} from '../trust/plugin-trust-bootstrap-executor';
import {
  PluginPilotRolloutAdapter,
} from './plugin-pilot-rollout-adapter';
import {
  PluginPilotExecutionRequest,
  buildPluginPilotExecutionReadiness,
} from './plugin-pilot-rollout-execution-request';
import {
  PluginPilotRolloutExecutor,
} from './plugin-pilot-rollout-executor';
import {
  FilePilotOfflineSignatureEvidenceReader,
} from './plugin-pilot-offline-signature-evidence';
import {
  buildPluginPilotRolloutPlan,
} from './plugin-pilot-rollout-plan';
import {
  PluginPublicationAdmissionService,
} from './plugin-publication-admission.service';
import {
  PluginPublicationGovernanceService,
} from './plugin-publication-governance.service';
import {
  PluginPublicationInstallationService,
} from './plugin-publication-installation.service';

type SerializedRequest =
  Omit<
    PluginPilotExecutionRequest,
    'bundleBytes' |
    'publicKeyPem'
  >;

function requiredEnvironment(
  name: string,
): string {
  const value = process.env[name];

  if (!value?.trim()) {
    throw new Error(
      `Missing required environment variable: ${name}`,
    );
  }

  return value.trim();
}

function postgresConfig() {
  return {
    host:
      process.env.POSTGRES_HOST ||
      '127.0.0.1',
    port:
      Number(
        process.env.POSTGRES_PORT ||
        5433,
      ),
    database:
      requiredEnvironment(
        'POSTGRES_DB',
      ),
    user:
      process.env.POSTGRES_USER ||
      'propertyos',
    password:
      process.env.POSTGRES_PASSWORD ||
      'propertyos',
  };
}

function loadRequest():
  PluginPilotExecutionRequest {
  const requestPath =
    resolve(
      requiredEnvironment(
        'PROPERTYOS_PILOT_REQUEST_PATH',
      ),
    );
  const serialized =
    JSON.parse(
      readFileSync(
        requestPath,
        'utf8',
      ),
    ) as SerializedRequest;
  const repositoryRoot =
    resolve(
      serialized.repositoryRoot,
    );
  const requestRelative =
    relative(
      repositoryRoot,
      requestPath,
    );

  if (
    requestRelative === '' ||
    !requestRelative
      .startsWith('..')
  ) {
    throw new Error(
      'Pilot request file must be outside the repository',
    );
  }

  return {
    ...serialized,
    bundleBytes:
      readFileSync(
        resolve(
          serialized.bundlePath,
        ),
      ),
    publicKeyPem:
      readFileSync(
        resolve(
          serialized.publicKeyPath,
        ),
        'utf8',
      ),
  };
}

async function assertIsolatedSchema(
  request:
    PluginPilotExecutionRequest,
): Promise<void> {
  const pool =
    new Pool(
      postgresConfig(),
    );

  try {
    const result =
      await pool.query(
        `
        SELECT
          current_database()
            AS database_name,
          pg_is_in_recovery()
            AS in_recovery,
          (
            SELECT COUNT(*)::integer
            FROM schema_migrations
          ) AS migration_count,
          (
            SELECT COUNT(*)::integer
            FROM schema_migrations
            WHERE name ~
              '^core/0(37|38|39|40|41|42|43|44|45|46|47|48)-'
          ) AS controlled_count
        `,
      );
    const row =
      result.rows[0];

    if (
      row?.database_name !==
        request.expectedDatabaseName ||
      row?.in_recovery === true ||
      Number(
        row?.migration_count,
      ) !== 49 ||
      Number(
        row?.controlled_count,
      ) !== 12
    ) {
      throw new Error(
        'PILOT_ISOLATED_SCHEMA_NOT_ACCEPTED',
      );
    }
  } finally {
    await pool.end();
  }
}

async function main():
  Promise<void> {
  const request =
    loadRequest();
  const readiness =
    buildPluginPilotExecutionReadiness(
      request,
    );

  if (readiness.status !== 'READY') {
    process.stdout.write(
      `${JSON.stringify(
        readiness,
        null,
        2,
      )}
`,
    );
    throw new Error(
      'PILOT_EXECUTION_READINESS_BLOCKED',
    );
  }

  const actualHead =
    execFileSync(
      'git',
      [
        'rev-parse',
        'HEAD',
      ],
      {
        cwd:
          request.repositoryRoot,
        encoding: 'utf8',
      },
    ).trim();

  if (
    actualHead !==
      request.gitCommit
  ) {
    throw new Error(
      'PILOT_EXECUTION_GIT_COMMIT_MISMATCH',
    );
  }

  const configuredDatabase =
    requiredEnvironment(
      'POSTGRES_DB',
    );

  if (
    configuredDatabase !==
      request.expectedDatabaseName ||
    configuredDatabase ===
      'propertyos'
  ) {
    throw new Error(
      'PILOT_EXECUTION_DATABASE_ENVIRONMENT_FORBIDDEN',
    );
  }

  const storageRoot =
    resolve(
      requiredEnvironment(
        'STORAGE_LOCAL_ROOT',
      ),
    );
  const storageRelative =
    relative(
      resolve(
        request.repositoryRoot,
      ),
      storageRoot,
    );

  if (
    storageRelative === '' ||
    !storageRelative
      .startsWith('..')
  ) {
    throw new Error(
      'PILOT_STORAGE_ROOT_MUST_BE_OUTSIDE_REPOSITORY',
    );
  }

  await assertIsolatedSchema(
    request,
  );

  const app =
    await NestFactory
      .createApplicationContext(
        AppModule,
        {
          logger: false,
        },
      );

  try {
    const pool =
      app.get<Pool>(
        POSTGRES_POOL,
      );
    const trustExecutor =
      new PluginTrustBootstrapExecutor(
        pool,
      );
    const trustResult =
      await trustExecutor.execute(
        {
          ...request
            .trustBootstrapInput,
          publicKeyPem:
            request.publicKeyPem,
        },
        request
          .trustBootstrapAuthorization,
      );

    const storage =
      app.get(
        StorageService,
      );
    const object =
      await storage.store({
        objectKey: [
          'phase-13d4',
          request.desired
            .artifactSha256,
          basename(
            request.bundlePath,
          ),
        ].join('/'),
        content:
          request.bundleBytes
            .toString('base64'),
        originalName:
          basename(
            request.bundlePath,
          ),
        mimeType:
          'application/zip',
        entityType:
          'PLUGIN_PACKAGE',
        metadata: {
          purpose:
            'plugin-publication',
          phase: '13D4',
          environmentId:
            request.environmentId,
          requestEvidenceSha256:
            readiness
              .requestEvidenceSha256,
        },
      });

    if (
      object.checksum !==
        request.desired
          .artifactSha256
    ) {
      throw new Error(
        'PILOT_STORED_ARTIFACT_DIGEST_MISMATCH',
      );
    }

    const adapter =
      new PluginPilotRolloutAdapter(
        pool,
        app.get(
          PluginPublicationAdmissionService,
        ),
        app.get(
          PluginPublicationGovernanceService,
        ),
        app.get(
          PluginMarketplaceService,
        ),
        app.get(
          PluginPublicationInstallationService,
        ),
        new FilePilotOfflineSignatureEvidenceReader(
          request
            .signatureEvidencePath,
          request.repositoryRoot,
        ),
        {
          environmentClass:
            request.environmentClass,
          environmentId:
            request.environmentId,
          expectedDatabaseName:
            request
              .expectedDatabaseName,
          forbiddenDatabaseNames:
            request
              .forbiddenDatabaseNames,
        },
      );
    const plan =
      buildPluginPilotRolloutPlan(
        request.desired,
      );
    const execution =
      await new PluginPilotRolloutExecutor(
        adapter,
      ).execute({
        plan,
        desired:
          request.desired,
        authorization:
          request
            .pilotAuthorization,
        artifactStorageObjectId:
          object.id,
      });

    process.stdout.write(
      `${JSON.stringify({
        status: 'COMPLETED',
        scope:
          'PHASE_13D_ISOLATED_PILOT_EXECUTION',
        sourceDatabaseTouched:
          false,
        readiness,
        trust: trustResult,
        storedArtifact: {
          id: object.id,
          checksum:
            object.checksum,
          purpose:
            object.metadata
              .purpose,
        },
        execution,
      }, null, 2)}
`,
    );
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : error,
  );
  process.exitCode = 1;
});
