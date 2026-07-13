import {
  HelpdeskCategory,
  HelpdeskStatus,
  HelpdeskTicket,
  HelpdeskTicketDetails,
  HelpdeskTicketFilters,
  HelpdeskTicketHistory,
} from '../types/helpdesk.types';

export const HELPDESK_REPOSITORY =
  Symbol('HELPDESK_REPOSITORY');

export interface HelpdeskRepository {
  create(ticket: HelpdeskTicket): Promise<HelpdeskTicket>;

  findById(id: string): Promise<HelpdeskTicket | null>;

  findDetailsById(
    id: string,
  ): Promise<HelpdeskTicketDetails | null>;

  findAll(
    filters?: HelpdeskTicketFilters,
  ): Promise<HelpdeskTicket[]>;

  update(
    id: string,
    input: Partial<HelpdeskTicket>,
  ): Promise<HelpdeskTicket | null>;

  assign(
    id: string,
    assigneePersonId: string,
  ): Promise<HelpdeskTicket | null>;

  updateStatus(
    id: string,
    status: HelpdeskStatus,
    timestamps?: {
      firstRespondedAt?: Date;
      escalatedAt?: Date;
      resolvedAt?: Date;
      closedAt?: Date;
    },
    resolutionSummary?: string,
  ): Promise<HelpdeskTicket | null>;

  addHistory(
    history: HelpdeskTicketHistory,
  ): Promise<HelpdeskTicketHistory>;

  getHistory(
    ticketId: string,
  ): Promise<HelpdeskTicketHistory[]>;

  listCategories(): Promise<HelpdeskCategory[]>;

  findCategoryById(
    id: string,
  ): Promise<HelpdeskCategory | null>;

  getMetrics(propertyId?: string): Promise<{
    total: number;
    open: number;
    assigned: number;
    inProgress: number;
    escalated: number;
    resolved: number;
    closed: number;
    responseBreached: number;
    resolutionBreached: number;
    urgent: number;
  }>;
}
