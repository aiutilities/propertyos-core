import {
  AccessEvent,
  AccessEventFilters,
  AccessGrant,
  AccessGrantFilters,
  AccessGrantStatus,
  AccessMetrics,
  AccessPoint,
  AccessPointFilters,
  AccessPointStatus,
} from "../types/access-control.types";

export const ACCESS_CONTROL_REPOSITORY = Symbol("ACCESS_CONTROL_REPOSITORY");

export interface AccessControlRepository {
  createAccessPoint(accessPoint: AccessPoint): Promise<AccessPoint>;

  findAccessPointById(id: string): Promise<AccessPoint | null>;

  findAccessPointByCode(
    propertyId: string,
    normalizedCode: string,
  ): Promise<AccessPoint | null>;

  listAccessPoints(filters?: AccessPointFilters): Promise<AccessPoint[]>;

  updateAccessPoint(
    id: string,
    input: Partial<AccessPoint>,
  ): Promise<AccessPoint | null>;

  updateAccessPointStatus(
    id: string,
    status: AccessPointStatus,
  ): Promise<AccessPoint | null>;

  createGrant(grant: AccessGrant): Promise<AccessGrant>;

  findGrantById(id: string): Promise<AccessGrant | null>;

  findApplicableGrants(
    accessPointId: string,
    subjectType: AccessGrant["subjectType"],
    subjectId: string,
    at: Date,
  ): Promise<AccessGrant[]>;

  listGrants(filters?: AccessGrantFilters): Promise<AccessGrant[]>;

  updateGrantStatus(
    id: string,
    status: AccessGrantStatus,
    input?: Partial<AccessGrant>,
  ): Promise<AccessGrant | null>;

  createEvent(event: AccessEvent): Promise<AccessEvent>;

  listEvents(filters?: AccessEventFilters): Promise<AccessEvent[]>;

  findLatestGrantedEvent(
    accessPointId: string,
    subjectType: AccessEvent["subjectType"],
    subjectId: string,
  ): Promise<AccessEvent | null>;

  getMetrics(propertyId?: string): Promise<AccessMetrics>;
}
