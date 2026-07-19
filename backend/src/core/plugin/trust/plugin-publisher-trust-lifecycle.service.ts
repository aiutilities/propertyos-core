import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
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
} from '../../../database/postgres';
import {
  PluginPublisherKeyRevocationResult,
  RevokePluginPublisherKey,
} from './plugin-publisher-trust-lifecycle.types';

const IDENTIFIER_PATTERN =
  /^[a-z0-9][a-z0-9._-]{0,149}$/;

@Injectable()
export class PluginPublisherTrustLifecycleService {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async revokeKey(
    input: RevokePluginPublisherKey,
  ): Promise<PluginPublisherKeyRevocationResult> {
    this.validateRevocation(input);

    const client =
      await this.pool.connect();

    try {
      await client.query('BEGIN');

      const currentResult =
        await client.query(
          `
          SELECT
            signing_key.key_id,
            signing_key.publisher_id,
            signing_key.status,
            signing_key.revoked_at
          FROM plugin_publisher_keys
            AS signing_key
          INNER JOIN plugin_publishers
            AS publisher
            ON publisher.id =
              signing_key.publisher_id
          WHERE publisher.id = $1
            AND signing_key.key_id = $2
          FOR UPDATE OF signing_key
          `,
          [
            input.publisherId,
            input.keyId,
          ],
        );

      const current =
        currentResult.rows[0];

      if (!current) {
        throw new NotFoundException(
          'PLUGIN_PUBLISHER_KEY_NOT_FOUND',
        );
      }

      if (
        current.status === 'REVOKED' ||
        current.revoked_at
      ) {
        throw new ConflictException(
          'PLUGIN_PUBLISHER_KEY_ALREADY_REVOKED',
        );
      }

      const revoked =
        await client.query(
          `
          UPDATE plugin_publisher_keys
          SET
            status = 'REVOKED',
            revoked_at = NOW(),
            revocation_reason = $3
          WHERE publisher_id = $1
            AND key_id = $2
            AND status = 'ACTIVE'
            AND revoked_at IS NULL
          RETURNING key_id
          `,
          [
            input.publisherId,
            input.keyId,
            input.reason.trim(),
          ],
        );

      if (!revoked.rows[0]) {
        throw new ConflictException(
          'PLUGIN_PUBLISHER_KEY_CONCURRENT_REVOCATION',
        );
      }

      const publications =
        await client.query(
          `
          UPDATE plugin_publications
          SET
            status = 'QUARANTINED',
            quarantined_by = $3,
            quarantined_at = NOW(),
            quarantine_reason = $4,
            updated_at = NOW()
          WHERE publisher_id = $1
            AND key_id = $2
            AND status = 'APPROVED'
          RETURNING id
          `,
          [
            input.publisherId,
            input.keyId,
            input.actorId,
            this.quarantineReason(
              input.keyId,
              input.reason,
            ),
          ],
        );

      const publicationIds =
        publications.rows.map(
          (row) => String(row.id),
        );

      for (
        const publicationId
        of publicationIds
      ) {
        await this.insertPublicationEvent(
          client,
          publicationId,
          input,
        );
      }

      await this.insertTrustEvent(
        client,
        input,
        publicationIds,
      );

      await client.query('COMMIT');

      return {
        publisherId:
          input.publisherId,
        keyId:
          input.keyId,
        status:
          'REVOKED',
        quarantinedPublicationIds:
          publicationIds,
        quarantinedPublicationCount:
          publicationIds.length,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async insertPublicationEvent(
    client: PoolClient,
    publicationId: string,
    input: RevokePluginPublisherKey,
  ): Promise<void> {
    await client.query(
      `
      INSERT INTO
        plugin_publication_security_events (
          id,
          publication_id,
          event_type,
          from_status,
          to_status,
          actor_id,
          reason,
          metadata
        )
      VALUES (
        $1,
        $2,
        'QUARANTINED',
        'APPROVED',
        'QUARANTINED',
        $3,
        $4,
        $5::jsonb
      )
      `,
      [
        randomUUID(),
        publicationId,
        input.actorId,
        this.quarantineReason(
          input.keyId,
          input.reason,
        ),
        JSON.stringify({
          ...input.metadata,
          source:
            'publisher-key-revocation',
          publisherId:
            input.publisherId,
          keyId:
            input.keyId,
        }),
      ],
    );
  }

  private async insertTrustEvent(
    client: PoolClient,
    input: RevokePluginPublisherKey,
    publicationIds: string[],
  ): Promise<void> {
    await client.query(
      `
      INSERT INTO
        plugin_publisher_trust_security_events (
          id,
          publisher_id,
          key_id,
          event_type,
          actor_id,
          reason,
          metadata
        )
      VALUES (
        $1,
        $2,
        $3,
        'KEY_REVOKED',
        $4,
        $5,
        $6::jsonb
      )
      `,
      [
        randomUUID(),
        input.publisherId,
        input.keyId,
        input.actorId,
        input.reason.trim(),
        JSON.stringify({
          ...input.metadata,
          quarantinedPublicationIds:
            publicationIds,
          quarantinedPublicationCount:
            publicationIds.length,
        }),
      ],
    );
  }

  private validateRevocation(
    input: RevokePluginPublisherKey,
  ): void {
    this.assertIdentifier(
      input.publisherId,
      'publisher ID',
    );

    this.assertIdentifier(
      input.keyId,
      'key ID',
    );

    if (
      !input.actorId ||
      input.actorId.length > 150
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLISHER_TRUST_ACTOR_INVALID',
      );
    }

    if (
      !input.reason ||
      !input.reason.trim() ||
      input.reason.trim().length > 2000
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLISHER_KEY_REVOCATION_REASON_INVALID',
      );
    }

    if (
      input.metadata !== undefined &&
      (
        !input.metadata ||
        Array.isArray(input.metadata) ||
        typeof input.metadata !== 'object'
      )
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLISHER_TRUST_METADATA_INVALID',
      );
    }
  }

  private assertIdentifier(
    value: string,
    label: string,
  ): void {
    if (
      !IDENTIFIER_PATTERN.test(value)
    ) {
      throw new BadRequestException(
        `Invalid plugin ${label}`,
      );
    }
  }

  private quarantineReason(
    keyId: string,
    reason: string,
  ): string {
    return (
      `Publisher signing key ${keyId} revoked: ` +
      reason.trim()
    );
  }
}
