import {
  BadRequestException,
} from '@nestjs/common';

import {
  InventoryMaterialIssueService,
} from '../../src/core/inventory/services/inventory-material-issue.service';

import {
  InventoryBatchAllocationStrategy,
  InventoryMaterialIssueStatus,
} from '../../src/core/inventory/types/inventory.types';

describe(
  'Inventory Material Issue automatic Batch allocation',
  () => {
    const propertyId =
      '11111111-1111-4111-8111-111111111111';

    const storeId =
      '22222222-2222-4222-8222-222222222222';

    const binId =
      '33333333-3333-4333-8333-333333333333';

    const itemId =
      '44444444-4444-4444-8444-444444444444';

    const personId =
      '55555555-5555-4555-8555-555555555555';

    const firstBatchId =
      '66666666-6666-4666-8666-666666666666';

    const secondBatchId =
      '77777777-7777-4777-8777-777777777777';

    let repository: any;
    let inventoryService: any;
    let allocationService: any;
    let eventBus: any;
    let auditService: any;

    let service:
      InventoryMaterialIssueService;

    beforeEach(
      () => {
        repository = {
          createMaterialIssue:
            jest.fn()
              .mockImplementation(
                async (
                  materialIssue:
                    any,

                  items:
                    any[],
                ) => ({
                  materialIssue,
                  items,
                }),
              ),

          findMaterialIssueById:
            jest.fn(),

          listMaterialIssues:
            jest.fn(),

          updateMaterialIssueStatus:
            jest.fn(),

          postMovement:
            jest.fn(),
        };

        inventoryService = {
          getStore:
            jest.fn()
              .mockResolvedValue({
                id:
                  storeId,

                propertyId,

                isActive:
                  true,
              }),

          getItem:
            jest.fn()
              .mockResolvedValue({
                id:
                  itemId,

                isActive:
                  true,

                isBatchTracked:
                  true,
              }),

          getBinLocation:
            jest.fn()
              .mockResolvedValue({
                id:
                  binId,

                storeId,

                isActive:
                  true,
              }),
        };

        allocationService = {
          allocate:
            jest.fn()
              .mockResolvedValue({
                itemId,
                storeId,
                binLocationId:
                  binId,

                strategy:
                  InventoryBatchAllocationStrategy
                    .FEFO,

                requestedQuantity:
                  7,

                allocatedQuantity:
                  7,

                shortageQuantity:
                  0,

                fullyAllocated:
                  true,

                allocations: [
                  {
                    batchId:
                      firstBatchId,

                    batchNumber:
                      'BATCH-A',

                    binLocationId:
                      binId,

                    availableQuantity:
                      4,

                    allocatedQuantity:
                      4,

                    averageUnitCost:
                      10,
                  },
                  {
                    batchId:
                      secondBatchId,

                    batchNumber:
                      'BATCH-B',

                    binLocationId:
                      binId,

                    availableQuantity:
                      10,

                    allocatedQuantity:
                      3,

                    averageUnitCost:
                      10,
                  },
                ],
              }),
        };

        eventBus = {
          publish:
            jest.fn()
              .mockResolvedValue(
                undefined,
              ),
        };

        auditService = {
          record:
            jest.fn()
              .mockResolvedValue(
                undefined,
              ),
        };

        service =
          new InventoryMaterialIssueService(
            repository,
            inventoryService,
            allocationService,
            eventBus,
            auditService,
          );
      },
    );

    function allocationDto() {
      return {
        propertyId,
        storeId,

        issueDate:
          '2026-07-16',

        reasonCode:
          'OPERATIONS',

        createdByPersonId:
          personId,

        items: [
          {
            itemId,

            binLocationId:
              binId,

            quantity:
              7,

            unitCost:
              10,

            allocation: {
              strategy:
                InventoryBatchAllocationStrategy
                  .FEFO,
            },
          },
        ],
      };
    }

    it(
      'expands one allocation request into Batch-specific persisted lines',
      async () => {
        const result =
          await service
            .createMaterialIssue(
              allocationDto(),
            );

        expect(
          allocationService
            .allocate,
        ).toHaveBeenCalledWith({
          itemId,
          storeId,

          binLocationId:
            binId,

          quantity:
            7,

          strategy:
            InventoryBatchAllocationStrategy
              .FEFO,

          manualBatchIds:
            undefined,

          asOf:
            new Date(
              '2026-07-16',
            ),

          strict:
            true,
        });

        expect(
          result.materialIssue
            .status,
        ).toBe(
          InventoryMaterialIssueStatus
            .DRAFT,
        );

        expect(
          result.items,
        ).toHaveLength(2);

        expect(
          result.items.map(
            (item: any) => ({
              batchId:
                item.batchId,

              quantity:
                item.quantity,
            }),
          ),
        ).toEqual([
          {
            batchId:
              firstBatchId,

            quantity:
              4,
          },
          {
            batchId:
              secondBatchId,

            quantity:
              3,
          },
        ]);
      },
    );

    it(
      'preserves explicit batchId behaviour without invoking allocation',
      async () => {
        const dto =
          allocationDto();

        dto.items = [
          {
            itemId,

            binLocationId:
              binId,

            batchId:
              firstBatchId,

            quantity:
              2,

            unitCost:
              10,
          } as any,
        ];

        const result =
          await service
            .createMaterialIssue(
              dto,
            );

        expect(
          allocationService
            .allocate,
        ).not.toHaveBeenCalled();

        expect(
          result.items,
        ).toHaveLength(1);

        expect(
          result.items[0]
            .batchId,
        ).toBe(
          firstBatchId,
        );
      },
    );

    it(
      'rejects batchId together with allocation',
      async () => {
        const dto =
          allocationDto();

        dto.items[0] = {
          ...dto.items[0],

          batchId:
            firstBatchId,
        } as any;

        await expect(
          service
            .createMaterialIssue(
              dto,
            ),
        ).rejects.toThrow(
          'Material Issue item cannot contain both batchId and allocation',
        );

        expect(
          repository
            .createMaterialIssue,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'requires manualBatchIds for MANUAL allocation',
      async () => {
        const dto =
          allocationDto();

        dto.items[0]
          .allocation.strategy =
            InventoryBatchAllocationStrategy
              .MANUAL;

        await expect(
          service
            .createMaterialIssue(
              dto,
            ),
        ).rejects.toThrow(
          'manualBatchIds are required for MANUAL Material Issue allocation',
        );
      },
    );

    it(
      'rejects manualBatchIds for FIFO or FEFO allocation',
      async () => {
        const dto =
          allocationDto();

        dto.items[0]
          .allocation.manualBatchIds = [
            firstBatchId,
          ];

        await expect(
          service
            .createMaterialIssue(
              dto,
            ),
        ).rejects.toThrow(
          'manualBatchIds can only be used with MANUAL Material Issue allocation',
        );
      },
    );

    it(
      'propagates strict allocation shortages before document persistence',
      async () => {
        allocationService
          .allocate
          .mockRejectedValueOnce(
            new BadRequestException(
              'Inventory Batch allocation could not satisfy the requested quantity; shortage: 2',
            ),
          );

        await expect(
          service
            .createMaterialIssue(
              allocationDto(),
            ),
        ).rejects.toThrow(
          'Inventory Batch allocation could not satisfy the requested quantity',
        );

        expect(
          repository
            .createMaterialIssue,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
