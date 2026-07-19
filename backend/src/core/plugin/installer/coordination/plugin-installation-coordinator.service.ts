import {
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  Pool,
  PoolClient,
} from 'pg';
import {
  POSTGRES_POOL,
} from '../../../../database/postgres';

export class PluginInstallationConflictError extends Error {
  constructor(requestKey: string) {
    super(
      `Plugin installation is already running for request ${requestKey}`,
    );
    this.name = 'PluginInstallationConflictError';
  }
}

export interface CoordinatedInstallationResult<T> {
  replayed: boolean;
  value: T;
}

interface StoredAttempt {
  status: string;
  result: unknown;
}

@Injectable()
export class PluginInstallationCoordinatorService {
  private readonly lockNamespace =
    'propertyos:plugin-installation';

  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async coordinate<T>(
    requestKey: string,
    operation: () => Promise<T>,
    succeeded: (value: T) => boolean = () => true,
  ): Promise<CoordinatedInstallationResult<T>> {
    this.assertRequestKey(requestKey);

    const client = await this.pool.connect();
    let lockAcquired = false;

    try {
      lockAcquired = await this.tryAcquireLock(
        client,
        requestKey,
      );

      if (lockAcquired === false) {
        throw new PluginInstallationConflictError(requestKey);
      }

      const stored = await this.findAttempt(
        client,
        requestKey,
      );

      if (
        stored?.status === 'COMPLETE' &&
        stored.result !== null &&
        stored.result !== undefined
      ) {
        return {
          replayed: true,
          value: stored.result as T,
        };
      }

      await this.startAttempt(client, requestKey);

      try {
        const value = await operation();

        if (succeeded(value)) {
          await this.completeAttempt(
            client,
            requestKey,
            value,
          );
        } else {
          await this.failAttempt(
            client,
            requestKey,
            value,
            'Installation returned an unsuccessful result',
          );
        }

        return {
          replayed: false,
          value,
        };
      } catch (error) {
        await this.failAttempt(
          client,
          requestKey,
          null,
          error instanceof Error
            ? error.message
            : 'Unknown installation coordination error',
        );

        throw error;
      }
    } finally {
      if (lockAcquired) {
        await this.releaseLock(client, requestKey);
      }

      client.release();
    }
  }

  private assertRequestKey(requestKey: string): void {
    if (/^[a-f0-9]{64}$/.test(requestKey) === false) {
      throw new Error(
        'Plugin installation request key must be a lowercase SHA-256 digest',
      );
    }
  }

  private lockKey(requestKey: string): string {
    return `${this.lockNamespace}:${requestKey}`;
  }

  private async tryAcquireLock(
    client: PoolClient,
    requestKey: string,
  ): Promise<boolean> {
    const result = await client.query<{
      acquired: boolean;
    }>(
      `
      SELECT pg_try_advisory_lock(
        hashtext($1)
      ) AS acquired
      `,
      [this.lockKey(requestKey)],
    );

    return result.rows[0]?.acquired === true;
  }

  private async releaseLock(
    client: PoolClient,
    requestKey: string,
  ): Promise<void> {
    await client.query(
      `
      SELECT pg_advisory_unlock(
        hashtext($1)
      )
      `,
      [this.lockKey(requestKey)],
    );
  }

  private async findAttempt(
    client: PoolClient,
    requestKey: string,
  ): Promise<StoredAttempt | null> {
    const result = await client.query<StoredAttempt>(
      `
      SELECT status, result
      FROM core_plugin_installation_attempts
      WHERE request_key = $1
      LIMIT 1
      `,
      [requestKey],
    );

    return result.rows[0] ?? null;
  }

  private async startAttempt(
    client: PoolClient,
    requestKey: string,
  ): Promise<void> {
    await client.query(
      `
      INSERT INTO core_plugin_installation_attempts
      (
        request_key,
        status
      )
      VALUES ($1, 'RUNNING')
      ON CONFLICT (request_key)
      DO UPDATE SET
        status = 'RUNNING',
        attempt_number =
          core_plugin_installation_attempts.attempt_number + 1,
        result = NULL,
        error = CASE
          WHEN core_plugin_installation_attempts.status = 'RUNNING'
          THEN 'Previous installation attempt was interrupted'
          ELSE NULL
        END,
        started_at = NOW(),
        heartbeat_at = NOW(),
        completed_at = NULL,
        updated_at = NOW()
      `,
      [requestKey],
    );
  }

  private async completeAttempt<T>(
    client: PoolClient,
    requestKey: string,
    value: T,
  ): Promise<void> {
    await client.query(
      `
      UPDATE core_plugin_installation_attempts
      SET
        status = 'COMPLETE',
        result = $2::jsonb,
        error = NULL,
        heartbeat_at = NOW(),
        completed_at = NOW(),
        updated_at = NOW()
      WHERE request_key = $1
      `,
      [requestKey, JSON.stringify(value)],
    );
  }

  private async failAttempt<T>(
    client: PoolClient,
    requestKey: string,
    value: T,
    error: string,
  ): Promise<void> {
    await client.query(
      `
      UPDATE core_plugin_installation_attempts
      SET
        status = 'FAILED',
        result = $2::jsonb,
        error = $3,
        heartbeat_at = NOW(),
        completed_at = NOW(),
        updated_at = NOW()
      WHERE request_key = $1
      `,
      [
        requestKey,
        JSON.stringify(value),
        error,
      ],
    );
  }
}
