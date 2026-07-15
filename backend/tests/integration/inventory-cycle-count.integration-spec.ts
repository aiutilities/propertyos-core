import {
  BadRequestException,
} from '@nestjs/common';

import {
  InventoryCycleCountService,
} from '../../src/core/inventory/services/inventory-cycle-count.service';

import {
  InventoryCycleCountScopeType,
  InventoryCycleCountStatus,
  InventoryStockMovementType,
} from '../../src/core/inventory/types/inventory.types';

describe(
  'Inventory Cycle Count workflow',
  () => {
    const propertyId =
      '11111111-1111-4111-8111-111111111111';

    const storeId =
      '22222222-2222-4222-8222-222222222222';

    const binLocationId =
      '33333333-3333-4333-8333-333333333333';

    const itemOneId =
      '44444444-4444-4444-8444-444444444444';

    const itemTwoId =
      '55555555-5555-4555-8555-555555555555';

    const actorId =
      '66666666-6666-4666-8666-666666666666';

    let cycleCountDetails:
      any;

    let stockLedgerRepository:
      any;

    let inventoryService:
      any;

    let eventBus:
      any;

    let auditService:
      any;

    let service:
      InventoryCycleCountService;

    beforeEach(
      () => {
        cycleCountDetails =
          undefined;

        inventoryService = {
          getStore:
            jest.fn(
              async (
                id: string,
              ) => ({
                id,
                propertyId,
                isActive:
                  true,
              }),
            ),

          getItem:
            jest.fn(
              async (
                id: string,
              ) => ({
                id,
                isActive:
                  true,
              }),
            ),

          getBinLocation:
            jest.fn(
              async (
                id: string,
              ) => ({
                id,
                storeId,
                isActive:
                  true,
              }),
            ),

          listStockBalances:
            jest.fn(
              async (
                filters:
                  any,
              ) => {
                const balances = [
                  {
                    id:
                      'balance-1',

                    itemId:
                      itemOneId,

                    storeId,

                    binLocationId,

                    quantityOnHand:
                      10,

                    reservedQuantity:
                      2,

                    availableQuantity:
                      8,

                    averageUnitCost:
                      25,
                  },

                  {
                    id:
                      'balance-2',

                    itemId:
                      itemTwoId,

                    storeId,

                    quantityOnHand:
                      5,

                    reservedQuantity:
                      0,

                    availableQuantity:
                      5,

                    averageUnitCost:
                      40,
                  },
                ];

                return balances.filter(
                  (
                    balance,
                  ) =>
                    (
                      !filters
                        ?.itemId ||
                      balance
                        .itemId ===
                        filters
                          .itemId
                    ) &&
                    (
                      !filters
                        ?.binLocationId ||
                      balance
                        .binLocationId ===
                        filters
                          .binLocationId
                    ),
                );
              },
            ),
        };

        stockLedgerRepository = {
          createCycleCount:
            jest.fn(
              async (
                cycleCount:
                  any,

                items:
                  any[],
              ) => {
                cycleCountDetails = {
                  cycleCount: {
                    ...cycleCount,
                  },

                  items:
                    items.map(
                      (
                        item,
                      ) => ({
                        ...item,
                      }),
                    ),
                };

                return cycleCountDetails;
              },
            ),

          findCycleCountById:
            jest.fn(
              async () =>
                cycleCountDetails,
            ),

          listCycleCounts:
            jest.fn(
              async () =>
                cycleCountDetails
                  ? [
                      {
                        ...cycleCountDetails
                          .cycleCount,
                      },
                    ]
                  : [],
            ),

          updateCycleCountStatus:
            jest.fn(
              async (
                cycleCountId:
                  string,

                input:
                  any,
              ) => {
                if (
                  !cycleCountDetails ||
                  cycleCountDetails
                    .cycleCount
                    .id !==
                    cycleCountId
                ) {
                  return null;
                }

                for (
                  const [
                    key,
                    value,
                  ]
                  of Object.entries(
                    input,
                  )
                ) {
                  if (
                    value !==
                    undefined
                  ) {
                    cycleCountDetails
                      .cycleCount[
                        key
                      ] =
                      value;
                  }
                }

                return {
                  ...cycleCountDetails
                    .cycleCount,
                };
              },
            ),

          updateCycleCountItem:
            jest.fn(
              async (
                cycleCountItemId:
                  string,

                input:
                  any,
              ) => {
                const item =
                  cycleCountDetails
                    ?.items
                    .find(
                      (
                        candidate:
                          any,
                      ) =>
                        candidate.id ===
                        cycleCountItemId,
                    );

                if (!item) {
                  return null;
                }

                Object.assign(
                  item,
                  input,
                );

                return {
                  ...item,
                };
              },
            ),

          postMovement:
            jest.fn(
              async (
                input:
                  any,
              ) => ({
                entry: {
                  id:
                    `ledger-${stockLedgerRepository.postMovement.mock.calls.length}`,

                  movementType:
                    input
                      .movementType,

                  quantityDelta:
                    input
                      .quantityDelta,

                  idempotencyKey:
                    input
                      .idempotencyKey,
                },

                balance: {
                  itemId:
                    input.itemId,

                  storeId:
                    input.storeId,
                },

                idempotentReplay:
                  false,
              }),
            ),
        };

        eventBus = {
          publish:
            jest.fn(
              async () =>
                undefined,
            ),
        };

        auditService = {
          record:
            jest.fn(
              async () =>
                undefined,
            ),
        };

        service =
          new InventoryCycleCountService(
            stockLedgerRepository,
            inventoryService,
            eventBus,
            auditService,
          );
      },
    );

    const createStoreCount =
      async () => {
        return service
          .createCycleCount({
            propertyId,

            storeId,

            countDate:
              '2026-07-15',

            blindCount:
              true,

            freezeStock:
              false,

            scopeType:
              InventoryCycleCountScopeType
                .STORE,

            createdByPersonId:
              actorId,

            notes:
              'Cycle Count test',
          });
      };

    const startCount =
      async () => {
        const created =
          await createStoreCount();

        return service
          .startCycleCount(
            created.cycleCount.id,
            {
              startedByPersonId:
                actorId,
            },
          );
      };

    it(
      'creates a DRAFT Cycle Count from current stock balances',
      async () => {
        const created =
          await createStoreCount();

        expect(
          created.cycleCount
            .status,
        ).toBe(
          InventoryCycleCountStatus
            .DRAFT,
        );

        expect(
          created.cycleCount
            .scopeType,
        ).toBe(
          InventoryCycleCountScopeType
            .STORE,
        );

        expect(
          created.items,
        ).toHaveLength(2);

        expect(
          created.items[0],
        ).toEqual(
          expect.objectContaining({
            itemId:
              itemOneId,

            systemQuantity:
              10,

            averageUnitCost:
              25,
          }),
        );

        expect(
          created.items[0],
        ).not.toHaveProperty(
          'countedQuantity',
        );

        expect(
          stockLedgerRepository
            .postMovement,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'creates a BIN scoped Cycle Count',
      async () => {
        const created =
          await service
            .createCycleCount({
              propertyId,

              storeId,

              countDate:
                '2026-07-15',

              scopeType:
                InventoryCycleCountScopeType
                  .BIN,

              binLocationId,

              createdByPersonId:
                actorId,
            });

        expect(
          inventoryService
            .getBinLocation,
        ).toHaveBeenCalledWith(
          binLocationId,
        );

        expect(
          created.items,
        ).toHaveLength(1);

        expect(
          created.items[0]
            .binLocationId,
        ).toBe(
          binLocationId,
        );
      },
    );

    it(
      'rejects BIN scope without a bin',
      async () => {
        await expect(
          service
            .createCycleCount({
              propertyId,

              storeId,

              countDate:
                '2026-07-15',

              scopeType:
                InventoryCycleCountScopeType
                  .BIN,

              createdByPersonId:
                actorId,
            }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );

    it(
      'starts a DRAFT Cycle Count',
      async () => {
        const started =
          await startCount();

        expect(
          started.cycleCount
            .status,
        ).toBe(
          InventoryCycleCountStatus
            .IN_PROGRESS,
        );

        expect(
          started.cycleCount
            .startedByPersonId,
        ).toBe(
          actorId,
        );

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          'inventory.cycle_count.started',
          'core.inventory',
          expect.objectContaining({
            actorPersonId:
              actorId,
          }),
        );
      },
    );

    it(
      'prevents starting the same Cycle Count twice',
      async () => {
        const started =
          await startCount();

        await expect(
          service
            .startCycleCount(
              started
                .cycleCount.id,
              {
                startedByPersonId:
                  actorId,
              },
            ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );

    it(
      'records counted quantities and calculates variances',
      async () => {
        const started =
          await startCount();

        const firstItem =
          started.items[0];

        const recorded =
          await service
            .recordCount(
              started
                .cycleCount.id,
              {
                countedByPersonId:
                  actorId,

                items: [
                  {
                    cycleCountItemId:
                      firstItem.id,

                    countedQuantity:
                      12,

                    remarks:
                      'Two extra units',
                  },
                ],
              },
            );

        expect(
          recorded.items[0],
        ).toEqual(
          expect.objectContaining({
            countedQuantity:
              12,

            varianceQuantity:
              2,

            varianceValue:
              50,

            countedByPersonId:
              actorId,
          }),
        );
      },
    );

    it(
      'records negative variance without posting stock yet',
      async () => {
        const started =
          await startCount();

        const secondItem =
          started.items[1];

        const recorded =
          await service
            .recordCount(
              started
                .cycleCount.id,
              {
                countedByPersonId:
                  actorId,

                items: [
                  {
                    cycleCountItemId:
                      secondItem.id,

                    countedQuantity:
                      3,
                  },
                ],
              },
            );

        expect(
          recorded.items[1]
            .varianceQuantity,
        ).toBe(-2);

        expect(
          recorded.items[1]
            .varianceValue,
        ).toBe(-80);

        expect(
          stockLedgerRepository
            .postMovement,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects completion while items remain uncounted',
      async () => {
        const started =
          await startCount();

        await service
          .recordCount(
            started.cycleCount.id,
            {
              countedByPersonId:
                actorId,

              items: [
                {
                  cycleCountItemId:
                    started.items[0]
                      .id,

                  countedQuantity:
                    10,
                },
              ],
            },
          );

        await expect(
          service
            .completeCycleCount(
              started
                .cycleCount.id,
              {
                completedByPersonId:
                  actorId,
              },
            ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );

    it(
      'completes after every item is counted',
      async () => {
        const started =
          await startCount();

        await service
          .recordCount(
            started.cycleCount.id,
            {
              countedByPersonId:
                actorId,

              items:
                started.items.map(
                  (
                    item:
                      any,
                  ) => ({
                    cycleCountItemId:
                      item.id,

                    countedQuantity:
                      item.systemQuantity,
                  }),
                ),
            },
          );

        const completed =
          await service
            .completeCycleCount(
              started
                .cycleCount.id,
              {
                completedByPersonId:
                  actorId,
              },
            );

        expect(
          completed.cycleCount
            .status,
        ).toBe(
          InventoryCycleCountStatus
            .COMPLETED,
        );

        expect(
          completed.cycleCount
            .completedByPersonId,
        ).toBe(
          actorId,
        );
      },
    );

    it(
      'posts positive and negative variances through the immutable ledger',
      async () => {
        const started =
          await startCount();

        await service
          .recordCount(
            started.cycleCount.id,
            {
              countedByPersonId:
                actorId,

              items: [
                {
                  cycleCountItemId:
                    started.items[0]
                      .id,

                  countedQuantity:
                    12,
                },

                {
                  cycleCountItemId:
                    started.items[1]
                      .id,

                  countedQuantity:
                    3,
                },
              ],
            },
          );

        await service
          .completeCycleCount(
            started.cycleCount.id,
            {
              completedByPersonId:
                actorId,
            },
          );

        const posted =
          await service
            .postCycleCount(
              started
                .cycleCount.id,
              {
                postedByPersonId:
                  actorId,
              },
            );

        expect(
          stockLedgerRepository
            .postMovement,
        ).toHaveBeenCalledTimes(
          2,
        );

        expect(
          stockLedgerRepository
            .postMovement,
        ).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({
            movementType:
              InventoryStockMovementType
                .ADJUSTMENT_IN,

            itemId:
              itemOneId,

            quantityDelta:
              2,

            unitCost:
              25,
          }),
        );

        expect(
          stockLedgerRepository
            .postMovement,
        ).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({
            movementType:
              InventoryStockMovementType
                .ADJUSTMENT_OUT,

            itemId:
              itemTwoId,

            quantityDelta:
              -2,

            unitCost:
              40,
          }),
        );

        expect(
          posted.cycleCount
            .status,
        ).toBe(
          InventoryCycleCountStatus
            .POSTED,
        );
      },
    );

    it(
      'does not post a ledger movement for zero variance',
      async () => {
        const started =
          await startCount();

        await service
          .recordCount(
            started.cycleCount.id,
            {
              countedByPersonId:
                actorId,

              items:
                started.items.map(
                  (
                    item:
                      any,
                  ) => ({
                    cycleCountItemId:
                      item.id,

                    countedQuantity:
                      item.systemQuantity,
                  }),
                ),
            },
          );

        await service
          .completeCycleCount(
            started.cycleCount.id,
            {
              completedByPersonId:
                actorId,
            },
          );

        await service
          .postCycleCount(
            started.cycleCount.id,
            {
              postedByPersonId:
                actorId,
            },
          );

        expect(
          stockLedgerRepository
            .postMovement,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'prevents posting the same Cycle Count twice',
      async () => {
        const started =
          await startCount();

        await service
          .recordCount(
            started.cycleCount.id,
            {
              countedByPersonId:
                actorId,

              items:
                started.items.map(
                  (
                    item:
                      any,
                  ) => ({
                    cycleCountItemId:
                      item.id,

                    countedQuantity:
                      item.systemQuantity,
                  }),
                ),
            },
          );

        await service
          .completeCycleCount(
            started.cycleCount.id,
            {
              completedByPersonId:
                actorId,
            },
          );

        await service
          .postCycleCount(
            started.cycleCount.id,
            {
              postedByPersonId:
                actorId,
            },
          );

        await expect(
          service
            .postCycleCount(
              started
                .cycleCount.id,
              {
                postedByPersonId:
                  actorId,
              },
            ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );

    it(
      'uses deterministic idempotency keys for variance postings',
      async () => {
        const started =
          await startCount();

        await service
          .recordCount(
            started.cycleCount.id,
            {
              countedByPersonId:
                actorId,

              items: [
                {
                  cycleCountItemId:
                    started.items[0]
                      .id,

                  countedQuantity:
                    11,
                },

                {
                  cycleCountItemId:
                    started.items[1]
                      .id,

                  countedQuantity:
                    5,
                },
              ],
            },
          );

        await service
          .completeCycleCount(
            started.cycleCount.id,
            {
              completedByPersonId:
                actorId,
            },
          );

        await service
          .postCycleCount(
            started.cycleCount.id,
            {
              postedByPersonId:
                actorId,
            },
          );

        expect(
          stockLedgerRepository
            .postMovement,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            idempotencyKey: [
              'inventory-cycle-count',
              started.cycleCount
                .id,
              started.items[0]
                .id,
            ].join(':'),
          }),
        );
      },
    );

    it(
      'cancels a DRAFT Cycle Count without posting stock',
      async () => {
        const created =
          await createStoreCount();

        const cancelled =
          await service
            .cancelCycleCount(
              created
                .cycleCount.id,
              {
                cancelledByPersonId:
                  actorId,

                cancellationReason:
                  'Count no longer required',
              },
            );

        expect(
          cancelled.cycleCount
            .status,
        ).toBe(
          InventoryCycleCountStatus
            .CANCELLED,
        );

        expect(
          cancelled.cycleCount
            .cancellationReason,
        ).toBe(
          'Count no longer required',
        );

        expect(
          stockLedgerRepository
            .postMovement,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'prevents cancellation after posting',
      async () => {
        const started =
          await startCount();

        await service
          .recordCount(
            started.cycleCount.id,
            {
              countedByPersonId:
                actorId,

              items:
                started.items.map(
                  (
                    item:
                      any,
                  ) => ({
                    cycleCountItemId:
                      item.id,

                    countedQuantity:
                      item.systemQuantity,
                  }),
                ),
            },
          );

        await service
          .completeCycleCount(
            started.cycleCount.id,
            {
              completedByPersonId:
                actorId,
            },
          );

        await service
          .postCycleCount(
            started.cycleCount.id,
            {
              postedByPersonId:
                actorId,
            },
          );

        await expect(
          service
            .cancelCycleCount(
              started
                .cycleCount.id,
              {
                cancelledByPersonId:
                  actorId,

                cancellationReason:
                  'Attempted late cancellation',
              },
            ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );
  },
);
