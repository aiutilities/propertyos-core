import {
  Reservation,
  ReservationAvailabilityQuery,
  ReservationDetails,
  ReservationFilters,
  ReservationMetrics,
  ReservationResource,
  ReservationResourceBlock,
  ReservationResourceFilters,
  ReservationStatus,
  ReservationStatusHistory,
} from '../types/reservation.types';

export const RESERVATION_REPOSITORY =
  Symbol('RESERVATION_REPOSITORY');

export interface ReservationRepository {
  createResource(
    resource: ReservationResource,
  ): Promise<ReservationResource>;

  findResourceById(
    id: string,
  ): Promise<ReservationResource | null>;

  findResourceByCode(
    propertyId: string,
    normalizedCode: string,
  ): Promise<ReservationResource | null>;

  listResources(
    filters?: ReservationResourceFilters,
  ): Promise<ReservationResource[]>;

  updateResource(
    id: string,
    input: Partial<ReservationResource>,
  ): Promise<ReservationResource | null>;

  createReservation(
    reservation: Reservation,
  ): Promise<Reservation>;

  findReservationById(
    id: string,
  ): Promise<Reservation | null>;

  findReservationDetailsById(
    id: string,
  ): Promise<ReservationDetails | null>;

  listReservations(
    filters?: ReservationFilters,
  ): Promise<Reservation[]>;

  updateReservation(
    id: string,
    input: Partial<Reservation>,
  ): Promise<Reservation | null>;

  updateReservationStatus(
    id: string,
    status: ReservationStatus,
    input?: Partial<Reservation>,
  ): Promise<Reservation | null>;

  addHistory(
    history: ReservationStatusHistory,
  ): Promise<ReservationStatusHistory>;

  listHistory(
    reservationId: string,
  ): Promise<ReservationStatusHistory[]>;

  createResourceBlock(
    block: ReservationResourceBlock,
  ): Promise<ReservationResourceBlock>;

  listResourceBlocks(
    resourceId: string,
    startsFrom?: Date,
    startsUntil?: Date,
  ): Promise<ReservationResourceBlock[]>;

  findConflictingReservations(
    query: ReservationAvailabilityQuery,
  ): Promise<Reservation[]>;

  findConflictingBlocks(
    query: ReservationAvailabilityQuery,
  ): Promise<ReservationResourceBlock[]>;

  getMetrics(
    propertyId?: string,
  ): Promise<ReservationMetrics>;
}
