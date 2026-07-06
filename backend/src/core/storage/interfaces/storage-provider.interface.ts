import { StoreObjectInput } from '../types/storage.types';

export interface StorageProvider {
  readonly provider: string;

  put(input: StoreObjectInput): Promise<{
    objectKey: string;
    sizeBytes: number;
    checksum: string;
  }>;

  get(objectKey: string): Promise<Buffer>;

  delete(objectKey: string): Promise<void>;
}
