export interface PlatformRepository<TEntity, TId = string> {
  findById(id: TId): Promise<TEntity | null>;
  findAll(): Promise<TEntity[]>;
  create(data: Partial<TEntity>): Promise<TEntity>;
  update(id: TId, data: Partial<TEntity>): Promise<TEntity>;
  delete(id: TId): Promise<void>;
}
