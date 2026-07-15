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
  INVENTORY_BATCH_REPOSITORY,
  InventoryBatchRepository,
} from '../repositories/inventory-batch.repository';

import {
  INVENTORY_REPOSITORY,
  InventoryRepository,
} from '../repositories/inventory.repository';

import {
  InventoryBatch,
  InventoryBatchStatus,
} from '../types/inventory.types';

export interface ResolveInventoryBatchInput {
  itemId: string;
  batchNumber: string;

  manufacturerBatchNumber?: string;

  manufactureDate?: Date;
  expiryDate?: Date;

  sourceType?: string;
  sourceId?: string;
  sourceLineId?: string;

  remarks?: string;

  metadata?: Record<
    string,
    unknown
  >;

  createdByPersonId?: string;
}

@Injectable()
export class InventoryBatchService {
  constructor(
    @Inject(
      INVENTORY_BATCH_REPOSITORY,
    )
    private readonly batchRepository:
      InventoryBatchRepository,

    @Inject(
      INVENTORY_REPOSITORY,
    )
    private readonly inventoryRepository:
      InventoryRepository,
  ) {}

  async resolveOrCreate(
    input: ResolveInventoryBatchInput,
  ): Promise<InventoryBatch> {
    const item =
      await this.inventoryRepository
        .findItemById(
          input.itemId,
        );

    if (!item) {
      throw new NotFoundException(
        'Inventory item was not found',
      );
    }

    if (!item.isActive) {
      throw new BadRequestException(
        'Inventory Batch cannot be resolved for an inactive Inventory item',
      );
    }

    if (!item.isBatchTracked) {
      throw new BadRequestException(
        'Inventory Batch cannot be used for an item that is not batch tracked',
      );
    }

    const batchNumber =
      input.batchNumber
        ?.trim();

    if (!batchNumber) {
      throw new BadRequestException(
        'Inventory Batch number is required',
      );
    }

    const manufacturerBatchNumber =
      input.manufacturerBatchNumber
        ?.trim() ||
      undefined;

    const manufactureDate =
      this.normalizeDate(
        input.manufactureDate,
        'manufactureDate',
      );

    const expiryDate =
      this.normalizeDate(
        input.expiryDate,
        'expiryDate',
      );

    if (
      manufactureDate &&
      expiryDate &&
      expiryDate.getTime() <
        manufactureDate.getTime()
    ) {
      throw new BadRequestException(
        'Inventory Batch expiry date cannot be before manufacture date',
      );
    }

    if (
      expiryDate &&
      expiryDate.getTime() <
        this.startOfToday()
          .getTime()
    ) {
      throw new BadRequestException(
        'Inventory Batch expiry date cannot be in the past',
      );
    }

    const existing =
      await this.batchRepository
        .findByItemAndBatchNumber(
          item.id,
          batchNumber,
        );

    if (existing) {
      this.validateExistingBatch(
        existing,
        {
          manufacturerBatchNumber,
          manufactureDate,
          expiryDate,
        },
      );

      return existing;
    }

    const now =
      new Date();

    const created =
      await this.batchRepository
        .create({
          id:
            randomUUID(),

          itemId:
            item.id,

          batchNumber,

          manufacturerBatchNumber,

          manufactureDate,

          expiryDate,

          status:
            InventoryBatchStatus
              .ACTIVE,

          sourceType:
            input.sourceType
              ?.trim() ||
            undefined,

          sourceId:
            input.sourceId,

          sourceLineId:
            input.sourceLineId,

          remarks:
            input.remarks
              ?.trim() ||
            undefined,

          metadata:
            input.metadata ??
            {},

          createdByPersonId:
            input.createdByPersonId,

          createdAt:
            now,

          updatedAt:
            now,
        });

    this.validateExistingBatch(
      created,
      {
        manufacturerBatchNumber,
        manufactureDate,
        expiryDate,
      },
    );

    return created;
  }

  private validateExistingBatch(
    batch: InventoryBatch,

    expected: {
      manufacturerBatchNumber?:
        string;

      manufactureDate?: Date;
      expiryDate?: Date;
    },
  ): void {
    if (
      batch.status !==
      InventoryBatchStatus.ACTIVE
    ) {
      throw new BadRequestException(
        `Inventory Batch is not active: ${batch.status}`,
      );
    }

    if (
      batch.expiryDate &&
      batch.expiryDate.getTime() <
        this.startOfToday()
          .getTime()
    ) {
      throw new BadRequestException(
        'Inventory Batch has expired',
      );
    }

    this.validateOptionalStringMatch(
      'manufacturer Batch number',
      batch.manufacturerBatchNumber,
      expected.manufacturerBatchNumber,
    );

    this.validateOptionalDateMatch(
      'manufacture date',
      batch.manufactureDate,
      expected.manufactureDate,
    );

    this.validateOptionalDateMatch(
      'expiry date',
      batch.expiryDate,
      expected.expiryDate,
    );
  }

  private validateOptionalStringMatch(
    fieldName: string,
    current?: string,
    requested?: string,
  ): void {
    if (
      current &&
      requested &&
      current !== requested
    ) {
      throw new BadRequestException(
        `Inventory Batch ${fieldName} conflicts with the existing Batch`,
      );
    }
  }

  private validateOptionalDateMatch(
    fieldName: string,
    current?: Date,
    requested?: Date,
  ): void {
    if (
      current &&
      requested &&
      this.dateKey(current) !==
        this.dateKey(requested)
    ) {
      throw new BadRequestException(
        `Inventory Batch ${fieldName} conflicts with the existing Batch`,
      );
    }
  }

  private normalizeDate(
    value: Date | undefined,
    fieldName: string,
  ): Date | undefined {
    if (!value) {
      return undefined;
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      throw new BadRequestException(
        `Invalid Inventory Batch ${fieldName}`,
      );
    }

    return date;
  }

  private startOfToday(): Date {
    const now =
      new Date();

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
  }

  private dateKey(
    date: Date,
  ): string {
    return date
      .toISOString()
      .slice(
        0,
        10,
      );
  }
}
