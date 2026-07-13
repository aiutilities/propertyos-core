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
  Vendor,
  VendorCategory,
  VendorComplianceDocument,
  VendorContact,
  VendorContract,
  VendorDetails,
  VendorFilters,
  VendorMetrics,
  VendorPropertyCoverage,
  VendorRating,
  VendorServiceCategory,
  VendorWorkOrder,
  VendorWorkOrderHistory,
} from '../types/vendor.types';

import {
  VendorRepository,
} from './vendor.repository';

@Injectable()
export class PostgresVendorRepository
  implements VendorRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async create(
    vendor: Vendor,
  ): Promise<Vendor> {
    const result =
      await this.pool.query(
        `
        INSERT INTO vendors (
          id,
          vendor_number,
          legal_name,
          display_name,
          vendor_type,
          status,
          email,
          phone,
          website,
          tax_identifier,
          pan_number,
          registration_number,
          address_line1,
          address_line2,
          city,
          state,
          country,
          postal_code,
          notes,
          metadata,
          created_by_person_id,
          updated_by_person_id,
          activated_at,
          suspended_at,
          blocked_at,
          archived_at,
          created_at,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,
          $9,$10,$11,$12,$13,$14,$15,
          $16,$17,$18,$19,$20,$21,$22,
          $23,$24,$25,$26,$27,$28
        )
        RETURNING *
        `,
        [
          vendor.id,
          vendor.vendorNumber,
          vendor.legalName,
          vendor.displayName,
          vendor.vendorType,
          vendor.status,
          vendor.email ?? null,
          vendor.phone ?? null,
          vendor.website ?? null,
          vendor.taxIdentifier ?? null,
          vendor.panNumber ?? null,
          vendor.registrationNumber ?? null,
          vendor.addressLine1 ?? null,
          vendor.addressLine2 ?? null,
          vendor.city ?? null,
          vendor.state ?? null,
          vendor.country ?? null,
          vendor.postalCode ?? null,
          vendor.notes ?? null,
          vendor.metadata,
          vendor.createdByPersonId,
          vendor.updatedByPersonId ?? null,
          vendor.activatedAt ?? null,
          vendor.suspendedAt ?? null,
          vendor.blockedAt ?? null,
          vendor.archivedAt ?? null,
          vendor.createdAt,
          vendor.updatedAt,
        ],
      );

    return this.mapVendor(
      result.rows[0],
    );
  }

  async findById(
    id: string,
  ): Promise<Vendor | null> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM vendors
        WHERE id = $1
        `,
        [id],
      );

    return result.rows[0]
      ? this.mapVendor(
          result.rows[0],
        )
      : null;
  }

  async findDetailsById(
    id: string,
  ): Promise<VendorDetails | null> {
    const vendor =
      await this.findById(id);

    if (!vendor) {
      return null;
    }

    const [
      contacts,
      propertyCoverage,
      serviceCategories,
      contracts,
      complianceDocuments,
      ratings,
    ] = await Promise.all([
      this.listContacts(id),
      this.listPropertyCoverage(id),
      this.listServiceCategories(id),

      this.pool.query(
        `
        SELECT *
        FROM vendor_contracts
        WHERE vendor_id = $1
        ORDER BY created_at DESC
        `,
        [id],
      ),

      this.pool.query(
        `
        SELECT *
        FROM vendor_compliance_documents
        WHERE vendor_id = $1
        ORDER BY created_at DESC
        `,
        [id],
      ),

      this.pool.query(
        `
        SELECT *
        FROM vendor_ratings
        WHERE vendor_id = $1
        ORDER BY created_at DESC
        `,
        [id],
      ),
    ]);

    return {
      ...vendor,
      contacts,
      propertyCoverage,
      serviceCategories,
      contracts:
        contracts.rows.map(
          (row) => ({
            id: row.id,
            contractNumber:
              row.contract_number,
            vendorId:
              row.vendor_id,
            propertyId:
              row.property_id ??
              undefined,
            contractType:
              row.contract_type,
            title:
              row.title,
            description:
              row.description ??
              undefined,
            status:
              row.status,
            startDate:
              row.start_date,
            endDate:
              row.end_date,
            contractValue:
              row.contract_value === null
                ? undefined
                : Number(
                    row.contract_value,
                  ),
            currency:
              row.currency,
            responseSlaMinutes:
              row.response_sla_minutes ??
              undefined,
            resolutionSlaMinutes:
              row.resolution_sla_minutes ??
              undefined,
            autoRenew:
              row.auto_renew,
            renewalNoticeDays:
              row.renewal_notice_days,
            createdByPersonId:
              row.created_by_person_id,
            approvedByPersonId:
              row.approved_by_person_id ??
              undefined,
            terminatedByPersonId:
              row.terminated_by_person_id ??
              undefined,
            activatedAt:
              row.activated_at ??
              undefined,
            terminatedAt:
              row.terminated_at ??
              undefined,
            renewedAt:
              row.renewed_at ??
              undefined,
            createdAt:
              row.created_at,
            updatedAt:
              row.updated_at,
          }),
        ),

      complianceDocuments:
        complianceDocuments.rows.map(
          (row) => ({
            id: row.id,
            vendorId:
              row.vendor_id,
            complianceType:
              row.compliance_type,
            documentId:
              row.document_id,
            referenceNumber:
              row.reference_number ??
              undefined,
            issuedAt:
              row.issued_at ??
              undefined,
            expiresAt:
              row.expires_at ??
              undefined,
            status:
              row.status,
            verifiedByPersonId:
              row.verified_by_person_id ??
              undefined,
            verifiedAt:
              row.verified_at ??
              undefined,
            remarks:
              row.remarks ??
              undefined,
            createdAt:
              row.created_at,
            updatedAt:
              row.updated_at,
          }),
        ),

      ratings:
        ratings.rows.map(
          (row) => ({
            id: row.id,
            vendorId:
              row.vendor_id,
            workOrderId:
              row.work_order_id ??
              undefined,
            propertyId:
              row.property_id ??
              undefined,
            ratedByPersonId:
              row.rated_by_person_id,
            rating:
              row.rating,
            qualityRating:
              row.quality_rating ??
              undefined,
            timelinessRating:
              row.timeliness_rating ??
              undefined,
            professionalismRating:
              row.professionalism_rating ??
              undefined,
            comments:
              row.comments ??
              undefined,
            createdAt:
              row.created_at,
          }),
        ),
    };
  }

  async findAll(
    filters: VendorFilters = {},
  ): Promise<Vendor[]> {
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

    if (filters.status) {
      addCondition(
        'v.status',
        filters.status,
      );
    }

    if (filters.vendorType) {
      addCondition(
        'v.vendor_type',
        filters.vendorType,
      );
    }

    if (filters.categoryId) {
      values.push(
        filters.categoryId,
      );

      conditions.push(
        `
        EXISTS (
          SELECT 1
          FROM vendor_service_categories vsc
          WHERE vsc.vendor_id = v.id
            AND vsc.category_id =
              $${values.length}
            AND vsc.is_active = TRUE
        )
        `,
      );
    }

    if (filters.propertyId) {
      values.push(
        filters.propertyId,
      );

      conditions.push(
        `
        EXISTS (
          SELECT 1
          FROM vendor_property_coverage vpc
          WHERE vpc.vendor_id = v.id
            AND vpc.property_id =
              $${values.length}
            AND vpc.is_active = TRUE
        )
        `,
      );
    }

    if (filters.search) {
      values.push(
        `%${filters.search}%`,
      );

      conditions.push(
        `(
          v.vendor_number
            ILIKE $${values.length}
          OR v.legal_name
            ILIKE $${values.length}
          OR v.display_name
            ILIKE $${values.length}
          OR v.email
            ILIKE $${values.length}
          OR v.phone
            ILIKE $${values.length}
          OR v.city
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
        SELECT v.*
        FROM vendors v
        ${where}
        ORDER BY
          v.display_name ASC,
          v.created_at DESC
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.mapVendor(row),
    );
  }

  async update(
    id: string,
    input: Partial<Vendor>,
  ): Promise<Vendor | null> {
    const current =
      await this.findById(id);

    if (!current) {
      return null;
    }

    const merged: Vendor = {
      ...current,
      ...input,
      id:
        current.id,
      vendorNumber:
        current.vendorNumber,
      createdByPersonId:
        current.createdByPersonId,
      createdAt:
        current.createdAt,
      updatedAt:
        new Date(),
      metadata:
        input.metadata ??
        current.metadata,
    };

    const result =
      await this.pool.query(
        `
        UPDATE vendors
        SET
          legal_name = $2,
          display_name = $3,
          vendor_type = $4,
          status = $5,
          email = $6,
          phone = $7,
          website = $8,
          tax_identifier = $9,
          pan_number = $10,
          registration_number = $11,
          address_line1 = $12,
          address_line2 = $13,
          city = $14,
          state = $15,
          country = $16,
          postal_code = $17,
          notes = $18,
          metadata = $19,
          updated_by_person_id = $20,
          activated_at = $21,
          suspended_at = $22,
          blocked_at = $23,
          archived_at = $24,
          updated_at = $25
        WHERE id = $1
        RETURNING *
        `,
        [
          id,
          merged.legalName,
          merged.displayName,
          merged.vendorType,
          merged.status,
          merged.email ?? null,
          merged.phone ?? null,
          merged.website ?? null,
          merged.taxIdentifier ?? null,
          merged.panNumber ?? null,
          merged.registrationNumber ?? null,
          merged.addressLine1 ?? null,
          merged.addressLine2 ?? null,
          merged.city ?? null,
          merged.state ?? null,
          merged.country ?? null,
          merged.postalCode ?? null,
          merged.notes ?? null,
          merged.metadata,
          merged.updatedByPersonId ?? null,
          merged.activatedAt ?? null,
          merged.suspendedAt ?? null,
          merged.blockedAt ?? null,
          merged.archivedAt ?? null,
          merged.updatedAt,
        ],
      );

    return result.rows[0]
      ? this.mapVendor(
          result.rows[0],
        )
      : null;
  }

  async replaceContacts(
    vendorId: string,
    contacts: VendorContact[],
  ): Promise<VendorContact[]> {
    const client =
      await this.pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        `
        DELETE FROM vendor_contacts
        WHERE vendor_id = $1
        `,
        [vendorId],
      );

      for (
        const contact
        of contacts
      ) {
        await client.query(
          `
          INSERT INTO vendor_contacts (
            id,
            vendor_id,
            contact_type,
            name,
            designation,
            email,
            phone,
            is_primary,
            is_active,
            created_at,
            updated_at
          )
          VALUES (
            $1,$2,$3,$4,$5,$6,
            $7,$8,$9,$10,$11
          )
          `,
          [
            contact.id,
            contact.vendorId,
            contact.contactType,
            contact.name,
            contact.designation ?? null,
            contact.email ?? null,
            contact.phone ?? null,
            contact.isPrimary,
            contact.isActive,
            contact.createdAt,
            contact.updatedAt,
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

    return this.listContacts(
      vendorId,
    );
  }

  async listContacts(
    vendorId: string,
  ): Promise<VendorContact[]> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM vendor_contacts
        WHERE vendor_id = $1
          AND is_active = TRUE
        ORDER BY
          is_primary DESC,
          name ASC
        `,
        [vendorId],
      );

    return result.rows.map(
      (row) => ({
        id:
          row.id,
        vendorId:
          row.vendor_id,
        contactType:
          row.contact_type,
        name:
          row.name,
        designation:
          row.designation ??
          undefined,
        email:
          row.email ??
          undefined,
        phone:
          row.phone ??
          undefined,
        isPrimary:
          row.is_primary,
        isActive:
          row.is_active,
        createdAt:
          row.created_at,
        updatedAt:
          row.updated_at,
      }),
    );
  }

  async replacePropertyCoverage(
    vendorId: string,
    coverage: VendorPropertyCoverage[],
  ): Promise<VendorPropertyCoverage[]> {
    const client =
      await this.pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        `
        DELETE FROM vendor_property_coverage
        WHERE vendor_id = $1
        `,
        [vendorId],
      );

      for (
        const item
        of coverage
      ) {
        await client.query(
          `
          INSERT INTO vendor_property_coverage (
            id,
            vendor_id,
            property_id,
            zone_id,
            is_active,
            created_at
          )
          VALUES (
            $1,$2,$3,$4,$5,$6
          )
          `,
          [
            item.id,
            item.vendorId,
            item.propertyId,
            item.zoneId ?? null,
            item.isActive,
            item.createdAt,
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

    return this.listPropertyCoverage(
      vendorId,
    );
  }

  async listPropertyCoverage(
    vendorId: string,
  ): Promise<VendorPropertyCoverage[]> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM vendor_property_coverage
        WHERE vendor_id = $1
          AND is_active = TRUE
        ORDER BY created_at ASC
        `,
        [vendorId],
      );

    return result.rows.map(
      (row) => ({
        id:
          row.id,
        vendorId:
          row.vendor_id,
        propertyId:
          row.property_id,
        zoneId:
          row.zone_id ??
          undefined,
        isActive:
          row.is_active,
        createdAt:
          row.created_at,
      }),
    );
  }

  async replaceServiceCategories(
    vendorId: string,
    categories: VendorServiceCategory[],
  ): Promise<VendorServiceCategory[]> {
    const client =
      await this.pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        `
        DELETE FROM vendor_service_categories
        WHERE vendor_id = $1
        `,
        [vendorId],
      );

      for (
        const category
        of categories
      ) {
        await client.query(
          `
          INSERT INTO vendor_service_categories (
            id,
            vendor_id,
            category_id,
            notes,
            is_active,
            created_at
          )
          VALUES (
            $1,$2,$3,$4,$5,$6
          )
          `,
          [
            category.id,
            category.vendorId,
            category.categoryId,
            category.notes ?? null,
            category.isActive,
            category.createdAt,
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

    return this.listServiceCategories(
      vendorId,
    );
  }

  async listServiceCategories(
    vendorId: string,
  ): Promise<VendorServiceCategory[]> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM vendor_service_categories
        WHERE vendor_id = $1
          AND is_active = TRUE
        ORDER BY created_at ASC
        `,
        [vendorId],
      );

    return result.rows.map(
      (row) => ({
        id:
          row.id,
        vendorId:
          row.vendor_id,
        categoryId:
          row.category_id,
        notes:
          row.notes ??
          undefined,
        isActive:
          row.is_active,
        createdAt:
          row.created_at,
      }),
    );
  }

  async createRating(
    rating: VendorRating,
  ): Promise<VendorRating> {
    const result =
      await this.pool.query(
        `
        INSERT INTO vendor_ratings (
          id,
          vendor_id,
          work_order_id,
          property_id,
          rated_by_person_id,
          rating,
          quality_rating,
          timeliness_rating,
          professionalism_rating,
          comments,
          created_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,
          $7,$8,$9,$10,$11
        )
        RETURNING *
        `,
        [
          rating.id,
          rating.vendorId,
          rating.workOrderId ?? null,
          rating.propertyId ?? null,
          rating.ratedByPersonId,
          rating.rating,
          rating.qualityRating ?? null,
          rating.timelinessRating ?? null,
          rating.professionalismRating ?? null,
          rating.comments ?? null,
          rating.createdAt,
        ],
      );

    return this.mapRating(
      result.rows[0],
    );
  }

  async listRatings(
    vendorId: string,
  ): Promise<VendorRating[]> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM vendor_ratings
        WHERE vendor_id = $1
        ORDER BY created_at DESC
        `,
        [vendorId],
      );

    return result.rows.map(
      (row) =>
        this.mapRating(row),
    );
  }

  async findRatingByWorkOrderAndPerson(
    vendorId: string,
    workOrderId: string,
    ratedByPersonId: string,
  ): Promise<VendorRating | null> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM vendor_ratings
        WHERE vendor_id = $1
          AND work_order_id = $2
          AND rated_by_person_id = $3
        LIMIT 1
        `,
        [
          vendorId,
          workOrderId,
          ratedByPersonId,
        ],
      );

    return result.rows[0]
      ? this.mapRating(
          result.rows[0],
        )
      : null;
  }

  async getRatingSummary(
    vendorId: string,
  ): Promise<{
    count: number;
    averageRating: number;
    averageQualityRating: number;
    averageTimelinessRating: number;
    averageProfessionalismRating: number;
  }> {
    const result =
      await this.pool.query(
        `
        SELECT
          COUNT(*) AS rating_count,
          COALESCE(
            AVG(rating),
            0
          ) AS average_rating,
          COALESCE(
            AVG(quality_rating),
            0
          ) AS average_quality_rating,
          COALESCE(
            AVG(timeliness_rating),
            0
          ) AS average_timeliness_rating,
          COALESCE(
            AVG(professionalism_rating),
            0
          ) AS average_professionalism_rating
        FROM vendor_ratings
        WHERE vendor_id = $1
        `,
        [vendorId],
      );

    const row =
      result.rows[0] ?? {};

    return {
      count:
        Number(
          row.rating_count ?? 0,
        ),

      averageRating:
        Number(
          Number(
            row.average_rating ?? 0,
          ).toFixed(2),
        ),

      averageQualityRating:
        Number(
          Number(
            row.average_quality_rating ?? 0,
          ).toFixed(2),
        ),

      averageTimelinessRating:
        Number(
          Number(
            row.average_timeliness_rating ?? 0,
          ).toFixed(2),
        ),

      averageProfessionalismRating:
        Number(
          Number(
            row.average_professionalism_rating ?? 0,
          ).toFixed(2),
        ),
    };
  }

  async createWorkOrder(
    workOrder: VendorWorkOrder,
  ): Promise<VendorWorkOrder> {
    const result =
      await this.pool.query(
        `
        INSERT INTO vendor_work_orders (
          id,
          work_order_number,
          vendor_id,
          property_id,
          zone_id,
          space_id,
          contract_id,
          maintenance_ticket_id,
          helpdesk_ticket_id,
          facility_asset_id,
          title,
          description,
          priority,
          status,
          scheduled_start_at,
          scheduled_end_at,
          actual_start_at,
          actual_end_at,
          estimated_cost,
          actual_cost,
          currency,
          assigned_by_person_id,
          accepted_by_person_id,
          completed_by_person_id,
          cancelled_by_person_id,
          completion_notes,
          cancellation_reason,
          created_at,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,
          $9,$10,$11,$12,$13,$14,$15,
          $16,$17,$18,$19,$20,$21,$22,
          $23,$24,$25,$26,$27,$28,$29
        )
        RETURNING *
        `,
        [
          workOrder.id,
          workOrder.workOrderNumber,
          workOrder.vendorId,
          workOrder.propertyId,
          workOrder.zoneId ?? null,
          workOrder.spaceId ?? null,
          workOrder.contractId ?? null,
          workOrder.maintenanceTicketId ?? null,
          workOrder.helpdeskTicketId ?? null,
          workOrder.facilityAssetId ?? null,
          workOrder.title,
          workOrder.description,
          workOrder.priority,
          workOrder.status,
          workOrder.scheduledStartAt ?? null,
          workOrder.scheduledEndAt ?? null,
          workOrder.actualStartAt ?? null,
          workOrder.actualEndAt ?? null,
          workOrder.estimatedCost ?? null,
          workOrder.actualCost ?? null,
          workOrder.currency,
          workOrder.assignedByPersonId,
          workOrder.acceptedByPersonId ?? null,
          workOrder.completedByPersonId ?? null,
          workOrder.cancelledByPersonId ?? null,
          workOrder.completionNotes ?? null,
          workOrder.cancellationReason ?? null,
          workOrder.createdAt,
          workOrder.updatedAt,
        ],
      );

    return this.mapWorkOrder(
      result.rows[0],
    );
  }

  async findWorkOrderById(
    id: string,
  ): Promise<VendorWorkOrder | null> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM vendor_work_orders
        WHERE id = $1
        `,
        [id],
      );

    return result.rows[0]
      ? this.mapWorkOrder(
          result.rows[0],
        )
      : null;
  }

  async listWorkOrders(
    filters: {
      vendorId?: string;
      propertyId?: string;
      contractId?: string;
      status?: string;
      priority?: string;
      search?: string;
    } = {},
  ): Promise<VendorWorkOrder[]> {
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

    if (filters.vendorId) {
      addCondition(
        'vendor_id',
        filters.vendorId,
      );
    }

    if (filters.propertyId) {
      addCondition(
        'property_id',
        filters.propertyId,
      );
    }

    if (filters.contractId) {
      addCondition(
        'contract_id',
        filters.contractId,
      );
    }

    if (filters.status) {
      addCondition(
        'status',
        filters.status,
      );
    }

    if (filters.priority) {
      addCondition(
        'priority',
        filters.priority,
      );
    }

    if (filters.search) {
      values.push(
        `%${filters.search}%`,
      );

      conditions.push(
        `(
          work_order_number
            ILIKE $${values.length}
          OR title
            ILIKE $${values.length}
          OR description
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
        FROM vendor_work_orders
        ${where}
        ORDER BY
          created_at DESC
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.mapWorkOrder(row),
    );
  }

  async updateWorkOrder(
    id: string,
    input: Partial<VendorWorkOrder>,
  ): Promise<VendorWorkOrder | null> {
    const current =
      await this.findWorkOrderById(id);

    if (!current) {
      return null;
    }

    const merged: VendorWorkOrder = {
      ...current,
      ...input,
      id:
        current.id,
      workOrderNumber:
        current.workOrderNumber,
      vendorId:
        current.vendorId,
      propertyId:
        current.propertyId,
      assignedByPersonId:
        current.assignedByPersonId,
      createdAt:
        current.createdAt,
      updatedAt:
        new Date(),
    };

    const result =
      await this.pool.query(
        `
        UPDATE vendor_work_orders
        SET
          zone_id = $2,
          space_id = $3,
          contract_id = $4,
          maintenance_ticket_id = $5,
          helpdesk_ticket_id = $6,
          facility_asset_id = $7,
          title = $8,
          description = $9,
          priority = $10,
          status = $11,
          scheduled_start_at = $12,
          scheduled_end_at = $13,
          actual_start_at = $14,
          actual_end_at = $15,
          estimated_cost = $16,
          actual_cost = $17,
          currency = $18,
          accepted_by_person_id = $19,
          completed_by_person_id = $20,
          cancelled_by_person_id = $21,
          completion_notes = $22,
          cancellation_reason = $23,
          updated_at = $24
        WHERE id = $1
        RETURNING *
        `,
        [
          id,
          merged.zoneId ?? null,
          merged.spaceId ?? null,
          merged.contractId ?? null,
          merged.maintenanceTicketId ?? null,
          merged.helpdeskTicketId ?? null,
          merged.facilityAssetId ?? null,
          merged.title,
          merged.description,
          merged.priority,
          merged.status,
          merged.scheduledStartAt ?? null,
          merged.scheduledEndAt ?? null,
          merged.actualStartAt ?? null,
          merged.actualEndAt ?? null,
          merged.estimatedCost ?? null,
          merged.actualCost ?? null,
          merged.currency,
          merged.acceptedByPersonId ?? null,
          merged.completedByPersonId ?? null,
          merged.cancelledByPersonId ?? null,
          merged.completionNotes ?? null,
          merged.cancellationReason ?? null,
          merged.updatedAt,
        ],
      );

    return result.rows[0]
      ? this.mapWorkOrder(
          result.rows[0],
        )
      : null;
  }

  async addWorkOrderHistory(
    history: VendorWorkOrderHistory,
  ): Promise<VendorWorkOrderHistory> {
    const result =
      await this.pool.query(
        `
        INSERT INTO vendor_work_order_history (
          id,
          work_order_id,
          from_status,
          to_status,
          changed_by_person_id,
          remarks,
          created_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7
        )
        RETURNING *
        `,
        [
          history.id,
          history.workOrderId,
          history.fromStatus ?? null,
          history.toStatus,
          history.changedByPersonId,
          history.remarks ?? null,
          history.createdAt,
        ],
      );

    return this.mapWorkOrderHistory(
      result.rows[0],
    );
  }

  async listWorkOrderHistory(
    workOrderId: string,
  ): Promise<VendorWorkOrderHistory[]> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM vendor_work_order_history
        WHERE work_order_id = $1
        ORDER BY created_at ASC
        `,
        [workOrderId],
      );

    return result.rows.map(
      (row) =>
        this.mapWorkOrderHistory(
          row,
        ),
    );
  }

  async createComplianceDocument(
    document: VendorComplianceDocument,
  ): Promise<VendorComplianceDocument> {
    const result =
      await this.pool.query(
        `
        INSERT INTO vendor_compliance_documents (
          id,
          vendor_id,
          compliance_type,
          document_id,
          reference_number,
          issued_at,
          expires_at,
          status,
          verified_by_person_id,
          verified_at,
          remarks,
          created_at,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,
          $8,$9,$10,$11,$12,$13
        )
        RETURNING *
        `,
        [
          document.id,
          document.vendorId,
          document.complianceType,
          document.documentId,
          document.referenceNumber ?? null,
          document.issuedAt ?? null,
          document.expiresAt ?? null,
          document.status,
          document.verifiedByPersonId ?? null,
          document.verifiedAt ?? null,
          document.remarks ?? null,
          document.createdAt,
          document.updatedAt,
        ],
      );

    return this.mapComplianceDocument(
      result.rows[0],
    );
  }

  async findComplianceDocumentById(
    id: string,
  ): Promise<VendorComplianceDocument | null> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM vendor_compliance_documents
        WHERE id = $1
        `,
        [id],
      );

    return result.rows[0]
      ? this.mapComplianceDocument(
          result.rows[0],
        )
      : null;
  }

  async listComplianceDocuments(
    filters: {
      vendorId?: string;
      complianceType?: string;
      status?: string;
      expiringBefore?: Date;
    } = {},
  ): Promise<VendorComplianceDocument[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    const addCondition = (
      expression: string,
      value: unknown,
    ) => {
      values.push(value);

      conditions.push(
        `${expression} $${values.length}`,
      );
    };

    if (filters.vendorId) {
      addCondition(
        'vendor_id =',
        filters.vendorId,
      );
    }

    if (filters.complianceType) {
      addCondition(
        'compliance_type =',
        filters.complianceType,
      );
    }

    if (filters.status) {
      addCondition(
        'status =',
        filters.status,
      );
    }

    if (filters.expiringBefore) {
      addCondition(
        'expires_at <=',
        filters.expiringBefore,
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
        FROM vendor_compliance_documents
        ${where}
        ORDER BY
          expires_at ASC NULLS LAST,
          created_at DESC
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.mapComplianceDocument(
          row,
        ),
    );
  }

  async updateComplianceDocument(
    id: string,
    input: Partial<VendorComplianceDocument>,
  ): Promise<VendorComplianceDocument | null> {
    const current =
      await this.findComplianceDocumentById(
        id,
      );

    if (!current) {
      return null;
    }

    const merged: VendorComplianceDocument = {
      ...current,
      ...input,
      id:
        current.id,
      vendorId:
        current.vendorId,
      documentId:
        current.documentId,
      createdAt:
        current.createdAt,
      updatedAt:
        new Date(),
    };

    const result =
      await this.pool.query(
        `
        UPDATE vendor_compliance_documents
        SET
          compliance_type = $2,
          reference_number = $3,
          issued_at = $4,
          expires_at = $5,
          status = $6,
          verified_by_person_id = $7,
          verified_at = $8,
          remarks = $9,
          updated_at = $10
        WHERE id = $1
        RETURNING *
        `,
        [
          id,
          merged.complianceType,
          merged.referenceNumber ?? null,
          merged.issuedAt ?? null,
          merged.expiresAt ?? null,
          merged.status,
          merged.verifiedByPersonId ?? null,
          merged.verifiedAt ?? null,
          merged.remarks ?? null,
          merged.updatedAt,
        ],
      );

    return result.rows[0]
      ? this.mapComplianceDocument(
          result.rows[0],
        )
      : null;
  }

  async createContract(
    contract: VendorContract,
  ): Promise<VendorContract> {
    const result =
      await this.pool.query(
        `
        INSERT INTO vendor_contracts (
          id,
          contract_number,
          vendor_id,
          property_id,
          contract_type,
          title,
          description,
          status,
          start_date,
          end_date,
          contract_value,
          currency,
          response_sla_minutes,
          resolution_sla_minutes,
          auto_renew,
          renewal_notice_days,
          created_by_person_id,
          approved_by_person_id,
          terminated_by_person_id,
          activated_at,
          terminated_at,
          renewed_at,
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
          contract.id,
          contract.contractNumber,
          contract.vendorId,
          contract.propertyId ?? null,
          contract.contractType,
          contract.title,
          contract.description ?? null,
          contract.status,
          contract.startDate,
          contract.endDate,
          contract.contractValue ?? null,
          contract.currency,
          contract.responseSlaMinutes ?? null,
          contract.resolutionSlaMinutes ?? null,
          contract.autoRenew,
          contract.renewalNoticeDays,
          contract.createdByPersonId,
          contract.approvedByPersonId ?? null,
          contract.terminatedByPersonId ?? null,
          contract.activatedAt ?? null,
          contract.terminatedAt ?? null,
          contract.renewedAt ?? null,
          contract.createdAt,
          contract.updatedAt,
        ],
      );

    return this.mapContract(
      result.rows[0],
    );
  }

  async findContractById(
    id: string,
  ): Promise<VendorContract | null> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM vendor_contracts
        WHERE id = $1
        `,
        [id],
      );

    return result.rows[0]
      ? this.mapContract(
          result.rows[0],
        )
      : null;
  }

  async listContracts(
    filters: {
      vendorId?: string;
      propertyId?: string;
      status?: string;
      search?: string;
    } = {},
  ): Promise<VendorContract[]> {
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

    if (filters.vendorId) {
      addCondition(
        'vendor_id',
        filters.vendorId,
      );
    }

    if (filters.propertyId) {
      addCondition(
        'property_id',
        filters.propertyId,
      );
    }

    if (filters.status) {
      addCondition(
        'status',
        filters.status,
      );
    }

    if (filters.search) {
      values.push(
        `%${filters.search}%`,
      );

      conditions.push(
        `(
          contract_number
            ILIKE $${values.length}
          OR title
            ILIKE $${values.length}
          OR description
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
        FROM vendor_contracts
        ${where}
        ORDER BY
          end_date ASC,
          created_at DESC
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.mapContract(row),
    );
  }

  async updateContract(
    id: string,
    input: Partial<VendorContract>,
  ): Promise<VendorContract | null> {
    const current =
      await this.findContractById(id);

    if (!current) {
      return null;
    }

    const merged: VendorContract = {
      ...current,
      ...input,
      id:
        current.id,
      contractNumber:
        current.contractNumber,
      vendorId:
        current.vendorId,
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
        UPDATE vendor_contracts
        SET
          property_id = $2,
          contract_type = $3,
          title = $4,
          description = $5,
          status = $6,
          start_date = $7,
          end_date = $8,
          contract_value = $9,
          currency = $10,
          response_sla_minutes = $11,
          resolution_sla_minutes = $12,
          auto_renew = $13,
          renewal_notice_days = $14,
          approved_by_person_id = $15,
          terminated_by_person_id = $16,
          activated_at = $17,
          terminated_at = $18,
          renewed_at = $19,
          updated_at = $20
        WHERE id = $1
        RETURNING *
        `,
        [
          id,
          merged.propertyId ?? null,
          merged.contractType,
          merged.title,
          merged.description ?? null,
          merged.status,
          merged.startDate,
          merged.endDate,
          merged.contractValue ?? null,
          merged.currency,
          merged.responseSlaMinutes ?? null,
          merged.resolutionSlaMinutes ?? null,
          merged.autoRenew,
          merged.renewalNoticeDays,
          merged.approvedByPersonId ?? null,
          merged.terminatedByPersonId ?? null,
          merged.activatedAt ?? null,
          merged.terminatedAt ?? null,
          merged.renewedAt ?? null,
          merged.updatedAt,
        ],
      );

    return result.rows[0]
      ? this.mapContract(
          result.rows[0],
        )
      : null;
  }

  async listCategories():
    Promise<VendorCategory[]> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM vendor_categories
        WHERE is_active = TRUE
        ORDER BY name ASC
        `,
      );

    return result.rows.map(
      (row) => ({
        id:
          row.id,
        code:
          row.code,
        name:
          row.name,
        description:
          row.description ??
          undefined,
        isActive:
          row.is_active,
        createdAt:
          row.created_at,
        updatedAt:
          row.updated_at,
      }),
    );
  }

  async findCategoryById(
    id: string,
  ): Promise<VendorCategory | null> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM vendor_categories
        WHERE id = $1
        `,
        [id],
      );

    return result.rows[0]
      ? {
          id:
            result.rows[0].id,
          code:
            result.rows[0].code,
          name:
            result.rows[0].name,
          description:
            result.rows[0]
              .description ??
            undefined,
          isActive:
            result.rows[0]
              .is_active,
          createdAt:
            result.rows[0]
              .created_at,
          updatedAt:
            result.rows[0]
              .updated_at,
        }
      : null;
  }

  async getMetrics():
    Promise<VendorMetrics> {
    const result =
      await this.pool.query(
        `
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (
            WHERE status = 'DRAFT'
          ) AS draft,
          COUNT(*) FILTER (
            WHERE status = 'ACTIVE'
          ) AS active,
          COUNT(*) FILTER (
            WHERE status = 'SUSPENDED'
          ) AS suspended,
          COUNT(*) FILTER (
            WHERE status = 'BLOCKED'
          ) AS blocked,
          COUNT(*) FILTER (
            WHERE status = 'ARCHIVED'
          ) AS archived,

          (
            SELECT COUNT(*)
            FROM vendor_contracts
            WHERE status = 'ACTIVE'
              AND end_date
                BETWEEN CURRENT_DATE
                AND CURRENT_DATE + 30
          ) AS contracts_expiring,

          (
            SELECT COUNT(*)
            FROM vendor_compliance_documents
            WHERE status = 'VERIFIED'
              AND expires_at
                BETWEEN CURRENT_DATE
                AND CURRENT_DATE + 30
          ) AS compliance_expiring,

          (
            SELECT COUNT(*)
            FROM vendor_compliance_documents
            WHERE status = 'EXPIRED'
              OR (
                expires_at IS NOT NULL
                AND expires_at < CURRENT_DATE
              )
          ) AS compliance_expired,

          (
            SELECT COUNT(*)
            FROM vendor_work_orders
            WHERE status IN (
              'ISSUED',
              'ACCEPTED',
              'IN_PROGRESS',
              'ON_HOLD'
            )
          ) AS open_work_orders
        FROM vendors
        `,
      );

    const row =
      result.rows[0] ?? {};

    return {
      total:
        Number(row.total ?? 0),
      draft:
        Number(row.draft ?? 0),
      active:
        Number(row.active ?? 0),
      suspended:
        Number(row.suspended ?? 0),
      blocked:
        Number(row.blocked ?? 0),
      archived:
        Number(row.archived ?? 0),
      contractsExpiring:
        Number(
          row.contracts_expiring ??
          0,
        ),
      complianceExpiring:
        Number(
          row.compliance_expiring ??
          0,
        ),
      complianceExpired:
        Number(
          row.compliance_expired ??
          0,
        ),
      openWorkOrders:
        Number(
          row.open_work_orders ??
          0,
        ),
    };
  }

  private mapRating(
    row: any,
  ): VendorRating {
    return {
      id:
        row.id,
      vendorId:
        row.vendor_id,
      workOrderId:
        row.work_order_id ??
        undefined,
      propertyId:
        row.property_id ??
        undefined,
      ratedByPersonId:
        row.rated_by_person_id,
      rating:
        row.rating,
      qualityRating:
        row.quality_rating ??
        undefined,
      timelinessRating:
        row.timeliness_rating ??
        undefined,
      professionalismRating:
        row.professionalism_rating ??
        undefined,
      comments:
        row.comments ??
        undefined,
      createdAt:
        row.created_at,
    };
  }

  private mapWorkOrderHistory(
    row: any,
  ): VendorWorkOrderHistory {
    return {
      id:
        row.id,
      workOrderId:
        row.work_order_id,
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

  private mapWorkOrder(
    row: any,
  ): VendorWorkOrder {
    return {
      id:
        row.id,
      workOrderNumber:
        row.work_order_number,
      vendorId:
        row.vendor_id,
      propertyId:
        row.property_id,
      zoneId:
        row.zone_id ??
        undefined,
      spaceId:
        row.space_id ??
        undefined,
      contractId:
        row.contract_id ??
        undefined,
      maintenanceTicketId:
        row.maintenance_ticket_id ??
        undefined,
      helpdeskTicketId:
        row.helpdesk_ticket_id ??
        undefined,
      facilityAssetId:
        row.facility_asset_id ??
        undefined,
      title:
        row.title,
      description:
        row.description,
      priority:
        row.priority,
      status:
        row.status,
      scheduledStartAt:
        row.scheduled_start_at ??
        undefined,
      scheduledEndAt:
        row.scheduled_end_at ??
        undefined,
      actualStartAt:
        row.actual_start_at ??
        undefined,
      actualEndAt:
        row.actual_end_at ??
        undefined,
      estimatedCost:
        row.estimated_cost === null
          ? undefined
          : Number(
              row.estimated_cost,
            ),
      actualCost:
        row.actual_cost === null
          ? undefined
          : Number(
              row.actual_cost,
            ),
      currency:
        row.currency,
      assignedByPersonId:
        row.assigned_by_person_id,
      acceptedByPersonId:
        row.accepted_by_person_id ??
        undefined,
      completedByPersonId:
        row.completed_by_person_id ??
        undefined,
      cancelledByPersonId:
        row.cancelled_by_person_id ??
        undefined,
      completionNotes:
        row.completion_notes ??
        undefined,
      cancellationReason:
        row.cancellation_reason ??
        undefined,
      createdAt:
        row.created_at,
      updatedAt:
        row.updated_at,
    };
  }

  private mapComplianceDocument(
    row: any,
  ): VendorComplianceDocument {
    return {
      id:
        row.id,
      vendorId:
        row.vendor_id,
      complianceType:
        row.compliance_type,
      documentId:
        row.document_id,
      referenceNumber:
        row.reference_number ??
        undefined,
      issuedAt:
        row.issued_at ??
        undefined,
      expiresAt:
        row.expires_at ??
        undefined,
      status:
        row.status,
      verifiedByPersonId:
        row.verified_by_person_id ??
        undefined,
      verifiedAt:
        row.verified_at ??
        undefined,
      remarks:
        row.remarks ??
        undefined,
      createdAt:
        row.created_at,
      updatedAt:
        row.updated_at,
    };
  }

  private mapContract(
    row: any,
  ): VendorContract {
    return {
      id:
        row.id,
      contractNumber:
        row.contract_number,
      vendorId:
        row.vendor_id,
      propertyId:
        row.property_id ??
        undefined,
      contractType:
        row.contract_type,
      title:
        row.title,
      description:
        row.description ??
        undefined,
      status:
        row.status,
      startDate:
        row.start_date,
      endDate:
        row.end_date,
      contractValue:
        row.contract_value === null
          ? undefined
          : Number(
              row.contract_value,
            ),
      currency:
        row.currency,
      responseSlaMinutes:
        row.response_sla_minutes ??
        undefined,
      resolutionSlaMinutes:
        row.resolution_sla_minutes ??
        undefined,
      autoRenew:
        row.auto_renew,
      renewalNoticeDays:
        row.renewal_notice_days,
      createdByPersonId:
        row.created_by_person_id,
      approvedByPersonId:
        row.approved_by_person_id ??
        undefined,
      terminatedByPersonId:
        row.terminated_by_person_id ??
        undefined,
      activatedAt:
        row.activated_at ??
        undefined,
      terminatedAt:
        row.terminated_at ??
        undefined,
      renewedAt:
        row.renewed_at ??
        undefined,
      createdAt:
        row.created_at,
      updatedAt:
        row.updated_at,
    };
  }

  private mapVendor(
    row: any,
  ): Vendor {
    return {
      id:
        row.id,
      vendorNumber:
        row.vendor_number,
      legalName:
        row.legal_name,
      displayName:
        row.display_name,
      vendorType:
        row.vendor_type,
      status:
        row.status,

      email:
        row.email ??
        undefined,
      phone:
        row.phone ??
        undefined,
      website:
        row.website ??
        undefined,

      taxIdentifier:
        row.tax_identifier ??
        undefined,
      panNumber:
        row.pan_number ??
        undefined,
      registrationNumber:
        row.registration_number ??
        undefined,

      addressLine1:
        row.address_line1 ??
        undefined,
      addressLine2:
        row.address_line2 ??
        undefined,
      city:
        row.city ??
        undefined,
      state:
        row.state ??
        undefined,
      country:
        row.country ??
        undefined,
      postalCode:
        row.postal_code ??
        undefined,

      notes:
        row.notes ??
        undefined,
      metadata:
        row.metadata ?? {},

      createdByPersonId:
        row.created_by_person_id,
      updatedByPersonId:
        row.updated_by_person_id ??
        undefined,

      activatedAt:
        row.activated_at ??
        undefined,
      suspendedAt:
        row.suspended_at ??
        undefined,
      blockedAt:
        row.blocked_at ??
        undefined,
      archivedAt:
        row.archived_at ??
        undefined,

      createdAt:
        row.created_at,
      updatedAt:
        row.updated_at,
    };
  }
}
