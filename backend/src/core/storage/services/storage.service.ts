import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ConfigurationService } from '../../configuration';
import { LocalStorageProvider } from '../providers/local-storage.provider';
import { S3StorageProvider } from '../providers/s3-storage.provider';
import { AzureStorageProvider } from '../providers/azure-storage.provider';
import { GcsStorageProvider } from '../providers/gcs-storage.provider';
import { MinioStorageProvider } from '../providers/minio-storage.provider';
import { PostgresStorageObjectRepository } from '../providers/postgres-storage-object.repository';
import { StoreObjectInput, StorageObject, StorageProviderType } from '../types/storage.types';

@Injectable()
export class StorageService {
  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly localProvider: LocalStorageProvider,
    private readonly s3Provider: S3StorageProvider,
    private readonly azureProvider: AzureStorageProvider,
    private readonly gcsProvider: GcsStorageProvider,
    private readonly minioProvider: MinioStorageProvider,
    private readonly repository: PostgresStorageObjectRepository,
  ) {}

  async store(input: StoreObjectInput): Promise<StorageObject> {
    const provider = await this.getActiveProvider();

    const stored = await provider.put(input);
    const now = new Date();

    return this.repository.create({
      id: randomUUID(),
      provider: provider.provider as StorageProviderType,
      objectKey: stored.objectKey,
      originalName: input.originalName,
      mimeType: input.mimeType,
      sizeBytes: stored.sizeBytes,
      checksum: stored.checksum,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    });
  }

  async list(): Promise<StorageObject[]> {
    return this.repository.list();
  }

  async getObject(id: string): Promise<StorageObject> {
    const object =
      await this.repository.findById(id);

    if (!object) {
      throw new NotFoundException(
        `Storage object not found: ${id}`,
      );
    }

    return object;
  }

  async getContent(id: string): Promise<Buffer> {
    const object =
      await this.getObject(id);

    return this
      .getProvider(object.provider)
      .get(object.objectKey);
  }

  async delete(id: string): Promise<void> {
    const object = await this.repository.findById(id);

    if (!object) {
      throw new NotFoundException(`Storage object not found: ${id}`);
    }

    await this.getProvider(object.provider).delete(object.objectKey);
    await this.repository.delete(id);
  }

  private async getActiveProvider() {
    try {
      const setting = await this.configurationService.getByScopeAndKey(
        'PLATFORM',
        undefined,
        'storage.provider',
      );

      return this.getProvider(String(setting.value));
    } catch {
      return this.localProvider;
    }
  }

  private getProvider(provider: string) {
    switch (provider) {
      case 'local':
        return this.localProvider;
      case 's3':
        return this.s3Provider;
      case 'azure':
        return this.azureProvider;
      case 'gcs':
        return this.gcsProvider;
      case 'minio':
        return this.minioProvider;
      default:
        return this.localProvider;
    }
  }
}
