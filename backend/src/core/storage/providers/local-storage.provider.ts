import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { dirname, join, normalize } from 'path';
import { StorageProvider } from '../interfaces/storage-provider.interface';
import { StoreObjectInput } from '../types/storage.types';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  readonly provider = 'local';

  private readonly rootPath = process.env.STORAGE_LOCAL_ROOT || './uploads';

  async put(input: StoreObjectInput): Promise<{
    objectKey: string;
    sizeBytes: number;
    checksum: string;
  }> {
    const safeObjectKey = this.safeObjectKey(input.objectKey);
    const absolutePath = join(this.rootPath, safeObjectKey);
    const buffer = Buffer.from(input.content, 'base64');

    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, buffer);

    return {
      objectKey: safeObjectKey,
      sizeBytes: buffer.length,
      checksum: createHash('sha256').update(buffer).digest('hex'),
    };
  }

  async get(objectKey: string): Promise<Buffer> {
    return readFile(join(this.rootPath, this.safeObjectKey(objectKey)));
  }

  async delete(objectKey: string): Promise<void> {
    await rm(join(this.rootPath, this.safeObjectKey(objectKey)), {
      force: true,
    });
  }

  private safeObjectKey(objectKey: string): string {
    if (
      objectKey.startsWith('/') ||
      objectKey.startsWith('\\') ||
      objectKey.split(/[\\/]+/).includes('..')
    ) {
      throw new Error('Invalid storage object key');
    }

    const normalized = normalize(objectKey);

    if (normalized.startsWith('/') || normalized.includes('..')) {
      throw new Error('Invalid storage object key');
    }

    return normalized;
  }
}
