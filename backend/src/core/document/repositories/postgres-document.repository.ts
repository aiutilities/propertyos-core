import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { POSTGRES_POOL } from '../../../database/postgres';
import { BasePostgresRepository } from '../../platform';
import { CreateDocumentTemplateDto } from '../dto/create-document-template.dto';
import { GenerateDocumentDto } from '../dto/generate-document.dto';
import { DocumentRepository } from './document-repository.interface';
import {
  DocumentEntity,
  DocumentTemplate,
  DocumentVersion,
} from '../types/document.types';

@Injectable()
export class PostgresDocumentRepository
  extends BasePostgresRepository
  implements DocumentRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {
    super();
  }

  async createTemplate(
    dto: CreateDocumentTemplateDto,
  ): Promise<DocumentTemplate> {
    const result = await this.pool.query(
      `
      INSERT INTO core_document_templates (
        name,
        code,
        description,
        template_type,
        content,
        variables
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        dto.name,
        dto.code,
        dto.description ?? null,
        dto.templateType ?? 'HTML',
        dto.content,
        JSON.stringify(dto.variables ?? []),
      ],
    );

    return this.mapTemplate(result.rows[0]);
  }

  async listTemplates(): Promise<DocumentTemplate[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM core_document_templates
      ORDER BY created_at DESC
      `,
    );

    return result.rows.map((row) => this.mapTemplate(row));
  }

  async findTemplateById(id: string): Promise<DocumentTemplate | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM core_document_templates
      WHERE id = $1
      `,
      [id],
    );

    return result.rows[0] ? this.mapTemplate(result.rows[0]) : null;
  }

  async createDocument(dto: GenerateDocumentDto): Promise<DocumentEntity> {
    const result = await this.pool.query(
      `
      INSERT INTO core_documents (
        template_id,
        entity_type,
        entity_id,
        title,
        status,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        dto.templateId,
        dto.entityType ?? null,
        dto.entityId ?? null,
        dto.title,
        'GENERATED',
        JSON.stringify(dto.metadata ?? {}),
      ],
    );

    return this.mapDocument(result.rows[0]);
  }

  async listDocuments(): Promise<DocumentEntity[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM core_documents
      ORDER BY created_at DESC
      `,
    );

    return result.rows.map((row) => this.mapDocument(row));
  }

  async findDocumentById(id: string): Promise<DocumentEntity | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM core_documents
      WHERE id = $1
      `,
      [id],
    );

    return result.rows[0] ? this.mapDocument(result.rows[0]) : null;
  }

  async createVersion(
    documentId: string,
    content: string,
    createdBy?: string,
  ): Promise<DocumentVersion> {
    const result = await this.pool.query(
      `
      INSERT INTO core_document_versions (
        document_id,
        version_number,
        content,
        created_by
      )
      VALUES (
        $1,
        COALESCE(
          (
            SELECT MAX(version_number) + 1
            FROM core_document_versions
            WHERE document_id = $1
          ),
          1
        ),
        $2,
        $3
      )
      RETURNING *
      `,
      [documentId, content, createdBy ?? null],
    );

    return this.mapVersion(result.rows[0]);
  }

  async listVersions(documentId: string): Promise<DocumentVersion[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM core_document_versions
      WHERE document_id = $1
      ORDER BY version_number ASC
      `,
      [documentId],
    );

    return result.rows.map((row) => this.mapVersion(row));
  }

  private mapTemplate(row: any): DocumentTemplate {
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description ?? undefined,
      templateType: row.template_type,
      content: row.content,
      variables: Array.isArray(row.variables)
        ? row.variables
        : JSON.parse(row.variables ?? '[]'),
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapDocument(row: any): DocumentEntity {
    return {
      id: row.id,
      templateId: row.template_id ?? undefined,
      entityType: row.entity_type ?? undefined,
      entityId: row.entity_id ?? undefined,
      title: row.title,
      status: row.status,
      metadata:
        typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata ?? {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapVersion(row: any): DocumentVersion {
    return {
      id: row.id,
      documentId: row.document_id,
      versionNumber: Number(row.version_number),
      content: row.content,
      createdBy: row.created_by ?? undefined,
      createdAt: new Date(row.created_at),
    };
  }
}
