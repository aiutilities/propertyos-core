export type DocumentTemplateType = 'HTML' | 'TEXT' | 'MARKDOWN';

export type DocumentStatus =
  | 'DRAFT'
  | 'GENERATED'
  | 'APPROVED'
  | 'ARCHIVED';

export interface DocumentTemplate {
  id: string;
  name: string;
  code: string;
  description?: string;
  templateType: DocumentTemplateType;
  content: string;
  variables: string[];
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentEntity {
  id: string;
  templateId?: string;
  entityType?: string;
  entityId?: string;
  title: string;
  status: DocumentStatus;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  content: string;
  createdBy?: string;
  createdAt: Date;
}
