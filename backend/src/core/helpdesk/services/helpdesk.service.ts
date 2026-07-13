import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { AuditService } from '../../audit/audit.service';
import { EventBusService } from '../../eventbus/services/eventbus.service';
import { AssignHelpdeskTicketDto } from '../dto/assign-helpdesk-ticket.dto';
import { CreateHelpdeskTicketDto } from '../dto/create-helpdesk-ticket.dto';
import { UpdateHelpdeskTicketDto } from '../dto/update-helpdesk-ticket.dto';
import { ResolveHelpdeskTicketDto } from '../dto/resolve-helpdesk-ticket.dto';
import { TransitionHelpdeskTicketDto } from '../dto/transition-helpdesk-ticket.dto';
import { AddHelpdeskCommentDto } from '../dto/add-helpdesk-comment.dto';
import { AddHelpdeskWorklogDto } from '../dto/add-helpdesk-worklog.dto';
import { SubmitHelpdeskFeedbackDto } from '../dto/submit-helpdesk-feedback.dto';
import {
  HELPDESK_EVENTS,
} from '../helpdesk.constants';
import {
  HELPDESK_REPOSITORY,
  HelpdeskRepository,
} from '../repositories/helpdesk.repository';
import {
  HelpdeskComment,
  HelpdeskFeedback,
  HelpdeskPriority,
  HelpdeskStatus,
  HelpdeskTicket,
  HelpdeskTicketFilters,
  HelpdeskWorklog,
} from '../types/helpdesk.types';

@Injectable()
export class HelpdeskService {
  constructor(
    @Inject(HELPDESK_REPOSITORY)
    private readonly repository: HelpdeskRepository,
    private readonly eventBus: EventBusService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateHelpdeskTicketDto,
  ): Promise<HelpdeskTicket> {
    this.requireText(dto.title, 'title');
    this.requireText(dto.description, 'description');

    const category =
      await this.repository.findCategoryById(
        dto.categoryId,
      );

    if (!category || !category.isActive) {
      throw new BadRequestException(
        `Invalid helpdesk category: ${dto.categoryId}`,
      );
    }

    const now = new Date();
    const priority =
      dto.priority ?? category.defaultPriority;

    const ticket: HelpdeskTicket = {
      id: randomUUID(),
      ticketNumber: this.createTicketNumber(),
      title: dto.title.trim(),
      description: dto.description.trim(),
      categoryId: dto.categoryId,
      propertyId: dto.propertyId,
      spaceId: dto.spaceId,
      requesterPersonId: dto.requesterPersonId,
      priority,
      status: HelpdeskStatus.OPEN,
      channel: dto.channel,
      responseDueAt: this.addMinutes(
        now,
        this.adjustSla(
          category.responseSlaMinutes,
          priority,
        ),
      ),
      resolutionDueAt: this.addMinutes(
        now,
        this.adjustSla(
          category.resolutionSlaMinutes,
          priority,
        ),
      ),
      createdAt: now,
      updatedAt: now,
    };

    const created =
      await this.repository.create(ticket);

    await this.repository.addHistory({
      id: randomUUID(),
      ticketId: created.id,
      toStatus: HelpdeskStatus.OPEN,
      changedByPersonId: dto.requesterPersonId,
      remarks: 'Helpdesk ticket created',
      createdAt: now,
    });

    await this.publish(
      HELPDESK_EVENTS.CREATED,
      created,
    );

    await this.auditService.record(
      HELPDESK_EVENTS.CREATED,
      'core.helpdesk',
      this.auditPayload(created, {
        actorPersonId: dto.requesterPersonId,
      }),
    );

    return created;
  }

  async list(
    filters: HelpdeskTicketFilters = {},
  ) {
    return this.repository.findAll(filters);
  }

  async get(id: string) {
    const ticket =
      await this.repository.findDetailsById(id);

    if (!ticket) {
      throw new NotFoundException(
        `Helpdesk ticket not found: ${id}`,
      );
    }

    return ticket;
  }

  async update(
    id: string,
    dto: UpdateHelpdeskTicketDto,
  ) {
    const current = await this.requireTicket(id);

    let categoryId = current.categoryId;
    let responseDueAt = current.responseDueAt;
    let resolutionDueAt = current.resolutionDueAt;

    if (
      dto.categoryId &&
      dto.categoryId !== current.categoryId
    ) {
      const category =
        await this.repository.findCategoryById(
          dto.categoryId,
        );

      if (!category || !category.isActive) {
        throw new BadRequestException(
          `Invalid helpdesk category: ${dto.categoryId}`,
        );
      }

      categoryId = category.id;
      const now = new Date();
      const priority =
        dto.priority ?? current.priority;

      responseDueAt = this.addMinutes(
        now,
        this.adjustSla(
          category.responseSlaMinutes,
          priority,
        ),
      );

      resolutionDueAt = this.addMinutes(
        now,
        this.adjustSla(
          category.resolutionSlaMinutes,
          priority,
        ),
      );
    }

    const updated = await this.repository.update(
      id,
      {
        title:
          dto.title?.trim() || current.title,
        description:
          dto.description?.trim() ||
          current.description,
        categoryId,
        spaceId:
          dto.spaceId ?? current.spaceId,
        priority:
          dto.priority ?? current.priority,
        channel:
          dto.channel ?? current.channel,
        responseDueAt,
        resolutionDueAt,
      },
    );

    if (!updated) {
      throw new NotFoundException(
        `Helpdesk ticket not found: ${id}`,
      );
    }

    await this.publish(
      HELPDESK_EVENTS.UPDATED,
      updated,
    );

    await this.auditService.record(
      HELPDESK_EVENTS.UPDATED,
      'core.helpdesk',
      this.auditPayload(updated, {
        actorPersonId: dto.changedByPersonId,
        remarks: dto.remarks,
      }),
    );

    return updated;
  }

  async assign(
    id: string,
    dto: AssignHelpdeskTicketDto,
  ) {
    const current = await this.requireTicket(id);

    if (
      ![
        HelpdeskStatus.OPEN,
        HelpdeskStatus.ASSIGNED,
        HelpdeskStatus.REOPENED,
      ].includes(current.status)
    ) {
      throw new BadRequestException(
        `Helpdesk ticket cannot be assigned from ${current.status}`,
      );
    }

    const assigned = await this.repository.assign(
      id,
      dto.assigneePersonId,
    );

    if (!assigned) {
      throw new NotFoundException(
        `Helpdesk ticket not found: ${id}`,
      );
    }

    await this.repository.addHistory({
      id: randomUUID(),
      ticketId: assigned.id,
      fromStatus: current.status,
      toStatus: HelpdeskStatus.ASSIGNED,
      changedByPersonId: dto.changedByPersonId,
      remarks:
        dto.remarks ?? 'Helpdesk ticket assigned',
      createdAt: new Date(),
    });

    await this.publish(
      HELPDESK_EVENTS.ASSIGNED,
      assigned,
    );

    await this.auditService.record(
      HELPDESK_EVENTS.ASSIGNED,
      'core.helpdesk',
      this.auditPayload(assigned, {
        actorPersonId: dto.changedByPersonId,
        remarks: dto.remarks,
      }),
    );

    return assigned;
  }

  async startProgress(
    id: string,
    dto: TransitionHelpdeskTicketDto,
  ) {
    return this.transition(
      id,
      dto,
      [HelpdeskStatus.ASSIGNED],
      HelpdeskStatus.IN_PROGRESS,
      HELPDESK_EVENTS.IN_PROGRESS,
    );
  }

  async escalate(
    id: string,
    dto: TransitionHelpdeskTicketDto,
  ) {
    return this.transition(
      id,
      dto,
      [
        HelpdeskStatus.OPEN,
        HelpdeskStatus.ASSIGNED,
        HelpdeskStatus.IN_PROGRESS,
        HelpdeskStatus.REOPENED,
      ],
      HelpdeskStatus.ESCALATED,
      HELPDESK_EVENTS.ESCALATED,
      {
        escalatedAt: new Date(),
      },
    );
  }

  async resolve(
    id: string,
    dto: ResolveHelpdeskTicketDto,
  ) {
    this.requireText(
      dto.resolutionSummary,
      'resolutionSummary',
    );

    return this.transition(
      id,
      dto,
      [
        HelpdeskStatus.ASSIGNED,
        HelpdeskStatus.IN_PROGRESS,
        HelpdeskStatus.ESCALATED,
        HelpdeskStatus.REOPENED,
      ],
      HelpdeskStatus.RESOLVED,
      HELPDESK_EVENTS.RESOLVED,
      {
        resolvedAt: new Date(),
      },
      dto.resolutionSummary.trim(),
    );
  }

  async reopen(
    id: string,
    dto: TransitionHelpdeskTicketDto,
  ) {
    return this.transition(
      id,
      dto,
      [
        HelpdeskStatus.RESOLVED,
        HelpdeskStatus.CLOSED,
      ],
      HelpdeskStatus.REOPENED,
      HELPDESK_EVENTS.REOPENED,
    );
  }

  async close(
    id: string,
    dto: TransitionHelpdeskTicketDto,
  ) {
    return this.transition(
      id,
      dto,
      [HelpdeskStatus.RESOLVED],
      HelpdeskStatus.CLOSED,
      HELPDESK_EVENTS.CLOSED,
      {
        closedAt: new Date(),
      },
    );
  }

  async cancel(
    id: string,
    dto: TransitionHelpdeskTicketDto,
  ) {
    return this.transition(
      id,
      dto,
      [
        HelpdeskStatus.OPEN,
        HelpdeskStatus.ASSIGNED,
        HelpdeskStatus.IN_PROGRESS,
        HelpdeskStatus.ESCALATED,
        HelpdeskStatus.REOPENED,
      ],
      HelpdeskStatus.CANCELLED,
      HELPDESK_EVENTS.CANCELLED,
    );
  }

  async addComment(
    id: string,
    dto: AddHelpdeskCommentDto,
  ): Promise<HelpdeskComment> {
    const ticket = await this.requireTicket(id);

    this.requireText(dto.body, 'body');

    if (
      [
        HelpdeskStatus.CLOSED,
        HelpdeskStatus.CANCELLED,
      ].includes(ticket.status)
    ) {
      throw new BadRequestException(
        `Comments cannot be added to a ${ticket.status} ticket`,
      );
    }

    const now = new Date();

    const comment =
      await this.repository.addComment({
        id: randomUUID(),
        ticketId: ticket.id,
        authorPersonId: dto.authorPersonId,
        body: dto.body.trim(),
        visibility: dto.visibility,
        createdAt: now,
        updatedAt: now,
      });

    await this.publish(
      HELPDESK_EVENTS.COMMENT_ADDED,
      ticket,
    );

    await this.auditService.record(
      HELPDESK_EVENTS.COMMENT_ADDED,
      'core.helpdesk',
      {
        ...this.auditPayload(ticket, {
          actorPersonId: dto.authorPersonId,
        }),
        commentId: comment.id,
        visibility: comment.visibility,
      },
    );

    return comment;
  }

  async addWorklog(
    id: string,
    dto: AddHelpdeskWorklogDto,
  ): Promise<HelpdeskWorklog> {
    const ticket = await this.requireTicket(id);

    if (
      [
        HelpdeskStatus.CLOSED,
        HelpdeskStatus.CANCELLED,
      ].includes(ticket.status)
    ) {
      throw new BadRequestException(
        `Worklogs cannot be added to a ${ticket.status} ticket`,
      );
    }

    if (
      !Number.isInteger(dto.minutesSpent) ||
      dto.minutesSpent <= 0
    ) {
      throw new BadRequestException(
        'minutesSpent must be a positive integer',
      );
    }

    this.requireText(
      dto.description,
      'description',
    );

    const workedAt = dto.workedAt
      ? new Date(dto.workedAt)
      : new Date();

    if (Number.isNaN(workedAt.getTime())) {
      throw new BadRequestException(
        'workedAt must be a valid ISO date',
      );
    }

    const worklog =
      await this.repository.addWorklog({
        id: randomUUID(),
        ticketId: ticket.id,
        personId: dto.personId,
        minutesSpent: dto.minutesSpent,
        description: dto.description.trim(),
        workedAt,
        createdAt: new Date(),
      });

    await this.publish(
      HELPDESK_EVENTS.WORKLOG_ADDED,
      ticket,
    );

    await this.auditService.record(
      HELPDESK_EVENTS.WORKLOG_ADDED,
      'core.helpdesk',
      {
        ...this.auditPayload(ticket, {
          actorPersonId: dto.personId,
        }),
        worklogId: worklog.id,
        minutesSpent: worklog.minutesSpent,
      },
    );

    return worklog;
  }

  async submitFeedback(
    id: string,
    dto: SubmitHelpdeskFeedbackDto,
  ): Promise<HelpdeskFeedback> {
    const ticket = await this.requireTicket(id);

    if (
      ![
        HelpdeskStatus.RESOLVED,
        HelpdeskStatus.CLOSED,
      ].includes(ticket.status)
    ) {
      throw new BadRequestException(
        'Feedback can be submitted only for resolved or closed tickets',
      );
    }

    if (
      !Number.isInteger(dto.rating) ||
      dto.rating < 1 ||
      dto.rating > 5
    ) {
      throw new BadRequestException(
        'rating must be an integer between 1 and 5',
      );
    }

    const existing =
      await this.repository.findFeedback(id);

    if (existing) {
      throw new BadRequestException(
        'Feedback has already been submitted for this ticket',
      );
    }

    const feedback =
      await this.repository.addFeedback({
        id: randomUUID(),
        ticketId: ticket.id,
        submittedByPersonId:
          dto.submittedByPersonId,
        rating: dto.rating,
        comments:
          dto.comments?.trim() || undefined,
        createdAt: new Date(),
      });

    await this.publish(
      HELPDESK_EVENTS.FEEDBACK_SUBMITTED,
      ticket,
    );

    await this.auditService.record(
      HELPDESK_EVENTS.FEEDBACK_SUBMITTED,
      'core.helpdesk',
      {
        ...this.auditPayload(ticket, {
          actorPersonId:
            dto.submittedByPersonId,
        }),
        feedbackId: feedback.id,
        rating: feedback.rating,
      },
    );

    return feedback;
  }

  async listCategories() {
    return this.repository.listCategories();
  }

  async getHistory(id: string) {
    await this.requireTicket(id);
    return this.repository.getHistory(id);
  }

  async getMetrics(propertyId?: string) {
    return this.repository.getMetrics(propertyId);
  }

  private async transition(
    id: string,
    dto: TransitionHelpdeskTicketDto,
    allowedFrom: HelpdeskStatus[],
    nextStatus: HelpdeskStatus,
    eventName: string,
    timestamps: {
      firstRespondedAt?: Date;
      escalatedAt?: Date;
      resolvedAt?: Date;
      closedAt?: Date;
    } = {},
    resolutionSummary?: string,
  ) {
    const current = await this.requireTicket(id);

    if (!allowedFrom.includes(current.status)) {
      throw new BadRequestException(
        `Helpdesk ticket cannot transition from ${current.status} to ${nextStatus}`,
      );
    }

    const updated =
      await this.repository.updateStatus(
        id,
        nextStatus,
        timestamps,
        resolutionSummary,
      );

    if (!updated) {
      throw new NotFoundException(
        `Helpdesk ticket not found: ${id}`,
      );
    }

    await this.repository.addHistory({
      id: randomUUID(),
      ticketId: id,
      fromStatus: current.status,
      toStatus: nextStatus,
      changedByPersonId: dto.changedByPersonId,
      remarks: dto.remarks,
      createdAt: new Date(),
    });

    await this.publish(eventName, updated);

    await this.auditService.record(
      eventName,
      'core.helpdesk',
      this.auditPayload(updated, {
        actorPersonId: dto.changedByPersonId,
        remarks: dto.remarks,
      }),
    );

    return updated;
  }

  private async requireTicket(
    id: string,
  ): Promise<HelpdeskTicket> {
    const ticket = await this.repository.findById(id);

    if (!ticket) {
      throw new NotFoundException(
        `Helpdesk ticket not found: ${id}`,
      );
    }

    return ticket;
  }

  private createTicketNumber(): string {
    const date = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');

    const suffix = randomUUID()
      .replace(/-/g, '')
      .slice(0, 8)
      .toUpperCase();

    return `HD-${date}-${suffix}`;
  }

  private requireText(
    value: string,
    field: string,
  ): void {
    if (!value || !value.trim()) {
      throw new BadRequestException(
        `${field} is required`,
      );
    }
  }

  private addMinutes(
    source: Date,
    minutes: number,
  ): Date {
    return new Date(
      source.getTime() + minutes * 60_000,
    );
  }

  private adjustSla(
    minutes: number,
    priority: HelpdeskPriority,
  ): number {
    const multiplier: Record<
      HelpdeskPriority,
      number
    > = {
      [HelpdeskPriority.LOW]: 1.5,
      [HelpdeskPriority.MEDIUM]: 1,
      [HelpdeskPriority.HIGH]: 0.5,
      [HelpdeskPriority.URGENT]: 0.25,
    };

    return Math.max(
      1,
      Math.round(minutes * multiplier[priority]),
    );
  }

  private async publish(
    eventName: string,
    ticket: HelpdeskTicket,
  ): Promise<void> {
    await this.eventBus.publish(
      eventName,
      'core.helpdesk',
      {
        ...ticket,
        entityType: 'helpdesk.ticket',
        entityId: ticket.id,
        eventVersion: 1,
      },
    );
  }

  private auditPayload(
    ticket: HelpdeskTicket,
    context: {
      actorPersonId?: string;
      remarks?: string;
    },
  ) {
    return {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      propertyId: ticket.propertyId,
      spaceId: ticket.spaceId,
      requesterPersonId:
        ticket.requesterPersonId,
      assigneePersonId:
        ticket.assigneePersonId,
      priority: ticket.priority,
      status: ticket.status,
      actorPersonId:
        context.actorPersonId,
      remarks: context.remarks,
    };
  }
}
