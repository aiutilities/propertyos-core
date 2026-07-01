export interface VisitEntity {
  id: string;
  visitorId: string;
  propertyId: string;
  hostPersonId: string;
  visitDate: string;
  visitPurpose?: string;
  status: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  arrivedAt?: Date;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  cancelledAt?: Date;
  expiredAt?: Date;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
