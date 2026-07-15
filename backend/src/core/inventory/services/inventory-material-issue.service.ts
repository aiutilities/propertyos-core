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
  CancelMaterialIssueDto,
  CreateMaterialIssueDto,
  PostMaterialIssueDto,
} from '../dto';

import {
  INVENTORY_EVENTS,
} from '../inventory.constants';

import {
  INVENTORY_STOCK_LEDGER_REPOSITORY,
  InventoryStockLedgerRepository,
} from '../repositories/inventory-stock-ledger.repository';

import {
  InventoryMaterialIssue,
  InventoryMaterialIssueItem,
  InventoryMaterialIssueStatus,
  InventoryStockMovementType,
} from '../types/inventory.types';

import {
  InventoryService,
} from './inventory.service';

@Injectable()
export class InventoryMaterialIssueService {
  constructor(
    @Inject(
      INVENTORY_STOCK_LEDGER_REPOSITORY,
    )
    private readonly stockLedgerRepository:
      InventoryStockLedgerRepository,

    private readonly inventoryService:
      InventoryService,

    private readonly eventBus:
      EventBusService,

    private readonly auditService:
      AuditService,
  ) {}

  async createMaterialIssue(
    dto:
      CreateMaterialIssueDto,
  ) {
    if (!dto.items?.length) {
      throw new BadRequestException(
        'At least one Material Issue item is required',
      );
    }

    if (!dto.reasonCode?.trim()) {
      throw new BadRequestException(
        'reasonCode is required',
      );
    }

    const store =
      await this.inventoryService
        .getStore(
          dto.storeId,
        );

    if (!store.isActive) {
      throw new BadRequestException(
        `Inventory store is inactive: ${store.id}`,
      );
    }

    if (
      store.propertyId !==
      dto.propertyId
    ) {
      throw new BadRequestException(
        'The Inventory store does not belong to the selected property',
      );
    }

    const issueDate =
      this.requireDate(
        dto.issueDate,
        'issueDate',
      );

    const now =
      new Date();

    const materialIssueId =
      randomUUID();

    const duplicateKeys =
      new Set<string>();

    const items:
      InventoryMaterialIssueItem[] =
      [];

    for (
      const dtoItem
      of dto.items
    ) {
      const quantity =
        Number(
          dtoItem.quantity,
        );

      const unitCost =
        Number(
          dtoItem.unitCost,
        );

      if (
        !Number.isFinite(
          quantity,
        ) ||
        quantity <= 0
      ) {
        throw new BadRequestException(
          'Each Material Issue quantity must be greater than zero',
        );
      }

      if (
        !Number.isFinite(
          unitCost,
        ) ||
        unitCost < 0
      ) {
        throw new BadRequestException(
          'Each Material Issue unitCost must be zero or greater',
        );
      }

      const item =
        await this.inventoryService
          .getItem(
            dtoItem.itemId,
          );

      if (!item.isActive) {
        throw new BadRequestException(
          `Inventory item is inactive: ${item.id}`,
        );
      }

      if (
        dtoItem.binLocationId
      ) {
        const bin =
          await this.inventoryService
            .getBinLocation(
              dtoItem.binLocationId,
            );

        if (
          bin.storeId !==
          dto.storeId
        ) {
          throw new BadRequestException(
            `Inventory bin does not belong to the selected store: ${bin.id}`,
          );
        }

        if (!bin.isActive) {
          throw new BadRequestException(
            `Inventory bin is inactive: ${bin.id}`,
          );
        }
      }

      const duplicateKey = [
        dtoItem.itemId,
        dtoItem.binLocationId ??
          'STORE',
      ].join(':');

      if (
        duplicateKeys.has(
          duplicateKey,
        )
      ) {
        throw new BadRequestException(
          'Duplicate Material Issue item and bin combination',
        );
      }

      duplicateKeys.add(
        duplicateKey,
      );

      items.push({
        id:
          randomUUID(),

        materialIssueId,

        itemId:
          dtoItem.itemId,

        binLocationId:
          dtoItem.binLocationId,

        quantity,

        unitCost,

        remarks:
          this.optionalText(
            dtoItem.remarks,
          ),

        metadata: {},

        createdAt:
          now,

        updatedAt:
          now,
      });
    }

    const materialIssue:
      InventoryMaterialIssue = {
        id:
          materialIssueId,

        issueNumber:
          this.issueNumber(
            now,
            materialIssueId,
          ),

        propertyId:
          dto.propertyId,

        storeId:
          dto.storeId,

        status:
          InventoryMaterialIssueStatus
            .DRAFT,

        issueDate,

        reasonCode:
          dto.reasonCode
            .trim()
            .toUpperCase(),

        reasonDescription:
          this.optionalText(
            dto.reasonDescription,
          ),

        requestedByPersonId:
          dto.requestedByPersonId,

        createdByPersonId:
          dto.createdByPersonId,

        remarks:
          this.optionalText(
            dto.remarks,
          ),

        metadata: {},

        createdAt:
          now,

        updatedAt:
          now,
      };

    const created =
      await this
        .stockLedgerRepository
        .createMaterialIssue(
          materialIssue,
          items,
        );

    await this.publishAndAudit(
      INVENTORY_EVENTS
        .MATERIAL_ISSUE_CREATED,
      created.materialIssue.id,
      {
        materialIssueId:
          created.materialIssue.id,

        issueNumber:
          created.materialIssue
            .issueNumber,

        propertyId:
          created.materialIssue
            .propertyId,

        storeId:
          created.materialIssue
            .storeId,

        reasonCode:
          created.materialIssue
            .reasonCode,

        itemCount:
          created.items.length,

        actorPersonId:
          dto.createdByPersonId,
      },
    );

    return created;
  }

  async getMaterialIssue(
    id: string,
  ) {
    const materialIssue =
      await this
        .stockLedgerRepository
        .findMaterialIssueById(
          id,
        );

    if (!materialIssue) {
      throw new NotFoundException(
        `Inventory Material Issue not found: ${id}`,
      );
    }

    return materialIssue;
  }

  listMaterialIssues(
    filters: {
      propertyId?: string;
      storeId?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {},
  ) {
    const status =
      filters.status
        ? this.requireMaterialIssueStatus(
            filters.status,
          )
        : undefined;

    return this
      .stockLedgerRepository
      .listMaterialIssues({
        propertyId:
          filters.propertyId,

        storeId:
          filters.storeId,

        status,

        dateFrom:
          filters.dateFrom
            ? this.requireDate(
                filters.dateFrom,
                'dateFrom',
              )
            : undefined,

        dateTo:
          filters.dateTo
            ? this.requireDate(
                filters.dateTo,
                'dateTo',
              )
            : undefined,
      });
  }

  async postMaterialIssue(
    id: string,
    dto:
      PostMaterialIssueDto,
  ) {
    const postedAt =
      new Date();

    const transactionResult =
      await this
        .stockLedgerRepository
        .withTransaction(
          async (transaction) => {
            const details =
              await transaction
                .lockMaterialIssueById(
                  id,
                );

            if (!details) {
              throw new NotFoundException(
                `Inventory Material Issue not found: ${id}`,
              );
            }

            if (
              details.materialIssue
                .status !==
              InventoryMaterialIssueStatus
                .DRAFT
            ) {
              throw new BadRequestException(
                `Only DRAFT Material Issues can be posted; current status is ${details.materialIssue.status}`,
              );
            }

            if (!details.items.length) {
              throw new BadRequestException(
                'Material Issue has no items',
              );
            }

            for (
              const item
              of details.items
            ) {
              await transaction
                .postMovement({
                  movementType:
                    InventoryStockMovementType
                      .ISSUE,

                  itemId:
                    item.itemId,

                  storeId:
                    details.materialIssue
                      .storeId,

                  binLocationId:
                    item.binLocationId,

                  quantityDelta:
                    -Math.abs(
                      item.quantity,
                    ),

                  unitCost:
                    item.unitCost,

                  sourceType:
                    'inventory.material_issue',

                  sourceId:
                    details.materialIssue.id,

                  sourceLineId:
                    item.id,

                  referenceNumber:
                    details.materialIssue
                      .issueNumber,

                  idempotencyKey:
                    [
                      'inventory-material-issue',
                      details.materialIssue.id,
                      item.id,
                    ].join(':'),

                  correlationId:
                    details.materialIssue.id,

                  movementDate:
                    details.materialIssue
                      .issueDate,

                  postedByPersonId:
                    dto.postedByPersonId,

                  remarks:
                    item.remarks ??
                    details.materialIssue
                      .remarks,

                  metadata: {
                    materialIssueId:
                      details.materialIssue.id,

                    issueNumber:
                      details.materialIssue
                        .issueNumber,

                    propertyId:
                      details.materialIssue
                        .propertyId,

                    storeId:
                      details.materialIssue
                        .storeId,

                    reasonCode:
                      details.materialIssue
                        .reasonCode,

                    reasonDescription:
                      details.materialIssue
                        .reasonDescription,

                    materialIssueItemId:
                      item.id,

                    requestedByPersonId:
                      details.materialIssue
                        .requestedByPersonId,
                  },
                });
            }

            const posted =
              await transaction
                .updateMaterialIssueStatus(
                  id,
                  {
                    status:
                      InventoryMaterialIssueStatus
                        .POSTED,

                    postedByPersonId:
                      dto.postedByPersonId,

                    postedAt,

                    updatedAt:
                      postedAt,
                  },
                );

            if (!posted) {
              throw new NotFoundException(
                `Inventory Material Issue not found: ${id}`,
              );
            }

            return {
              posted,
              itemCount:
                details.items.length,
            };
          },
        );

    await this.publishAndAudit(
      INVENTORY_EVENTS
        .MATERIAL_ISSUE_POSTED,
      transactionResult.posted.id,
      {
        materialIssueId:
          transactionResult.posted.id,

        issueNumber:
          transactionResult
            .posted.issueNumber,

        propertyId:
          transactionResult
            .posted.propertyId,

        storeId:
          transactionResult
            .posted.storeId,

        reasonCode:
          transactionResult
            .posted.reasonCode,

        itemCount:
          transactionResult.itemCount,

        actorPersonId:
          dto.postedByPersonId,
      },
    );

    return this.getMaterialIssue(
      id,
    );
  }

  async cancelMaterialIssue(
    id: string,
    dto:
      CancelMaterialIssueDto,
  ) {
    const details =
      await this.getMaterialIssue(
        id,
      );

    if (
      details.materialIssue
        .status !==
      InventoryMaterialIssueStatus
        .DRAFT
    ) {
      throw new BadRequestException(
        `Only DRAFT Material Issues can be cancelled; current status is ${details.materialIssue.status}`,
      );
    }

    if (
      !dto.cancellationReason
        ?.trim()
    ) {
      throw new BadRequestException(
        'cancellationReason is required',
      );
    }

    const cancelledAt =
      new Date();

    const cancelled =
      await this
        .stockLedgerRepository
        .updateMaterialIssueStatus(
          id,
          {
            status:
              InventoryMaterialIssueStatus
                .CANCELLED,

            cancelledByPersonId:
              dto.cancelledByPersonId,

            cancelledAt,

            cancellationReason:
              dto.cancellationReason
                .trim(),

            updatedAt:
              cancelledAt,
          },
        );

    if (!cancelled) {
      throw new NotFoundException(
        `Inventory Material Issue not found: ${id}`,
      );
    }

    await this.publishAndAudit(
      INVENTORY_EVENTS
        .MATERIAL_ISSUE_CANCELLED,
      cancelled.id,
      {
        materialIssueId:
          cancelled.id,

        issueNumber:
          cancelled.issueNumber,

        propertyId:
          cancelled.propertyId,

        storeId:
          cancelled.storeId,

        cancellationReason:
          cancelled
            .cancellationReason,

        actorPersonId:
          dto.cancelledByPersonId,
      },
    );

    return this.getMaterialIssue(
      id,
    );
  }

  private issueNumber(
    date: Date,
    id: string,
  ) {
    return [
      'MI',
      date
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, ''),
      id
        .replace(/-/g, '')
        .slice(0, 10)
        .toUpperCase(),
    ].join('-');
  }

  private requireDate(
    value: string,
    field: string,
  ) {
    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      throw new BadRequestException(
        `${field} must be a valid date`,
      );
    }

    return date;
  }

  private requireMaterialIssueStatus(
    value: string,
  ) {
    const normalized =
      value
        .trim()
        .toUpperCase();

    const statuses =
      Object.values(
        InventoryMaterialIssueStatus,
      );

    if (
      !statuses.includes(
        normalized as
          InventoryMaterialIssueStatus,
      )
    ) {
      throw new BadRequestException(
        `Invalid Material Issue status: ${value}`,
      );
    }

    return normalized;
  }

  private optionalText(
    value?: string,
  ) {
    const normalized =
      value?.trim();

    return normalized ||
      undefined;
  }

  private async publishAndAudit(
    eventType: string,
    materialIssueId: string,
    payload:
      Record<string, unknown>,
  ) {
    const fullPayload = {
      entityType:
        'inventory.material_issue',

      entityId:
        materialIssueId,

      ...payload,
    };

    await this.eventBus.publish(
      eventType,
      'core.inventory',
      fullPayload,
    );

    await this.auditService.record(
      eventType,
      'core.inventory',
      fullPayload,
    );
  }
}
