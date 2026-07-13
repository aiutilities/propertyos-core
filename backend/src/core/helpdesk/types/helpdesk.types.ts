export enum HelpdeskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum HelpdeskStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  ESCALATED = 'ESCALATED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED',
  CANCELLED = 'CANCELLED',
}

export enum HelpdeskChannel {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  ADMIN = 'ADMIN',
}

export enum HelpdeskVisibility {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
}

export interface HelpdeskCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  defaultPriority: HelpdeskPriority;
  responseSlaMinutes: number;
  resolutionSlaMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  responseDueAt?: Date;
  resolutionDueAt?: Date;
  firstRespondedAt?: Date;
  escalatedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  resolutionSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HelpdeskTicketHistory {
  id: string;
  ticketId: string;
  fromStatus?: HelpdeskStatus;
  toStatus: HelpdeskStatus;
  changedByPersonId: string;
  remarks?: string;
  createdAt: Date;
}

export interface HelpdeskComment {
  id: string;
  ticketId: string;
  authorPersonId: string;
  body: string;
  visibility: HelpdeskVisibility;
  createdAt: Date;
  updatedAt: Date;
}

export interface HelpdeskAttachment {
  id: string;
  ticketId: string;
  commentId?: string;
  documentId: string;
  uploadedByPersonId: string;
  createdAt: Date;
}

export interface HelpdeskWorklog {
  id: string;
  ticketId: string;
  personId: string;
  minutesSpent: number;
  description: string;
  workedAt: Date;
  createdAt: Date;
}

export interface HelpdeskFeedback {
  id: string;
  ticketId: string;
  submittedByPersonId: string;
  rating: number;
  comments?: string;
  createdAt: Date;
}

export interface HelpdeskTicketDetails extends HelpdeskTicket {
  category?: HelpdeskCategory;
  history: HelpdeskTicketHistory[];
  comments: HelpdeskComment[];
  attachments: HelpdeskAttachment[];
  worklogs: HelpdeskWorklog[];
  feedback?: HelpdeskFeedback;
}

export interface HelpdeskTicketFilters {
  propertyId?: string;
  spaceId?: string;
  requesterPersonId?: string;
  assigneePersonId?: string;
  categoryId?: string;
  priority?: HelpdeskPriority;
  status?: HelpdeskStatus;
  channel?: HelpdeskChannel;
  search?: string;
}
