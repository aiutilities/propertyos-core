import {
  DocumentEntity,
  DocumentTemplate,
  DocumentVersion,
} from '../types/document.types';
import { CreateDocumentTemplateDto } from '../dto/create-document-template.dto';
import { GenerateDocumentDto } from '../dto/generate-document.dto';

export interface DocumentRepository {
  createTemplate(dto: CreateDocumentTemplateDto): Promise<DocumentTemplate>;
  listTemplates(): Promise<DocumentTemplate[]>;
  findTemplateById(id: string): Promise<DocumentTemplate | null>;

  createDocument(dto: GenerateDocumentDto): Promise<DocumentEntity>;
  listDocuments(): Promise<DocumentEntity[]>;
  findDocumentById(id: string): Promise<DocumentEntity | null>;

  createVersion(
    documentId: string,
    content: string,
    createdBy?: string,
  ): Promise<DocumentVersion>;

  listVersions(documentId: string): Promise<DocumentVersion[]>;
}
