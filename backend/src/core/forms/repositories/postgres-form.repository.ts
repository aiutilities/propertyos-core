import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { POSTGRES_POOL } from '../../../database/postgres';
import {
  FormDefinition,
  FormStatus,
  FormSubmission,
} from '../types/forms.types';
import { FormRepositoryPort } from './form-repository.interface';

@Injectable()
export class PostgresFormRepository implements FormRepositoryPort {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async createForm(form: FormDefinition): Promise<FormDefinition> {
    const result = await this.pool.query(
      `
      INSERT INTO form_definitions (
        id,
        code,
        name,
        description,
        version,
        status,
        fields,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        form.id || randomUUID(),
        form.code ?? null,
        form.name,
        form.description ?? null,
        form.version ?? 1,
        form.status ?? 'ACTIVE',
        JSON.stringify(form.fields ?? []),
        JSON.stringify(form.metadata ?? {}),
      ],
    );

    return this.mapForm(result.rows[0]);
  }

  async listForms(
    filters: { status?: FormStatus; code?: string } = {},
  ): Promise<FormDefinition[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];

    if (filters.status) {
      values.push(filters.status);
      clauses.push(`status = $${values.length}`);
    }

    if (filters.code) {
      values.push(filters.code);
      clauses.push(`code = $${values.length}`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const result = await this.pool.query(
      `SELECT * FROM form_definitions ${where} ORDER BY created_at DESC`,
      values,
    );

    return result.rows.map((row) => this.mapForm(row));
  }

  async findFormById(id: string): Promise<FormDefinition | undefined> {
    const result = await this.pool.query(
      `SELECT * FROM form_definitions WHERE id = $1`,
      [id],
    );

    return result.rows[0] ? this.mapForm(result.rows[0]) : undefined;
  }

  async findFormByCode(code: string): Promise<FormDefinition | undefined> {
    const result = await this.pool.query(
      `SELECT * FROM form_definitions WHERE code = $1 ORDER BY version DESC LIMIT 1`,
      [code],
    );

    return result.rows[0] ? this.mapForm(result.rows[0]) : undefined;
  }

  async updateFormStatus(
    id: string,
    status: FormStatus,
  ): Promise<FormDefinition | undefined> {
    const result = await this.pool.query(
      `
      UPDATE form_definitions
      SET status = $2,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [id, status],
    );

    return result.rows[0] ? this.mapForm(result.rows[0]) : undefined;
  }

  async createSubmission(
    input: Omit<FormSubmission, 'id' | 'submittedAt'>,
  ): Promise<FormSubmission> {
    const result = await this.pool.query(
      `
      INSERT INTO form_submissions (
        id,
        form_id,
        values,
        submitted_by_person_id,
        subject_type,
        subject_id,
        property_id,
        space_id,
        context
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
      `,
      [
        randomUUID(),
        input.formId,
        JSON.stringify(input.values ?? {}),
        input.submittedByPersonId ?? null,
        input.subjectType ?? null,
        input.subjectId ?? null,
        input.propertyId ?? null,
        input.spaceId ?? null,
        JSON.stringify(input.context ?? {}),
      ],
    );

    return this.mapSubmission(result.rows[0]);
  }

  async listSubmissions(formId: string): Promise<FormSubmission[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM form_submissions
      WHERE form_id = $1
      ORDER BY submitted_at DESC
      `,
      [formId],
    );

    return result.rows.map((row) => this.mapSubmission(row));
  }

  private mapForm(row: any): FormDefinition {
    return {
      id: row.id,
      code: row.code ?? undefined,
      name: row.name,
      description: row.description ?? undefined,
      version: Number(row.version ?? 1),
      status: row.status,
      fields: Array.isArray(row.fields) ? row.fields : JSON.parse(row.fields ?? '[]'),
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata ?? {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapSubmission(row: any): FormSubmission {
    return {
      id: row.id,
      formId: row.form_id,
      values: typeof row.values === 'string' ? JSON.parse(row.values) : row.values ?? {},
      submittedByPersonId: row.submitted_by_person_id ?? undefined,
      subjectType: row.subject_type ?? undefined,
      subjectId: row.subject_id ?? undefined,
      propertyId: row.property_id ?? undefined,
      spaceId: row.space_id ?? undefined,
      context: typeof row.context === 'string' ? JSON.parse(row.context) : row.context ?? {},
      submittedAt: new Date(row.submitted_at),
    };
  }
}
