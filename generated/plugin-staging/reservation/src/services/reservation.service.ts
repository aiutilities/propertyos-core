import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { AuditService } from '@propertyos/core-contracts';
import {
  EventBusService,
} from '@propertyos/core-contracts';
import {
  SchedulerService,
} from '@propertyos/core-contracts';
import {
  WorkflowService,
} from '@propertyos/core-contracts';
import {
  RESERVATION_END_JOB_TYPE,
  RESERVATION_EVENTS,
  RESERVATION_REMINDER_JOB_TYPE,
  RESERVATION_WORKFLOW_CODE,
} from '../reservation.constants';
import {
  ApproveReservationDto,
} from '../dto/approve-reservation.dto';
import {
  CancelReservationDto,
} from '../dto/cancel-reservation.dto';
import {
  CheckAvailabilityDto,
} from '../dto/check-availability.dto';
import {
  CreateReservationDto,
} from '../dto/create-reservation.dto';
import {
  CreateReservationResourceDto,
} from '../dto/create-reservation-resource.dto';
import {
  CreateResourceBlockDto,
} from '../dto/create-resource-block.dto';
import {
  RejectReservationDto,
} from '../dto/reject-reservation.dto';
import {
  TransitionReservationDto,
} from '../dto/transition-reservation.dto';
import {
  UpdateReservationDto,
} from '../dto/update-reservation.dto';
import {
  UpdateReservationResourceDto,
} from '../dto/update-reservation-resource.dto';
import {
  RESERVATION_REPOSITORY,
  ReservationRepository,
} from '../repositories/reservation.repository';
import {
  Reservation,
  ReservationAvailabilityResult,
  ReservationFilters,
  ReservationResource,
  ReservationResourceBlock,
  ReservationResourceFilters,
  ReservationStatus,
  ReservationStatusHistory,
} from '../types/reservation.types';

@Injectable()
export class ReservationService {
  private readonly eventSource =
    'core.reservation';

  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly repository:
      ReservationRepository,
    private readonly eventBus:
      EventBusService,
    private readonly workflowService:
      WorkflowService,
    private readonly schedulerService:
      SchedulerService,
    private readonly auditService:
      AuditService,
  ) {}

  async createResource(
    dto: CreateReservationResourceDto,
  ): Promise<ReservationResource> {
    this.validateRequiredId(
      dto.propertyId,
      'Property ID',
    );

    const code = dto.code?.trim().toUpperCase();
    const normalizedCode =
      this.normalizeCode(dto.code);

    if (!normalizedCode) {
      throw new BadRequestException(
        'Reservation resource code is required',
      );
    }

    const name = dto.name?.trim();

    if (!name) {
      throw new BadRequestException(
        'Reservation resource name is required',
      );
    }

    const duplicate =
      await this.repository.findResourceByCode(
        dto.propertyId,
        normalizedCode,
      );

    if (duplicate) {
      throw new ConflictException(
        `Reservation resource already exists: ${duplicate.code}`,
      );
    }

    this.validateResourceConfiguration({
      capacity: dto.capacity,
      minimumDurationMinutes:
        dto.minimumDurationMinutes,
      maximumDurationMinutes:
        dto.maximumDurationMinutes,
      bookingIntervalMinutes:
        dto.bookingIntervalMinutes,
      advanceBookingDays:
        dto.advanceBookingDays,
      minimumNoticeMinutes:
        dto.minimumNoticeMinutes,
      openingTime: dto.openingTime,
      closingTime: dto.closingTime,
    });

    const now = new Date();

    const resource: ReservationResource = {
      id: randomUUID(),
      propertyId: dto.propertyId,
      zoneId: this.optionalTrim(dto.zoneId),
      spaceId: this.optionalTrim(dto.spaceId),
      code,
      normalizedCode,
      name,
      description:
        this.optionalTrim(dto.description),
      resourceType: dto.resourceType,
      capacity: dto.capacity,
      requiresApproval:
        dto.requiresApproval,
      isActive: true,
      minimumDurationMinutes:
        dto.minimumDurationMinutes,
      maximumDurationMinutes:
        dto.maximumDurationMinutes,
      bookingIntervalMinutes:
        dto.bookingIntervalMinutes,
      advanceBookingDays:
        dto.advanceBookingDays,
      minimumNoticeMinutes:
        dto.minimumNoticeMinutes,
      openingTime:
        this.optionalTrim(dto.openingTime),
      closingTime:
        this.optionalTrim(dto.closingTime),
      createdAt: now,
      updatedAt: now,
    };

    const created =
      await this.repository.createResource(
        resource,
      );

    await this.publishAndAudit(
      RESERVATION_EVENTS.RESOURCE_CREATED,
      this.resourcePayload(created),
    );

    return created;
  }

  listResources(
    filters: ReservationResourceFilters = {},
  ): Promise<ReservationResource[]> {
    return this.repository.listResources({
      ...filters,
      search:
        filters.search?.trim() || undefined,
    });
  }

  async getResource(
    id: string,
  ): Promise<ReservationResource> {
    const resource =
      await this.repository.findResourceById(
        id,
      );

    if (!resource) {
      throw new NotFoundException(
        `Reservation resource not found: ${id}`,
      );
    }

    return resource;
  }

  async updateResource(
    id: string,
    dto: UpdateReservationResourceDto,
  ): Promise<ReservationResource> {
    const current = await this.getResource(id);

    const capacity =
      dto.capacity ?? current.capacity;

    const minimumDurationMinutes =
      dto.minimumDurationMinutes ??
      current.minimumDurationMinutes;

    const maximumDurationMinutes =
      dto.maximumDurationMinutes !== undefined
        ? dto.maximumDurationMinutes
        : current.maximumDurationMinutes;

    const bookingIntervalMinutes =
      dto.bookingIntervalMinutes ??
      current.bookingIntervalMinutes;

    const advanceBookingDays =
      dto.advanceBookingDays ??
      current.advanceBookingDays;

    const minimumNoticeMinutes =
      dto.minimumNoticeMinutes ??
      current.minimumNoticeMinutes;

    const openingTime =
      dto.openingTime !== undefined
        ? this.optionalTrim(dto.openingTime)
        : current.openingTime;

    const closingTime =
      dto.closingTime !== undefined
        ? this.optionalTrim(dto.closingTime)
        : current.closingTime;

    this.validateResourceConfiguration({
      capacity,
      minimumDurationMinutes,
      maximumDurationMinutes,
      bookingIntervalMinutes,
      advanceBookingDays,
      minimumNoticeMinutes,
      openingTime,
      closingTime,
    });

    const updated =
      await this.repository.updateResource(
        id,
        {
          zoneId:
            dto.zoneId !== undefined
              ? this.optionalTrim(dto.zoneId)
              : current.zoneId,
          spaceId:
            dto.spaceId !== undefined
              ? this.optionalTrim(dto.spaceId)
              : current.spaceId,
          name:
            dto.name?.trim() ||
            current.name,
          description:
            dto.description !== undefined
              ? this.optionalTrim(
                  dto.description,
                )
              : current.description,
          resourceType:
            dto.resourceType ??
            current.resourceType,
          capacity,
          requiresApproval:
            dto.requiresApproval ??
            current.requiresApproval,
          isActive:
            dto.isActive ??
            current.isActive,
          minimumDurationMinutes,
          maximumDurationMinutes,
          bookingIntervalMinutes,
          advanceBookingDays,
          minimumNoticeMinutes,
          openingTime,
          closingTime,
        },
      );

    if (!updated) {
      throw new NotFoundException(
        `Reservation resource not found: ${id}`,
      );
    }

    const event =
      updated.isActive !== current.isActive
        ? updated.isActive
          ? RESERVATION_EVENTS
              .RESOURCE_ACTIVATED
          : RESERVATION_EVENTS
              .RESOURCE_DEACTIVATED
        : RESERVATION_EVENTS
            .RESOURCE_UPDATED;

    await this.publishAndAudit(
      event,
      this.resourcePayload(updated, {
        previousActiveStatus:
          current.isActive,
      }),
    );

    return updated;
  }

  async createResourceBlock(
    resourceId: string,
    dto: CreateResourceBlockDto,
  ): Promise<ReservationResourceBlock> {
    const resource =
      await this.getResource(resourceId);

    const startAt = this.requireDate(
      dto.startAt,
      'startAt',
    );

    const endAt = this.requireDate(
      dto.endAt,
      'endAt',
    );

    this.validateTimeRange(startAt, endAt);

    const reason = dto.reason?.trim();

    if (!reason) {
      throw new BadRequestException(
        'Resource block reason is required',
      );
    }

    this.validateRequiredId(
      dto.createdByPersonId,
      'Created-by person ID',
    );

    const conflicts =
      await this.repository
        .findConflictingReservations({
          resourceId,
          startAt,
          endAt,
        });

    if (conflicts.length > 0) {
      throw new ConflictException(
        'Resource block conflicts with an existing reservation',
      );
    }

    const block =
      await this.repository
        .createResourceBlock({
          id: randomUUID(),
          resourceId,
          startAt,
          endAt,
          reason,
          createdByPersonId:
            dto.createdByPersonId,
          createdAt: new Date(),
        });

    await this.publishAndAudit(
      RESERVATION_EVENTS.RESOURCE_BLOCKED,
      {
        entityType:
          'reservation-resource-block',
        entityId: block.id,
        blockId: block.id,
        resourceId,
        propertyId: resource.propertyId,
        startAt,
        endAt,
        reason,
        actorPersonId:
          dto.createdByPersonId,
      },
    );

    return block;
  }

  listResourceBlocks(
    resourceId: string,
    startsFrom?: string,
    startsUntil?: string,
  ): Promise<ReservationResourceBlock[]> {
    return this.repository
      .listResourceBlocks(
        resourceId,
        startsFrom
          ? this.requireDate(
              startsFrom,
              'startsFrom',
            )
          : undefined,
        startsUntil
          ? this.requireDate(
              startsUntil,
              'startsUntil',
            )
          : undefined,
      );
  }

  async checkAvailability(
    dto: CheckAvailabilityDto,
  ): Promise<ReservationAvailabilityResult> {
    const resource =
      await this.getResource(dto.resourceId);

    const startAt = this.requireDate(
      dto.startAt,
      'startAt',
    );

    const endAt = this.requireDate(
      dto.endAt,
      'endAt',
    );

    this.validateTimeRange(startAt, endAt);

    const [
      conflictingReservations,
      conflictingBlocks,
    ] = await Promise.all([
      this.repository
        .findConflictingReservations({
          resourceId: dto.resourceId,
          startAt,
          endAt,
          excludeReservationId:
            dto.excludeReservationId,
        }),
      this.repository.findConflictingBlocks({
        resourceId: dto.resourceId,
        startAt,
        endAt,
      }),
    ]);

    return {
      available:
        resource.isActive &&
        conflictingReservations.length === 0 &&
        conflictingBlocks.length === 0,
      resource,
      conflictingReservations,
      conflictingBlocks,
    };
  }

  async createReservation(
    dto: CreateReservationDto,
  ): Promise<Reservation> {
    this.validateRequiredId(
      dto.propertyId,
      'Property ID',
    );

    this.validateRequiredId(
      dto.requesterPersonId,
      'Requester person ID',
    );

    const resource =
      await this.getResource(dto.resourceId);

    if (
      resource.propertyId !== dto.propertyId
    ) {
      throw new BadRequestException(
        'Reservation property does not match the resource property',
      );
    }

    if (!resource.isActive) {
      throw new BadRequestException(
        'Inactive resources cannot be reserved',
      );
    }

    const title = dto.title?.trim();

    if (!title) {
      throw new BadRequestException(
        'Reservation title is required',
      );
    }

    const startAt = this.requireDate(
      dto.startAt,
      'startAt',
    );

    const endAt = this.requireDate(
      dto.endAt,
      'endAt',
    );

    this.validateReservationWindow(
      resource,
      startAt,
      endAt,
      dto.attendeeCount,
    );

    const availability =
      await this.checkAvailability({
        resourceId: resource.id,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
      });

    if (!availability.available) {
      throw new ConflictException(
        'The selected resource is not available for this time',
      );
    }

    const now = new Date();

    const status =
      resource.requiresApproval
        ? ReservationStatus.PENDING
        : ReservationStatus.APPROVED;

    const reservation: Reservation = {
      id: randomUUID(),
      reservationNumber:
        this.createReservationNumber(now),
      resourceId: resource.id,
      propertyId: dto.propertyId,
      requesterPersonId:
        dto.requesterPersonId,
      beneficiaryPersonId:
        this.optionalTrim(
          dto.beneficiaryPersonId,
        ),
      title,
      description:
        this.optionalTrim(dto.description),
      startAt,
      endAt,
      attendeeCount: dto.attendeeCount,
      status,
      approvalRequired:
        resource.requiresApproval,
      approvedByPersonId:
        resource.requiresApproval
          ? undefined
          : dto.requesterPersonId,
      approvedAt:
        resource.requiresApproval
          ? undefined
          : now,
      notes: this.optionalTrim(dto.notes),
      createdAt: now,
      updatedAt: now,
    };

    const created =
      await this.repository
        .createReservation(reservation);

    await this.addHistory(
      created,
      undefined,
      created.status,
      dto.requesterPersonId,
      resource.requiresApproval
        ? 'Reservation submitted for approval'
        : 'Reservation automatically approved',
    );

    await this.workflowService.startWorkflowByCode({
      workflowCode:
        RESERVATION_WORKFLOW_CODE,
      entityType: 'reservation',
      entityId: created.id,
      createdBy:
        dto.requesterPersonId,
      metadata: {
        reservationNumber:
          created.reservationNumber,
        propertyId:
          created.propertyId,
        resourceId:
          created.resourceId,
      },
    });

    if (!resource.requiresApproval) {
      await this.workflowService.transitionWorkflowByEntity({
        entityType: 'reservation',
        entityId: created.id,
        actionCode: 'approve',
        actorId:
          dto.requesterPersonId,
        notes:
          'Automatically approved by resource configuration',
        metadata: {
          automatic: true,
        },
      });
    }

    await this.publishAndAudit(
      RESERVATION_EVENTS.CREATED,
      this.reservationPayload(created),
    );

    await this.scheduleReservationJobs(
      created,
    );

    await this.eventBus.publish(
      resource.requiresApproval
        ? RESERVATION_EVENTS.SUBMITTED
        : RESERVATION_EVENTS.APPROVED,
      this.eventSource,
      this.reservationPayload(created),
    );

    return created;
  }

  listReservations(
    filters: ReservationFilters = {},
  ): Promise<Reservation[]> {
    return this.repository
      .listReservations({
        ...filters,
        search:
          filters.search?.trim() ||
          undefined,
      });
  }

  async getReservation(id: string) {
    const reservation =
      await this.repository
        .findReservationDetailsById(id);

    if (!reservation) {
      throw new NotFoundException(
        `Reservation not found: ${id}`,
      );
    }

    return reservation;
  }

  async updateReservation(
    id: string,
    dto: UpdateReservationDto,
  ): Promise<Reservation> {
    const current =
      await this.requireReservation(id);

    if (
      ![
        ReservationStatus.DRAFT,
        ReservationStatus.PENDING,
        ReservationStatus.APPROVED,
      ].includes(current.status)
    ) {
      throw new BadRequestException(
        `Reservation cannot be updated in status ${current.status}`,
      );
    }

    const resource =
      await this.getResource(
        current.resourceId,
      );

    const startAt = dto.startAt
      ? this.requireDate(
          dto.startAt,
          'startAt',
        )
      : current.startAt;

    const endAt = dto.endAt
      ? this.requireDate(
          dto.endAt,
          'endAt',
        )
      : current.endAt;

    const attendeeCount =
      dto.attendeeCount ??
      current.attendeeCount;

    this.validateReservationWindow(
      resource,
      startAt,
      endAt,
      attendeeCount,
    );

    const availability =
      await this.checkAvailability({
        resourceId: resource.id,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        excludeReservationId: id,
      });

    if (!availability.available) {
      throw new ConflictException(
        'The selected resource is not available for this time',
      );
    }

    const updated =
      await this.repository
        .updateReservation(id, {
          beneficiaryPersonId:
            dto.beneficiaryPersonId !==
            undefined
              ? this.optionalTrim(
                  dto.beneficiaryPersonId,
                )
              : current
                  .beneficiaryPersonId,
          title:
            dto.title?.trim() ||
            current.title,
          description:
            dto.description !== undefined
              ? this.optionalTrim(
                  dto.description,
                )
              : current.description,
          startAt,
          endAt,
          attendeeCount,
          notes:
            dto.notes !== undefined
              ? this.optionalTrim(dto.notes)
              : current.notes,
        });

    if (!updated) {
      throw new NotFoundException(
        `Reservation not found: ${id}`,
      );
    }

    await this.publishAndAudit(
      RESERVATION_EVENTS.UPDATED,
      this.reservationPayload(updated, {
        previousStartAt:
          current.startAt,
        previousEndAt:
          current.endAt,
      }),
    );

    return updated;
  }

  async approve(
    id: string,
    dto: ApproveReservationDto,
  ): Promise<Reservation> {
    const current =
      await this.requireReservation(id);

    this.assertStatus(
      current,
      [ReservationStatus.PENDING],
      'approved',
    );

    this.validateRequiredId(
      dto.approvedByPersonId,
      'Approver person ID',
    );

    const availability =
      await this.checkAvailability({
        resourceId: current.resourceId,
        startAt:
          current.startAt.toISOString(),
        endAt:
          current.endAt.toISOString(),
        excludeReservationId: current.id,
      });

    if (!availability.available) {
      throw new ConflictException(
        'Reservation cannot be approved because the resource is no longer available',
      );
    }

    return this.transition(
      current,
      ReservationStatus.APPROVED,
      dto.approvedByPersonId,
      dto.remarks,
      {
        approvedByPersonId:
          dto.approvedByPersonId,
        approvedAt: new Date(),
      },
      RESERVATION_EVENTS.APPROVED,
      'approve',
    );
  }

  async reject(
    id: string,
    dto: RejectReservationDto,
  ): Promise<Reservation> {
    const current =
      await this.requireReservation(id);

    this.assertStatus(
      current,
      [ReservationStatus.PENDING],
      'rejected',
    );

    this.validateRequiredId(
      dto.rejectedByPersonId,
      'Rejecting person ID',
    );

    const reason = dto.reason?.trim();

    if (!reason) {
      throw new BadRequestException(
        'Rejection reason is required',
      );
    }

    return this.transition(
      current,
      ReservationStatus.REJECTED,
      dto.rejectedByPersonId,
      reason,
      {
        rejectedByPersonId:
          dto.rejectedByPersonId,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
      RESERVATION_EVENTS.REJECTED,
      'reject',
    );
  }

  async cancel(
    id: string,
    dto: CancelReservationDto,
  ): Promise<Reservation> {
    const current =
      await this.requireReservation(id);

    this.assertStatus(
      current,
      [
        ReservationStatus.DRAFT,
        ReservationStatus.PENDING,
        ReservationStatus.APPROVED,
      ],
      'cancelled',
    );

    this.validateRequiredId(
      dto.cancelledByPersonId,
      'Cancelling person ID',
    );

    const reason =
      this.optionalTrim(dto.reason);

    return this.transition(
      current,
      ReservationStatus.CANCELLED,
      dto.cancelledByPersonId,
      reason,
      {
        cancelledByPersonId:
          dto.cancelledByPersonId,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
      RESERVATION_EVENTS.CANCELLED,
      'cancel',
    );
  }

  async checkIn(
    id: string,
    dto: TransitionReservationDto,
  ): Promise<Reservation> {
    const current =
      await this.requireReservation(id);

    this.assertStatus(
      current,
      [ReservationStatus.APPROVED],
      'checked in',
    );

    this.validateRequiredId(
      dto.changedByPersonId,
      'Changed-by person ID',
    );

    const now = new Date();

    if (now >= current.endAt) {
      throw new BadRequestException(
        'Expired reservations cannot be checked in',
      );
    }

    return this.transition(
      current,
      ReservationStatus.CHECKED_IN,
      dto.changedByPersonId,
      dto.remarks,
      {
        checkedInAt: now,
      },
      RESERVATION_EVENTS.CHECKED_IN,
      'check-in',
    );
  }

  async complete(
    id: string,
    dto: TransitionReservationDto,
  ): Promise<Reservation> {
    const current =
      await this.requireReservation(id);

    this.assertStatus(
      current,
      [
        ReservationStatus.APPROVED,
        ReservationStatus.CHECKED_IN,
      ],
      'completed',
    );

    this.validateRequiredId(
      dto.changedByPersonId,
      'Changed-by person ID',
    );

    return this.transition(
      current,
      ReservationStatus.COMPLETED,
      dto.changedByPersonId,
      dto.remarks,
      {
        completedAt: new Date(),
      },
      RESERVATION_EVENTS.COMPLETED,
      'complete',
    );
  }

  async markNoShow(
    id: string,
    dto: TransitionReservationDto,
  ): Promise<Reservation> {
    const current =
      await this.requireReservation(id);

    this.assertStatus(
      current,
      [ReservationStatus.APPROVED],
      'marked as no-show',
    );

    this.validateRequiredId(
      dto.changedByPersonId,
      'Changed-by person ID',
    );

    if (new Date() < current.endAt) {
      throw new BadRequestException(
        'Reservation cannot be marked as no-show before its end time',
      );
    }

    return this.transition(
      current,
      ReservationStatus.NO_SHOW,
      dto.changedByPersonId,
      dto.remarks,
      {},
      RESERVATION_EVENTS.NO_SHOW,
      'no-show',
    );
  }

  getMetrics(propertyId?: string) {
    return this.repository.getMetrics(
      propertyId,
    );
  }


  private async scheduleReservationJobs(
    reservation: Reservation,
  ): Promise<void> {
    const now = Date.now();

    const payload = {
      reservationId:
        reservation.id,
      reservationNumber:
        reservation.reservationNumber,
      propertyId:
        reservation.propertyId,
      requesterPersonId:
        reservation.requesterPersonId,
    };

    const reminderAt =
      new Date(
        reservation.startAt.getTime() -
          60 * 60 * 1000,
      );

    if (
      reminderAt.getTime() > now
    ) {
      await this.schedulerService
        .createJob({
          name:
            `Reservation reminder: ${reservation.reservationNumber}`,
          jobType:
            RESERVATION_REMINDER_JOB_TYPE,
          payload,
          scheduleType:
            'ONE_TIME',
          runAt:
            reminderAt.toISOString(),
          maxAttempts: 3,
        });
    }

    if (
      reservation.endAt.getTime() > now
    ) {
      await this.schedulerService
        .createJob({
          name:
            `Reservation end: ${reservation.reservationNumber}`,
          jobType:
            RESERVATION_END_JOB_TYPE,
          payload,
          scheduleType:
            'ONE_TIME',
          runAt:
            reservation.endAt
              .toISOString(),
          maxAttempts: 3,
        });
    }
  }

  private async transition(
    current: Reservation,
    status: ReservationStatus,
    changedByPersonId: string,
    remarks: string | undefined,
    changes: Partial<Reservation>,
    event: string,
    workflowAction: string,
  ): Promise<Reservation> {
    const updated =
      await this.repository
        .updateReservationStatus(
          current.id,
          status,
          changes,
        );

    if (!updated) {
      throw new NotFoundException(
        `Reservation not found: ${current.id}`,
      );
    }

    await this.addHistory(
      updated,
      current.status,
      status,
      changedByPersonId,
      remarks,
    );

    await this.workflowService.transitionWorkflowByEntity({
      entityType: 'reservation',
      entityId: updated.id,
      actionCode: workflowAction,
      actorId: changedByPersonId,
      notes: remarks,
      metadata: {
        fromStatus: current.status,
        toStatus: status,
      },
    });

    const payload =
      this.reservationPayload(updated, {
        previousStatus: current.status,
        actorPersonId:
          changedByPersonId,
        remarks,
      });

    await this.publishAndAudit(
      event,
      payload,
    );

    return updated;
  }

  private async addHistory(
    reservation: Reservation,
    fromStatus: ReservationStatus | undefined,
    toStatus: ReservationStatus,
    changedByPersonId: string,
    remarks?: string,
  ): Promise<ReservationStatusHistory> {
    return this.repository.addHistory({
      id: randomUUID(),
      reservationId:
        reservation.id,
      fromStatus,
      toStatus,
      changedByPersonId,
      remarks:
        this.optionalTrim(remarks),
      createdAt: new Date(),
    });
  }

  private async requireReservation(
    id: string,
  ): Promise<Reservation> {
    const reservation =
      await this.repository
        .findReservationById(id);

    if (!reservation) {
      throw new NotFoundException(
        `Reservation not found: ${id}`,
      );
    }

    return reservation;
  }

  private assertStatus(
    reservation: Reservation,
    allowed: ReservationStatus[],
    action: string,
  ): void {
    if (!allowed.includes(
      reservation.status,
    )) {
      throw new BadRequestException(
        `Reservation cannot be ${action} in status ${reservation.status}`,
      );
    }
  }

  private validateReservationWindow(
    resource: ReservationResource,
    startAt: Date,
    endAt: Date,
    attendeeCount: number,
  ): void {
    this.validateTimeRange(
      startAt,
      endAt,
    );

    if (
      !Number.isInteger(attendeeCount) ||
      attendeeCount <= 0
    ) {
      throw new BadRequestException(
        'Attendee count must be a positive integer',
      );
    }

    if (attendeeCount > resource.capacity) {
      throw new BadRequestException(
        `Attendee count exceeds resource capacity of ${resource.capacity}`,
      );
    }

    const durationMinutes =
      Math.round(
        (
          endAt.getTime() -
          startAt.getTime()
        ) /
          60000,
      );

    if (
      durationMinutes <
      resource.minimumDurationMinutes
    ) {
      throw new BadRequestException(
        `Minimum booking duration is ${resource.minimumDurationMinutes} minutes`,
      );
    }

    if (
      resource.maximumDurationMinutes &&
      durationMinutes >
        resource.maximumDurationMinutes
    ) {
      throw new BadRequestException(
        `Maximum booking duration is ${resource.maximumDurationMinutes} minutes`,
      );
    }

    if (
      durationMinutes %
        resource.bookingIntervalMinutes !==
      0
    ) {
      throw new BadRequestException(
        `Booking duration must align with the ${resource.bookingIntervalMinutes}-minute interval`,
      );
    }

    const now = new Date();

    const minimumStart =
      new Date(
        now.getTime() +
          resource.minimumNoticeMinutes *
            60000,
      );

    if (startAt < minimumStart) {
      throw new BadRequestException(
        `Reservation requires at least ${resource.minimumNoticeMinutes} minutes notice`,
      );
    }

    const maximumStart =
      new Date(
        now.getTime() +
          resource.advanceBookingDays *
            86400000,
      );

    if (startAt > maximumStart) {
      throw new BadRequestException(
        `Reservation cannot be created more than ${resource.advanceBookingDays} days in advance`,
      );
    }

    this.validateOperatingHours(
      resource,
      startAt,
      endAt,
    );
  }

  private validateOperatingHours(
    resource: ReservationResource,
    startAt: Date,
    endAt: Date,
  ): void {
    if (
      !resource.openingTime ||
      !resource.closingTime
    ) {
      return;
    }

    const openingMinutes =
      this.timeToMinutes(
        resource.openingTime,
      );

    const closingMinutes =
      this.timeToMinutes(
        resource.closingTime,
      );

    const startMinutes =
      startAt.getHours() * 60 +
      startAt.getMinutes();

    const endMinutes =
      endAt.getHours() * 60 +
      endAt.getMinutes();

    if (
      startAt.toDateString() !==
      endAt.toDateString()
    ) {
      throw new BadRequestException(
        'Reservation must remain within a single operating day',
      );
    }

    if (
      startMinutes < openingMinutes ||
      endMinutes > closingMinutes
    ) {
      throw new BadRequestException(
        `Reservation must be between ${resource.openingTime} and ${resource.closingTime}`,
      );
    }
  }

  private validateResourceConfiguration(
    input: {
      capacity: number;
      minimumDurationMinutes: number;
      maximumDurationMinutes?: number;
      bookingIntervalMinutes: number;
      advanceBookingDays: number;
      minimumNoticeMinutes: number;
      openingTime?: string;
      closingTime?: string;
    },
  ): void {
    const positiveIntegers = [
      [
        input.capacity,
        'Capacity',
      ],
      [
        input.minimumDurationMinutes,
        'Minimum duration',
      ],
      [
        input.bookingIntervalMinutes,
        'Booking interval',
      ],
    ] as const;

    for (
      const [value, label]
      of positiveIntegers
    ) {
      if (
        !Number.isInteger(value) ||
        value <= 0
      ) {
        throw new BadRequestException(
          `${label} must be a positive integer`,
        );
      }
    }

    if (
      input.maximumDurationMinutes !==
        undefined &&
      (
        !Number.isInteger(
          input.maximumDurationMinutes,
        ) ||
        input.maximumDurationMinutes <
          input.minimumDurationMinutes
      )
    ) {
      throw new BadRequestException(
        'Maximum duration must be greater than or equal to minimum duration',
      );
    }

    if (
      !Number.isInteger(
        input.advanceBookingDays,
      ) ||
      input.advanceBookingDays < 0
    ) {
      throw new BadRequestException(
        'Advance booking days must be zero or greater',
      );
    }

    if (
      !Number.isInteger(
        input.minimumNoticeMinutes,
      ) ||
      input.minimumNoticeMinutes < 0
    ) {
      throw new BadRequestException(
        'Minimum notice must be zero or greater',
      );
    }

    if (
      Boolean(input.openingTime) !==
      Boolean(input.closingTime)
    ) {
      throw new BadRequestException(
        'Opening and closing times must be configured together',
      );
    }

    if (
      input.openingTime &&
      input.closingTime
    ) {
      const opening =
        this.timeToMinutes(
          input.openingTime,
        );

      const closing =
        this.timeToMinutes(
          input.closingTime,
        );

      if (closing <= opening) {
        throw new BadRequestException(
          'Closing time must be later than opening time',
        );
      }
    }
  }

  private validateTimeRange(
    startAt: Date,
    endAt: Date,
  ): void {
    if (endAt <= startAt) {
      throw new BadRequestException(
        'endAt must be later than startAt',
      );
    }
  }

  private requireDate(
    value: string,
    field: string,
  ): Date {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        `Invalid ${field}`,
      );
    }

    return date;
  }

  private validateRequiredId(
    value: string,
    label: string,
  ): void {
    if (!value?.trim()) {
      throw new BadRequestException(
        `${label} is required`,
      );
    }
  }

  private normalizeCode(
    value: string,
  ): string {
    return String(value ?? '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  }

  private createReservationNumber(
    now: Date,
  ): string {
    const date =
      now.toISOString()
        .slice(0, 10)
        .replace(/-/g, '');

    const suffix =
      randomUUID()
        .replace(/-/g, '')
        .slice(0, 8)
        .toUpperCase();

    return `RSV-${date}-${suffix}`;
  }

  private timeToMinutes(
    value: string,
  ): number {
    if (
      !/^\d{2}:\d{2}(?::\d{2})?$/.test(
        value,
      )
    ) {
      throw new BadRequestException(
        `Invalid time value: ${value}`,
      );
    }

    const [hour, minute] =
      value.split(':').map(Number);

    if (
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      throw new BadRequestException(
        `Invalid time value: ${value}`,
      );
    }

    return hour * 60 + minute;
  }

  private resourcePayload(
    resource: ReservationResource,
    extra: Record<string, unknown> = {},
  ) {
    return {
      entityType:
        'reservation-resource',
      entityId: resource.id,
      resourceId: resource.id,
      propertyId: resource.propertyId,
      zoneId: resource.zoneId,
      spaceId: resource.spaceId,
      code: resource.code,
      resourceType:
        resource.resourceType,
      capacity: resource.capacity,
      isActive: resource.isActive,
      ...extra,
    };
  }

  private reservationPayload(
    reservation: Reservation,
    extra: Record<string, unknown> = {},
  ) {
    return {
      entityType: 'reservation',
      entityId: reservation.id,
      reservationId:
        reservation.id,
      reservationNumber:
        reservation.reservationNumber,
      title: reservation.title,
      resourceId:
        reservation.resourceId,
      propertyId:
        reservation.propertyId,
      requesterPersonId:
        reservation.requesterPersonId,
      beneficiaryPersonId:
        reservation.beneficiaryPersonId,
      startAt: reservation.startAt,
      endAt: reservation.endAt,
      status: reservation.status,
      approvalRequired:
        reservation.approvalRequired,
      rejectionReason:
        reservation.rejectionReason,
      cancellationReason:
        reservation.cancellationReason,
      ...extra,
    };
  }

  private async publishAndAudit(
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.eventBus.publish(
      event,
      this.eventSource,
      payload,
    );

    await this.auditService.record(
      event,
      this.eventSource,
      payload,
    );
  }

  private optionalTrim(
    value?: string,
  ): string | undefined {
    const trimmed = value?.trim();

    return trimmed || undefined;
  }
}
