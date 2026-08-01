import {
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  Pool,
} from 'pg';

import {
  POSTGRES_POOL,
} from '@propertyos/core-contracts';

import {
  Communication,
  CommunicationCategory,
  CommunicationDetails,
  CommunicationEngagementMetrics,
  CommunicationFilters,
  CommunicationMetrics,
  CommunicationRead,
  CommunicationStatusHistory,
  CommunicationTarget,
} from '../types/communications.types';

import {
  CommunicationsRepository,
} from './communications.repository';

@Injectable()
export class PostgresCommunicationsRepository
  implements CommunicationsRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async create(
    communication: Communication,
  ): Promise<Communication> {
    const result =
      await this.pool.query(
        `
        INSERT INTO communications (
          id,
          communication_number,
          property_id,
          category_id,
          communication_type,
          title,
          content,
          summary,
          priority,
          status,
          is_pinned,
          requires_acknowledgement,
          publish_at,
          published_at,
          expires_at,
          archived_at,
          cancelled_at,
          created_by_person_id,
          updated_by_person_id,
          published_by_person_id,
          archived_by_person_id,
          cancelled_by_person_id,
          created_at,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,
          $9,$10,$11,$12,$13,$14,$15,
          $16,$17,$18,$19,$20,$21,$22,
          $23,$24
        )
        RETURNING *
        `,
        [
          communication.id,
          communication.communicationNumber,
          communication.propertyId,
          communication.categoryId,
          communication.type,
          communication.title,
          communication.content,
          communication.summary ?? null,
          communication.priority,
          communication.status,
          communication.isPinned,
          communication.requiresAcknowledgement,
          communication.publishAt ?? null,
          communication.publishedAt ?? null,
          communication.expiresAt ?? null,
          communication.archivedAt ?? null,
          communication.cancelledAt ?? null,
          communication.createdByPersonId,
          communication.updatedByPersonId ?? null,
          communication.publishedByPersonId ?? null,
          communication.archivedByPersonId ?? null,
          communication.cancelledByPersonId ?? null,
          communication.createdAt,
          communication.updatedAt,
        ],
      );

    return this.mapCommunication(
      result.rows[0],
    );
  }

  async findById(
    id: string,
  ): Promise<Communication | null> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM communications
        WHERE id = $1
        `,
        [id],
      );

    return result.rows[0]
      ? this.mapCommunication(
          result.rows[0],
        )
      : null;
  }

  async findDetailsById(
    id: string,
  ): Promise<CommunicationDetails | null> {
    const communication =
      await this.findById(id);

    if (!communication) {
      return null;
    }

    const [
      category,
      targets,
      attachments,
      reads,
      deliveries,
      history,
    ] = await Promise.all([
      this.findCategoryById(
        communication.categoryId,
      ),
      this.listTargets(id),
      this.pool.query(
        `
        SELECT *
        FROM communication_attachments
        WHERE communication_id = $1
        ORDER BY created_at ASC
        `,
        [id],
      ),
      this.pool.query(
        `
        SELECT *
        FROM communication_reads
        WHERE communication_id = $1
        ORDER BY read_at ASC
        `,
        [id],
      ),
      this.pool.query(
        `
        SELECT *
        FROM communication_deliveries
        WHERE communication_id = $1
        ORDER BY created_at ASC
        `,
        [id],
      ),
      this.listHistory(id),
    ]);

    return {
      ...communication,
      category:
        category ?? undefined,
      targets,
      attachments:
        attachments.rows.map(
          (row) => ({
            id: row.id,
            communicationId:
              row.communication_id,
            documentId:
              row.document_id,
            uploadedByPersonId:
              row.uploaded_by_person_id,
            createdAt:
              row.created_at,
          }),
        ),
      reads:
        reads.rows.map(
          (row) => ({
            id: row.id,
            communicationId:
              row.communication_id,
            personId:
              row.person_id,
            readAt:
              row.read_at,
            acknowledgedAt:
              row.acknowledged_at ??
              undefined,
            createdAt:
              row.created_at,
          }),
        ),
      deliveries:
        deliveries.rows.map(
          (row) => ({
            id: row.id,
            communicationId:
              row.communication_id,
            personId:
              row.person_id ??
              undefined,
            channel:
              row.channel,
            status:
              row.status,
            providerMessageId:
              row.provider_message_id ??
              undefined,
            errorMessage:
              row.error_message ??
              undefined,
            queuedAt:
              row.queued_at ??
              undefined,
            sentAt:
              row.sent_at ??
              undefined,
            deliveredAt:
              row.delivered_at ??
              undefined,
            failedAt:
              row.failed_at ??
              undefined,
            createdAt:
              row.created_at,
            updatedAt:
              row.updated_at,
          }),
        ),
      history,
    };
  }

  async findAll(
    filters: CommunicationFilters = {},
  ): Promise<Communication[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    const addCondition = (
      column: string,
      value: unknown,
    ) => {
      values.push(value);
      conditions.push(
        `${column} = $${values.length}`,
      );
    };

    if (filters.propertyId) {
      addCondition(
        'property_id',
        filters.propertyId,
      );
    }

    if (filters.categoryId) {
      addCondition(
        'category_id',
        filters.categoryId,
      );
    }

    if (filters.type) {
      addCondition(
        'communication_type',
        filters.type,
      );
    }

    if (filters.priority) {
      addCondition(
        'priority',
        filters.priority,
      );
    }

    if (filters.status) {
      addCondition(
        'status',
        filters.status,
      );
    }

    if (filters.createdByPersonId) {
      addCondition(
        'created_by_person_id',
        filters.createdByPersonId,
      );
    }

    if (
      filters.isPinned !==
      undefined
    ) {
      addCondition(
        'is_pinned',
        filters.isPinned,
      );
    }

    if (filters.search) {
      values.push(
        `%${filters.search}%`,
      );

      conditions.push(
        `(
          communication_number
            ILIKE $${values.length}
          OR title
            ILIKE $${values.length}
          OR summary
            ILIKE $${values.length}
          OR content
            ILIKE $${values.length}
        )`,
      );
    }

    const where =
      conditions.length > 0
        ? `WHERE ${conditions.join(
            ' AND ',
          )}`
        : '';

    const result =
      await this.pool.query(
        `
        SELECT *
        FROM communications
        ${where}
        ORDER BY
          is_pinned DESC,
          created_at DESC
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.mapCommunication(row),
    );
  }

  async update(
    id: string,
    input: Partial<Communication>,
  ): Promise<Communication | null> {
    const current =
      await this.findById(id);

    if (!current) {
      return null;
    }

    const merged: Communication = {
      ...current,
      ...input,
      id: current.id,
      communicationNumber:
        current.communicationNumber,
      propertyId:
        current.propertyId,
      createdByPersonId:
        current.createdByPersonId,
      createdAt:
        current.createdAt,
      updatedAt:
        new Date(),
    };

    const result =
      await this.pool.query(
        `
        UPDATE communications
        SET
          category_id = $2,
          communication_type = $3,
          title = $4,
          content = $5,
          summary = $6,
          priority = $7,
          status = $8,
          is_pinned = $9,
          requires_acknowledgement = $10,
          publish_at = $11,
          published_at = $12,
          expires_at = $13,
          archived_at = $14,
          cancelled_at = $15,
          updated_by_person_id = $16,
          published_by_person_id = $17,
          archived_by_person_id = $18,
          cancelled_by_person_id = $19,
          updated_at = $20
        WHERE id = $1
        RETURNING *
        `,
        [
          id,
          merged.categoryId,
          merged.type,
          merged.title,
          merged.content,
          merged.summary ?? null,
          merged.priority,
          merged.status,
          merged.isPinned,
          merged.requiresAcknowledgement,
          merged.publishAt ?? null,
          merged.publishedAt ?? null,
          merged.expiresAt ?? null,
          merged.archivedAt ?? null,
          merged.cancelledAt ?? null,
          merged.updatedByPersonId ??
            null,
          merged.publishedByPersonId ??
            null,
          merged.archivedByPersonId ??
            null,
          merged.cancelledByPersonId ??
            null,
          merged.updatedAt,
        ],
      );

    return result.rows[0]
      ? this.mapCommunication(
          result.rows[0],
        )
      : null;
  }

  async replaceTargets(
    communicationId: string,
    targets: CommunicationTarget[],
  ): Promise<CommunicationTarget[]> {
    const client =
      await this.pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        `
        DELETE FROM communication_targets
        WHERE communication_id = $1
        `,
        [communicationId],
      );

      for (const target of targets) {
        await client.query(
          `
          INSERT INTO communication_targets (
            id,
            communication_id,
            audience_type,
            zone_id,
            space_id,
            person_id,
            role_id,
            created_at
          )
          VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8
          )
          `,
          [
            target.id,
            target.communicationId,
            target.audienceType,
            target.zoneId ?? null,
            target.spaceId ?? null,
            target.personId ?? null,
            target.roleId ?? null,
            target.createdAt,
          ],
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return this.listTargets(
      communicationId,
    );
  }

  async listTargets(
    communicationId: string,
  ): Promise<CommunicationTarget[]> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM communication_targets
        WHERE communication_id = $1
        ORDER BY created_at ASC
        `,
        [communicationId],
      );

    return result.rows.map(
      (row) => ({
        id: row.id,
        communicationId:
          row.communication_id,
        audienceType:
          row.audience_type,
        zoneId:
          row.zone_id ??
          undefined,
        spaceId:
          row.space_id ??
          undefined,
        personId:
          row.person_id ??
          undefined,
        roleId:
          row.role_id ??
          undefined,
        createdAt:
          row.created_at,
      }),
    );
  }

  async addHistory(
    history: CommunicationStatusHistory,
  ): Promise<CommunicationStatusHistory> {
    const result =
      await this.pool.query(
        `
        INSERT INTO communication_status_history (
          id,
          communication_id,
          from_status,
          to_status,
          changed_by_person_id,
          remarks,
          created_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING *
        `,
        [
          history.id,
          history.communicationId,
          history.fromStatus ?? null,
          history.toStatus,
          history.changedByPersonId,
          history.remarks ?? null,
          history.createdAt,
        ],
      );

    return this.mapHistory(
      result.rows[0],
    );
  }

  async listHistory(
    communicationId: string,
  ): Promise<CommunicationStatusHistory[]> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM communication_status_history
        WHERE communication_id = $1
        ORDER BY created_at ASC
        `,
        [communicationId],
      );

    return result.rows.map(
      (row) =>
        this.mapHistory(row),
    );
  }

  async markRead(
    communicationId: string,
    personId: string,
    readAt: Date,
  ): Promise<CommunicationRead> {
    const result =
      await this.pool.query(
        `
        INSERT INTO communication_reads (
          id,
          communication_id,
          person_id,
          read_at,
          created_at
        )
        VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          $3
        )
        ON CONFLICT (
          communication_id,
          person_id
        )
        DO UPDATE SET
          read_at =
            LEAST(
              communication_reads.read_at,
              EXCLUDED.read_at
            )
        RETURNING *
        `,
        [
          communicationId,
          personId,
          readAt,
        ],
      );

    return this.mapRead(
      result.rows[0],
    );
  }

  async acknowledge(
    communicationId: string,
    personId: string,
    acknowledgedAt: Date,
  ): Promise<CommunicationRead> {
    const result =
      await this.pool.query(
        `
        INSERT INTO communication_reads (
          id,
          communication_id,
          person_id,
          read_at,
          acknowledged_at,
          created_at
        )
        VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          $3,
          $3
        )
        ON CONFLICT (
          communication_id,
          person_id
        )
        DO UPDATE SET
          acknowledged_at =
            COALESCE(
              communication_reads.acknowledged_at,
              EXCLUDED.acknowledged_at
            ),
          read_at =
            LEAST(
              communication_reads.read_at,
              EXCLUDED.read_at
            )
        RETURNING *
        `,
        [
          communicationId,
          personId,
          acknowledgedAt,
        ],
      );

    return this.mapRead(
      result.rows[0],
    );
  }

  async listReads(
    communicationId: string,
  ): Promise<CommunicationRead[]> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM communication_reads
        WHERE communication_id = $1
        ORDER BY read_at ASC
        `,
        [communicationId],
      );

    return result.rows.map(
      (row) =>
        this.mapRead(row),
    );
  }

  async getEngagementMetrics(
    communicationId: string,
  ): Promise<CommunicationEngagementMetrics> {
    const result =
      await this.pool.query(
        `
        SELECT
          c.id AS communication_id,
          c.requires_acknowledgement,
          COUNT(cr.id) AS total_reads,
          COUNT(cr.id) FILTER (
            WHERE cr.acknowledged_at
              IS NOT NULL
          ) AS total_acknowledgements
        FROM communications c
        LEFT JOIN communication_reads cr
          ON cr.communication_id = c.id
        WHERE c.id = $1
        GROUP BY
          c.id,
          c.requires_acknowledgement
        `,
        [communicationId],
      );

    const row =
      result.rows[0];

    if (!row) {
      return {
        communicationId,
        totalReads: 0,
        totalAcknowledgements: 0,
        acknowledgementRequired: false,
      };
    }

    return {
      communicationId:
        row.communication_id,
      totalReads:
        Number(row.total_reads ?? 0),
      totalAcknowledgements:
        Number(
          row.total_acknowledgements ??
            0,
        ),
      acknowledgementRequired:
        row.requires_acknowledgement,
    };
  }

  async listCategories():
    Promise<CommunicationCategory[]> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM communication_categories
        WHERE is_active = TRUE
        ORDER BY name ASC
        `,
      );

    return result.rows.map(
      (row) =>
        this.mapCategory(row),
    );
  }

  async findCategoryById(
    id: string,
  ): Promise<CommunicationCategory | null> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM communication_categories
        WHERE id = $1
        `,
        [id],
      );

    return result.rows[0]
      ? this.mapCategory(
          result.rows[0],
        )
      : null;
  }

  async getMetrics(
    propertyId?: string,
  ): Promise<CommunicationMetrics> {
    const result =
      await this.pool.query(
        `
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (
            WHERE status = 'DRAFT'
          ) AS draft,
          COUNT(*) FILTER (
            WHERE status = 'SCHEDULED'
          ) AS scheduled,
          COUNT(*) FILTER (
            WHERE status = 'PUBLISHED'
          ) AS published,
          COUNT(*) FILTER (
            WHERE status = 'EXPIRED'
          ) AS expired,
          COUNT(*) FILTER (
            WHERE status = 'ARCHIVED'
          ) AS archived,
          COUNT(*) FILTER (
            WHERE status = 'CANCELLED'
          ) AS cancelled,
          COUNT(*) FILTER (
            WHERE priority = 'URGENT'
          ) AS urgent,
          COUNT(*) FILTER (
            WHERE is_pinned = TRUE
          ) AS pinned,
          COUNT(*) FILTER (
            WHERE requires_acknowledgement =
              TRUE
          ) AS acknowledgement_required
        FROM communications
        WHERE (
          $1::uuid IS NULL
          OR property_id = $1
        )
        `,
        [propertyId ?? null],
      );

    const row =
      result.rows[0] ?? {};

    return {
      total:
        Number(row.total ?? 0),
      draft:
        Number(row.draft ?? 0),
      scheduled:
        Number(row.scheduled ?? 0),
      published:
        Number(row.published ?? 0),
      expired:
        Number(row.expired ?? 0),
      archived:
        Number(row.archived ?? 0),
      cancelled:
        Number(row.cancelled ?? 0),
      urgent:
        Number(row.urgent ?? 0),
      pinned:
        Number(row.pinned ?? 0),
      acknowledgementRequired:
        Number(
          row.acknowledgement_required ??
            0,
        ),
    };
  }

  private mapCommunication(
    row: any,
  ): Communication {
    return {
      id: row.id,
      communicationNumber:
        row.communication_number,
      propertyId:
        row.property_id,
      categoryId:
        row.category_id,
      type:
        row.communication_type,
      title:
        row.title,
      content:
        row.content,
      summary:
        row.summary ?? undefined,
      priority:
        row.priority,
      status:
        row.status,
      isPinned:
        row.is_pinned,
      requiresAcknowledgement:
        row.requires_acknowledgement,
      publishAt:
        row.publish_at ??
        undefined,
      publishedAt:
        row.published_at ??
        undefined,
      expiresAt:
        row.expires_at ??
        undefined,
      archivedAt:
        row.archived_at ??
        undefined,
      cancelledAt:
        row.cancelled_at ??
        undefined,
      createdByPersonId:
        row.created_by_person_id,
      updatedByPersonId:
        row.updated_by_person_id ??
        undefined,
      publishedByPersonId:
        row.published_by_person_id ??
        undefined,
      archivedByPersonId:
        row.archived_by_person_id ??
        undefined,
      cancelledByPersonId:
        row.cancelled_by_person_id ??
        undefined,
      createdAt:
        row.created_at,
      updatedAt:
        row.updated_at,
    };
  }

  private mapCategory(
    row: any,
  ): CommunicationCategory {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description:
        row.description ??
        undefined,
      isActive:
        row.is_active,
      createdAt:
        row.created_at,
      updatedAt:
        row.updated_at,
    };
  }

  private mapRead(
    row: any,
  ): CommunicationRead {
    return {
      id: row.id,
      communicationId:
        row.communication_id,
      personId:
        row.person_id,
      readAt:
        row.read_at,
      acknowledgedAt:
        row.acknowledged_at ??
        undefined,
      createdAt:
        row.created_at,
    };
  }

  private mapHistory(
    row: any,
  ): CommunicationStatusHistory {
    return {
      id: row.id,
      communicationId:
        row.communication_id,
      fromStatus:
        row.from_status ??
        undefined,
      toStatus:
        row.to_status,
      changedByPersonId:
        row.changed_by_person_id,
      remarks:
        row.remarks ??
        undefined,
      createdAt:
        row.created_at,
    };
  }
}
