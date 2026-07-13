export type CommunicationType =
  | "ANNOUNCEMENT"
  | "NOTICE"
  | "ALERT"
  | "EVENT"
  | "POLL";

export type CommunicationPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "URGENT";

export type CommunicationStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "PUBLISHED"
  | "EXPIRED"
  | "ARCHIVED"
  | "CANCELLED";

export type CommunicationAudienceType =
  | "ALL_PROPERTY"
  | "ZONE"
  | "SPACE"
  | "PERSON"
  | "ROLE"
  | "OWNERS"
  | "TENANTS"
  | "RESIDENTS"
  | "STAFF"
  | "SECURITY";

export interface CommunicationCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationTarget {
  id: string;
  communicationId: string;
  audienceType:
    CommunicationAudienceType;
  zoneId?: string;
  spaceId?: string;
  personId?: string;
  roleId?: string;
  createdAt: string;
}

export interface CommunicationAttachment {
  id: string;
  communicationId: string;
  documentId: string;
  uploadedByPersonId: string;
  createdAt: string;
}

export interface CommunicationRead {
  id: string;
  communicationId: string;
  personId: string;
  readAt: string;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface CommunicationDelivery {
  id: string;
  communicationId: string;
  personId?: string;
  channel:
    | "IN_APP"
    | "EMAIL"
    | "WHATSAPP"
    | "SMS"
    | "PUSH";
  status:
    | "PENDING"
    | "SENT"
    | "DELIVERED"
    | "FAILED"
    | "SKIPPED";
  providerMessageId?: string;
  errorMessage?: string;
  queuedAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationStatusHistory {
  id: string;
  communicationId: string;
  fromStatus?: CommunicationStatus;
  toStatus: CommunicationStatus;
  changedByPersonId: string;
  remarks?: string;
  createdAt: string;
}

export interface Communication {
  id: string;
  communicationNumber: string;
  propertyId: string;
  categoryId: string;
  type: CommunicationType;
  title: string;
  content: string;
  summary?: string;
  priority: CommunicationPriority;
  status: CommunicationStatus;
  isPinned: boolean;
  requiresAcknowledgement: boolean;
  publishAt?: string;
  publishedAt?: string;
  expiresAt?: string;
  archivedAt?: string;
  cancelledAt?: string;
  createdByPersonId: string;
  updatedByPersonId?: string;
  publishedByPersonId?: string;
  archivedByPersonId?: string;
  cancelledByPersonId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationDetails
  extends Communication {
  category?: CommunicationCategory;
  targets: CommunicationTarget[];
  attachments: CommunicationAttachment[];
  reads: CommunicationRead[];
  deliveries: CommunicationDelivery[];
  history: CommunicationStatusHistory[];
}

export interface CommunicationMetrics {
  total: number;
  draft: number;
  scheduled: number;
  published: number;
  expired: number;
  archived: number;
  cancelled: number;
  urgent: number;
  pinned: number;
  acknowledgementRequired: number;
}

export interface CommunicationEngagementMetrics {
  communicationId: string;
  totalReads: number;
  totalAcknowledgements: number;
  acknowledgementRequired: boolean;
}

export interface CommunicationFilters {
  propertyId?: string;
  categoryId?: string;
  type?: CommunicationType | "";
  priority?: CommunicationPriority | "";
  status?: CommunicationStatus | "";
  createdByPersonId?: string;
  isPinned?: boolean;
  search?: string;
}

export interface CommunicationTargetInput {
  audienceType:
    CommunicationAudienceType;
  zoneId?: string;
  spaceId?: string;
  personId?: string;
  roleId?: string;
}

export interface CreateCommunicationInput {
  propertyId: string;
  categoryId: string;
  type: CommunicationType;
  title: string;
  content: string;
  summary?: string;
  priority: CommunicationPriority;
  isPinned: boolean;
  requiresAcknowledgement: boolean;
  publishAt?: string;
  expiresAt?: string;
  createdByPersonId: string;
  targets: CommunicationTargetInput[];
}

export interface UpdateCommunicationInput {
  categoryId?: string;
  type?: CommunicationType;
  title?: string;
  content?: string;
  summary?: string;
  priority?: CommunicationPriority;
  isPinned?: boolean;
  requiresAcknowledgement?: boolean;
  publishAt?: string;
  expiresAt?: string;
  updatedByPersonId: string;
  targets?: CommunicationTargetInput[];
}

export interface ScheduleCommunicationInput {
  publishAt: string;
  expiresAt?: string;
  changedByPersonId: string;
  remarks?: string;
}

export interface TransitionCommunicationInput {
  changedByPersonId: string;
  remarks?: string;
}

export interface CommunicationApiResponse<T> {
  success: boolean;
  data: T;
}
