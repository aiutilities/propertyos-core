export enum CommunicationType {
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  NOTICE = 'NOTICE',
  ALERT = 'ALERT',
  EVENT = 'EVENT',
  POLL = 'POLL',
}

export enum CommunicationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum CommunicationStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED',
  CANCELLED = 'CANCELLED',
}

export enum CommunicationAudienceType {
  ALL_PROPERTY = 'ALL_PROPERTY',
  ZONE = 'ZONE',
  SPACE = 'SPACE',
  PERSON = 'PERSON',
  ROLE = 'ROLE',
  OWNERS = 'OWNERS',
  TENANTS = 'TENANTS',
  RESIDENTS = 'RESIDENTS',
  STAFF = 'STAFF',
  SECURITY = 'SECURITY',
}

export enum CommunicationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

export enum CommunicationDeliveryStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

export interface CommunicationCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  publishAt?: Date;
  publishedAt?: Date;
  expiresAt?: Date;
  archivedAt?: Date;
  cancelledAt?: Date;
  createdByPersonId: string;
  updatedByPersonId?: string;
  publishedByPersonId?: string;
  archivedByPersonId?: string;
  cancelledByPersonId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunicationTarget {
  id: string;
  communicationId: string;
  audienceType: CommunicationAudienceType;
  zoneId?: string;
  spaceId?: string;
  personId?: string;
  roleId?: string;
  createdAt: Date;
}

export interface CommunicationAttachment {
  id: string;
  communicationId: string;
  documentId: string;
  uploadedByPersonId: string;
  createdAt: Date;
}

export interface CommunicationRead {
  id: string;
  communicationId: string;
  personId: string;
  readAt: Date;
  acknowledgedAt?: Date;
  createdAt: Date;
}

export interface CommunicationDelivery {
  id: string;
  communicationId: string;
  personId?: string;
  channel: CommunicationChannel;
  status: CommunicationDeliveryStatus;
  providerMessageId?: string;
  errorMessage?: string;
  queuedAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunicationStatusHistory {
  id: string;
  communicationId: string;
  fromStatus?: CommunicationStatus;
  toStatus: CommunicationStatus;
  changedByPersonId: string;
  remarks?: string;
  createdAt: Date;
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

export interface CommunicationFilters {
  propertyId?: string;
  categoryId?: string;
  type?: CommunicationType;
  priority?: CommunicationPriority;
  status?: CommunicationStatus;
  createdByPersonId?: string;
  isPinned?: boolean;
  search?: string;
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
