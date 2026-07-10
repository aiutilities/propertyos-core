export class UploadObjectDto {
  objectKey!: string;
  content!: string;
  originalName?: string;
  mimeType?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}
