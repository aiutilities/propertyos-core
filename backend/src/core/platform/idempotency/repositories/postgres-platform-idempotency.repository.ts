import {
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  randomUUID,
} from 'crypto';
import {
  Pool,
  PoolClient,
} from 'pg';

import {
  POSTGRES_POOL,
} from '../../../../database/postgres';
import {
  PlatformIdempotencyRequest,
} from '../entities/platform-idempotency-request.entity';
import {
  PlatformIdempotencyScope,
  PlatformIdempotencyStoredResponse,
} from '../platform-idempotency.types';
import {
  PlatformIdempotencyRepository,
  PlatformIdempotencyTransaction,
} from './platform-idempotency.repository';

interface PlatformIdempotencyRow {
  id: string;
  actor_id: string;
  operation: string;
  resource_key: string;
  idempotency_key: string;
  request_fingerprint: string;
  status:
    | 'RUNNING'
    | 'COMPLETE'
    | 'FAILED';
  response_status: number | null;
  response_payload: unknown;
  error_payload: unknown;
  attempt_number: number;
  started_at: Date;
  heartbeat_at: Date;
  completed_at: Date | null;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class PostgresPlatformIdempotencyRepository
  extends PlatformIdempotencyRepository {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {
    super();
  }

  async executeWithLock<T>(
    scope:
      PlatformIdempotencyScope,

    work: (
      transaction:
        PlatformIdempotencyTransaction,
    ) => Promise<T>,
  ): Promise<T> {
    const client =
      await this.pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      await client.query(
        `
        SELECT pg_advisory_xact_lock(
          hashtext($1)
        )
        `,
        [
          this.lockKey(scope),
        ],
      );

      const state =
        await this.findWithClient(
          client,
          scope.actorId,
          scope.operation,
          scope.idempotencyKey,
        );

      const transaction:
        PlatformIdempotencyTransaction = {
          state,

          start:
            (input) =>
              this.startWithClient(
                client,
                input,
              ),

          complete:
            (
              id,
              response,
            ) =>
              this.completeWithClient(
                client,
                id,
                response,
              ),

          fail:
            (
              id,
              errorPayload,
            ) =>
              this.failWithClient(
                client,
                id,
                errorPayload,
              ),
        };

      const value =
        await work(
          transaction,
        );

      await client.query(
        'COMMIT',
      );

      return value;
    } catch (error) {
      await client.query(
        'ROLLBACK',
      );

      throw error;
    } finally {
      client.release();
    }
  }

  async start(
    scope:
      PlatformIdempotencyScope,
  ): Promise<
    PlatformIdempotencyRequest
  > {
    return this.startWithQuery(
      this.pool,
      scope,
    );
  }

  private async startWithClient(
    client:
      PoolClient,
    scope:
      PlatformIdempotencyScope,
  ): Promise<
    PlatformIdempotencyRequest
  > {
    return this.startWithQuery(
      client,
      scope,
    );
  }

  private async startWithQuery(
    queryable:
      Pick<Pool, 'query'>,
    scope:
      PlatformIdempotencyScope,
  ): Promise<
    PlatformIdempotencyRequest
  > {
    const result =
      await queryable.query<
        PlatformIdempotencyRow
      >(
        `
        INSERT INTO core_idempotency_requests
        (
          id,
          actor_id,
          operation,
          resource_key,
          idempotency_key,
          request_fingerprint,
          status,
          expires_at
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          'RUNNING',
          $7
        )
        ON CONFLICT
        (
          actor_id,
          operation,
          idempotency_key
        )
        DO UPDATE SET
          resource_key =
            EXCLUDED.resource_key,
          request_fingerprint =
            EXCLUDED.request_fingerprint,
          status =
            'RUNNING',
          response_status =
            NULL,
          response_payload =
            NULL,
          error_payload =
            NULL,
          attempt_number =
            core_idempotency_requests
              .attempt_number + 1,
          started_at =
            NOW(),
          heartbeat_at =
            NOW(),
          completed_at =
            NULL,
          expires_at =
            EXCLUDED.expires_at,
          updated_at =
            NOW()
        RETURNING *
        `,
        [
          randomUUID(),
          scope.actorId,
          scope.operation,
          scope.resourceKey,
          scope.idempotencyKey,
          scope.requestFingerprint,
          scope.expiresAt,
        ],
      );

    return this.map(
      result.rows[0],
    );
  }

  async complete(
    id: string,
    response:
      PlatformIdempotencyStoredResponse,
  ): Promise<
    PlatformIdempotencyRequest
  > {
    return this.completeWithQuery(
      this.pool,
      id,
      response,
    );
  }

  private async completeWithClient(
    client:
      PoolClient,
    id: string,
    response:
      PlatformIdempotencyStoredResponse,
  ): Promise<
    PlatformIdempotencyRequest
  > {
    return this.completeWithQuery(
      client,
      id,
      response,
    );
  }

  private async completeWithQuery(
    queryable:
      Pick<Pool, 'query'>,
    id: string,
    response:
      PlatformIdempotencyStoredResponse,
  ): Promise<
    PlatformIdempotencyRequest
  > {
    const result =
      await queryable.query<
        PlatformIdempotencyRow
      >(
        `
        UPDATE core_idempotency_requests
        SET
          status = 'COMPLETE',
          response_status = $2,
          response_payload = $3::jsonb,
          error_payload = NULL,
          heartbeat_at = NOW(),
          completed_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [
          id,
          response.statusCode,
          JSON.stringify(
            response.payload,
          ),
        ],
      );

    return this.requireRow(
      result.rows[0],
      id,
    );
  }

  async fail(
    id: string,
    errorPayload: unknown,
  ): Promise<
    PlatformIdempotencyRequest
  > {
    return this.failWithQuery(
      this.pool,
      id,
      errorPayload,
    );
  }

  private async failWithClient(
    client:
      PoolClient,
    id: string,
    errorPayload: unknown,
  ): Promise<
    PlatformIdempotencyRequest
  > {
    return this.failWithQuery(
      client,
      id,
      errorPayload,
    );
  }

  private async failWithQuery(
    queryable:
      Pick<Pool, 'query'>,
    id: string,
    errorPayload: unknown,
  ): Promise<
    PlatformIdempotencyRequest
  > {
    const result =
      await queryable.query<
        PlatformIdempotencyRow
      >(
        `
        UPDATE core_idempotency_requests
        SET
          status = 'FAILED',
          response_status = NULL,
          response_payload = NULL,
          error_payload = $2::jsonb,
          heartbeat_at = NOW(),
          completed_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [
          id,
          JSON.stringify(
            errorPayload,
          ),
        ],
      );

    return this.requireRow(
      result.rows[0],
      id,
    );
  }

  async find(
    actorId: string,
    operation: string,
    idempotencyKey: string,
  ): Promise<
    PlatformIdempotencyRequest | null
  > {
    const result =
      await this.pool.query<
        PlatformIdempotencyRow
      >(
        `
        SELECT *
        FROM core_idempotency_requests
        WHERE actor_id = $1
          AND operation = $2
          AND idempotency_key = $3
        LIMIT 1
        `,
        [
          actorId,
          operation,
          idempotencyKey,
        ],
      );

    return result.rows[0]
      ? this.map(
          result.rows[0],
        )
      : null;
  }

  async cleanupExpired(
    asOf: Date,
  ): Promise<number> {
    const result =
      await this.pool.query(
        `
        DELETE FROM core_idempotency_requests
        WHERE expires_at < $1
          AND status <> 'RUNNING'
        `,
        [
          asOf,
        ],
      );

    return result.rowCount ?? 0;
  }

  private async findWithClient(
    client: PoolClient,
    actorId: string,
    operation: string,
    idempotencyKey: string,
  ): Promise<
    PlatformIdempotencyRequest | null
  > {
    const result =
      await client.query<
        PlatformIdempotencyRow
      >(
        `
        SELECT *
        FROM core_idempotency_requests
        WHERE actor_id = $1
          AND operation = $2
          AND idempotency_key = $3
        LIMIT 1
        `,
        [
          actorId,
          operation,
          idempotencyKey,
        ],
      );

    return result.rows[0]
      ? this.map(
          result.rows[0],
        )
      : null;
  }

  private lockKey(
    scope: PlatformIdempotencyScope,
  ): string {
    return [
      'propertyos',
      'idempotency',
      scope.actorId,
      scope.operation,
      scope.idempotencyKey,
    ].join(':');
  }

  private requireRow(
    row:
      PlatformIdempotencyRow | undefined,
    id: string,
  ): PlatformIdempotencyRequest {
    if (!row) {
      throw new Error(
        `Platform idempotency request ${id} was not found`,
      );
    }

    return this.map(row);
  }

  private map(
    row: PlatformIdempotencyRow,
  ): PlatformIdempotencyRequest {
    return {
      id:
        row.id,
      actorId:
        row.actor_id,
      operation:
        row.operation,
      resourceKey:
        row.resource_key,
      idempotencyKey:
        row.idempotency_key,
      requestFingerprint:
        row.request_fingerprint,
      status:
        row.status,
      responseStatus:
        row.response_status,
      responsePayload:
        row.response_payload,
      errorPayload:
        row.error_payload,
      attemptNumber:
        row.attempt_number,
      startedAt:
        row.started_at,
      heartbeatAt:
        row.heartbeat_at,
      completedAt:
        row.completed_at,
      expiresAt:
        row.expires_at,
      createdAt:
        row.created_at,
      updatedAt:
        row.updated_at,
    };
  }
}
