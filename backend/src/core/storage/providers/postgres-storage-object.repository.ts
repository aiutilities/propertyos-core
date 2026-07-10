import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { POSTGRES_POOL } from '../../../database/postgres/postgres.types';
import { StorageObjectRepository } from '../interfaces/storage-object.repository';
import { StorageObject, StorageProviderType } from '../types/storage.types';

@Injectable()
export class PostgresStorageObjectRepository
  implements StorageObjectRepository
{
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  async create(object: StorageObject): Promise<StorageObject> {
    const result = await this.pool.query(
      `
      INSERT INTO storage_objects (
        id, provider, bucket, object_key, original_name, mime_type,
        size_bytes, checksum, entity_type, entity_id, metadata, created_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
      `,
      [
        object.id,
        object.provider,
        object.bucket ?? null,
        object.objectKey,
        object.originalName ?? null,
        object.mimeType ?? null,
        object.sizeBytes,
        object.checksum ?? null,
        object.entityType ?? null,
        object.entityId ?? null,
        JSON.stringify(object.metadata ?? {}),
        object.createdAt,
        object.updatedAt,
      ],
    );

    return this.mapObject(result.rows[0]);
  }

  async findById(id: string): Promise<StorageObject | null> {
    const result = await this.pool.query(
      `SELECT * FROM storage_objects WHERE id = $1`,
      [id],
    );

    return result.rows[0] ? this.mapObject(result.rows[0]) : null;
  }

  async list(): Promise<StorageObject[]> {
    const result = await this.pool.query(
      `SELECT * FROM storage_objects ORDER BY created_at DESC`,
    );

    return result.rows.map((row) => this.mapObject(row));
  }

  async delete(id: string): Promise<void> {
    await this.pool.query(`DELETE FROM storage_objects WHERE id = $1`, [id]);
  }

  private mapObject(row: any): StorageObject {
    return {
      id: row.id,
      provider: row.provider as StorageProviderType,
      bucket: row.bucket ?? undefined,
      objectKey: row.object_key,
      originalName: row.original_name ?? undefined,
      mimeType: row.mime_type ?? undefined,
      sizeBytes: Number(row.size_bytes),
      checksum: row.checksum ?? undefined,
      entityType: row.entity_type ?? undefined,
      entityId: row.entity_id ?? undefined,
      metadata: row.metadata ?? {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
