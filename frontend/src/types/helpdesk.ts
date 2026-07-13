export type HelpdeskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

export type HelpdeskStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "ESCALATED"
  | "RESOLVED"
  | "CLOSED"
  | "REOPENED"
  | "CANCELLED";

export type HelpdeskChannel =
  | "WEB"
  | "MOBILE"
  | "WHATSAPP"
  | "EMAIL"
  | "PHONE"
  | "ADMIN";

export type HelpdeskVisibility =
  | "PUBLIC"
  | "INTERNAL";

export interface HelpdeskCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  defaultPriority: HelpdeskPriority;
  responseSlaMinutes: number;
  resolutionSlaMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HelpdeskHistory {
  id: string;
  ticketId: string;
  fromStatus?: HelpdeskStatus;
  toStatus: HelpdeskStatus;
  changedByPersonId: string;
  remarks?: string;
  createdAt: string;
}

export interface HelpdeskComment {
  id: string;
  ticketId: string;
  authorPersonId: string;
  body: string;
  visibility: HelpdeskVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface HelpdeskWorklog {
  id: string;
  ticketId: string;
  personId: string;
  minutesSpent: number;
  description: string;
  workedAt: string;
  createdAt: string;
}

export interface HelpdeskFeedback {
  id: string;
  ticketId: string;
  submittedByPersonId: string;
  rating: number;
  comments?: string;
  createdAt: string;
}

export interface HelpdeskTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  categoryId: string;
  propertyId: string;
  spaceId?: string;
  requesterPersonId: string;
  assigneePersonId?: string;
  priority: HelpdeskPriority;
  status: HelpdeskStatus;
  channel: HelpdeskChannel;
  responseDueAt?: string;
  resolutionDueAt?: string;
  firstRespondedAt?: string;
  escalatedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  resolutionSummary?: string;
  createdAt: string;
  updatedAt: string;
  category?: HelpdeskCategory;
  history?: HelpdeskHistory[];
  comments?: HelpdeskComment[];
  worklogs?: HelpdeskWorklog[];
  feedback?: HelpdeskFeedback;
}

export interface HelpdeskMetrics {
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
}

export interface HelpdeskListFilters {
  propertyId?: string;
  spaceId?: string;
  requesterPersonId?: string;
  assigneePersonId?: string;
  categoryId?: string;
  priority?: HelpdeskPriority | "";
  status?: HelpdeskStatus | "";
  channel?: HelpdeskChannel | "";
  search?: string;
}

export interface CreateHelpdeskTicketInput {
  title: string;
  description: string;
  categoryId: string;
  propertyId: string;
  spaceId?: string;
  requesterPersonId: string;
  priority?: HelpdeskPriority;
  channel: HelpdeskChannel;
}

export interface AssignHelpdeskTicketInput {
  assigneePersonId: string;
  changedByPersonId: string;
  remarks?: string;
}

export interface TransitionHelpdeskTicketInput {
  changedByPersonId: string;
  remarks?: string;
}

export interface ResolveHelpdeskTicketInput
  extends TransitionHelpdeskTicketInput {
  resolutionSummary: string;
}

export interface AddHelpdeskCommentInput {
  authorPersonId: string;
  body: string;
  visibility: HelpdeskVisibility;
}

export interface AddHelpdeskWorklogInput {
  personId: string;
  minutesSpent: number;
  description: string;
  workedAt?: string;
}

export interface SubmitHelpdeskFeedbackInput {
  submittedByPersonId: string;
  rating: number;
  comments?: string;
}

export interface HelpdeskApiResponse<T> {
  success: boolean;
  data: T;
}
