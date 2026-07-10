export interface VisitorStatusHistoryEntity {
  id: string;
  visitId: string;
  previousStatus?: string;
  newStatus: string;
  changedByPersonId?: string;
  changeReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
