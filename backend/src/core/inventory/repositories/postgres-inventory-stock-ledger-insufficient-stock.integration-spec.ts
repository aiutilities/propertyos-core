import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  BadRequestException,
} from '@nestjs/common';

import {
  PostgresInventoryStockLedgerRepository,
} from './postgres-inventory-stock-ledger.repository';

import {
  InventoryStockMovementType,
} from '../types/inventory.types';

describe(
  'PostgresInventoryStockLedgerRepository insufficient-stock FAT contract',
  () => {
    let client:
      any;

    let pool:
      any;

    let repository:
      PostgresInventoryStockLedgerRepository;

    let runtime:
      any;

    const item = {
      id:
        'item-1',
      isActive:
        true,
      isBatchTracked:
        false,
    };

    const batchTrackedItem = {
      ...item,
      isBatchTracked:
        true,
    };

    const store = {
      id:
        'store-1',
      isActive:
        true,
    };

    const batch = {
      id:
        'batch-1',
      itemId:
        item.id,
      status:
        'active',
    };

    const balance = (
      quantityOnHand: number,
      reservedQuantity: number,
    ) => ({
      id:
        'balance-1',
      itemId:
        item.id,
      storeId:
        store.id,
      quantityOnHand,
      reservedQuantity,
      averageUnitCost:
        100,
      createdAt:
        new Date(),
      updatedAt:
        new Date(),
    });

    const batchBalance = (
      quantityOnHand: number,
      reservedQuantity: number,
    ) => ({
      id:
        'batch-balance-1',
      batchId:
        batch.id,
      itemId:
        item.id,
      storeId:
        store.id,
      quantityOnHand,
      reservedQuantity,
      averageUnitCost:
        100,
      createdAt:
        new Date(),
      updatedAt:
        new Date(),
    });

    const movement = (
      overrides: Record<
        string,
        unknown
      > = {},
    ) => ({
      movementType:
        InventoryStockMovementType.ISSUE,
      itemId:
        item.id,
      storeId:
        store.id,
      quantityDelta:
        -1,
      sourceType:
        'fat.insufficient_stock',
      sourceId:
        'fat-source-1',
      postedByPersonId:
        'founder-person-1',
      ...overrides,
    });

    async function expectRejected(
      input:
        Record<string, unknown>,
      message:
        string,
    ) {
      await expect(
        runtime.postMovementWithClient(
          client,
          input,
        ),
      ).rejects.toEqual(
        expect.objectContaining({
          message,
        }),
      );

      expect(
        runtime.updateBalance,
      ).not.toHaveBeenCalled();

      expect(
        runtime.updateBatchBalance,
      ).not.toHaveBeenCalled();

      expect(
        runtime.insertLedgerEntry,
      ).not.toHaveBeenCalled();
    }

    beforeEach(() => {
      client = {
        query:
          jest.fn(),
        release:
          jest.fn(),
      };

      pool = {
        connect:
          jest.fn(
            async () =>
              client,
          ),
      };

      repository =
        new PostgresInventoryStockLedgerRepository(
          pool as any,
        );

      runtime =
        repository as any;

      runtime.requireActiveItem =
        jest.fn(
          async () =>
            item,
        );

      runtime.requireActiveStore =
        jest.fn(
          async () =>
            store,
        );

      runtime.requireActiveBin =
        jest.fn();

      runtime.requireActiveBatch =
        jest.fn(
          async () =>
            batch,
        );

      runtime.lockOrCreateBalance =
        jest.fn(
          async () =>
            balance(
              10,
              0,
            ),
        );

      runtime.lockOrCreateBatchBalance =
        jest.fn(
          async () =>
            batchBalance(
              10,
              0,
            ),
        );

      runtime.updateBalance =
        jest.fn();

      runtime.updateBatchBalance =
        jest.fn();

      runtime.insertLedgerEntry =
        jest.fn();
    });

    it(
      'rejects a movement that would create negative stock',
      async () => {
        runtime.lockOrCreateBalance
          .mockResolvedValue(
            balance(
              5,
              0,
            ),
          );

        await expectRejected(
          movement({
            quantityDelta:
              -6,
          }),
          'Inventory movement would create negative stock',
        );
      },
    );

    it(
      'rejects a movement that would create a negative reservation',
      async () => {
        runtime.lockOrCreateBalance
          .mockResolvedValue(
            balance(
              10,
              2,
            ),
          );

        await expectRejected(
          movement({
            movementType:
              InventoryStockMovementType
                .RESERVATION_RELEASE,
            quantityDelta:
              0,
            reservedQuantityDelta:
              -3,
          }),
          'Inventory movement would create a negative reservation',
        );
      },
    );

    it(
      'rejects reserved quantity above quantity on hand',
      async () => {
        runtime.lockOrCreateBalance
          .mockResolvedValue(
            balance(
              5,
              4,
            ),
          );

        await expectRejected(
          movement({
            movementType:
              InventoryStockMovementType
                .RESERVATION,
            quantityDelta:
              0,
            reservedQuantityDelta:
              2,
          }),
          'Reserved quantity cannot exceed quantity on hand',
        );
      },
    );

    it(
      'rejects a Batch movement that would create negative Batch stock',
      async () => {
        runtime.requireActiveItem
          .mockResolvedValue(
            batchTrackedItem,
          );

        runtime.lockOrCreateBalance
          .mockResolvedValue(
            balance(
              100,
              0,
            ),
          );

        runtime
          .lockOrCreateBatchBalance
          .mockResolvedValue(
            batchBalance(
              2,
              0,
            ),
          );

        await expectRejected(
          movement({
            batchId:
              batch.id,
            quantityDelta:
              -3,
          }),
          'Inventory movement would create negative Batch stock',
        );
      },
    );

    it(
      'rejects a Batch movement that would create a negative Batch reservation',
      async () => {
        runtime.requireActiveItem
          .mockResolvedValue(
            batchTrackedItem,
          );

        runtime.lockOrCreateBalance
          .mockResolvedValue(
            balance(
              100,
              10,
            ),
          );

        runtime
          .lockOrCreateBatchBalance
          .mockResolvedValue(
            batchBalance(
              5,
              1,
            ),
          );

        await expectRejected(
          movement({
            movementType:
              InventoryStockMovementType
                .RESERVATION_RELEASE,
            batchId:
              batch.id,
            quantityDelta:
              0,
            reservedQuantityDelta:
              -2,
          }),
          'Inventory movement would create a negative Batch reservation',
        );
      },
    );

    it(
      'rejects Batch reserved quantity above Batch quantity on hand',
      async () => {
        runtime.requireActiveItem
          .mockResolvedValue(
            batchTrackedItem,
          );

        runtime.lockOrCreateBalance
          .mockResolvedValue(
            balance(
              100,
              0,
            ),
          );

        runtime
          .lockOrCreateBatchBalance
          .mockResolvedValue(
            batchBalance(
              2,
              0,
            ),
          );

        await expectRejected(
          movement({
            movementType:
              InventoryStockMovementType
                .RESERVATION,
            batchId:
              batch.id,
            quantityDelta:
              0,
            reservedQuantityDelta:
              3,
          }),
          'Batch reserved quantity cannot exceed Batch quantity on hand',
        );
      },
    );

    it(
      'rolls back the public transaction after insufficient-stock rejection',
      async () => {
        runtime.lockOrCreateBalance
          .mockResolvedValue(
            balance(
              1,
              0,
            ),
          );

        await expect(
          repository.postMovement(
            movement({
              quantityDelta:
                -2,
            }) as any,
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          client.query,
        ).toHaveBeenNthCalledWith(
          1,
          'BEGIN',
        );

        expect(
          client.query,
        ).toHaveBeenNthCalledWith(
          2,
          'ROLLBACK',
        );

        expect(
          client.query,
        ).not.toHaveBeenCalledWith(
          'COMMIT',
        );

        expect(
          client.release,
        ).toHaveBeenCalledTimes(1);

        expect(
          runtime.updateBalance,
        ).not.toHaveBeenCalled();

        expect(
          runtime.insertLedgerEntry,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
