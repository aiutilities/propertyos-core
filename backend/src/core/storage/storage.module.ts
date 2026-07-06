import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ConfigurationModule } from '../configuration';
import { StorageController } from './controllers/storage.controller';
import { StorageService } from './services/storage.service';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { AzureStorageProvider } from './providers/azure-storage.provider';
import { GcsStorageProvider } from './providers/gcs-storage.provider';
import { MinioStorageProvider } from './providers/minio-storage.provider';
import { PostgresStorageObjectRepository } from './providers/postgres-storage-object.repository';

@Module({
  imports: [DatabaseModule, ConfigurationModule],
  controllers: [StorageController],
  providers: [
    StorageService,
    LocalStorageProvider,
    S3StorageProvider,
    AzureStorageProvider,
    GcsStorageProvider,
    MinioStorageProvider,
    PostgresStorageObjectRepository,
  ],
  exports: [StorageService],
})
export class StorageModule {}
