import {
  InventoryBatchAllocationStrategy,
  InventoryMaterialIssueStatus,
  InventoryMaterialReturnStatus,
} from '../../src/core/inventory/types/inventory.types';

import {
  InventoryMaterialReturnService,
} from '../../src/core/inventory/services/inventory-material-return.service';

describe(
  'Inventory Material Return automatic Batch allocation',
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

    const materialIssueId =
      '66666666-6666-4666-8666-666666666666';

    const firstBatchId =
      '77777777-7777-4777-8777-777777777777';

    const secondBatchId =
      '88888888-8888-4888-8888-888888888888';

    let repository: any;
    let inventoryService: any;
    let batchService: any;
    let eventBus: any;
    let auditService: any;

    let service:
      InventoryMaterialReturnService;

    beforeEach(
      () => {
        repository = {
          findMaterialIssueById:
            jest.fn()
              .mockResolvedValue({
                materialIssue: {
                  id:
                    materialIssueId,

                  issueNumber:
                    'MI-20260716-TEST',

                  propertyId,
                  storeId,

                  status:
                    InventoryMaterialIssueStatus
                      .POSTED,

                  issueDate:
                    new Date(
                      '2026-07-16',
                    ),

                  reasonCode:
                    'OPERATIONS',

                  createdByPersonId:
                    personId,

                  metadata: {},

                  createdAt:
                    new Date(),

                  updatedAt:
                    new Date(),
                },

                items: [
                  {
                    id:
                      '99999999-9999-4999-8999-999999999991',

                    materialIssueId,
                    itemId,

                    binLocationId:
                      binId,

                    batchId:
                      firstBatchId,

                    quantity:
                      4,

                    unitCost:
                      10,

                    metadata: {},

                    createdAt:
                      new Date(),

                    updatedAt:
                      new Date(),
                  },
                  {
                    id:
                      '99999999-9999-4999-8999-999999999992',

                    materialIssueId,
                    itemId,

                    binLocationId:
                      binId,

                    batchId:
                      secondBatchId,

                    quantity:
                      6,

                    unitCost:
                      10,

                    metadata: {},

                    createdAt:
                      new Date(),

                    updatedAt:
                      new Date(),
                  },
                ],
              }),

          getPostedMaterialReturnQuantity:
            jest.fn()
              .mockResolvedValue(0),

          createMaterialReturn:
            jest.fn()
              .mockImplementation(
                async (
                  materialReturn:
                    any,

                  items:
                    any[],
                ) => ({
                  materialReturn,
                  items,
                }),
              ),

          findMaterialReturnById:
            jest.fn(),

          listMaterialReturns:
            jest.fn(),

          updateMaterialReturnStatus:
            jest.fn(),

          withTransaction:
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

        batchService = {
          getByIds:
            jest.fn()
              .mockResolvedValue([
                {
                  id:
                    firstBatchId,

                  itemId,

                  batchNumber:
                    'BATCH-A',

                  manufactureDate:
                    new Date(
                      '2026-01-01',
                    ),

                  expiryDate:
                    new Date(
                      '2027-12-31',
                    ),

                  status:
                    'ACTIVE',

                  metadata: {},

                  createdAt:
                    new Date(
                      '2026-01-02',
                    ),

                  updatedAt:
                    new Date(),
                },
                {
                  id:
                    secondBatchId,

                  itemId,

                  batchNumber:
                    'BATCH-B',

                  manufactureDate:
                    new Date(
                      '2026-03-01',
                    ),

                  expiryDate:
                    new Date(
                      '2027-01-01',
                    ),

                  status:
                    'ACTIVE',

                  metadata: {},

                  createdAt:
                    new Date(
                      '2026-03-02',
                    ),

                  updatedAt:
                    new Date(),
                },
              ]),
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
          new InventoryMaterialReturnService(
            repository,
            inventoryService,
            batchService,
            eventBus,
            auditService,
          );
      },
    );

    function createDto(
      strategy:
        InventoryBatchAllocationStrategy =
          InventoryBatchAllocationStrategy
            .FIFO,
    ) {
      return {
        propertyId,
        storeId,
        materialIssueId,

        returnDate:
          '2026-07-16',

        reasonCode:
          'UNUSED_MATERIAL',

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
              strategy,
            },
          },
        ],
      };
    }

    it(
      'expands FIFO return allocation across original issued Batches',
      async () => {
        const created =
          await service
            .createMaterialReturn(
              createDto(),
            );

        expect(
          created.materialReturn
            .status,
        ).toBe(
          InventoryMaterialReturnStatus
            .DRAFT,
        );

        expect(
          created.items.map(
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
      'uses FEFO ordering from Batch metadata',
      async () => {
        const created =
          await service
            .createMaterialReturn(
              createDto(
                InventoryBatchAllocationStrategy
                  .FEFO,
              ),
            );

        expect(
          created.items.map(
            (item: any) =>
              item.batchId,
          ),
        ).toEqual([
          secondBatchId,
          firstBatchId,
        ]);
      },
    );

    it(
      'subtracts previously posted returns per Batch',
      async () => {
        repository
          .getPostedMaterialReturnQuantity
          .mockImplementation(
            async (
              _issueId:
                string,

              _itemId:
                string,

              _binId:
                string,

              batchId:
                string,
            ) =>
              batchId ===
              firstBatchId
                ? 3
                : 0,
          );

        const created =
          await service
            .createMaterialReturn(
              createDto(),
            );

        expect(
          created.items.map(
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
              1,
          },
          {
            batchId:
              secondBatchId,

            quantity:
              6,
          },
        ]);
      },
    );

    it(
      'preserves MANUAL Batch order',
      async () => {
        const dto =
          createDto(
            InventoryBatchAllocationStrategy
              .MANUAL,
          );

        dto.items[0]
          .allocation.manualBatchIds = [
            secondBatchId,
            firstBatchId,
          ];

        const created =
          await service
            .createMaterialReturn(
              dto,
            );

        expect(
          created.items.map(
            (item: any) =>
              item.batchId,
          ),
        ).toEqual([
          secondBatchId,
          firstBatchId,
        ]);
      },
    );

    it(
      'rejects automatic allocation without a linked Material Issue',
      async () => {
        const dto =
          createDto();

        delete (
          dto as {
            materialIssueId?:
              string;
          }
        ).materialIssueId;

        await expect(
          service
            .createMaterialReturn(
              dto,
            ),
        ).rejects.toThrow(
          'Automatic Material Return Batch allocation requires a linked Material Issue',
        );
      },
    );

    it(
      'rejects strict shortages before persistence',
      async () => {
        const dto =
          createDto();

        dto.items[0]
          .quantity =
            11;

        await expect(
          service
            .createMaterialReturn(
              dto,
            ),
        ).rejects.toThrow(
          'Material Return Batch allocation could not satisfy the requested quantity',
        );

        expect(
          repository
            .createMaterialReturn,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'preserves explicit batchId behaviour',
      async () => {
        const dto =
          createDto();

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

        const created =
          await service
            .createMaterialReturn(
              dto,
            );

        expect(
          batchService
            .getByIds,
        ).not.toHaveBeenCalled();

        expect(
          created.items[0]
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
          createDto();

        dto.items[0] = {
          ...dto.items[0],

          batchId:
            firstBatchId,
        } as any;

        await expect(
          service
            .createMaterialReturn(
              dto,
            ),
        ).rejects.toThrow(
          'Material Return item cannot contain both batchId and allocation',
        );
      },
    );
  },
);
