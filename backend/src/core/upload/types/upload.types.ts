export interface UploadPolicy {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
}

export interface UploadResult {
  storageObjectId: string;
  objectKey: string;
  originalName?: string;
  mimeType?: string;
  sizeBytes: number;
  entityType?: string;
  entityId?: string;
  metadata: Record<string, unknown>;
}
