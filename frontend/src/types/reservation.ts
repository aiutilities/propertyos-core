export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export type ReservationStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "CHECKED_IN"
  | "COMPLETED"
  | "NO_SHOW";

export type ReservationResourceType =
  | "FACILITY"
  | "ROOM"
  | "DESK"
  | "PARKING"
  | "EQUIPMENT"
  | "AMENITY"
  | "SERVICE"
  | "OTHER";

export interface ReservationResource {
  id: string;
  propertyId: string;
  zoneId?: string;
  spaceId?: string;

  code: string;
  normalizedCode?: string;

  name: string;
  description?: string;

  resourceType: ReservationResourceType;

  capacity: number;

  requiresApproval: boolean;
  isActive: boolean;

  minimumDurationMinutes: number;
  maximumDurationMinutes?: number;
  bookingIntervalMinutes: number;

  advanceBookingDays: number;
  minimumNoticeMinutes: number;

  openingTime?: string;
  closingTime?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ReservationResourceBlock {
  id: string;
  resourceId: string;

  startAt: string;
  endAt: string;

  reason: string;
  createdByPersonId: string;

  createdAt: string;
}

export interface ReservationHistoryEntry {
  id: string;
  reservationId: string;

  fromStatus?: ReservationStatus;
  toStatus: ReservationStatus;

  changedByPersonId?: string;
  remarks?: string;

  createdAt: string;
}

export interface Reservation {
  id: string;
  reservationNumber: string;

  resourceId: string;
  propertyId: string;

  requesterPersonId: string;
  beneficiaryPersonId?: string;

  title: string;
  description?: string;

  startAt: string;
  endAt: string;

  attendeeCount: number;

  status: ReservationStatus;
  approvalRequired: boolean;

  approvedByPersonId?: string;
  approvedAt?: string;

  rejectedByPersonId?: string;
  rejectedAt?: string;
  rejectionReason?: string;

  cancelledByPersonId?: string;
  cancelledAt?: string;
  cancellationReason?: string;

  checkedInAt?: string;
  completedAt?: string;
  noShowAt?: string;

  notes?: string;

  resource?: ReservationResource;
  history?: ReservationHistoryEntry[];

  createdAt: string;
  updatedAt: string;
}

export interface ReservationMetrics {
  total: number;
  pending: number;
  approved: number;
  checkedIn: number;
  completed: number;
  cancelled: number;
  rejected: number;
  noShow: number;
  upcoming: number;
}

export interface ReservationFilters {
  propertyId?: string;
  resourceId?: string;
  requesterPersonId?: string;
  beneficiaryPersonId?: string;
  status?: ReservationStatus | "";
  startsFrom?: string;
  startsUntil?: string;
  search?: string;
}

export interface ReservationResourceFilters {
  propertyId?: string;
  zoneId?: string;
  spaceId?: string;
  resourceType?: ReservationResourceType | "";
  isActive?: boolean | "";
  search?: string;
}

export interface CreateReservationInput {
  resourceId: string;
  propertyId: string;

  requesterPersonId: string;
  beneficiaryPersonId?: string;

  title: string;
  description?: string;

  startAt: string;
  endAt: string;

  attendeeCount: number;
  notes?: string;
}

export interface ApproveReservationInput {
  approvedByPersonId: string;
  remarks?: string;
}

export interface RejectReservationInput {
  rejectedByPersonId: string;
  reason: string;
}

export interface CancelReservationInput {
  cancelledByPersonId: string;
  reason: string;
}

export interface TransitionReservationInput {
  changedByPersonId: string;
  remarks?: string;
}

export interface AvailabilityInput {
  resourceId: string;
  startAt: string;
  endAt: string;
  attendeeCount?: number;
  excludeReservationId?: string;
}

export interface AvailabilityResult {
  available: boolean;
  resource: ReservationResource;
  conflictingReservations: Reservation[];
  conflictingBlocks: ReservationResourceBlock[];
}

export interface CreateReservationResourceInput {
  propertyId: string;
  zoneId?: string;
  spaceId?: string;

  code: string;
  name: string;
  description?: string;

  resourceType: ReservationResourceType;

  capacity: number;

  requiresApproval: boolean;

  minimumDurationMinutes: number;
  maximumDurationMinutes?: number;
  bookingIntervalMinutes: number;

  advanceBookingDays: number;
  minimumNoticeMinutes: number;

  openingTime?: string;
  closingTime?: string;
}

export interface UpdateReservationResourceInput {
  zoneId?: string;
  spaceId?: string;

  name?: string;
  description?: string;

  resourceType?: ReservationResourceType;

  capacity?: number;

  requiresApproval?: boolean;
  isActive?: boolean;

  minimumDurationMinutes?: number;
  maximumDurationMinutes?: number;
  bookingIntervalMinutes?: number;

  advanceBookingDays?: number;
  minimumNoticeMinutes?: number;

  openingTime?: string;
  closingTime?: string;
}

export interface CreateReservationResourceBlockInput {
  startAt: string;
  endAt: string;

  reason: string;
  createdByPersonId: string;
}
