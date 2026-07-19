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
import semver from 'semver';
import {
  POSTGRES_POOL,
} from '../../../database/postgres';
import {
  PluginPublication,
  PluginPublicationEventType,
  PluginPublicationSecurityEvent,
  PluginPublicationStatus,
  SubmitPluginPublication,
  TransitionPluginPublication,
} from './plugin-publication-governance.types';

const IDENTIFIER_PATTERN =
  /^[a-z0-9][a-z0-9._-]{0,149}$/;
const SHA256_PATTERN =
  /^[a-f0-9]{64}$/;
const UUID_PATTERN =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

const TRANSITIONS:
  Record<
    PluginPublicationStatus,
    readonly PluginPublicationStatus[]
  > = {
    SUBMITTED: [
      'APPROVED',
      'REJECTED',
      'QUARANTINED',
    ],
    APPROVED: [
      'QUARANTINED',
      'REVOKED',
    ],
    REJECTED: [],
    QUARANTINED: [
      'APPROVED',
      'REVOKED',
    ],
    REVOKED: [],
  };

@Injectable()
export class PluginPublicationGovernanceService {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async submit(
    input: SubmitPluginPublication,
  ): Promise<PluginPublication> {
    this.validateSubmission(input);

    const client =
      await this.pool.connect();

    try {
      await client.query('BEGIN');

      const publicationId =
        randomUUID();

      const result =
        await client.query(
          `
          INSERT INTO plugin_publications (
            id,
            plugin_id,
            plugin_name,
            version,
            publisher_id,
            key_id,
            artifact_storage_object_id,
            artifact_sha256,
            integrity_sha256,
            status,
            submitted_by,
            metadata
          )
          SELECT
            $1,
            $2,
            $3,
            $4,
            $5::varchar(100),
            $6::varchar(150),
            $7,
            $8,
            $9,
            'SUBMITTED',
            $10,
            $11::jsonb
          FROM plugin_publishers publisher
          INNER JOIN plugin_publisher_keys signing_key
            ON signing_key.publisher_id =
              publisher.id
          WHERE publisher.id =
              $5::varchar(100)
            AND signing_key.key_id =
              $6::varchar(150)
            AND publisher.status = 'ACTIVE'
            AND signing_key.status = 'ACTIVE'
            AND publisher.revoked_at IS NULL
            AND signing_key.revoked_at IS NULL
            AND signing_key.valid_from <= NOW()
            AND (
              signing_key.valid_until IS NULL
              OR signing_key.valid_until > NOW()
            )
          RETURNING *
          `,
          [
            publicationId,
            input.pluginId,
            input.pluginName.trim(),
            input.version,
            input.publisherId,
            input.keyId,
            input.artifactStorageObjectId,
            input.artifactSha256,
            input.integritySha256,
            input.actorId,
            JSON.stringify(
              input.metadata ?? {},
            ),
          ],
        );

      if (!result.rows[0]) {
        throw new BadRequestException(
          'PLUGIN_PUBLICATION_PUBLISHER_KEY_NOT_ACTIVE',
        );
      }

      await this.insertEvent(
        client,
        publicationId,
        'SUBMITTED',
        undefined,
        'SUBMITTED',
        input.actorId,
        undefined,
        input.metadata,
      );

      await client.query('COMMIT');

      return this.mapPublication(
        result.rows[0],
      );
    } catch (error) {
      await client.query('ROLLBACK');

      if (
        this.isUniqueViolation(
          error
        )
      ) {
        throw new ConflictException(
          'PLUGIN_PUBLICATION_VERSION_IMMUTABLE',
        );
      }

      throw error;
    } finally {
      client.release();
    }
  }

  async transition(
    input: TransitionPluginPublication,
  ): Promise<PluginPublication> {
    this.validateTransitionInput(
      input,
    );

    const client =
      await this.pool.connect();

    try {
      await client.query('BEGIN');

      const currentResult =
        await client.query(
          `
          SELECT *
          FROM plugin_publications
          WHERE id = $1
          FOR UPDATE
          `,
          [
            input.publicationId,
          ],
        );

      const currentRow =
        currentResult.rows[0];

      if (!currentRow) {
        throw new NotFoundException(
          'PLUGIN_PUBLICATION_NOT_FOUND',
        );
      }

      const current =
        this.mapPublication(
          currentRow,
        );

      if (
        !TRANSITIONS[
          current.status
        ].includes(
          input.targetStatus,
        )
      ) {
        throw new ConflictException(
          `PLUGIN_PUBLICATION_TRANSITION_INVALID:${current.status}->${input.targetStatus}`,
        );
      }

      if (
        input.targetStatus ===
          'APPROVED'
      ) {
        await this.assertApprovalEligible(
          client,
          current,
          input.actorId,
        );
      }

      const eventType =
        this.eventType(
          current.status,
          input.targetStatus,
        );

      const result =
        await client.query(
          `
          UPDATE plugin_publications
          SET
            status = $2::varchar(30),
            reviewed_by =
              CASE
                WHEN $2::varchar(30) IN (
                  'APPROVED',
                  'REJECTED'
                )
                THEN $3
                ELSE reviewed_by
              END,
            reviewed_at =
              CASE
                WHEN $2::varchar(30) IN (
                  'APPROVED',
                  'REJECTED'
                )
                THEN NOW()
                ELSE reviewed_at
              END,
            decision_reason =
              CASE
                WHEN $2::varchar(30) IN (
                  'APPROVED',
                  'REJECTED'
                )
                THEN $4
                ELSE decision_reason
              END,
            quarantined_by =
              CASE
                WHEN $2::varchar(30) = 'QUARANTINED'
                THEN $3
                WHEN $2::varchar(30) = 'APPROVED'
                  AND status = 'QUARANTINED'
                THEN NULL
                ELSE quarantined_by
              END,
            quarantined_at =
              CASE
                WHEN $2::varchar(30) = 'QUARANTINED'
                THEN NOW()
                WHEN $2::varchar(30) = 'APPROVED'
                  AND status = 'QUARANTINED'
                THEN NULL
                ELSE quarantined_at
              END,
            quarantine_reason =
              CASE
                WHEN $2::varchar(30) = 'QUARANTINED'
                THEN $4
                WHEN $2::varchar(30) = 'APPROVED'
                  AND status = 'QUARANTINED'
                THEN NULL
                ELSE quarantine_reason
              END,
            revoked_by =
              CASE
                WHEN $2::varchar(30) = 'REVOKED'
                THEN $3
                ELSE revoked_by
              END,
            revoked_at =
              CASE
                WHEN $2::varchar(30) = 'REVOKED'
                THEN NOW()
                ELSE revoked_at
              END,
            revocation_reason =
              CASE
                WHEN $2::varchar(30) = 'REVOKED'
                THEN $4
                ELSE revocation_reason
              END,
            updated_at = NOW()
          WHERE id = $1
            AND status = $5::varchar(30)
          RETURNING *
          `,
          [
            input.publicationId,
            input.targetStatus,
            input.actorId,
            input.reason.trim(),
            current.status,
          ],
        );

      if (!result.rows[0]) {
        throw new ConflictException(
          'PLUGIN_PUBLICATION_CONCURRENT_TRANSITION',
        );
      }

      await this.insertEvent(
        client,
        input.publicationId,
        eventType,
        current.status,
        input.targetStatus,
        input.actorId,
        input.reason.trim(),
        input.metadata,
      );

      await client.query('COMMIT');

      return this.mapPublication(
        result.rows[0],
      );
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async get(
    publicationId: string,
  ): Promise<PluginPublication> {
    this.assertUuid(
      publicationId,
      'publication ID',
    );

    const result =
      await this.pool.query(
        `
        SELECT *
        FROM plugin_publications
        WHERE id = $1
        `,
        [
          publicationId,
        ],
      );

    if (!result.rows[0]) {
      throw new NotFoundException(
        'PLUGIN_PUBLICATION_NOT_FOUND',
      );
    }

    return this.mapPublication(
      result.rows[0],
    );
  }

  async listApproved():
    Promise<PluginPublication[]> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM plugin_publications
        WHERE status = 'APPROVED'
          AND quarantined_at IS NULL
          AND revoked_at IS NULL
        ORDER BY
          plugin_id ASC,
          submitted_at DESC
        `,
      );

    return result.rows.map(
      (row) =>
        this.mapPublication(row),
    );
  }

  async listEvents(
    publicationId: string,
  ): Promise<
    PluginPublicationSecurityEvent[]
  > {
    this.assertUuid(
      publicationId,
      'publication ID',
    );

    const result =
      await this.pool.query(
        `
        SELECT *
        FROM plugin_publication_security_events
        WHERE publication_id = $1
        ORDER BY created_at ASC, id ASC
        `,
        [
          publicationId,
        ],
      );

    return result.rows.map(
      (row) =>
        this.mapEvent(row),
    );
  }

  private async assertApprovalEligible(
    client: PoolClient,
    publication:
      PluginPublication,
    actorId: string,
  ): Promise<void> {
    if (
      publication.submittedBy ===
      actorId
    ) {
      throw new ConflictException(
        'PLUGIN_PUBLICATION_SELF_APPROVAL_FORBIDDEN',
      );
    }

    const result =
      await client.query(
        `
        SELECT EXISTS (
          SELECT 1
          FROM plugin_publishers
            AS publisher
          INNER JOIN
            plugin_publisher_keys
              AS signing_key
            ON signing_key.publisher_id =
              publisher.id
          WHERE publisher.id = $1
            AND signing_key.key_id = $2
            AND publisher.status = 'ACTIVE'
            AND signing_key.status = 'ACTIVE'
            AND publisher.revoked_at IS NULL
            AND signing_key.revoked_at IS NULL
            AND signing_key.valid_from <= NOW()
            AND (
              signing_key.valid_until IS NULL
              OR signing_key.valid_until > NOW()
            )
        ) AS eligible
        `,
        [
          publication.publisherId,
          publication.keyId,
        ],
      );

    if (
      result.rows[0]
        ?.eligible !== true
    ) {
      throw new ConflictException(
        'PLUGIN_PUBLICATION_PUBLISHER_KEY_NOT_ACTIVE',
      );
    }
  }

  private async insertEvent(
    client: PoolClient,
    publicationId: string,
    eventType:
      PluginPublicationEventType,
    fromStatus:
      PluginPublicationStatus |
      undefined,
    toStatus:
      PluginPublicationStatus,
    actorId: string,
    reason?: string,
    metadata?:
      Record<string, unknown>,
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
        $3,
        $4,
        $5,
        $6,
        $7,
        $8::jsonb
      )
      `,
      [
        randomUUID(),
        publicationId,
        eventType,
        fromStatus ?? null,
        toStatus,
        actorId,
        reason ?? null,
        JSON.stringify(
          metadata ?? {},
        ),
      ],
    );
  }

  private validateSubmission(
    input: SubmitPluginPublication,
  ): void {
    this.assertIdentifier(
      input.pluginId,
      'plugin ID',
    );
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
    this.assertUuid(
      input.artifactStorageObjectId,
      'artifact storage object ID',
    );

    if (
      !input.pluginName ||
      !input.pluginName.trim() ||
      input.pluginName.trim().length > 200
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLICATION_NAME_INVALID',
      );
    }

    if (!semver.valid(input.version)) {
      throw new BadRequestException(
        'PLUGIN_PUBLICATION_VERSION_INVALID',
      );
    }

    if (
      !SHA256_PATTERN.test(
        input.artifactSha256,
      ) ||
      !SHA256_PATTERN.test(
        input.integritySha256,
      )
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLICATION_CHECKSUM_INVALID',
      );
    }
  }

  private validateTransitionInput(
    input: TransitionPluginPublication,
  ): void {
    this.assertUuid(
      input.publicationId,
      'publication ID',
    );
    this.assertActor(
      input.actorId,
    );

    if (
      ![
        'APPROVED',
        'REJECTED',
        'QUARANTINED',
        'REVOKED',
      ].includes(
        input.targetStatus,
      )
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLICATION_TARGET_STATUS_INVALID',
      );
    }

    if (
      !input.reason ||
      !input.reason.trim() ||
      input.reason.trim().length > 2000
    ) {
      throw new BadRequestException(
        'PLUGIN_PUBLICATION_REASON_REQUIRED',
      );
    }
  }

  private eventType(
    fromStatus:
      PluginPublicationStatus,
    toStatus:
      PluginPublicationStatus,
  ): PluginPublicationEventType {
    if (
      fromStatus ===
        'QUARANTINED' &&
      toStatus ===
        'APPROVED'
    ) {
      return 'QUARANTINE_RELEASED';
    }

    return toStatus;
  }

  private assertIdentifier(
    value: string,
    label: string,
  ): void {
    if (
      !IDENTIFIER_PATTERN.test(
        value,
      )
    ) {
      throw new BadRequestException(
        `Invalid plugin publication ${label}`,
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
        'PLUGIN_PUBLICATION_ACTOR_INVALID',
      );
    }
  }

  private assertUuid(
    value: string,
    label: string,
  ): void {
    if (
      !UUID_PATTERN.test(value)
    ) {
      throw new BadRequestException(
        `Invalid plugin publication ${label}`,
      );
    }
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

  private mapPublication(
    row: any,
  ): PluginPublication {
    return {
      id:
        row.id,
      pluginId:
        row.plugin_id,
      pluginName:
        row.plugin_name,
      version:
        row.version,
      publisherId:
        row.publisher_id,
      keyId:
        row.key_id,
      artifactStorageObjectId:
        row.artifact_storage_object_id,
      artifactSha256:
        row.artifact_sha256,
      integritySha256:
        row.integrity_sha256,
      status:
        row.status,
      submittedBy:
        row.submitted_by,
      submittedAt:
        row.submitted_at,
      reviewedBy:
        row.reviewed_by ??
        undefined,
      reviewedAt:
        row.reviewed_at ??
        undefined,
      decisionReason:
        row.decision_reason ??
        undefined,
      quarantinedBy:
        row.quarantined_by ??
        undefined,
      quarantinedAt:
        row.quarantined_at ??
        undefined,
      quarantineReason:
        row.quarantine_reason ??
        undefined,
      revokedBy:
        row.revoked_by ??
        undefined,
      revokedAt:
        row.revoked_at ??
        undefined,
      revocationReason:
        row.revocation_reason ??
        undefined,
      metadata:
        row.metadata ?? {},
      updatedAt:
        row.updated_at,
    };
  }

  private mapEvent(
    row: any,
  ): PluginPublicationSecurityEvent {
    return {
      id:
        row.id,
      publicationId:
        row.publication_id,
      eventType:
        row.event_type,
      fromStatus:
        row.from_status ??
        undefined,
      toStatus:
        row.to_status,
      actorId:
        row.actor_id,
      reason:
        row.reason ??
        undefined,
      metadata:
        row.metadata ?? {},
      createdAt:
        row.created_at,
    };
  }
}
