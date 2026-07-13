export enum MaintenancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum MaintenanceStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

export interface MaintenanceCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  defaultSlaMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceHistory {
  id: string;
  ticketId: string;
  fromStatus?: MaintenanceStatus;
  toStatus: MaintenanceStatus;
  changedByPersonId: string;
  remarks?: string;
  createdAt: Date;
}

export interface MaintenanceTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  categoryId: string;
  propertyId: string;
  spaceId?: string;
  reporterPersonId: string;
  assigneePersonId?: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  slaDueAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceTicketDetails extends MaintenanceTicket {
  category?: MaintenanceCategory;
  history: MaintenanceHistory[];
}

export interface MaintenanceTicketFilters {
  propertyId?: string;
  spaceId?: string;
  reporterPersonId?: string;
  assigneePersonId?: string;
  categoryId?: string;
  priority?: MaintenancePriority;
  status?: MaintenanceStatus;
  search?: string;
}
