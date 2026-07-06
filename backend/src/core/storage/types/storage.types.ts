export type StorageProviderType =
  | 'local'
  | 's3'
  | 'azure'
  | 'gcs'
  | 'minio';

export interface StorageObject {
  id: string;
  provider: StorageProviderType;
  bucket?: string;
  objectKey: string;
  originalName?: string;
  mimeType?: string;
  sizeBytes: number;
  checksum?: string;
  entityType?: string;
  entityId?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreObjectInput {
  objectKey: string;
  content: string;
  originalName?: string;
  mimeType?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}
