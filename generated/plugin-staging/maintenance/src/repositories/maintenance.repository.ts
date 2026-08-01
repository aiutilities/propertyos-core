import {
  MaintenanceCategory,
  MaintenanceHistory,
  MaintenanceStatus,
  MaintenanceTicket,
  MaintenanceTicketDetails,
  MaintenanceTicketFilters,
} from '../types/maintenance.types';

export const MAINTENANCE_REPOSITORY = Symbol('MAINTENANCE_REPOSITORY');

export interface MaintenanceRepository {
  create(ticket: MaintenanceTicket): Promise<MaintenanceTicket>;

  findById(id: string): Promise<MaintenanceTicket | null>;

  findDetailsById(id: string): Promise<MaintenanceTicketDetails | null>;

  findAll(
    filters?: MaintenanceTicketFilters,
  ): Promise<MaintenanceTicket[]>;

  update(
    id: string,
    input: Partial<MaintenanceTicket>,
  ): Promise<MaintenanceTicket | null>;

  assign(
    id: string,
    assigneePersonId: string,
  ): Promise<MaintenanceTicket | null>;

  updateStatus(
    id: string,
    status: MaintenanceStatus,
    timestamps?: {
      resolvedAt?: Date;
      closedAt?: Date;
    },
  ): Promise<MaintenanceTicket | null>;

  addHistory(
    history: MaintenanceHistory,
  ): Promise<MaintenanceHistory>;

  getHistory(ticketId: string): Promise<MaintenanceHistory[]>;

  listCategories(): Promise<MaintenanceCategory[]>;

  findCategoryById(id: string): Promise<MaintenanceCategory | null>;

  getMetrics(propertyId?: string): Promise<{
    total: number;
    open: number;
    assigned: number;
    inProgress: number;
    resolved: number;
    closed: number;
    overdue: number;
    urgent: number;
  }>;
}
