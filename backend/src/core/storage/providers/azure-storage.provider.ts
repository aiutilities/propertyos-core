import { Injectable, NotImplementedException } from '@nestjs/common';
import { StorageProvider } from '../interfaces/storage-provider.interface';
import { StoreObjectInput } from '../types/storage.types';

@Injectable()
export class AzureStorageProvider implements StorageProvider {
  readonly provider = 'azure';

  async put(input: StoreObjectInput): Promise<{
    objectKey: string;
    sizeBytes: number;
    checksum: string;
  }> {
    throw new NotImplementedException('Azure Blob storage provider is not configured yet');
  }

  async get(objectKey: string): Promise<Buffer> {
    throw new NotImplementedException('Azure Blob storage provider is not configured yet');
  }

  async delete(objectKey: string): Promise<void> {
    throw new NotImplementedException('Azure Blob storage provider is not configured yet');
  }
}
