export interface VisitorEntity {
  id: string;
  fullName: string;
  mobile: string;
  email?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
