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
  RegisteredPluginPublisher,
  RegisteredPluginPublisherKey,
  RegisterPluginPublisher,
  RegisterPluginPublisherKey,
  RevokePluginPublisherKey,
} from './plugin-publisher-trust-lifecycle.types';
import {
  canonicalizePluginPublicKey,
} from './plugin-public-key-policy';

const IDENTIFIER_PATTERN =
  /^[a-z0-9][a-z0-9._-]{0,149}$/;

@Injectable()
export class PluginPublisherTrustLifecycleService {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async registerPublisher(
    input: RegisterPluginPublisher,
  ): Promise<RegisteredPluginPublisher> {
    this.validatePublisherRegistration(
      input,
    );

    const client =
      await this.pool.connect();

    try {
      await client.query('BEGIN');

      const result =
        await client.query(
          `
          INSERT INTO plugin_publishers (
            id,
            display_name,
            status,
            metadata
          )
          VALUES (
            $1,
            $2,
            'ACTIVE',
            $3::jsonb
          )
          RETURNING
            id,
            display_name,
            status
          `,
          [
            input.publisherId,
            input.displayName.trim(),
            JSON.stringify(
              input.metadata ?? {},
            ),
          ],
        );

      await client.query(
        `
        INSERT INTO
          plugin_publisher_trust_security_events (
            id,
            publisher_id,
            event_type,
            actor_id,
            metadata
          )
        VALUES (
          $1,
          $2,
          'PUBLISHER_REGISTERED',
          $3,
          $4::jsonb
        )
        `,
        [
          randomUUID(),
          input.publisherId,
          input.actorId,
          JSON.stringify({
            ...input.metadata,
            publisherId:
              input.publisherId,
            displayName:
              input.displayName.trim(),
          }),
        ],
      );

      await client.query('COMMIT');

      return {
        publisherId:
          result.rows[0].id,
        displayName:
          result.rows[0].display_name,
        status:
          result.rows[0].status,
      };
    } catch (error) {
      await client.query('ROLLBACK');

      if (
        this.isUniqueViolation(
          error,
        )
      ) {
        throw new ConflictException(
          'PLUGIN_PUBLISHER_IMMUTABLE',
        );
      }

      throw error;
    } finally {
      client.release();
    }
  }

  async registerKey(
    input: RegisterPluginPublisherKey,
  ): Promise<RegisteredPluginPublisherKey> {
    this.validateKeyRegistration(
      input,
    );

    let canonical;

    try {
      canonical =
        canonicalizePluginPublicKey(
          input.publicKeyPem,
        );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'PLUGIN_PUBLISHER_PUBLIC_KEY_INVALID',
      );
    }

    const client =
      await this.pool.connect();

    try {
      await client.query('BEGIN');

      const result =
        await client.query(
          `
          INSERT INTO plugin_publisher_keys (
            key_id,
            publisher_id,
            algorithm,
            public_key_pem,
            fingerprint_sha256,
            status,
            valid_from,
            valid_until
          )
          SELECT
            $1,
            publisher.id,
            $3,
            $4,
            $5,
            'ACTIVE',
            COALESCE(
              $6::timestamptz,
              NOW()
            ),
            $7::timestamptz
          FROM plugin_publishers
            AS publisher
          WHERE publisher.id = $2
            AND publisher.status = 'ACTIVE'
            AND publisher.revoked_at IS NULL
          RETURNING
            key_id,
            publisher_id,
            algorithm,
            public_key_pem,
            fingerprint_sha256,
            status,
            valid_from,
            valid_until
          `,
          [
            input.keyId,
            input.publisherId,
            canonical.algorithm,
            canonical.publicKeyPem,
            canonical.fingerprintSha256,
            input.validFrom
              ?.toISOString() ??
              null,
            input.validUntil
              ?.toISOString() ??
              null,
          ],
        );

      const row =
        result.rows[0];

      if (!row) {
        throw new BadRequestException(
          'PLUGIN_PUBLISHER_NOT_ACTIVE',
        );
      }

      await client.query(
        `
        INSERT INTO
          plugin_publisher_trust_security_events (
            id,
            publisher_id,
            key_id,
            event_type,
            actor_id,
            metadata
          )
        VALUES (
          $1,
          $2,
          $3,
          'KEY_REGISTERED',
          $4,
          $5::jsonb
        )
        `,
        [
          randomUUID(),
          input.publisherId,
          input.keyId,
          input.actorId,
          JSON.stringify({
            ...input.metadata,
            publisherId:
              input.publisherId,
            keyId:
              input.keyId,
            algorithm:
              canonical.algorithm,
            fingerprintSha256:
              canonical.fingerprintSha256,
            modulusLength:
              canonical.modulusLength,
          }),
        ],
      );

      await client.query('COMMIT');

      return {
        publisherId:
          row.publisher_id,
        keyId:
          row.key_id,
        algorithm:
          row.algorithm,
        publicKeyPem:
          row.public_key_pem,
        fingerprintSha256:
          row.fingerprint_sha256,
        modulusLength:
          canonical.modulusLength,
        status:
          row.status,
        validFrom:
          new Date(
            row.valid_from,
          ),
        validUntil:
          row.valid_until
            ? new Date(
                row.valid_until,
              )
            : undefined,
      };
    } catch (error) {
      await client.query('ROLLBACK');

      if (
        this.isUniqueViolation(
          error,
        )
      ) {
        throw new ConflictException(
          'PLUGIN_PUBLISHER_KEY_IMMUTABLE',
        );
      }

      throw error;
    } finally {
      client.release();
    }
  }

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

  private validatePublisherRegistration(
    input: RegisterPluginPublisher,
  ): void {
    this.assertIdentifier(
      input.publisherId,
      'publisher ID',
    );

    if (
      !input.displayName ||
      !input.displayName.trim() ||
      input.displayName.trim().length > 200
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLISHER_DISPLAY_NAME_INVALID',
      );
    }

    this.assertActor(
      input.actorId,
    );

    this.assertMetadata(
      input.metadata,
    );
  }

  private validateKeyRegistration(
    input: RegisterPluginPublisherKey,
  ): void {
    this.assertIdentifier(
      input.publisherId,
      'publisher ID',
    );

    this.assertIdentifier(
      input.keyId,
      'key ID',
    );

    this.assertActor(
      input.actorId,
    );

    this.assertMetadata(
      input.metadata,
    );

    if (
      input.validFrom &&
      Number.isNaN(
        input.validFrom.getTime(),
      )
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLISHER_KEY_VALID_FROM_INVALID',
      );
    }

    if (
      input.validUntil &&
      Number.isNaN(
        input.validUntil.getTime(),
      )
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLISHER_KEY_VALID_UNTIL_INVALID',
      );
    }

    if (
      input.validUntil &&
      input.validFrom &&
      input.validUntil <=
        input.validFrom
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLISHER_KEY_VALIDITY_INVALID',
      );
    }
  }

  private assertActor(
    actorId: string,
  ): void {
    if (
      !actorId ||
      actorId.length > 150
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLISHER_TRUST_ACTOR_INVALID',
      );
    }
  }

  private assertMetadata(
    metadata:
      Record<string, unknown> |
      undefined,
  ): void {
    if (
      metadata !== undefined &&
      (
        !metadata ||
        Array.isArray(metadata) ||
        typeof metadata !== 'object'
      )
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLISHER_TRUST_METADATA_INVALID',
      );
    }

    if (
      metadata &&
      this.containsSensitiveMetadata(
        metadata,
      )
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLISHER_TRUST_SENSITIVE_METADATA_FORBIDDEN',
      );
    }
  }

  private containsSensitiveMetadata(
    value: unknown,
  ): boolean {
    if (
      Array.isArray(value)
    ) {
      return value.some(
        (item) =>
          this.containsSensitiveMetadata(
            item,
          ),
      );
    }

    if (
      !value ||
      typeof value !== 'object'
    ) {
      return false;
    }

    for (
      const [
        key,
        nestedValue,
      ] of Object.entries(
        value,
      )
    ) {
      const normalized =
        key
          .replace(
            /[^a-z0-9]/gi,
            '',
          )
          .toLowerCase();

      if (
        normalized === 'privatekey' ||
        normalized === 'privatekeypem'
      ) {
        return true;
      }

      if (
        this.containsSensitiveMetadata(
          nestedValue,
        )
      ) {
        return true;
      }
    }

    return false;
  }

  private isUniqueViolation(
    error: unknown,
  ): boolean {
    return (
      !!error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === '23505'
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

    this.assertActor(
      input.actorId,
    );

    if (
      !input.reason ||
      !input.reason.trim() ||
      input.reason.trim().length > 2000
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLISHER_KEY_REVOCATION_REASON_INVALID',
      );
    }

    this.assertMetadata(
      input.metadata,
    );
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
