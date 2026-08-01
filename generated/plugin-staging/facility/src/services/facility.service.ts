import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { AuditService } from '@propertyos/core-contracts';
import { EventBusService } from '@propertyos/core-contracts';
import { WorkflowService } from '@propertyos/core-contracts';
import {
  FACILITY_ASSET_WORKFLOW_CODE,
  FACILITY_EVENTS,
} from '../facility.constants';
import { CreateAssetCategoryDto } from '../dto/create-asset-category.dto';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { CreatePreventiveMaintenancePlanDto } from '../dto/create-preventive-maintenance-plan.dto';
import { TransitionAssetDto } from '../dto/transition-asset.dto';
import { UpdateAssetDto } from '../dto/update-asset.dto';
import {
  FACILITY_REPOSITORY,
  FacilityRepository,
} from '../repositories/facility.repository';
import {
  AssetStatus,
  FacilityAsset,
  FacilityAssetFilters,
} from '../types/facility.types';

@Injectable()
export class FacilityService {
  constructor(
    @Inject(FACILITY_REPOSITORY)
    private readonly repository: FacilityRepository,
    private readonly eventBus: EventBusService,
    private readonly auditService: AuditService,
    private readonly workflowService: WorkflowService,
  ) {}

  async createCategory(dto: CreateAssetCategoryDto) {
    const now = new Date();

    return this.repository.createCategory({
      id: randomUUID(),
      code: dto.code.trim().toUpperCase(),
      name: dto.name.trim(),
      description: dto.description?.trim(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  listCategories() {
    return this.repository.listCategories();
  }

  async createAsset(dto: CreateAssetDto) {
    const category =
      await this.repository.findCategoryById(
        dto.categoryId,
      );

    if (!category || !category.isActive) {
      throw new BadRequestException(
        `Invalid asset category: ${dto.categoryId}`,
      );
    }

    const now = new Date();

    const asset: FacilityAsset = {
      id: randomUUID(),
      assetNumber: this.createAssetNumber(),
      name: dto.name,
      description: dto.description,
      categoryId: dto.categoryId,
      propertyId: dto.propertyId,
      zoneId: dto.zoneId,
      spaceId: dto.spaceId,
      manufacturer: dto.manufacturer,
      model: dto.model,
      serialNumber: dto.serialNumber,
      qrToken: randomUUID(),
      status: dto.status,
      condition: dto.condition,
      purchaseDate: dto.purchaseDate
        ? new Date(dto.purchaseDate)
        : undefined,
      purchaseCost: dto.purchaseCost,
      warrantyExpiresAt: dto.warrantyExpiresAt
        ? new Date(dto.warrantyExpiresAt)
        : undefined,
      vendorName: dto.vendorName,
      vendorContact: dto.vendorContact,
      installedAt: dto.installedAt
        ? new Date(dto.installedAt)
        : undefined,
      createdAt: now,
      updatedAt: now,
    };

    const created =
      await this.repository.createAsset(asset);

    await this.repository.addHistory({
      id: randomUUID(),
      assetId: created.id,
      toStatus: created.status,
      changedByPersonId: dto.createdByPersonId,
      remarks: 'Facility asset created',
      createdAt: now,
    });

    await this.workflowService.startWorkflowByCode({
      workflowCode: FACILITY_ASSET_WORKFLOW_CODE,
      entityType: 'facility.asset',
      entityId: created.id,
      createdBy: dto.createdByPersonId,
      metadata: {
        assetNumber: created.assetNumber,
        propertyId: created.propertyId,
        categoryId: created.categoryId,
      },
    });

    await this.publish(
      FACILITY_EVENTS.ASSET_CREATED,
      created,
    );

    await this.auditService.record(
      FACILITY_EVENTS.ASSET_CREATED,
      'core.facility',
      this.auditPayload(created, {
        actorPersonId: dto.createdByPersonId,
      }),
    );

    return created;
  }

  listAssets(
    filters: FacilityAssetFilters = {},
  ) {
    return this.repository.listAssets(filters);
  }

  async search(query: string, limit = 25) {
    const assets = await this.repository.listAssets({
      search: query,
    });

    return assets.slice(
      0,
      Math.min(Math.max(limit, 1), 100),
    );
  }

  async getAsset(id: string) {
    const asset =
      await this.repository.findAssetDetailsById(id);

    if (!asset) {
      throw new NotFoundException(
        `Facility asset not found: ${id}`,
      );
    }

    return asset;
  }

  async updateAsset(
    id: string,
    dto: UpdateAssetDto,
  ) {
    const current = await this.requireAsset(id);

    const updated =
      await this.repository.updateAsset(id, {
        name: dto.name ?? current.name,
        description:
          dto.description ?? current.description,
        categoryId:
          dto.categoryId ?? current.categoryId,
        zoneId: dto.zoneId ?? current.zoneId,
        spaceId: dto.spaceId ?? current.spaceId,
        manufacturer:
          dto.manufacturer ?? current.manufacturer,
        model: dto.model ?? current.model,
        serialNumber:
          dto.serialNumber ?? current.serialNumber,
        condition:
          dto.condition ?? current.condition,
        purchaseDate: dto.purchaseDate
          ? new Date(dto.purchaseDate)
          : current.purchaseDate,
        purchaseCost:
          dto.purchaseCost ?? current.purchaseCost,
        warrantyExpiresAt: dto.warrantyExpiresAt
          ? new Date(dto.warrantyExpiresAt)
          : current.warrantyExpiresAt,
        vendorName:
          dto.vendorName ?? current.vendorName,
        vendorContact:
          dto.vendorContact ?? current.vendorContact,
        installedAt: dto.installedAt
          ? new Date(dto.installedAt)
          : current.installedAt,
      });

    if (!updated) {
      throw new NotFoundException(
        `Facility asset not found: ${id}`,
      );
    }

    await this.publish(
      FACILITY_EVENTS.ASSET_UPDATED,
      updated,
    );

    await this.auditService.record(
      FACILITY_EVENTS.ASSET_UPDATED,
      'core.facility',
      this.auditPayload(updated, {
        actorPersonId: dto.changedByPersonId,
        remarks: dto.remarks,
      }),
    );

    return updated;
  }

  async transitionAsset(
    id: string,
    dto: TransitionAssetDto,
  ) {
    const current = await this.requireAsset(id);

    this.assertTransition(
      current.status,
      dto.status,
    );

    const now = new Date();

    const updated =
      await this.repository.updateAssetStatus(
        id,
        dto.status,
        {
          retiredAt:
            dto.status === AssetStatus.RETIRED
              ? now
              : undefined,
          disposedAt:
            dto.status === AssetStatus.DISPOSED
              ? now
              : undefined,
        },
      );

    if (!updated) {
      throw new NotFoundException(
        `Facility asset not found: ${id}`,
      );
    }

    await this.repository.addHistory({
      id: randomUUID(),
      assetId: updated.id,
      fromStatus: current.status,
      toStatus: dto.status,
      changedByPersonId: dto.changedByPersonId,
      remarks: dto.remarks,
      createdAt: now,
    });

    const actionCode = this.actionForTransition(
      current.status,
      dto.status,
    );

    await this.workflowService.transitionWorkflowByEntity({
      entityType: 'facility.asset',
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
      await this.publish(event, updated);

      await this.auditService.record(
        event,
        'core.facility',
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

  async createPreventivePlan(
    assetId: string,
    dto: CreatePreventiveMaintenancePlanDto,
  ) {
    const asset = await this.requireAsset(assetId);
    const now = new Date();

    const plan =
      await this.repository.createPreventivePlan({
        id: randomUUID(),
        assetId,
        name: dto.name,
        description: dto.description,
        frequency: dto.frequency,
        intervalDays: dto.intervalDays,
        nextDueAt: new Date(dto.nextDueAt),
        assignedPersonId: dto.assignedPersonId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

    await this.eventBus.publish(
      FACILITY_EVENTS.PLAN_CREATED,
      'core.facility',
      {
        entityType:
          'facility.preventive_maintenance_plan',
        entityId: plan.id,
        planId: plan.id,
        assetId,
        assetNumber: asset.assetNumber,
        propertyId: asset.propertyId,
        nextDueAt: plan.nextDueAt,
        frequency: plan.frequency,
        assignedPersonId: plan.assignedPersonId,
        actorPersonId: dto.createdByPersonId,
      },
    );

    return plan;
  }

  getMetrics(propertyId?: string) {
    return this.repository.getMetrics(propertyId);
  }

  private async requireAsset(
    id: string,
  ): Promise<FacilityAsset> {
    const asset = await this.repository.findAssetById(id);

    if (!asset) {
      throw new NotFoundException(
        `Facility asset not found: ${id}`,
      );
    }

    return asset;
  }

  private assertTransition(
    from: AssetStatus,
    to: AssetStatus,
  ): void {
    const transitions: Record<
      AssetStatus,
      AssetStatus[]
    > = {
      DRAFT: [
        AssetStatus.ACTIVE,
        AssetStatus.DISPOSED,
      ],
      ACTIVE: [
        AssetStatus.IN_MAINTENANCE,
        AssetStatus.OUT_OF_SERVICE,
        AssetStatus.RETIRED,
      ],
      IN_MAINTENANCE: [
        AssetStatus.ACTIVE,
        AssetStatus.OUT_OF_SERVICE,
        AssetStatus.RETIRED,
      ],
      OUT_OF_SERVICE: [
        AssetStatus.IN_MAINTENANCE,
        AssetStatus.ACTIVE,
        AssetStatus.RETIRED,
      ],
      RETIRED: [
        AssetStatus.DISPOSED,
      ],
      DISPOSED: [],
    };

    if (!transitions[from].includes(to)) {
      throw new BadRequestException(
        `Invalid asset transition: ${from} -> ${to}`,
      );
    }
  }

  private actionForTransition(
    from: AssetStatus,
    to: AssetStatus,
  ): string {
    const actions: Record<string, string> = {
      'DRAFT->ACTIVE': 'activate',
      'ACTIVE->IN_MAINTENANCE':
        'start-maintenance',
      'IN_MAINTENANCE->ACTIVE':
        'return-to-service',
      'ACTIVE->RETIRED': 'retire',
      'RETIRED->DISPOSED': 'dispose',
    };

    const action = actions[`${from}->${to}`];

    if (!action) {
      throw new BadRequestException(
        `No workflow action configured for ${from} -> ${to}`,
      );
    }

    return action;
  }

  private eventForStatus(
    status: AssetStatus,
  ): string | undefined {
    const events: Partial<Record<AssetStatus, string>> = {
      ACTIVE: FACILITY_EVENTS.ASSET_ACTIVATED,
      IN_MAINTENANCE:
        FACILITY_EVENTS.ASSET_IN_MAINTENANCE,
      RETIRED: FACILITY_EVENTS.ASSET_RETIRED,
      DISPOSED: FACILITY_EVENTS.ASSET_DISPOSED,
    };

    return events[status];
  }

  private createAssetNumber(): string {
    const date = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');

    const suffix = randomUUID()
      .replace(/-/g, '')
      .slice(0, 6)
      .toUpperCase();

    return `AS-${date}-${suffix}`;
  }

  private auditPayload(
    asset: FacilityAsset,
    extra: Record<string, unknown> = {},
  ) {
    return {
      entityType: 'facility.asset',
      entityId: asset.id,
      assetId: asset.id,
      assetNumber: asset.assetNumber,
      propertyId: asset.propertyId,
      zoneId: asset.zoneId,
      spaceId: asset.spaceId,
      categoryId: asset.categoryId,
      status: asset.status,
      condition: asset.condition,
      ...extra,
    };
  }

  private publish(
    eventType: string,
    asset: FacilityAsset,
  ) {
    return this.eventBus.publish(
      eventType,
      'core.facility',
      this.auditPayload(asset),
    );
  }
}
