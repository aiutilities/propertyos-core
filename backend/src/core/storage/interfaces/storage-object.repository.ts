import { StorageObject } from '../types/storage.types';

export interface StorageObjectRepository {
  create(object: StorageObject): Promise<StorageObject>;

  findById(id: string): Promise<StorageObject | null>;

  list(): Promise<StorageObject[]>;

  delete(id: string): Promise<void>;
}
