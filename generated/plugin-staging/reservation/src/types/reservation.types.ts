export enum ReservationResourceType {
  FACILITY = 'FACILITY',
  ROOM = 'ROOM',
  DESK = 'DESK',
  PARKING = 'PARKING',
  EQUIPMENT = 'EQUIPMENT',
  AMENITY = 'AMENITY',
  SERVICE = 'SERVICE',
  OTHER = 'OTHER',
}

export enum ReservationStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  CHECKED_IN = 'CHECKED_IN',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export interface ReservationResource {
  id: string;
  propertyId: string;
  zoneId?: string;
  spaceId?: string;

  code: string;
  normalizedCode: string;

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

  createdAt: Date;
  updatedAt: Date;
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

  startAt: Date;
  endAt: Date;

  attendeeCount: number;

  status: ReservationStatus;
  approvalRequired: boolean;

  approvedByPersonId?: string;
  approvedAt?: Date;

  rejectedByPersonId?: string;
  rejectedAt?: Date;
  rejectionReason?: string;

  cancelledByPersonId?: string;
  cancelledAt?: Date;
  cancellationReason?: string;

  checkedInAt?: Date;
  completedAt?: Date;

  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface ReservationStatusHistory {
  id: string;
  reservationId: string;

  fromStatus?: ReservationStatus;
  toStatus: ReservationStatus;

  changedByPersonId: string;
  remarks?: string;

  createdAt: Date;
}

export interface ReservationResourceBlock {
  id: string;
  resourceId: string;

  startAt: Date;
  endAt: Date;

  reason: string;
  createdByPersonId: string;

  createdAt: Date;
}

export interface ReservationDetails extends Reservation {
  resource?: ReservationResource;
  history: ReservationStatusHistory[];
}

export interface ReservationResourceFilters {
  propertyId?: string;
  zoneId?: string;
  spaceId?: string;
  resourceType?: ReservationResourceType;
  isActive?: boolean;
  search?: string;
}

export interface ReservationFilters {
  propertyId?: string;
  resourceId?: string;
  requesterPersonId?: string;
  beneficiaryPersonId?: string;
  status?: ReservationStatus;
  startsFrom?: Date;
  startsUntil?: Date;
  search?: string;
}

export interface ReservationAvailabilityQuery {
  resourceId: string;
  startAt: Date;
  endAt: Date;
  excludeReservationId?: string;
}

export interface ReservationAvailabilityResult {
  available: boolean;
  resource: ReservationResource;
  conflictingReservations: Reservation[];
  conflictingBlocks: ReservationResourceBlock[];
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
