import { Injectable } from '@nestjs/common';
import { EventBusService } from '../../eventbus/services/eventbus.service';
import { CreateDocumentTemplateDto } from '../dto/create-document-template.dto';
import { CreateDocumentVersionDto } from '../dto/create-document-version.dto';
import { GenerateDocumentDto } from '../dto/generate-document.dto';
import { PostgresDocumentRepository } from '../repositories/postgres-document.repository';

@Injectable()
export class DocumentService {
  private readonly source = 'core.document';

  constructor(
    private readonly repository: PostgresDocumentRepository,
    private readonly eventBus: EventBusService,
  ) {}

  async createTemplate(dto: CreateDocumentTemplateDto) {
    const template = await this.repository.createTemplate(dto);

    await this.eventBus.publish('document.template.created', this.source, {
      id: template.id,
      code: template.code,
      name: template.name,
    });

    return template;
  }

  listTemplates() {
    return this.repository.listTemplates();
  }

  async generate(dto: GenerateDocumentDto) {
    const template = await this.repository.findTemplateById(dto.templateId);

    if (!template) {
      throw new Error(`Document template not found: ${dto.templateId}`);
    }

    let content = template.content;

    for (const [key, value] of Object.entries(dto.values ?? {})) {
      content = content.replaceAll(`{{${key}}}`, String(value));
    }

    const document = await this.repository.createDocument(dto);

    await this.repository.createVersion(document.id, content);

    await this.eventBus.publish('document.generated', this.source, {
      id: document.id,
      templateId: dto.templateId,
      title: document.title,
    });

    return document;
  }

  listDocuments() {
    return this.repository.listDocuments();
  }

  getDocument(id: string) {
    return this.repository.findDocumentById(id);
  }

  async createVersion(id: string, dto: CreateDocumentVersionDto) {
    const version = await this.repository.createVersion(
      id,
      dto.content,
      dto.createdBy,
    );

    await this.eventBus.publish('document.version.created', this.source, {
      documentId: id,
      versionId: version.id,
      versionNumber: version.versionNumber,
    });

    return version;
  }

  listVersions(id: string) {
    return this.repository.listVersions(id);
  }
}
