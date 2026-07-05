import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

import { POSTGRES_POOL } from '../../../database/postgres';
import {
  Agreement,
  AgreementVersion,
} from '../types/agreement.types';
import { AgreementRepositoryPort } from './agreement-repository.interface';

@Injectable()
export class PostgresAgreementRepository implements AgreementRepositoryPort {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async createAgreement(
    input: Omit<Agreement, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Agreement> {
    const result = await this.pool.query(
      `
      INSERT INTO agreements (
        id,
        tenant_id,
        agreement_number,
        current_version_id,
        status
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        $4
      )
      RETURNING *
      `,
      [
        input.tenantId,
        input.agreementNumber,
        input.currentVersionId ?? null,
        input.status,
      ],
    );

    return this.mapAgreement(result.rows[0]);
  }

  async getAgreement(id: string): Promise<Agreement | undefined> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM agreements
      WHERE id = $1
        AND deleted_at IS NULL
      `,
      [id],
    );

    return result.rows[0] ? this.mapAgreement(result.rows[0]) : undefined;
  }

  async listAgreements(): Promise<Agreement[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM agreements
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      `,
    );

    return result.rows.map((row) => this.mapAgreement(row));
  }

  async createAgreementVersion(
    input: Omit<AgreementVersion, 'id' | 'createdAt'>,
  ): Promise<AgreementVersion> {
    const result = await this.pool.query(
      `
      INSERT INTO agreement_versions (
        id,
        agreement_id,
        version_number,
        start_date,
        end_date,
        rent_amount,
        deposit_amount,
        notice_period_days,
        agreement_document_url
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8
      )
      RETURNING *
      `,
      [
        input.agreementId,
        input.versionNumber,
        input.startDate,
        input.endDate ?? null,
        input.rentAmount,
        input.depositAmount,
        input.noticePeriodDays,
        input.agreementDocumentUrl ?? null,
      ],
    );

    return this.mapAgreementVersion(result.rows[0]);
  }

  async listAgreementVersions(
    agreementId: string,
  ): Promise<AgreementVersion[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM agreement_versions
      WHERE agreement_id = $1
        AND deleted_at IS NULL
      ORDER BY version_number DESC
      `,
      [agreementId],
    );

    return result.rows.map((row) => this.mapAgreementVersion(row));
  }

  private mapAgreement(row: any): Agreement {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      agreementNumber: row.agreement_number,
      currentVersionId: row.current_version_id ?? undefined,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private formatDate(value: Date | string): string {
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    }

    return String(value).split('T')[0];
  }

  private mapAgreementVersion(row: any): AgreementVersion {
    return {
      id: row.id,
      agreementId: row.agreement_id,
      versionNumber: row.version_number,
      startDate: this.formatDate(row.start_date),
      endDate: row.end_date
        ? this.formatDate(row.end_date)
        : undefined,
      rentAmount: Number(row.rent_amount),
      depositAmount: Number(row.deposit_amount),
      noticePeriodDays: row.notice_period_days,
      agreementDocumentUrl: row.agreement_document_url ?? undefined,
      createdAt: row.created_at,
    };
  }
}
