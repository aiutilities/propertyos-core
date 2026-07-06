import { Injectable, NotImplementedException } from '@nestjs/common';
import { StorageProvider } from '../interfaces/storage-provider.interface';
import { StoreObjectInput } from '../types/storage.types';

@Injectable()
export class GcsStorageProvider implements StorageProvider {
  readonly provider = 'gcs';

  async put(input: StoreObjectInput): Promise<{
    objectKey: string;
    sizeBytes: number;
    checksum: string;
  }> {
    throw new NotImplementedException('Google Cloud Storage provider is not configured yet');
  }

  async get(objectKey: string): Promise<Buffer> {
    throw new NotImplementedException('Google Cloud Storage provider is not configured yet');
  }

  async delete(objectKey: string): Promise<void> {
    throw new NotImplementedException('Google Cloud Storage provider is not configured yet');
  }
}
