export type PlatformId = string;

export interface TimestampedEntity {
  createdAt: Date;
  updatedAt?: Date;
}

export interface SoftDeletableEntity {
  deletedAt?: Date | null;
}
