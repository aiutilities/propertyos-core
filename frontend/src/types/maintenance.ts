export type MaintenancePriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

export type MaintenanceStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "CANCELLED"
  | "REJECTED";

export interface MaintenanceCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  defaultSlaMinutes: number;
  isActive: boolean;
}

export interface MaintenanceHistory {
  id: string;
  ticketId: string;
  fromStatus?: MaintenanceStatus;
  toStatus: MaintenanceStatus;
  changedByPersonId: string;
  remarks?: string;
  createdAt: string;
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
  slaDueAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  category?: MaintenanceCategory;
  history?: MaintenanceHistory[];
}

export interface MaintenanceMetrics {
  total: number;
  open: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  closed: number;
  overdue: number;
  urgent: number;
}

export interface MaintenanceListFilters {
  propertyId?: string;
  spaceId?: string;
  reporterPersonId?: string;
  assigneePersonId?: string;
  categoryId?: string;
  priority?: MaintenancePriority | "";
  status?: MaintenanceStatus | "";
  search?: string;
}

export interface CreateMaintenanceTicketInput {
  title: string;
  description: string;
  categoryId: string;
  propertyId: string;
  spaceId?: string;
  reporterPersonId: string;
  priority: MaintenancePriority;
}

export interface AssignMaintenanceTicketInput {
  assigneePersonId: string;
  changedByPersonId: string;
  remarks?: string;
}

export interface TransitionMaintenanceTicketInput {
  status: MaintenanceStatus;
  changedByPersonId: string;
  remarks?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
