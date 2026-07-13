import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  randomUUID,
} from 'crypto';

import {
  AuditService,
} from '../../audit/audit.service';
import {
  EventBusService,
} from '../../eventbus/services/eventbus.service';

import {
  CreateCommunicationDto,
  CommunicationTargetDto,
} from '../dto/create-communication.dto';
import {
  UpdateCommunicationDto,
} from '../dto/update-communication.dto';
import {
  ScheduleCommunicationDto,
} from '../dto/schedule-communication.dto';
import {
  TransitionCommunicationDto,
} from '../dto/transition-communication.dto';

import {
  COMMUNICATIONS_EVENTS,
} from '../communications.constants';

import {
  COMMUNICATIONS_REPOSITORY,
  CommunicationsRepository,
} from '../repositories/communications.repository';

import {
  Communication,
  CommunicationAudienceType,
  CommunicationFilters,
  CommunicationStatus,
  CommunicationTarget,
} from '../types/communications.types';

@Injectable()
export class CommunicationsService {
  constructor(
    @Inject(COMMUNICATIONS_REPOSITORY)
    private readonly repository:
      CommunicationsRepository,
    private readonly eventBus:
      EventBusService,
    private readonly auditService:
      AuditService,
  ) {}

  async create(
    dto: CreateCommunicationDto,
  ): Promise<Communication> {
    this.requireText(
      dto.title,
      'title',
    );

    this.requireText(
      dto.content,
      'content',
    );

    const category =
      await this.repository.findCategoryById(
        dto.categoryId,
      );

    if (!category || !category.isActive) {
      throw new BadRequestException(
        `Invalid communication category: ${dto.categoryId}`,
      );
    }

    const targets =
      this.validateTargets(
        dto.targets,
      );

    const publishAt =
      this.parseOptionalDate(
        dto.publishAt,
        'publishAt',
      );

    const expiresAt =
      this.parseOptionalDate(
        dto.expiresAt,
        'expiresAt',
      );

    this.validateDateRange(
      publishAt,
      expiresAt,
    );

    const now =
      new Date();

    const communication:
      Communication = {
        id: randomUUID(),
        communicationNumber:
          this.createNumber(),
        propertyId:
          dto.propertyId,
        categoryId:
          dto.categoryId,
        type:
          dto.type,
        title:
          dto.title.trim(),
        content:
          dto.content.trim(),
        summary:
          dto.summary?.trim() ||
          undefined,
        priority:
          dto.priority,
        status:
          CommunicationStatus.DRAFT,
        isPinned:
          dto.isPinned,
        requiresAcknowledgement:
          dto.requiresAcknowledgement,
        publishAt,
        expiresAt,
        createdByPersonId:
          dto.createdByPersonId,
        createdAt:
          now,
        updatedAt:
          now,
      };

    const created =
      await this.repository.create(
        communication,
      );

    await this.repository.replaceTargets(
      created.id,
      targets.map(
        (target) =>
          this.mapTarget(
            created.id,
            target,
          ),
      ),
    );

    await this.repository.addHistory({
      id: randomUUID(),
      communicationId:
        created.id,
      toStatus:
        CommunicationStatus.DRAFT,
      changedByPersonId:
        dto.createdByPersonId,
      remarks:
        'Communication created',
      createdAt:
        now,
    });

    await this.publishEvent(
      COMMUNICATIONS_EVENTS.CREATED,
      created,
    );

    await this.auditService.record(
      COMMUNICATIONS_EVENTS.CREATED,
      'core.communications',
      this.auditPayload(
        created,
        dto.createdByPersonId,
      ),
    );

    return created;
  }

  async list(
    filters:
      CommunicationFilters = {},
  ) {
    return this.repository.findAll(
      filters,
    );
  }

  async get(
    id: string,
  ) {
    const communication =
      await this.repository.findDetailsById(
        id,
      );

    if (!communication) {
      throw new NotFoundException(
        `Communication not found: ${id}`,
      );
    }

    return communication;
  }

  async update(
    id: string,
    dto: UpdateCommunicationDto,
  ) {
    const current =
      await this.requireCommunication(
        id,
      );

    if (
      current.status !==
      CommunicationStatus.DRAFT
    ) {
      throw new BadRequestException(
        'Only draft communications can be edited',
      );
    }

    if (dto.categoryId) {
      const category =
        await this.repository.findCategoryById(
          dto.categoryId,
        );

      if (
        !category ||
        !category.isActive
      ) {
        throw new BadRequestException(
          `Invalid communication category: ${dto.categoryId}`,
        );
      }
    }

    const publishAt =
      dto.publishAt !== undefined
        ? this.parseOptionalDate(
            dto.publishAt,
            'publishAt',
          )
        : current.publishAt;

    const expiresAt =
      dto.expiresAt !== undefined
        ? this.parseOptionalDate(
            dto.expiresAt,
            'expiresAt',
          )
        : current.expiresAt;

    this.validateDateRange(
      publishAt,
      expiresAt,
    );

    const updated =
      await this.repository.update(
        id,
        {
          categoryId:
            dto.categoryId ??
            current.categoryId,
          type:
            dto.type ??
            current.type,
          title:
            dto.title?.trim() ||
            current.title,
          content:
            dto.content?.trim() ||
            current.content,
          summary:
            dto.summary !== undefined
              ? dto.summary.trim() ||
                undefined
              : current.summary,
          priority:
            dto.priority ??
            current.priority,
          isPinned:
            dto.isPinned ??
            current.isPinned,
          requiresAcknowledgement:
            dto.requiresAcknowledgement ??
            current.requiresAcknowledgement,
          publishAt,
          expiresAt,
          updatedByPersonId:
            dto.updatedByPersonId,
        },
      );

    if (!updated) {
      throw new NotFoundException(
        `Communication not found: ${id}`,
      );
    }

    if (dto.targets) {
      const targets =
        this.validateTargets(
          dto.targets,
        );

      await this.repository.replaceTargets(
        id,
        targets.map(
          (target) =>
            this.mapTarget(
              id,
              target,
            ),
        ),
      );
    }

    await this.publishEvent(
      COMMUNICATIONS_EVENTS.UPDATED,
      updated,
    );

    await this.auditService.record(
      COMMUNICATIONS_EVENTS.UPDATED,
      'core.communications',
      this.auditPayload(
        updated,
        dto.updatedByPersonId,
      ),
    );

    return updated;
  }

  async schedule(
    id: string,
    dto: ScheduleCommunicationDto,
  ) {
    const current =
      await this.requireCommunication(id);

    if (
      current.status !==
      CommunicationStatus.DRAFT
    ) {
      throw new BadRequestException(
        `Only DRAFT communications can be scheduled`,
      );
    }

    const publishAt =
      this.parseRequiredDate(
        dto.publishAt,
        'publishAt',
      );

    if (
      publishAt.getTime() <=
      Date.now()
    ) {
      throw new BadRequestException(
        'publishAt must be in the future',
      );
    }

    const expiresAt =
      this.parseOptionalDate(
        dto.expiresAt,
        'expiresAt',
      ) ??
      current.expiresAt;

    this.validateDateRange(
      publishAt,
      expiresAt,
    );

    return this.transition(
      current,
      CommunicationStatus.SCHEDULED,
      COMMUNICATIONS_EVENTS.SCHEDULED,
      dto.changedByPersonId,
      dto.remarks,
      {
        publishAt,
        expiresAt,
        updatedByPersonId:
          dto.changedByPersonId,
      },
    );
  }

  async publish(
    id: string,
    dto: TransitionCommunicationDto,
  ) {
    const current =
      await this.requireCommunication(id);

    if (
      ![
        CommunicationStatus.DRAFT,
        CommunicationStatus.SCHEDULED,
      ].includes(current.status)
    ) {
      throw new BadRequestException(
        `Communication cannot be published from ${current.status}`,
      );
    }

    const now =
      new Date();

    if (
      current.expiresAt &&
      current.expiresAt.getTime() <=
        now.getTime()
    ) {
      throw new BadRequestException(
        'Expired communication cannot be published',
      );
    }

    return this.transition(
      current,
      CommunicationStatus.PUBLISHED,
      COMMUNICATIONS_EVENTS.PUBLISHED,
      dto.changedByPersonId,
      dto.remarks,
      {
        publishAt:
          current.publishAt ?? now,
        publishedAt:
          now,
        publishedByPersonId:
          dto.changedByPersonId,
        updatedByPersonId:
          dto.changedByPersonId,
      },
    );
  }

  async expire(
    id: string,
    dto: TransitionCommunicationDto,
  ) {
    const current =
      await this.requireCommunication(id);

    if (
      current.status !==
      CommunicationStatus.PUBLISHED
    ) {
      throw new BadRequestException(
        'Only PUBLISHED communications can expire',
      );
    }

    return this.transition(
      current,
      CommunicationStatus.EXPIRED,
      COMMUNICATIONS_EVENTS.EXPIRED,
      dto.changedByPersonId,
      dto.remarks,
      {
        expiresAt:
          current.expiresAt ??
          new Date(),
        updatedByPersonId:
          dto.changedByPersonId,
      },
    );
  }

  async archive(
    id: string,
    dto: TransitionCommunicationDto,
  ) {
    const current =
      await this.requireCommunication(id);

    if (
      ![
        CommunicationStatus.PUBLISHED,
        CommunicationStatus.EXPIRED,
      ].includes(current.status)
    ) {
      throw new BadRequestException(
        `Communication cannot be archived from ${current.status}`,
      );
    }

    return this.transition(
      current,
      CommunicationStatus.ARCHIVED,
      COMMUNICATIONS_EVENTS.ARCHIVED,
      dto.changedByPersonId,
      dto.remarks,
      {
        archivedAt:
          new Date(),
        archivedByPersonId:
          dto.changedByPersonId,
        updatedByPersonId:
          dto.changedByPersonId,
      },
    );
  }

  async cancel(
    id: string,
    dto: TransitionCommunicationDto,
  ) {
    const current =
      await this.requireCommunication(id);

    if (
      ![
        CommunicationStatus.DRAFT,
        CommunicationStatus.SCHEDULED,
      ].includes(current.status)
    ) {
      throw new BadRequestException(
        `Communication cannot be cancelled from ${current.status}`,
      );
    }

    return this.transition(
      current,
      CommunicationStatus.CANCELLED,
      COMMUNICATIONS_EVENTS.CANCELLED,
      dto.changedByPersonId,
      dto.remarks,
      {
        cancelledAt:
          new Date(),
        cancelledByPersonId:
          dto.changedByPersonId,
        updatedByPersonId:
          dto.changedByPersonId,
      },
    );
  }

  async getHistory(
    id: string,
  ) {
    await this.requireCommunication(id);

    return this.repository.listHistory(id);
  }

  async listCategories() {
    return this.repository.listCategories();
  }

  async getMetrics(
    propertyId?: string,
  ) {
    return this.repository.getMetrics(
      propertyId,
    );
  }

  private async transition(
    current: Communication,
    nextStatus: CommunicationStatus,
    eventName: string,
    changedByPersonId: string,
    remarks?: string,
    changes: Partial<Communication> = {},
  ) {
    const updated =
      await this.repository.update(
        current.id,
        {
          ...changes,
          status:
            nextStatus,
        },
      );

    if (!updated) {
      throw new NotFoundException(
        `Communication not found: ${current.id}`,
      );
    }

    await this.repository.addHistory({
      id: randomUUID(),
      communicationId:
        current.id,
      fromStatus:
        current.status,
      toStatus:
        nextStatus,
      changedByPersonId,
      remarks,
      createdAt:
        new Date(),
    });

    await this.publishEvent(
      eventName,
      updated,
    );

    await this.auditService.record(
      eventName,
      'core.communications',
      {
        ...this.auditPayload(
          updated,
          changedByPersonId,
        ),
        fromStatus:
          current.status,
        toStatus:
          nextStatus,
        remarks,
      },
    );

    return updated;
  }

  private async requireCommunication(
    id: string,
  ): Promise<Communication> {
    const communication =
      await this.repository.findById(
        id,
      );

    if (!communication) {
      throw new NotFoundException(
        `Communication not found: ${id}`,
      );
    }

    return communication;
  }

  private validateTargets(
    targets:
      CommunicationTargetDto[],
  ): CommunicationTargetDto[] {
    if (
      !Array.isArray(targets) ||
      targets.length === 0
    ) {
      throw new BadRequestException(
        'At least one audience target is required',
      );
    }

    for (const target of targets) {
      switch (target.audienceType) {
        case CommunicationAudienceType.ZONE:
          if (!target.zoneId) {
            throw new BadRequestException(
              'ZONE target requires zoneId',
            );
          }
          break;

        case CommunicationAudienceType.SPACE:
          if (!target.spaceId) {
            throw new BadRequestException(
              'SPACE target requires spaceId',
            );
          }
          break;

        case CommunicationAudienceType.PERSON:
          if (!target.personId) {
            throw new BadRequestException(
              'PERSON target requires personId',
            );
          }
          break;

        case CommunicationAudienceType.ROLE:
          if (!target.roleId) {
            throw new BadRequestException(
              'ROLE target requires roleId',
            );
          }
          break;

        default:
          break;
      }
    }

    return targets;
  }

  private mapTarget(
    communicationId: string,
    target: CommunicationTargetDto,
  ): CommunicationTarget {
    return {
      id: randomUUID(),
      communicationId,
      audienceType:
        target.audienceType,
      zoneId:
        target.zoneId,
      spaceId:
        target.spaceId,
      personId:
        target.personId,
      roleId:
        target.roleId,
      createdAt:
        new Date(),
    };
  }

  private parseRequiredDate(
    value: string,
    field: string,
  ): Date {
    if (!value) {
      throw new BadRequestException(
        `${field} is required`,
      );
    }

    const parsed =
      new Date(value);

    if (
      Number.isNaN(
        parsed.getTime(),
      )
    ) {
      throw new BadRequestException(
        `${field} must be a valid ISO date`,
      );
    }

    return parsed;
  }

  private parseOptionalDate(
    value: string | undefined,
    field: string,
  ): Date | undefined {
    if (!value) {
      return undefined;
    }

    const parsed =
      new Date(value);

    if (
      Number.isNaN(
        parsed.getTime(),
      )
    ) {
      throw new BadRequestException(
        `${field} must be a valid ISO date`,
      );
    }

    return parsed;
  }

  private validateDateRange(
    publishAt?: Date,
    expiresAt?: Date,
  ): void {
    if (
      publishAt &&
      expiresAt &&
      expiresAt.getTime() <=
        publishAt.getTime()
    ) {
      throw new BadRequestException(
        'expiresAt must be after publishAt',
      );
    }
  }

  private requireText(
    value: string,
    field: string,
  ): void {
    if (!value?.trim()) {
      throw new BadRequestException(
        `${field} is required`,
      );
    }
  }

  private createNumber(): string {
    const date =
      new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '');

    const suffix =
      randomUUID()
        .replace(/-/g, '')
        .slice(0, 8)
        .toUpperCase();

    return `COM-${date}-${suffix}`;
  }

  private async publishEvent(
    eventName: string,
    communication: Communication,
  ): Promise<void> {
    await this.eventBus.publish(
      eventName,
      'core.communications',
      {
        ...communication,
        entityType:
          'communication',
        entityId:
          communication.id,
        eventVersion: 1,
      },
    );
  }

  private auditPayload(
    communication: Communication,
    actorPersonId: string,
  ) {
    return {
      communicationId:
        communication.id,
      communicationNumber:
        communication.communicationNumber,
      propertyId:
        communication.propertyId,
      categoryId:
        communication.categoryId,
      type:
        communication.type,
      priority:
        communication.priority,
      status:
        communication.status,
      actorPersonId,
    };
  }
}
