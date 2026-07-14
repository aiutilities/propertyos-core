export type VendorStatus =
  | "DRAFT"
  | "ACTIVE"
  | "SUSPENDED"
  | "BLOCKED"
  | "ARCHIVED";

export type VendorType =
  | "COMPANY"
  | "INDIVIDUAL"
  | "AGENCY"
  | "CONTRACTOR"
  | "CONSULTANT";

export type VendorContactType =
  | "PRIMARY"
  | "BILLING"
  | "OPERATIONS"
  | "ESCALATION"
  | "EMERGENCY";

export type VendorContractStatus =
  | "DRAFT"
  | "ACTIVE"
  | "EXPIRED"
  | "TERMINATED"
  | "RENEWED"
  | "CANCELLED";

export type VendorContractType =
  | "AMC"
  | "RATE_CONTRACT"
  | "SERVICE_AGREEMENT"
  | "MANPOWER"
  | "PROJECT"
  | "SUPPLY"
  | "CONSULTING"
  | "OTHER";

export type VendorComplianceType =
  | "GST"
  | "PAN"
  | "INSURANCE"
  | "LICENCE"
  | "CERTIFICATION"
  | "LABOUR_REGISTRATION"
  | "POLICE_VERIFICATION"
  | "SAFETY_CERTIFICATE"
  | "OTHER";

export type VendorComplianceStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED"
  | "WAIVED";

export type VendorWorkOrderStatus =
  | "DRAFT"
  | "ISSUED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

export type VendorWorkOrderPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

export interface VendorCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface VendorPropertyCoverage {
  id: string;
  vendorId: string;
  propertyId: string;
  zoneId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface VendorServiceCategory {
  id: string;
  vendorId: string;
  categoryId: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  category?: VendorCategory;
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
  startDate: string;
  endDate: string;
  contractValue?: number;
  currency: string;
  responseSlaMinutes?: number;
  resolutionSlaMinutes?: number;
  autoRenew: boolean;
  renewalNoticeDays: number;
  createdByPersonId: string;
  approvedByPersonId?: string;
  terminatedByPersonId?: string;
  activatedAt?: string;
  terminatedAt?: string;
  renewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorComplianceDocument {
  id: string;
  vendorId: string;
  complianceType: VendorComplianceType;
  documentId: string;
  referenceNumber?: string;
  issuedAt?: string;
  expiresAt?: string;
  status: VendorComplianceStatus;
  verifiedByPersonId?: string;
  verifiedAt?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorWorkOrderHistory {
  id: string;
  workOrderId: string;
  fromStatus?: VendorWorkOrderStatus;
  toStatus: VendorWorkOrderStatus;
  changedByPersonId: string;
  remarks?: string;
  createdAt: string;
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
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  actualStartAt?: string;
  actualEndAt?: string;
  estimatedCost?: number;
  actualCost?: number;
  currency: string;
  assignedByPersonId: string;
  acceptedByPersonId?: string;
  completedByPersonId?: string;
  cancelledByPersonId?: string;
  completionNotes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  history?: VendorWorkOrderHistory[];
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
  createdAt: string;
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
  activatedAt?: string;
  suspendedAt?: string;
  blockedAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorDetails extends Vendor {
  contacts: VendorContact[];
  propertyCoverage: VendorPropertyCoverage[];
  serviceCategories: VendorServiceCategory[];
  contracts: VendorContract[];
  complianceDocuments: VendorComplianceDocument[];
  ratings: VendorRating[];
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

export interface VendorRatingSummary {
  count: number;
  averageRating: number;
  averageQualityRating: number;
  averageTimelinessRating: number;
  averageProfessionalismRating: number;
}

export interface VendorFilters {
  status?: VendorStatus | "";
  vendorType?: VendorType | "";
  categoryId?: string;
  propertyId?: string;
  search?: string;
}

export interface VendorContractFilters {
  vendorId?: string;
  propertyId?: string;
  status?: VendorContractStatus | "";
  search?: string;
}

export interface VendorWorkOrderFilters {
  vendorId?: string;
  propertyId?: string;
  contractId?: string;
  status?: VendorWorkOrderStatus | "";
  priority?: VendorWorkOrderPriority | "";
  search?: string;
}

export interface CreateVendorInput {
  legalName: string;
  displayName: string;
  vendorType: VendorType;
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
  createdByPersonId: string;
  contacts?: Array<{
    contactType: VendorContactType;
    name: string;
    designation?: string;
    email?: string;
    phone?: string;
    isPrimary?: boolean;
  }>;
  propertyCoverage?: Array<{
    propertyId: string;
    zoneId?: string;
  }>;
  serviceCategories?: Array<{
    categoryId: string;
    notes?: string;
  }>;
}

export interface CreateVendorContractInput {
  vendorId: string;
  propertyId?: string;
  contractType: VendorContractType;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  contractValue?: number;
  currency?: string;
  responseSlaMinutes?: number;
  resolutionSlaMinutes?: number;
  autoRenew?: boolean;
  renewalNoticeDays?: number;
  createdByPersonId: string;
}

export interface CreateVendorWorkOrderInput {
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
  priority?: VendorWorkOrderPriority;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  estimatedCost?: number;
  currency?: string;
  assignedByPersonId: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}
