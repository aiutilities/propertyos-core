import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "crypto";

import { AuditService } from "../../audit/audit.service";
import { CredentialService } from "../../credential/services/credential.service";
import { EventBusService } from "../../eventbus/services/eventbus.service";
import { ACCESS_CONTROL_EVENTS } from "../access-control.constants";
import { CreateAccessGrantDto } from "../dto/create-access-grant.dto";
import { CreateAccessPointDto } from "../dto/create-access-point.dto";
import { EvaluateAccessDto } from "../dto/evaluate-access.dto";
import { RevokeAccessGrantDto } from "../dto/revoke-access-grant.dto";
import { UpdateAccessPointDto } from "../dto/update-access-point.dto";
import {
  ACCESS_CONTROL_REPOSITORY,
  AccessControlRepository,
} from "../repositories/access-control.repository";
import {
  AccessDecision,
  AccessDenialReason,
  AccessDirection,
  AccessEvaluation,
  AccessEvent,
  AccessEventFilters,
  AccessEventType,
  AccessGrant,
  AccessGrantFilters,
  AccessGrantStatus,
  AccessMetrics,
  AccessPoint,
  AccessPointFilters,
  AccessPointStatus,
  AccessSchedule,
  AccessSubjectType,
} from "../types/access-control.types";

@Injectable()
export class AccessControlService {
  private readonly eventSource = "core.access-control";

  constructor(
    @Inject(ACCESS_CONTROL_REPOSITORY)
    private readonly repository: AccessControlRepository,
    private readonly credentialService: CredentialService,
    private readonly eventBus: EventBusService,
    private readonly auditService: AuditService,
  ) {}

  async createAccessPoint(dto: CreateAccessPointDto): Promise<AccessPoint> {
    const normalizedCode = this.normalizeCode(dto.code);

    if (!normalizedCode) {
      throw new BadRequestException("Access-point code is required");
    }

    if (!dto.name?.trim()) {
      throw new BadRequestException("Access-point name is required");
    }

    const duplicate = await this.repository.findAccessPointByCode(
      dto.propertyId,
      normalizedCode,
    );

    if (duplicate) {
      throw new ConflictException(
        `Access point already exists: ${duplicate.code}`,
      );
    }

    const now = new Date();

    const accessPoint: AccessPoint = {
      id: randomUUID(),
      propertyId: dto.propertyId,
      zoneId: this.optionalTrim(dto.zoneId),
      spaceId: this.optionalTrim(dto.spaceId),
      code: dto.code.trim().toUpperCase(),
      normalizedCode,
      name: dto.name.trim(),
      description: this.optionalTrim(dto.description),
      accessPointType: dto.accessPointType,
      direction: dto.direction,
      status: AccessPointStatus.ACTIVE,
      controllerProvider: this.optionalTrim(dto.controllerProvider),
      controllerReference: this.optionalTrim(dto.controllerReference),
      requiresAntiPassback: dto.requiresAntiPassback ?? false,
      metadata: dto.metadata,
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.repository.createAccessPoint(accessPoint);

    await this.publishAndAudit(
      ACCESS_CONTROL_EVENTS.ACCESS_POINT_CREATED,
      this.accessPointPayload(created),
    );

    return created;
  }

  listAccessPoints(filters: AccessPointFilters = {}): Promise<AccessPoint[]> {
    return this.repository.listAccessPoints({
      ...filters,
      search: filters.search?.trim() || undefined,
    });
  }

  async getAccessPoint(id: string): Promise<AccessPoint> {
    const accessPoint = await this.repository.findAccessPointById(id);

    if (!accessPoint) {
      throw new NotFoundException(`Access point not found: ${id}`);
    }

    return accessPoint;
  }

  async lookupAccessPoint(
    propertyId: string,
    code: string,
  ): Promise<AccessPoint> {
    if (!propertyId?.trim()) {
      throw new BadRequestException("Property ID is required");
    }

    const normalizedCode = this.normalizeCode(code);

    if (!normalizedCode) {
      throw new BadRequestException("Access-point code is required");
    }

    const accessPoint = await this.repository.findAccessPointByCode(
      propertyId,
      normalizedCode,
    );

    if (!accessPoint) {
      throw new NotFoundException(`Access point not found: ${code}`);
    }

    return accessPoint;
  }

  async updateAccessPoint(
    id: string,
    dto: UpdateAccessPointDto,
  ): Promise<AccessPoint> {
    const current = await this.getAccessPoint(id);

    if (dto.status && dto.status !== current.status) {
      this.assertAccessPointStatusTransition(current.status, dto.status);
    }

    const updated = await this.repository.updateAccessPoint(id, {
      zoneId:
        dto.zoneId !== undefined
          ? this.optionalTrim(dto.zoneId)
          : current.zoneId,
      spaceId:
        dto.spaceId !== undefined
          ? this.optionalTrim(dto.spaceId)
          : current.spaceId,
      name: dto.name?.trim() || current.name,
      description:
        dto.description !== undefined
          ? this.optionalTrim(dto.description)
          : current.description,
      accessPointType: dto.accessPointType ?? current.accessPointType,
      direction: dto.direction ?? current.direction,
      status: dto.status ?? current.status,
      controllerProvider:
        dto.controllerProvider !== undefined
          ? this.optionalTrim(dto.controllerProvider)
          : current.controllerProvider,
      controllerReference:
        dto.controllerReference !== undefined
          ? this.optionalTrim(dto.controllerReference)
          : current.controllerReference,
      requiresAntiPassback:
        dto.requiresAntiPassback ?? current.requiresAntiPassback,
      metadata: dto.metadata ?? current.metadata,
    });

    if (!updated) {
      throw new NotFoundException(`Access point not found: ${id}`);
    }

    const eventType =
      dto.status && dto.status !== current.status
        ? this.eventForAccessPointStatus(dto.status)
        : ACCESS_CONTROL_EVENTS.ACCESS_POINT_UPDATED;

    await this.publishAndAudit(
      eventType,
      this.accessPointPayload(updated, {
        actorPersonId: dto.changedByPersonId,
        remarks: dto.remarks,
        previousStatus: current.status,
      }),
    );

    return updated;
  }

  async createGrant(dto: CreateAccessGrantDto): Promise<AccessGrant> {
    const accessPoint = await this.getAccessPoint(dto.accessPointId);

    if (accessPoint.status === AccessPointStatus.ARCHIVED) {
      throw new BadRequestException(
        "Cannot create a grant for an archived access point",
      );
    }

    if (!Object.values(AccessSubjectType).includes(dto.subjectType)) {
      throw new BadRequestException(
        `Unsupported access subject type: ${dto.subjectType}`,
      );
    }

    const validFrom = this.optionalDate(dto.validFrom, "validFrom");

    const validUntil = this.optionalDate(dto.validUntil, "validUntil");

    if (validFrom && validUntil && validUntil <= validFrom) {
      throw new BadRequestException(
        "Grant validUntil must be later than validFrom",
      );
    }

    this.validateSchedule(dto.schedule);

    const existing = await this.repository.listGrants({
      accessPointId: dto.accessPointId,
      subjectType: dto.subjectType,
      subjectId: dto.subjectId,
      status: AccessGrantStatus.ACTIVE,
    });

    const duplicate = existing.find(
      (grant) =>
        grant.direction === dto.direction &&
        this.dateValue(grant.validFrom) === this.dateValue(validFrom) &&
        this.dateValue(grant.validUntil) === this.dateValue(validUntil) &&
        JSON.stringify(grant.schedule ?? {}) ===
          JSON.stringify(dto.schedule ?? {}),
    );

    if (duplicate) {
      throw new ConflictException(
        "An equivalent active access grant already exists",
      );
    }

    const now = new Date();

    const grant: AccessGrant = {
      id: randomUUID(),
      accessPointId: dto.accessPointId,
      subjectType: dto.subjectType,
      subjectId: dto.subjectId,
      direction: dto.direction,
      status: AccessGrantStatus.ACTIVE,
      validFrom,
      validUntil,
      schedule: dto.schedule,
      issuedByPersonId: dto.issuedByPersonId,
      notes: this.optionalTrim(dto.notes),
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.repository.createGrant(grant);

    await this.publishAndAudit(
      ACCESS_CONTROL_EVENTS.GRANT_CREATED,
      this.grantPayload(created, {
        propertyId: accessPoint.propertyId,
      }),
    );

    return created;
  }

  listGrants(filters: AccessGrantFilters = {}): Promise<AccessGrant[]> {
    return this.repository.listGrants(filters);
  }

  async getGrant(id: string): Promise<AccessGrant> {
    const grant = await this.repository.findGrantById(id);

    if (!grant) {
      throw new NotFoundException(`Access grant not found: ${id}`);
    }

    return grant;
  }

  async revokeGrant(
    id: string,
    dto: RevokeAccessGrantDto,
  ): Promise<AccessGrant> {
    const current = await this.getGrant(id);

    if (current.status === AccessGrantStatus.REVOKED) {
      throw new BadRequestException("Access grant is already revoked");
    }

    if (current.status === AccessGrantStatus.EXPIRED) {
      throw new BadRequestException("Expired access grants cannot be revoked");
    }

    const reason = dto.reason?.trim();

    if (!reason) {
      throw new BadRequestException("Revocation reason is required");
    }

    const revoked = await this.repository.updateGrantStatus(
      id,
      AccessGrantStatus.REVOKED,
      {
        revokedByPersonId: dto.revokedByPersonId,
        revokedAt: new Date(),
        revocationReason: reason,
      },
    );

    if (!revoked) {
      throw new NotFoundException(`Access grant not found: ${id}`);
    }

    await this.publishAndAudit(
      ACCESS_CONTROL_EVENTS.GRANT_REVOKED,
      this.grantPayload(revoked),
    );

    return revoked;
  }

  async evaluateAccess(dto: EvaluateAccessDto): Promise<AccessEvaluation> {
    const occurredAt = dto.occurredAt
      ? this.requiredDate(dto.occurredAt, "occurredAt")
      : new Date();

    const accessPoint = await this.lookupAccessPoint(
      dto.propertyId,
      dto.accessPointCode,
    );

    if (
      accessPoint.status !== AccessPointStatus.ACTIVE &&
      accessPoint.status !== AccessPointStatus.EMERGENCY_OPEN
    ) {
      return this.denyAccess({
        accessPoint,
        eventType: dto.eventType,
        denialReason: AccessDenialReason.ACCESS_POINT_INACTIVE,
        recordedByPersonId: dto.recordedByPersonId,
        occurredAt,
        metadata: dto.metadata,
      });
    }

    if (!this.directionAllows(accessPoint.direction, dto.eventType)) {
      return this.denyAccess({
        accessPoint,
        eventType: dto.eventType,
        denialReason: AccessDenialReason.DIRECTION_NOT_ALLOWED,
        recordedByPersonId: dto.recordedByPersonId,
        occurredAt,
        metadata: dto.metadata,
      });
    }

    const credentialResult = await this.credentialService.validateCredential({
      token: dto.credentialValue,
      credentialType: dto.credentialType,
      propertyId: dto.propertyId,
      spaceId: accessPoint.spaceId,
      context: {
        accessPointId: accessPoint.id,
        accessPointCode: accessPoint.code,
        eventType: dto.eventType,
        ...dto.metadata,
      },
    });

    if (!credentialResult.valid || !credentialResult.credential) {
      return this.denyAccess({
        accessPoint,
        eventType: dto.eventType,
        denialReason: AccessDenialReason.CREDENTIAL_INVALID,
        recordedByPersonId: dto.recordedByPersonId,
        occurredAt,
        metadata: {
          credentialValidationReason: credentialResult.reason,
          ...dto.metadata,
        },
      });
    }

    const credential = credentialResult.credential;

    const subjectType = this.toAccessSubjectType(credential.subjectType);

    if (!subjectType) {
      return this.denyAccess({
        accessPoint,
        eventType: dto.eventType,
        denialReason: AccessDenialReason.SUBJECT_INACTIVE,
        credentialId: credential.id,
        recordedByPersonId: dto.recordedByPersonId,
        occurredAt,
        metadata: {
          unsupportedSubjectType: credential.subjectType,
          ...dto.metadata,
        },
      });
    }

    const grants = await this.repository.findApplicableGrants(
      accessPoint.id,
      subjectType,
      credential.subjectId,
      occurredAt,
    );

    if (grants.length === 0) {
      return this.denyAccess({
        accessPoint,
        eventType: dto.eventType,
        denialReason: AccessDenialReason.GRANT_NOT_FOUND,
        subjectType,
        subjectId: credential.subjectId,
        credentialId: credential.id,
        recordedByPersonId: dto.recordedByPersonId,
        occurredAt,
        metadata: dto.metadata,
      });
    }

    const directionGrant = grants.find((grant) =>
      this.directionAllows(grant.direction, dto.eventType),
    );

    if (!directionGrant) {
      return this.denyAccess({
        accessPoint,
        eventType: dto.eventType,
        denialReason: AccessDenialReason.DIRECTION_NOT_ALLOWED,
        subjectType,
        subjectId: credential.subjectId,
        credentialId: credential.id,
        recordedByPersonId: dto.recordedByPersonId,
        occurredAt,
        metadata: dto.metadata,
      });
    }

    const scheduleGrant = grants.find(
      (grant) =>
        this.directionAllows(grant.direction, dto.eventType) &&
        this.scheduleAllows(grant.schedule, occurredAt),
    );

    if (!scheduleGrant) {
      return this.denyAccess({
        accessPoint,
        eventType: dto.eventType,
        denialReason: AccessDenialReason.SCHEDULE_NOT_ALLOWED,
        subjectType,
        subjectId: credential.subjectId,
        credentialId: credential.id,
        recordedByPersonId: dto.recordedByPersonId,
        occurredAt,
        metadata: dto.metadata,
      });
    }

    if (accessPoint.requiresAntiPassback) {
      const latest = await this.repository.findLatestGrantedEvent(
        accessPoint.id,
        subjectType,
        credential.subjectId,
      );

      if (latest && latest.eventType === dto.eventType) {
        return this.denyAccess({
          accessPoint,
          eventType: dto.eventType,
          denialReason: AccessDenialReason.ANTI_PASSBACK,
          subjectType,
          subjectId: credential.subjectId,
          credentialId: credential.id,
          grant: scheduleGrant,
          recordedByPersonId: dto.recordedByPersonId,
          occurredAt,
          metadata: dto.metadata,
        });
      }
    }

    return this.grantAccess({
      accessPoint,
      eventType: dto.eventType,
      subjectType,
      subjectId: credential.subjectId,
      credentialId: credential.id,
      grant: scheduleGrant,
      recordedByPersonId: dto.recordedByPersonId,
      occurredAt,
      metadata: dto.metadata,
    });
  }

  listEvents(filters: AccessEventFilters = {}): Promise<AccessEvent[]> {
    return this.repository.listEvents(filters);
  }

  getMetrics(propertyId?: string): Promise<AccessMetrics> {
    return this.repository.getMetrics(propertyId);
  }

  normalizeCode(value: string): string {
    return String(value ?? "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  }

  private async grantAccess(input: {
    accessPoint: AccessPoint;
    eventType: AccessEventType;
    subjectType: AccessSubjectType;
    subjectId: string;
    credentialId: string;
    grant: AccessGrant;
    recordedByPersonId?: string;
    occurredAt: Date;
    metadata?: Record<string, unknown>;
  }): Promise<AccessEvaluation> {
    const event = await this.persistEvent({
      accessPointId: input.accessPoint.id,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      credentialId: input.credentialId,
      eventType: input.eventType,
      decision: AccessDecision.GRANTED,
      grantId: input.grant.id,
      recordedByPersonId: input.recordedByPersonId,
      occurredAt: input.occurredAt,
      metadata: input.metadata,
    });

    const accessEventType = ACCESS_CONTROL_EVENTS.ACCESS_GRANTED;

    const movementEventType =
      input.eventType === AccessEventType.ENTRY
        ? ACCESS_CONTROL_EVENTS.ENTRY_RECORDED
        : ACCESS_CONTROL_EVENTS.EXIT_RECORDED;

    const payload = this.accessEventPayload(event, input.accessPoint);

    await this.publishAndAudit(accessEventType, payload);

    await this.eventBus.publish(movementEventType, this.eventSource, payload);

    return {
      accessPoint: input.accessPoint,
      eventType: input.eventType,
      decision: AccessDecision.GRANTED,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      credentialId: input.credentialId,
      grant: input.grant,
    };
  }

  private async denyAccess(input: {
    accessPoint: AccessPoint;
    eventType: AccessEventType;
    denialReason: AccessDenialReason;
    subjectType?: AccessSubjectType;
    subjectId?: string;
    credentialId?: string;
    grant?: AccessGrant;
    recordedByPersonId?: string;
    occurredAt: Date;
    metadata?: Record<string, unknown>;
  }): Promise<AccessEvaluation> {
    const event = await this.persistEvent({
      accessPointId: input.accessPoint.id,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      credentialId: input.credentialId,
      eventType: input.eventType,
      decision: AccessDecision.DENIED,
      denialReason: input.denialReason,
      grantId: input.grant?.id,
      recordedByPersonId: input.recordedByPersonId,
      occurredAt: input.occurredAt,
      metadata: input.metadata,
    });

    await this.publishAndAudit(
      ACCESS_CONTROL_EVENTS.ACCESS_DENIED,
      this.accessEventPayload(event, input.accessPoint),
    );

    return {
      accessPoint: input.accessPoint,
      eventType: input.eventType,
      decision: AccessDecision.DENIED,
      denialReason: input.denialReason,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      credentialId: input.credentialId,
      grant: input.grant,
    };
  }

  private persistEvent(
    input: Omit<AccessEvent, "id" | "createdAt">,
  ): Promise<AccessEvent> {
    return this.repository.createEvent({
      id: randomUUID(),
      ...input,
      createdAt: new Date(),
    });
  }

  private directionAllows(
    direction: AccessDirection,
    eventType: AccessEventType,
  ): boolean {
    return (
      direction === AccessDirection.BIDIRECTIONAL ||
      direction === this.eventDirection(eventType)
    );
  }

  private eventDirection(eventType: AccessEventType): AccessDirection {
    return eventType === AccessEventType.ENTRY
      ? AccessDirection.ENTRY
      : AccessDirection.EXIT;
  }

  private scheduleAllows(
    schedule: AccessSchedule | undefined,
    at: Date,
  ): boolean {
    if (!schedule) {
      return true;
    }

    if (
      schedule.daysOfWeek &&
      schedule.daysOfWeek.length > 0 &&
      !schedule.daysOfWeek.includes(at.getDay())
    ) {
      return false;
    }

    if (!schedule.startTime || !schedule.endTime) {
      return true;
    }

    const currentMinutes = at.getHours() * 60 + at.getMinutes();

    const startMinutes = this.timeToMinutes(schedule.startTime);

    const endMinutes = this.timeToMinutes(schedule.endTime);

    if (startMinutes === endMinutes) {
      return true;
    }

    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }

    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }

  private validateSchedule(schedule?: AccessSchedule): void {
    if (!schedule) {
      return;
    }

    if (schedule.daysOfWeek) {
      const invalid = schedule.daysOfWeek.some(
        (day) => !Number.isInteger(day) || day < 0 || day > 6,
      );

      if (invalid) {
        throw new BadRequestException(
          "Schedule daysOfWeek must contain integers from 0 to 6",
        );
      }
    }

    if (Boolean(schedule.startTime) !== Boolean(schedule.endTime)) {
      throw new BadRequestException(
        "Schedule startTime and endTime must be supplied together",
      );
    }

    if (schedule.startTime) {
      this.timeToMinutes(schedule.startTime);
    }

    if (schedule.endTime) {
      this.timeToMinutes(schedule.endTime);
    }
  }

  private timeToMinutes(value: string): number {
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) {
      throw new BadRequestException(
        `Invalid schedule time: ${value}. Expected HH:mm`,
      );
    }

    const [hours, minutes] = value.split(":").map(Number);

    return hours * 60 + minutes;
  }

  private assertAccessPointStatusTransition(
    from: AccessPointStatus,
    to: AccessPointStatus,
  ): void {
    const transitions: Record<AccessPointStatus, AccessPointStatus[]> = {
      ACTIVE: [
        AccessPointStatus.INACTIVE,
        AccessPointStatus.MAINTENANCE,
        AccessPointStatus.EMERGENCY_OPEN,
        AccessPointStatus.ARCHIVED,
      ],
      INACTIVE: [
        AccessPointStatus.ACTIVE,
        AccessPointStatus.MAINTENANCE,
        AccessPointStatus.EMERGENCY_OPEN,
        AccessPointStatus.ARCHIVED,
      ],
      MAINTENANCE: [
        AccessPointStatus.ACTIVE,
        AccessPointStatus.INACTIVE,
        AccessPointStatus.EMERGENCY_OPEN,
        AccessPointStatus.ARCHIVED,
      ],
      EMERGENCY_OPEN: [
        AccessPointStatus.ACTIVE,
        AccessPointStatus.INACTIVE,
        AccessPointStatus.MAINTENANCE,
        AccessPointStatus.ARCHIVED,
      ],
      ARCHIVED: [],
    };

    if (!transitions[from].includes(to)) {
      throw new BadRequestException(
        `Invalid access-point status transition: ${from} -> ${to}`,
      );
    }
  }

  private eventForAccessPointStatus(status: AccessPointStatus): string {
    const events: Record<AccessPointStatus, string> = {
      ACTIVE: ACCESS_CONTROL_EVENTS.ACCESS_POINT_ACTIVATED,
      INACTIVE: ACCESS_CONTROL_EVENTS.ACCESS_POINT_DEACTIVATED,
      MAINTENANCE: ACCESS_CONTROL_EVENTS.ACCESS_POINT_UPDATED,
      EMERGENCY_OPEN: ACCESS_CONTROL_EVENTS.ACCESS_POINT_EMERGENCY_OPENED,
      ARCHIVED: ACCESS_CONTROL_EVENTS.ACCESS_POINT_UPDATED,
    };

    return events[status];
  }

  private toAccessSubjectType(value: string): AccessSubjectType | undefined {
    const normalized = String(value).trim().toUpperCase();

    return Object.values(AccessSubjectType).includes(
      normalized as AccessSubjectType,
    )
      ? (normalized as AccessSubjectType)
      : undefined;
  }

  private accessPointPayload(
    accessPoint: AccessPoint,
    extra: Record<string, unknown> = {},
  ) {
    return {
      entityType: "access-point",
      entityId: accessPoint.id,
      accessPointId: accessPoint.id,
      propertyId: accessPoint.propertyId,
      zoneId: accessPoint.zoneId,
      spaceId: accessPoint.spaceId,
      code: accessPoint.code,
      accessPointType: accessPoint.accessPointType,
      direction: accessPoint.direction,
      status: accessPoint.status,
      ...extra,
    };
  }

  private grantPayload(
    grant: AccessGrant,
    extra: Record<string, unknown> = {},
  ) {
    return {
      entityType: "access-grant",
      entityId: grant.id,
      grantId: grant.id,
      accessPointId: grant.accessPointId,
      subjectType: grant.subjectType,
      subjectId: grant.subjectId,
      direction: grant.direction,
      status: grant.status,
      validFrom: grant.validFrom,
      validUntil: grant.validUntil,
      issuedByPersonId: grant.issuedByPersonId,
      revokedByPersonId: grant.revokedByPersonId,
      revocationReason: grant.revocationReason,
      ...extra,
    };
  }

  private accessEventPayload(event: AccessEvent, accessPoint: AccessPoint) {
    return {
      entityType: "access-event",
      entityId: event.id,
      accessEventId: event.id,
      accessPointId: event.accessPointId,
      accessPointCode: accessPoint.code,
      propertyId: accessPoint.propertyId,
      subjectType: event.subjectType,
      subjectId: event.subjectId,
      credentialId: event.credentialId,
      eventType: event.eventType,
      decision: event.decision,
      denialReason: event.denialReason,
      grantId: event.grantId,
      recordedByPersonId: event.recordedByPersonId,
      occurredAt: event.occurredAt,
      metadata: event.metadata,
    };
  }

  private async publishAndAudit(
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.eventBus.publish(eventType, this.eventSource, payload);

    await this.auditService.record(eventType, this.eventSource, payload);
  }

  private requiredDate(value: string, field: string): Date {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Invalid ${field}`);
    }

    return parsed;
  }

  private optionalDate(
    value: string | undefined,
    field: string,
  ): Date | undefined {
    return value ? this.requiredDate(value, field) : undefined;
  }

  private dateValue(value?: Date): number | undefined {
    return value?.getTime();
  }

  private optionalTrim(value?: string): string | undefined {
    const trimmed = value?.trim();

    return trimmed || undefined;
  }
}
