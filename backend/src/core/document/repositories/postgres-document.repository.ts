import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
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
  private readonly templates = new Map<string, DocumentTemplate>();
  private readonly documents = new Map<string, DocumentEntity>();
  private readonly versions = new Map<string, DocumentVersion[]>();

  async createTemplate(
    dto: CreateDocumentTemplateDto,
  ): Promise<DocumentTemplate> {
    const now = new Date();

    const template: DocumentTemplate = {
      id: randomUUID(),
      name: dto.name,
      code: dto.code,
      description: dto.description,
      templateType: dto.templateType ?? 'HTML',
      content: dto.content,
      variables: dto.variables ?? [],
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    this.templates.set(template.id, template);

    return template;
  }

  async listTemplates(): Promise<DocumentTemplate[]> {
    return [...this.templates.values()];
  }

  async findTemplateById(id: string): Promise<DocumentTemplate | null> {
    return this.templates.get(id) ?? null;
  }

  async createDocument(dto: GenerateDocumentDto): Promise<DocumentEntity> {
    const now = new Date();

    const document: DocumentEntity = {
      id: randomUUID(),
      templateId: dto.templateId,
      entityType: dto.entityType,
      entityId: dto.entityId,
      title: dto.title,
      status: 'GENERATED',
      metadata: dto.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };

    this.documents.set(document.id, document);

    return document;
  }

  async listDocuments(): Promise<DocumentEntity[]> {
    return [...this.documents.values()];
  }

  async findDocumentById(id: string): Promise<DocumentEntity | null> {
    return this.documents.get(id) ?? null;
  }

  async createVersion(
    documentId: string,
    content: string,
    createdBy?: string,
  ): Promise<DocumentVersion> {
    const existingVersions = this.versions.get(documentId) ?? [];

    const version: DocumentVersion = {
      id: randomUUID(),
      documentId,
      versionNumber: existingVersions.length + 1,
      content,
      createdBy,
      createdAt: new Date(),
    };

    this.versions.set(documentId, [...existingVersions, version]);

    return version;
  }

  async listVersions(documentId: string): Promise<DocumentVersion[]> {
    return this.versions.get(documentId) ?? [];
  }
}
