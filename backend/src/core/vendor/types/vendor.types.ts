export enum VendorStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BLOCKED = 'BLOCKED',
  ARCHIVED = 'ARCHIVED',
}

export enum VendorType {
  COMPANY = 'COMPANY',
  INDIVIDUAL = 'INDIVIDUAL',
  AGENCY = 'AGENCY',
  CONTRACTOR = 'CONTRACTOR',
  CONSULTANT = 'CONSULTANT',
}

export enum VendorContactType {
  PRIMARY = 'PRIMARY',
  BILLING = 'BILLING',
  OPERATIONS = 'OPERATIONS',
  ESCALATION = 'ESCALATION',
  EMERGENCY = 'EMERGENCY',
}

export enum VendorContractStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  RENEWED = 'RENEWED',
  CANCELLED = 'CANCELLED',
}

export enum VendorContractType {
  AMC = 'AMC',
  RATE_CONTRACT = 'RATE_CONTRACT',
  SERVICE_AGREEMENT = 'SERVICE_AGREEMENT',
  MANPOWER = 'MANPOWER',
  PROJECT = 'PROJECT',
  SUPPLY = 'SUPPLY',
  CONSULTING = 'CONSULTING',
  OTHER = 'OTHER',
}

export enum VendorComplianceType {
  GST = 'GST',
  PAN = 'PAN',
  INSURANCE = 'INSURANCE',
  LICENCE = 'LICENCE',
  CERTIFICATION = 'CERTIFICATION',
  LABOUR_REGISTRATION = 'LABOUR_REGISTRATION',
  POLICE_VERIFICATION = 'POLICE_VERIFICATION',
  SAFETY_CERTIFICATE = 'SAFETY_CERTIFICATE',
  OTHER = 'OTHER',
}

export enum VendorComplianceStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  WAIVED = 'WAIVED',
}

export enum VendorWorkOrderStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

export enum VendorWorkOrderPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface VendorCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vendor {
  id: string;
  vendorNumber: string;
  legalName: string;
  displayName: string;
  vendorType: VendorType;
  status: VendorStatus;

  email?: string;
  phone?: string;
  website?: string;

  taxIdentifier?: string;
  panNumber?: string;
  registrationNumber?: string;

  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;

  notes?: string;
  metadata: Record<string, unknown>;

  createdByPersonId: string;
  updatedByPersonId?: string;

  activatedAt?: Date;
  suspendedAt?: Date;
  blockedAt?: Date;
  archivedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface VendorContact {
  id: string;
  vendorId: string;
  contactType: VendorContactType;
  name: string;
  designation?: string;
  email?: string;
  phone?: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorPropertyCoverage {
  id: string;
  vendorId: string;
  propertyId: string;
  zoneId?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface VendorServiceCategory {
  id: string;
  vendorId: string;
  categoryId: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface VendorContract {
  id: string;
  contractNumber: string;
  vendorId: string;
  propertyId?: string;
  contractType: VendorContractType;
  title: string;
  description?: string;
  status: VendorContractStatus;

  startDate: Date;
  endDate: Date;

  contractValue?: number;
  currency: string;

  responseSlaMinutes?: number;
  resolutionSlaMinutes?: number;

  autoRenew: boolean;
  renewalNoticeDays: number;

  createdByPersonId: string;
  approvedByPersonId?: string;
  terminatedByPersonId?: string;

  activatedAt?: Date;
  terminatedAt?: Date;
  renewedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface VendorContractDocument {
  id: string;
  contractId: string;
  documentId: string;
  uploadedByPersonId: string;
  createdAt: Date;
}

export interface VendorComplianceDocument {
  id: string;
  vendorId: string;
  complianceType: VendorComplianceType;
  documentId: string;
  referenceNumber?: string;
  issuedAt?: Date;
  expiresAt?: Date;
  status: VendorComplianceStatus;
  verifiedByPersonId?: string;
  verifiedAt?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorWorkOrder {
  id: string;
  workOrderNumber: string;
  vendorId: string;
  propertyId: string;
  zoneId?: string;
  spaceId?: string;
  contractId?: string;

  maintenanceTicketId?: string;
  helpdeskTicketId?: string;
  facilityAssetId?: string;

  title: string;
  description: string;
  priority: VendorWorkOrderPriority;
  status: VendorWorkOrderStatus;

  scheduledStartAt?: Date;
  scheduledEndAt?: Date;
  actualStartAt?: Date;
  actualEndAt?: Date;

  estimatedCost?: number;
  actualCost?: number;
  currency: string;

  assignedByPersonId: string;
  acceptedByPersonId?: string;
  completedByPersonId?: string;
  cancelledByPersonId?: string;

  completionNotes?: string;
  cancellationReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface VendorWorkOrderHistory {
  id: string;
  workOrderId: string;
  fromStatus?: VendorWorkOrderStatus;
  toStatus: VendorWorkOrderStatus;
  changedByPersonId: string;
  remarks?: string;
  createdAt: Date;
}

export interface VendorRating {
  id: string;
  vendorId: string;
  workOrderId?: string;
  propertyId?: string;
  ratedByPersonId: string;
  rating: number;
  qualityRating?: number;
  timelinessRating?: number;
  professionalismRating?: number;
  comments?: string;
  createdAt: Date;
}

export interface VendorDetails
  extends Vendor {
  contacts: VendorContact[];
  propertyCoverage: VendorPropertyCoverage[];
  serviceCategories: VendorServiceCategory[];
  contracts: VendorContract[];
  complianceDocuments: VendorComplianceDocument[];
  ratings: VendorRating[];
}

export interface VendorFilters {
  status?: VendorStatus;
  vendorType?: VendorType;
  categoryId?: string;
  propertyId?: string;
  search?: string;
}

export interface VendorMetrics {
  total: number;
  draft: number;
  active: number;
  suspended: number;
  blocked: number;
  archived: number;
  contractsExpiring: number;
  complianceExpiring: number;
  complianceExpired: number;
  openWorkOrders: number;
}
