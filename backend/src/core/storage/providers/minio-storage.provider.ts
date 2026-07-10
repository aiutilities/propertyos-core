import { Injectable, NotImplementedException } from '@nestjs/common';
import { StorageProvider } from '../interfaces/storage-provider.interface';
import { StoreObjectInput } from '../types/storage.types';

@Injectable()
export class MinioStorageProvider implements StorageProvider {
  readonly provider = 'minio';

  async put(input: StoreObjectInput): Promise<{
    objectKey: string;
    sizeBytes: number;
    checksum: string;
  }> {
    throw new NotImplementedException('MinIO storage provider is not configured yet');
  }

  async get(objectKey: string): Promise<Buffer> {
    throw new NotImplementedException('MinIO storage provider is not configured yet');
  }

  async delete(objectKey: string): Promise<void> {
    throw new NotImplementedException('MinIO storage provider is not configured yet');
  }
}
