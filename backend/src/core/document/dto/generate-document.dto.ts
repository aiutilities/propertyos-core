export class GenerateDocumentDto {
  templateId!: string;
  title!: string;
  entityType?: string;
  entityId?: string;
  values?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
