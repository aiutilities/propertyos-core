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
  CancelMaterialReturnDto,
  CreateMaterialReturnDto,
  PostMaterialReturnDto,
} from '../dto';

import {
  INVENTORY_EVENTS,
} from '../inventory.constants';

import {
  INVENTORY_STOCK_LEDGER_REPOSITORY,
  InventoryStockLedgerRepository,
} from '../repositories/inventory-stock-ledger.repository';

import {
  InventoryMaterialIssueStatus,
  InventoryMaterialReturn,
  InventoryMaterialReturnItem,
  InventoryMaterialReturnStatus,
  InventoryStockMovementType,
} from '../types/inventory.types';

import {
  InventoryService,
} from './inventory.service';

@Injectable()
export class InventoryMaterialReturnService {
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

  async createMaterialReturn(
    dto:
      CreateMaterialReturnDto,
  ) {
    if (!dto.items?.length) {
      throw new BadRequestException(
        'At least one Material Return item is required',
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

    const returnDate =
      this.requireDate(
        dto.returnDate,
        'returnDate',
      );

    const originalIssue =
      dto.materialIssueId
        ? await this
            .stockLedgerRepository
            .findMaterialIssueById(
              dto.materialIssueId,
            )
        : undefined;

    if (
      dto.materialIssueId &&
      !originalIssue
    ) {
      throw new NotFoundException(
        `Inventory Material Issue not found: ${dto.materialIssueId}`,
      );
    }

    if (originalIssue) {
      if (
        originalIssue.materialIssue
          .status !==
        InventoryMaterialIssueStatus
          .POSTED
      ) {
        throw new BadRequestException(
          'Returns can only reference a POSTED Material Issue',
        );
      }

      if (
        originalIssue.materialIssue
          .propertyId !==
        dto.propertyId
      ) {
        throw new BadRequestException(
          'The original Material Issue belongs to another property',
        );
      }

      if (
        originalIssue.materialIssue
          .storeId !==
        dto.storeId
      ) {
        throw new BadRequestException(
          'The original Material Issue belongs to another store',
        );
      }
    }

    const now =
      new Date();

    const materialReturnId =
      randomUUID();

    const duplicateKeys =
      new Set<string>();

    const items:
      InventoryMaterialReturnItem[] =
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
          'Each Material Return quantity must be greater than zero',
        );
      }

      if (
        !Number.isFinite(
          unitCost,
        ) ||
        unitCost < 0
      ) {
        throw new BadRequestException(
          'Each Material Return unitCost must be zero or greater',
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
          'Duplicate Material Return item and bin combination',
        );
      }

      duplicateKeys.add(
        duplicateKey,
      );

      if (originalIssue) {
        const originalLine =
          originalIssue.items.find(
            (line) =>
              line.itemId ===
                dtoItem.itemId &&
              (
                line.binLocationId ??
                undefined
              ) ===
                (
                  dtoItem.binLocationId ??
                  undefined
                ),
          );

        if (!originalLine) {
          throw new BadRequestException(
            'The returned item and bin were not present on the original Material Issue',
          );
        }

        const alreadyReturned =
          await this
            .stockLedgerRepository
            .getPostedMaterialReturnQuantity(
              originalIssue
                .materialIssue.id,

              dtoItem.itemId,

              dtoItem.binLocationId,
            );

        if (
          alreadyReturned +
            quantity >
          originalLine.quantity
        ) {
          throw new BadRequestException(
            'Material Return quantity exceeds the remaining issued quantity',
          );
        }
      }

      items.push({
        id:
          randomUUID(),

        materialReturnId,

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

    const materialReturn:
      InventoryMaterialReturn = {
        id:
          materialReturnId,

        returnNumber:
          this.returnNumber(
            now,
            materialReturnId,
          ),

        propertyId:
          dto.propertyId,

        storeId:
          dto.storeId,

        materialIssueId:
          dto.materialIssueId,

        status:
          InventoryMaterialReturnStatus
            .DRAFT,

        returnDate,

        reasonCode:
          dto.reasonCode
            .trim()
            .toUpperCase(),

        reasonDescription:
          this.optionalText(
            dto.reasonDescription,
          ),

        returnedByPersonId:
          dto.returnedByPersonId,

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
        .createMaterialReturn(
          materialReturn,
          items,
        );

    await this.publishAndAudit(
      INVENTORY_EVENTS
        .MATERIAL_RETURN_CREATED,
      created.materialReturn.id,
      {
        materialReturnId:
          created.materialReturn.id,

        returnNumber:
          created.materialReturn
            .returnNumber,

        materialIssueId:
          created.materialReturn
            .materialIssueId,

        propertyId:
          created.materialReturn
            .propertyId,

        storeId:
          created.materialReturn
            .storeId,

        reasonCode:
          created.materialReturn
            .reasonCode,

        itemCount:
          created.items.length,

        actorPersonId:
          dto.createdByPersonId,
      },
    );

    return created;
  }

  async getMaterialReturn(
    id: string,
  ) {
    const materialReturn =
      await this
        .stockLedgerRepository
        .findMaterialReturnById(
          id,
        );

    if (!materialReturn) {
      throw new NotFoundException(
        `Inventory Material Return not found: ${id}`,
      );
    }

    return materialReturn;
  }

  listMaterialReturns(
    filters: {
      propertyId?: string;
      storeId?: string;
      materialIssueId?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {},
  ) {
    const status =
      filters.status
        ? this.requireMaterialReturnStatus(
            filters.status,
          )
        : undefined;

    return this
      .stockLedgerRepository
      .listMaterialReturns({
        propertyId:
          filters.propertyId,

        storeId:
          filters.storeId,

        materialIssueId:
          filters.materialIssueId,

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

  async postMaterialReturn(
    id: string,
    dto:
      PostMaterialReturnDto,
  ) {
    const details =
      await this.getMaterialReturn(
        id,
      );

    if (
      details.materialReturn
        .status !==
      InventoryMaterialReturnStatus
        .DRAFT
    ) {
      throw new BadRequestException(
        `Only DRAFT Material Returns can be posted; current status is ${details.materialReturn.status}`,
      );
    }

    if (!details.items.length) {
      throw new BadRequestException(
        'Material Return has no items',
      );
    }

    await this
      .validateLinkedReturnQuantities(
        details.materialReturn,
        details.items,
      );

    for (
      const item
      of details.items
    ) {
      await this
        .stockLedgerRepository
        .postMovement({
          movementType:
            InventoryStockMovementType
              .RECEIPT,

          itemId:
            item.itemId,

          storeId:
            details.materialReturn
              .storeId,

          binLocationId:
            item.binLocationId,

          quantityDelta:
            Math.abs(
              item.quantity,
            ),

          unitCost:
            item.unitCost,

          sourceType:
            'inventory.material_return',

          sourceId:
            details.materialReturn.id,

          sourceLineId:
            item.id,

          referenceNumber:
            details.materialReturn
              .returnNumber,

          idempotencyKey:
            [
              'inventory-material-return',
              details.materialReturn.id,
              item.id,
            ].join(':'),

          correlationId:
            details.materialReturn
              .materialIssueId ??
            details.materialReturn.id,

          movementDate:
            details.materialReturn
              .returnDate,

          postedByPersonId:
            dto.postedByPersonId,

          remarks:
            item.remarks ??
            details.materialReturn
              .remarks,

          metadata: {
            materialReturnId:
              details.materialReturn.id,

            returnNumber:
              details.materialReturn
                .returnNumber,

            materialIssueId:
              details.materialReturn
                .materialIssueId,

            propertyId:
              details.materialReturn
                .propertyId,

            storeId:
              details.materialReturn
                .storeId,

            reasonCode:
              details.materialReturn
                .reasonCode,

            reasonDescription:
              details.materialReturn
                .reasonDescription,

            materialReturnItemId:
              item.id,

            returnedByPersonId:
              details.materialReturn
                .returnedByPersonId,
          },
        });
    }

    const postedAt =
      new Date();

    const posted =
      await this
        .stockLedgerRepository
        .updateMaterialReturnStatus(
          id,
          {
            status:
              InventoryMaterialReturnStatus
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
        `Inventory Material Return not found: ${id}`,
      );
    }

    await this.publishAndAudit(
      INVENTORY_EVENTS
        .MATERIAL_RETURN_POSTED,
      posted.id,
      {
        materialReturnId:
          posted.id,

        returnNumber:
          posted.returnNumber,

        materialIssueId:
          posted.materialIssueId,

        propertyId:
          posted.propertyId,

        storeId:
          posted.storeId,

        reasonCode:
          posted.reasonCode,

        itemCount:
          details.items.length,

        actorPersonId:
          dto.postedByPersonId,
      },
    );

    return this.getMaterialReturn(
      id,
    );
  }

  async cancelMaterialReturn(
    id: string,
    dto:
      CancelMaterialReturnDto,
  ) {
    const details =
      await this.getMaterialReturn(
        id,
      );

    if (
      details.materialReturn
        .status !==
      InventoryMaterialReturnStatus
        .DRAFT
    ) {
      throw new BadRequestException(
        `Only DRAFT Material Returns can be cancelled; current status is ${details.materialReturn.status}`,
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
        .updateMaterialReturnStatus(
          id,
          {
            status:
              InventoryMaterialReturnStatus
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
        `Inventory Material Return not found: ${id}`,
      );
    }

    await this.publishAndAudit(
      INVENTORY_EVENTS
        .MATERIAL_RETURN_CANCELLED,
      cancelled.id,
      {
        materialReturnId:
          cancelled.id,

        returnNumber:
          cancelled.returnNumber,

        materialIssueId:
          cancelled.materialIssueId,

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

    return this.getMaterialReturn(
      id,
    );
  }

  private async validateLinkedReturnQuantities(
    materialReturn:
      InventoryMaterialReturn,

    items:
      InventoryMaterialReturnItem[],
  ) {
    if (
      !materialReturn
        .materialIssueId
    ) {
      return;
    }

    const originalIssue =
      await this
        .stockLedgerRepository
        .findMaterialIssueById(
          materialReturn
            .materialIssueId,
        );

    if (!originalIssue) {
      throw new NotFoundException(
        `Inventory Material Issue not found: ${materialReturn.materialIssueId}`,
      );
    }

    if (
      originalIssue.materialIssue
        .status !==
      InventoryMaterialIssueStatus
        .POSTED
    ) {
      throw new BadRequestException(
        'Returns can only reference a POSTED Material Issue',
      );
    }

    if (
      originalIssue.materialIssue
        .propertyId !==
      materialReturn.propertyId
    ) {
      throw new BadRequestException(
        'The original Material Issue belongs to another property',
      );
    }

    if (
      originalIssue.materialIssue
        .storeId !==
      materialReturn.storeId
    ) {
      throw new BadRequestException(
        'The original Material Issue belongs to another store',
      );
    }

    for (const item of items) {
      const originalLine =
        originalIssue.items.find(
          (line) =>
            line.itemId ===
              item.itemId &&
            (
              line.binLocationId ??
              undefined
            ) ===
              (
                item.binLocationId ??
                undefined
              ),
        );

      if (!originalLine) {
        throw new BadRequestException(
          'The returned item and bin were not present on the original Material Issue',
        );
      }

      const alreadyReturned =
        await this
          .stockLedgerRepository
          .getPostedMaterialReturnQuantity(
            originalIssue
              .materialIssue.id,

            item.itemId,

            item.binLocationId,
          );

      if (
        alreadyReturned +
          item.quantity >
        originalLine.quantity
      ) {
        throw new BadRequestException(
          'Material Return quantity exceeds the remaining issued quantity',
        );
      }
    }
  }

  private returnNumber(
    date: Date,
    id: string,
  ) {
    return [
      'MR',
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

  private requireMaterialReturnStatus(
    value: string,
  ) {
    const normalized =
      value
        .trim()
        .toUpperCase();

    const statuses =
      Object.values(
        InventoryMaterialReturnStatus,
      );

    if (
      !statuses.includes(
        normalized as
          InventoryMaterialReturnStatus,
      )
    ) {
      throw new BadRequestException(
        `Invalid Material Return status: ${value}`,
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
    materialReturnId: string,
    payload:
      Record<string, unknown>,
  ) {
    const fullPayload = {
      entityType:
        'inventory.material_return',

      entityId:
        materialReturnId,

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
