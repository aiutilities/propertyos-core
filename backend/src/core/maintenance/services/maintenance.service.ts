import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { AuditService } from '../../audit/audit.service';
import { EventBusService } from '../../eventbus/services/eventbus.service';
import { WorkflowService } from '../../workflow/services/workflow.service';
import { SchedulerService } from '../../scheduler/services/scheduler.service';
import {
  MAINTENANCE_EVENTS,
  MAINTENANCE_WORKFLOW_CODE,
  MAINTENANCE_SLA_WARNING_JOB_TYPE,
  MAINTENANCE_SLA_OVERDUE_JOB_TYPE,
} from '../maintenance.constants';
import { AssignMaintenanceTicketDto } from '../dto/assign-maintenance-ticket.dto';
import { CreateMaintenanceTicketDto } from '../dto/create-maintenance-ticket.dto';
import { TransitionMaintenanceTicketDto } from '../dto/transition-maintenance-ticket.dto';
import { UpdateMaintenanceTicketDto } from '../dto/update-maintenance-ticket.dto';
import {
  MAINTENANCE_REPOSITORY,
  MaintenanceRepository,
} from '../repositories/maintenance.repository';
import {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceTicket,
  MaintenanceTicketFilters,
} from '../types/maintenance.types';

@Injectable()
export class MaintenanceService {
  constructor(
    @Inject(MAINTENANCE_REPOSITORY)
    private readonly repository: MaintenanceRepository,
    private readonly eventBus: EventBusService,
    private readonly workflowService: WorkflowService,
    private readonly auditService: AuditService,
    private readonly schedulerService: SchedulerService,
  ) {}

  async create(
    dto: CreateMaintenanceTicketDto,
  ): Promise<MaintenanceTicket> {
    const category =
      await this.repository.findCategoryById(
        dto.categoryId,
      );

    if (!category || !category.isActive) {
      throw new BadRequestException(
        `Invalid maintenance category: ${dto.categoryId}`,
      );
    }

    const now = new Date();
    const priority =
      dto.priority ?? MaintenancePriority.MEDIUM;

    const ticket: MaintenanceTicket = {
      id: randomUUID(),
      ticketNumber: this.createTicketNumber(),
      title: dto.title,
      description: dto.description,
      categoryId: dto.categoryId,
      propertyId: dto.propertyId,
      spaceId: dto.spaceId,
      reporterPersonId: dto.reporterPersonId,
      priority,
      status: MaintenanceStatus.OPEN,
      slaDueAt: this.calculateSlaDueAt(
        now,
        category.defaultSlaMinutes,
        priority,
      ),
      createdAt: now,
      updatedAt: now,
    };

    const created =
      await this.repository.create(ticket);

    await this.repository.addHistory({
      id: randomUUID(),
      ticketId: created.id,
      toStatus: MaintenanceStatus.OPEN,
      changedByPersonId: dto.reporterPersonId,
      remarks: 'Maintenance ticket created',
      createdAt: now,
    });

    await this.workflowService.startWorkflowByCode({
      workflowCode: MAINTENANCE_WORKFLOW_CODE,
      entityType: 'maintenance.ticket',
      entityId: created.id,
      createdBy: dto.reporterPersonId,
      metadata: {
        ticketNumber: created.ticketNumber,
        propertyId: created.propertyId,
        priority: created.priority,
      },
    });

    await this.scheduleSlaJobs(created);

    await this.publish(
      MAINTENANCE_EVENTS.CREATED,
      created,
    );

    await this.auditService.record(
      MAINTENANCE_EVENTS.CREATED,
      'core.maintenance',
      this.auditPayload(created, {
        actorPersonId: dto.reporterPersonId,
      }),
    );

    return created;
  }

  async list(
    filters: MaintenanceTicketFilters = {},
  ) {
    return this.repository.findAll(filters);
  }

  async search(
    query: string,
    limit = 25,
  ): Promise<MaintenanceTicket[]> {
    const normalizedLimit = Math.min(
      Math.max(limit, 1),
      100,
    );

    const tickets = await this.repository.findAll({
      search: query,
    });

    return tickets.slice(0, normalizedLimit);
  }

  async get(id: string) {
    const ticket =
      await this.repository.findDetailsById(id);

    if (!ticket) {
      throw new NotFoundException(
        `Maintenance ticket not found: ${id}`,
      );
    }

    return ticket;
  }

  async update(
    id: string,
    dto: UpdateMaintenanceTicketDto,
  ) {
    const current = await this.requireTicket(id);

    const updated = await this.repository.update(
      id,
      {
        title: dto.title ?? current.title,
        description:
          dto.description ?? current.description,
        priority:
          dto.priority ?? current.priority,
      },
    );

    if (!updated) {
      throw new NotFoundException(
        `Maintenance ticket not found: ${id}`,
      );
    }

    await this.auditService.record(
      'maintenance.ticket.updated',
      'core.maintenance',
      this.auditPayload(updated, {
        actorPersonId: dto.changedByPersonId,
        remarks: dto.remarks,
      }),
    );

    return updated;
  }

  async assign(
    id: string,
    dto: AssignMaintenanceTicketDto,
  ) {
    const current = await this.requireTicket(id);

    if (
      ![
        MaintenanceStatus.OPEN,
        MaintenanceStatus.ASSIGNED,
      ].includes(current.status)
    ) {
      throw new BadRequestException(
        `Ticket cannot be assigned from ${current.status}`,
      );
    }

    const assigned = await this.repository.assign(
      id,
      dto.assigneePersonId,
    );

    if (!assigned) {
      throw new NotFoundException(
        `Maintenance ticket not found: ${id}`,
      );
    }

    await this.recordTransition(
      assigned,
      current.status,
      MaintenanceStatus.ASSIGNED,
      dto.changedByPersonId,
      dto.remarks ?? 'Maintenance ticket assigned',
    );

    await this.workflowService.transitionWorkflowByEntity({
      entityType: 'maintenance.ticket',
      entityId: assigned.id,
      actionCode: 'assign',
      actorId: dto.changedByPersonId,
      notes: dto.remarks,
      metadata: {
        assigneePersonId: assigned.assigneePersonId,
      },
    });

    await this.publish(
      MAINTENANCE_EVENTS.ASSIGNED,
      assigned,
    );

    await this.auditService.record(
      MAINTENANCE_EVENTS.ASSIGNED,
      'core.maintenance',
      this.auditPayload(assigned, {
        actorPersonId: dto.changedByPersonId,
        remarks: dto.remarks,
      }),
    );

    return assigned;
  }

  async transition(
    id: string,
    dto: TransitionMaintenanceTicketDto,
  ) {
    const current = await this.requireTicket(id);

    this.assertTransition(
      current.status,
      dto.status,
    );

    const now = new Date();

    const updated =
      await this.repository.updateStatus(
        id,
        dto.status,
        {
          resolvedAt:
            dto.status === MaintenanceStatus.RESOLVED
              ? now
              : undefined,
          closedAt:
            dto.status === MaintenanceStatus.CLOSED
              ? now
              : undefined,
        },
      );

    if (!updated) {
      throw new NotFoundException(
        `Maintenance ticket not found: ${id}`,
      );
    }

    await this.recordTransition(
      updated,
      current.status,
      dto.status,
      dto.changedByPersonId,
      dto.remarks,
    );

    const actionCode = this.actionForTransition(
      current.status,
      dto.status,
    );

    await this.workflowService.transitionWorkflowByEntity({
      entityType: 'maintenance.ticket',
      entityId: updated.id,
      actionCode,
      actorId: dto.changedByPersonId,
      notes: dto.remarks,
      metadata: {
        fromStatus: current.status,
        toStatus: dto.status,
      },
    });

    const event = this.eventForStatus(dto.status);

    if (event) {
      await this.publish(event, updated, {
        remarks: dto.remarks,
      });

      await this.auditService.record(
        event,
        'core.maintenance',
        this.auditPayload(updated, {
          actorPersonId: dto.changedByPersonId,
          fromStatus: current.status,
          toStatus: dto.status,
          remarks: dto.remarks,
        }),
      );
    }

    return updated;
  }

  async getHistory(id: string) {
    await this.requireTicket(id);
    return this.repository.getHistory(id);
  }

  async listCategories() {
    return this.repository.listCategories();
  }

  async getMetrics(propertyId?: string) {
    return this.repository.getMetrics(propertyId);
  }

  private async requireTicket(
    id: string,
  ): Promise<MaintenanceTicket> {
    const ticket = await this.repository.findById(id);

    if (!ticket) {
      throw new NotFoundException(
        `Maintenance ticket not found: ${id}`,
      );
    }

    return ticket;
  }

  private async recordTransition(
    ticket: MaintenanceTicket,
    fromStatus: MaintenanceStatus,
    toStatus: MaintenanceStatus,
    changedByPersonId: string,
    remarks?: string,
  ): Promise<void> {
    await this.repository.addHistory({
      id: randomUUID(),
      ticketId: ticket.id,
      fromStatus,
      toStatus,
      changedByPersonId,
      remarks,
      createdAt: new Date(),
    });
  }

  private assertTransition(
    from: MaintenanceStatus,
    to: MaintenanceStatus,
  ): void {
    const transitions: Record<
      MaintenanceStatus,
      MaintenanceStatus[]
    > = {
      OPEN: [
        MaintenanceStatus.ASSIGNED,
        MaintenanceStatus.CANCELLED,
        MaintenanceStatus.REJECTED,
      ],
      ASSIGNED: [
        MaintenanceStatus.IN_PROGRESS,
        MaintenanceStatus.CANCELLED,
      ],
      IN_PROGRESS: [
        MaintenanceStatus.RESOLVED,
      ],
      RESOLVED: [
        MaintenanceStatus.CLOSED,
        MaintenanceStatus.IN_PROGRESS,
      ],
      CLOSED: [],
      CANCELLED: [],
      REJECTED: [],
    };

    if (!transitions[from].includes(to)) {
      throw new BadRequestException(
        `Invalid maintenance transition: ${from} -> ${to}`,
      );
    }
  }

  private calculateSlaDueAt(
    createdAt: Date,
    defaultSlaMinutes: number,
    priority: MaintenancePriority,
  ): Date {
    const multiplier: Record<
      MaintenancePriority,
      number
    > = {
      LOW: 2,
      MEDIUM: 1,
      HIGH: 0.5,
      URGENT: 0.25,
    };

    const minutes = Math.max(
      15,
      Math.round(
        defaultSlaMinutes * multiplier[priority],
      ),
    );

    return new Date(
      createdAt.getTime() + minutes * 60_000,
    );
  }

  private createTicketNumber(): string {
    const date = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');

    const suffix = randomUUID()
      .replace(/-/g, '')
      .slice(0, 6)
      .toUpperCase();

    return `MT-${date}-${suffix}`;
  }

  private async scheduleSlaJobs(
    ticket: MaintenanceTicket,
  ): Promise<void> {
    if (!ticket.slaDueAt) {
      return;
    }

    const now = Date.now();
    const dueAt = ticket.slaDueAt.getTime();
    const warningAt = new Date(
      now + Math.max(
        Math.round((dueAt - now) * 0.8),
        60_000,
      ),
    );

    const payload = {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      propertyId: ticket.propertyId,
    };

    await this.schedulerService.createJob({
      name:
        `Maintenance SLA warning: ${ticket.ticketNumber}`,
      jobType:
        MAINTENANCE_SLA_WARNING_JOB_TYPE,
      payload,
      scheduleType: 'ONE_TIME',
      runAt: warningAt.toISOString(),
      maxAttempts: 3,
    });

    await this.schedulerService.createJob({
      name:
        `Maintenance SLA overdue: ${ticket.ticketNumber}`,
      jobType:
        MAINTENANCE_SLA_OVERDUE_JOB_TYPE,
      payload,
      scheduleType: 'ONE_TIME',
      runAt: ticket.slaDueAt.toISOString(),
      maxAttempts: 3,
    });
  }

  private actionForTransition(
    from: MaintenanceStatus,
    to: MaintenanceStatus,
  ): string {
    const key = `${from}->${to}`;

    const actions: Record<string, string> = {
      'OPEN->ASSIGNED': 'assign',
      'ASSIGNED->IN_PROGRESS': 'start',
      'IN_PROGRESS->RESOLVED': 'resolve',
      'RESOLVED->CLOSED': 'close',
      'RESOLVED->IN_PROGRESS': 'reopen',
      'OPEN->CANCELLED': 'cancel',
      'ASSIGNED->CANCELLED': 'cancel',
      'OPEN->REJECTED': 'reject',
    };

    const action = actions[key];

    if (!action) {
      throw new BadRequestException(
        `No workflow action configured for ${key}`,
      );
    }

    return action;
  }

  private auditPayload(
    ticket: MaintenanceTicket,
    extra: Record<string, unknown> = {},
  ): Record<string, unknown> {
    return {
      entityType: 'maintenance.ticket',
      entityId: ticket.id,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      propertyId: ticket.propertyId,
      spaceId: ticket.spaceId,
      reporterPersonId: ticket.reporterPersonId,
      assigneePersonId: ticket.assigneePersonId,
      priority: ticket.priority,
      status: ticket.status,
      slaDueAt: ticket.slaDueAt,
      ...extra,
    };
  }

  private eventForStatus(
    status: MaintenanceStatus,
  ): string | undefined {
    const events: Partial<
      Record<MaintenanceStatus, string>
    > = {
      IN_PROGRESS:
        MAINTENANCE_EVENTS.IN_PROGRESS,
      RESOLVED: MAINTENANCE_EVENTS.RESOLVED,
      CLOSED: MAINTENANCE_EVENTS.CLOSED,
      CANCELLED: MAINTENANCE_EVENTS.CANCELLED,
      REJECTED: MAINTENANCE_EVENTS.REJECTED,
    };

    return events[status];
  }

  private async publish(
    event: string,
    ticket: MaintenanceTicket,
    extra: Record<string, unknown> = {},
  ): Promise<void> {
    await this.eventBus.publish(
      event,
      'core.maintenance',
      {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        propertyId: ticket.propertyId,
        spaceId: ticket.spaceId,
        categoryId: ticket.categoryId,
        reporterPersonId:
          ticket.reporterPersonId,
        assigneePersonId:
          ticket.assigneePersonId,
        priority: ticket.priority,
        status: ticket.status,
        slaDueAt: ticket.slaDueAt,
        ...extra,
      },
    );
  }
}
