import {
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  Pool,
} from 'pg';
import {
  POSTGRES_POOL,
} from '../../../database/postgres';
import {
  PluginSigningAlgorithm,
  TrustedPluginPublisherKey,
} from './plugin-publisher-trust.types';

@Injectable()
export class PluginPublisherTrustService {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async resolveActiveKey(
    publisherId: string,
    keyId: string,
    algorithm:
      PluginSigningAlgorithm,
  ): Promise<
    TrustedPluginPublisherKey | null
  > {
    this.assertIdentifier(
      publisherId,
      'publisher ID',
    );

    this.assertIdentifier(
      keyId,
      'key ID',
    );

    if (
      algorithm !==
        'RSA-SHA256'
    ) {
      throw new Error(
        `Unsupported plugin signing algorithm: ${algorithm}`,
      );
    }

    const result =
      await this.pool.query(
        `
        SELECT
          publisher.id
            AS publisher_id,
          publisher.display_name
            AS publisher_name,
          signing_key.key_id,
          signing_key.algorithm,
          signing_key.public_key_pem,
          signing_key.fingerprint_sha256,
          signing_key.valid_from,
          signing_key.valid_until
        FROM plugin_publisher_keys
          AS signing_key
        INNER JOIN plugin_publishers
          AS publisher
          ON publisher.id =
            signing_key.publisher_id
        WHERE publisher.id = $1
          AND signing_key.key_id = $2
          AND signing_key.algorithm = $3
          AND publisher.status = 'ACTIVE'
          AND signing_key.status = 'ACTIVE'
          AND publisher.revoked_at IS NULL
          AND signing_key.revoked_at IS NULL
          AND signing_key.valid_from <= NOW()
          AND (
            signing_key.valid_until IS NULL
            OR signing_key.valid_until > NOW()
          )
        LIMIT 1
        `,
        [
          publisherId,
          keyId,
          algorithm,
        ],
      );

    const row =
      result.rows[0];

    if (!row) {
      return null;
    }

    return {
      publisherId:
        row.publisher_id,
      publisherName:
        row.publisher_name,
      keyId:
        row.key_id,
      algorithm:
        row.algorithm,
      publicKeyPem:
        row.public_key_pem,
      fingerprintSha256:
        row.fingerprint_sha256,
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
  }

  private assertIdentifier(
    value: string,
    label: string,
  ): void {
    if (
      !/^[a-z0-9][a-z0-9._-]{0,149}$/.test(
        value,
      )
    ) {
      throw new Error(
        `Invalid plugin ${label}`,
      );
    }
  }
}
