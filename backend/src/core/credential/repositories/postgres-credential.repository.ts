import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { POSTGRES_POOL } from '../../../database/postgres';
import { Credential, CredentialStatus, CredentialUsage } from '../types/credential.types';
import { CredentialRepositoryPort } from './credential-repository.interface';

@Injectable()
export class PostgresCredentialRepository implements CredentialRepositoryPort {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async createCredential(
    input: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Credential> {
    const result = await this.pool.query(
      `
      INSERT INTO credentials (
        id,
        credential_type,
        subject_type,
        subject_id,
        issued_to_person_id,
        issued_by_person_id,
        property_id,
        space_id,
        token_hash,
        display_value,
        status,
        valid_from,
        valid_until,
        max_uses,
        use_count,
        metadata
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15, $16
      )
      RETURNING *
      `,
      [
        randomUUID(),
        input.credentialType,
        input.subjectType,
        input.subjectId,
        input.issuedToPersonId ?? null,
        input.issuedByPersonId ?? null,
        input.propertyId ?? null,
        input.spaceId ?? null,
        input.tokenHash,
        input.displayValue ?? null,
        input.status,
        input.validFrom ?? null,
        input.validUntil ?? null,
        input.maxUses ?? null,
        input.useCount,
        JSON.stringify(input.metadata ?? {}),
      ],
    );

    return this.mapCredential(result.rows[0]);
  }

  async findById(id: string): Promise<Credential | undefined> {
    const result = await this.pool.query(
      `SELECT * FROM credentials WHERE id = $1`,
      [id],
    );

    return result.rows[0] ? this.mapCredential(result.rows[0]) : undefined;
  }

  async findByTokenHash(tokenHash: string): Promise<Credential | undefined> {
    const result = await this.pool.query(
      `SELECT * FROM credentials WHERE token_hash = $1`,
      [tokenHash],
    );

    return result.rows[0] ? this.mapCredential(result.rows[0]) : undefined;
  }

  async listCredentials(filters: {
    subjectType?: string;
    subjectId?: string;
    propertyId?: string;
    status?: CredentialStatus;
  } = {}): Promise<Credential[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];

    if (filters.subjectType) {
      values.push(filters.subjectType);
      clauses.push(`subject_type = $${values.length}`);
    }

    if (filters.subjectId) {
      values.push(filters.subjectId);
      clauses.push(`subject_id = $${values.length}`);
    }

    if (filters.propertyId) {
      values.push(filters.propertyId);
      clauses.push(`property_id = $${values.length}`);
    }

    if (filters.status) {
      values.push(filters.status);
      clauses.push(`status = $${values.length}`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const result = await this.pool.query(
      `SELECT * FROM credentials ${where} ORDER BY created_at DESC`,
      values,
    );

    return result.rows.map((row) => this.mapCredential(row));
  }

  async updateStatus(id: string, status: CredentialStatus): Promise<Credential | undefined> {
    const result = await this.pool.query(
      `
      UPDATE credentials
      SET status = $2,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [id, status],
    );

    return result.rows[0] ? this.mapCredential(result.rows[0]) : undefined;
  }

  async incrementUseCount(id: string): Promise<Credential | undefined> {
    const result = await this.pool.query(
      `
      UPDATE credentials
      SET use_count = use_count + 1,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [id],
    );

    return result.rows[0] ? this.mapCredential(result.rows[0]) : undefined;
  }

  async recordUsage(
    input: Omit<CredentialUsage, 'id' | 'usedAt'>,
  ): Promise<CredentialUsage> {
    const result = await this.pool.query(
      `
      INSERT INTO credential_usage (
        id,
        credential_id,
        used_by_person_id,
        property_id,
        space_id,
        context
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        randomUUID(),
        input.credentialId,
        input.usedByPersonId ?? null,
        input.propertyId ?? null,
        input.spaceId ?? null,
        JSON.stringify(input.context ?? {}),
      ],
    );

    return this.mapUsage(result.rows[0]);
  }

  async listUsage(credentialId: string): Promise<CredentialUsage[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM credential_usage
      WHERE credential_id = $1
      ORDER BY used_at DESC
      `,
      [credentialId],
    );

    return result.rows.map((row) => this.mapUsage(row));
  }

  private mapCredential(row: any): Credential {
    return {
      id: row.id,
      credentialType: row.credential_type,
      subjectType: row.subject_type,
      subjectId: row.subject_id,
      issuedToPersonId: row.issued_to_person_id ?? undefined,
      issuedByPersonId: row.issued_by_person_id ?? undefined,
      propertyId: row.property_id ?? undefined,
      spaceId: row.space_id ?? undefined,
      tokenHash: row.token_hash,
      displayValue: row.display_value ?? undefined,
      status: row.status,
      validFrom: row.valid_from ? new Date(row.valid_from) : undefined,
      validUntil: row.valid_until ? new Date(row.valid_until) : undefined,
      maxUses: row.max_uses ?? undefined,
      useCount: Number(row.use_count ?? 0),
      metadata: row.metadata ?? {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapUsage(row: any): CredentialUsage {
    return {
      id: row.id,
      credentialId: row.credential_id,
      usedAt: new Date(row.used_at),
      usedByPersonId: row.used_by_person_id ?? undefined,
      propertyId: row.property_id ?? undefined,
      spaceId: row.space_id ?? undefined,
      context: row.context ?? {},
    };
  }
}
