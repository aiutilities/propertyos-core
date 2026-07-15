import {
  BadRequestException,
} from '@nestjs/common';

import {
  InventoryMaterialReturnService,
} from '../../src/core/inventory/services/inventory-material-return.service';

import {
  InventoryMaterialIssueStatus,
  InventoryMaterialReturnStatus,
  InventoryStockMovementType,
} from '../../src/core/inventory/types/inventory.types';

describe(
  'Inventory Material Return workflow',
  () => {
    let service:
      InventoryMaterialReturnService;

    let repository: any;
    let inventoryService: any;
    let eventBus: any;
    let auditService: any;

    const propertyId =
      '11111111-1111-4111-8111-111111111111';

    const storeId =
      '22222222-2222-4222-8222-222222222222';

    const itemId =
      '33333333-3333-4333-8333-333333333333';

    const binId =
      '44444444-4444-4444-8444-444444444444';

    const personId =
      '55555555-5555-4555-8555-555555555555';

    const materialIssueId =
      '66666666-6666-4666-8666-666666666666';

    const materialReturnId =
      '77777777-7777-4777-8777-777777777777';

    const returnItemId =
      '88888888-8888-4888-8888-888888888888';

    beforeEach(
      () => {
        repository = {
          createMaterialReturn:
            jest.fn(),

          findMaterialReturnById:
            jest.fn(),

          listMaterialReturns:
            jest.fn(),

          updateMaterialReturnStatus:
            jest.fn(),

          findMaterialIssueById:
            jest.fn(),

          getPostedMaterialReturnQuantity:
            jest.fn()
              .mockResolvedValue(0),

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
            eventBus,
            auditService,
          );
      },
    );

    function originalIssue() {
      return {
        materialIssue: {
          id:
            materialIssueId,

          issueNumber:
            'MI-20260715-6666666666',

          propertyId,
          storeId,

          status:
            InventoryMaterialIssueStatus
              .POSTED,

          issueDate:
            new Date(
              '2026-07-15',
            ),

          reasonCode:
            'MAINTENANCE',

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
              '99999999-9999-4999-8999-999999999999',

            materialIssueId,

            itemId,

            binLocationId:
              binId,

            quantity:
              5,

            unitCost:
              25,

            metadata: {},

            createdAt:
              new Date(),

            updatedAt:
              new Date(),
          },
        ],
      };
    }

    function createDto() {
      return {
        propertyId,
        storeId,
        materialIssueId,

        returnDate:
          '2026-07-16',

        reasonCode:
          'unused_material',

        returnedByPersonId:
          personId,

        createdByPersonId:
          personId,

        remarks:
          'Unused maintenance material',

        items: [
          {
            itemId,

            binLocationId:
              binId,

            quantity:
              2,

            unitCost:
              25,

            remarks:
              'Returned unused',
          },
        ],
      };
    }

    function draftDetails() {
      return {
        materialReturn: {
          id:
            materialReturnId,

          returnNumber:
            'MR-20260716-7777777777',

          propertyId,
          storeId,
          materialIssueId,

          status:
            InventoryMaterialReturnStatus
              .DRAFT,

          returnDate:
            new Date(
              '2026-07-16',
            ),

          reasonCode:
            'UNUSED_MATERIAL',

          returnedByPersonId:
            personId,

          createdByPersonId:
            personId,

          remarks:
            'Unused maintenance material',

          metadata: {},

          createdAt:
            new Date(),

          updatedAt:
            new Date(),
        },

        items: [
          {
            id:
              returnItemId,

            materialReturnId,

            itemId,

            binLocationId:
              binId,

            quantity:
              2,

            unitCost:
              25,

            remarks:
              'Returned unused',

            metadata: {},

            createdAt:
              new Date(),

            updatedAt:
              new Date(),
          },
        ],
      };
    }

    it(
      'creates a linked DRAFT Material Return',
      async () => {
        repository
          .findMaterialIssueById
          .mockResolvedValue(
            originalIssue(),
          );

        repository
          .createMaterialReturn
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
          );

        const result =
          await service
            .createMaterialReturn(
              createDto(),
            );

        expect(
          result.materialReturn
            .status,
        ).toBe(
          InventoryMaterialReturnStatus
            .DRAFT,
        );

        expect(
          result.materialReturn
            .materialIssueId,
        ).toBe(
          materialIssueId,
        );

        expect(
          result.materialReturn
            .reasonCode,
        ).toBe(
          'UNUSED_MATERIAL',
        );

        expect(
          repository
            .getPostedMaterialReturnQuantity,
        ).toHaveBeenCalledWith(
          materialIssueId,
          itemId,
          binId,
        );

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          'inventory.material_return.created',
          'core.inventory',
          expect.objectContaining({
            entityType:
              'inventory.material_return',

            materialIssueId,
            propertyId,
            storeId,
          }),
        );

        expect(
          auditService.record,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'creates an unlinked Material Return',
      async () => {
        const dto =
          createDto();

        delete dto.materialIssueId;

        repository
          .createMaterialReturn
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
          );

        const result =
          await service
            .createMaterialReturn(
              dto,
            );

        expect(
          result.materialReturn
            .materialIssueId,
        ).toBeUndefined();

        expect(
          repository
            .findMaterialIssueById,
        ).not
          .toHaveBeenCalled();

        expect(
          repository
            .getPostedMaterialReturnQuantity,
        ).not
          .toHaveBeenCalled();
      },
    );

    it(
      'rejects a return linked to a non-POSTED issue',
      async () => {
        const issue =
          originalIssue();

        issue.materialIssue.status =
          InventoryMaterialIssueStatus
            .DRAFT;

        repository
          .findMaterialIssueById
          .mockResolvedValue(
            issue,
          );

        await expect(
          service
            .createMaterialReturn(
              createDto(),
            ),
        ).rejects.toThrow(
          'Returns can only reference a POSTED Material Issue',
        );
      },
    );

    it(
      'rejects an item not present on the original issue',
      async () => {
        const issue =
          originalIssue();

        issue.items = [];

        repository
          .findMaterialIssueById
          .mockResolvedValue(
            issue,
          );

        await expect(
          service
            .createMaterialReturn(
              createDto(),
            ),
        ).rejects.toThrow(
          'The returned item and bin were not present on the original Material Issue',
        );
      },
    );

    it(
      'rejects a return exceeding the issued quantity',
      async () => {
        repository
          .findMaterialIssueById
          .mockResolvedValue(
            originalIssue(),
          );

        repository
          .getPostedMaterialReturnQuantity
          .mockResolvedValue(4);

        await expect(
          service
            .createMaterialReturn(
              createDto(),
            ),
        ).rejects.toThrow(
          'Material Return quantity exceeds the remaining issued quantity',
        );
      },
    );

    it(
      'rechecks the remaining issued quantity when posting',
      async () => {
        repository
          .findMaterialReturnById
          .mockResolvedValue(
            draftDetails(),
          );

        repository
          .findMaterialIssueById
          .mockResolvedValue(
            originalIssue(),
          );

        repository
          .getPostedMaterialReturnQuantity
          .mockResolvedValue(4);

        await expect(
          service
            .postMaterialReturn(
              materialReturnId,
              {
                postedByPersonId:
                  personId,
              },
            ),
        ).rejects.toThrow(
          'Material Return quantity exceeds the remaining issued quantity',
        );

        expect(
          repository.postMovement,
        ).not
          .toHaveBeenCalled();

        expect(
          repository
            .updateMaterialReturnStatus,
        ).not
          .toHaveBeenCalled();
      },
    );

    it(
      'posts Material Return lines through RECEIPT movements',
      async () => {
        const details =
          draftDetails();

        repository
          .findMaterialReturnById
          .mockResolvedValueOnce(
            details,
          )
          .mockResolvedValueOnce({
            ...details,

            materialReturn: {
              ...details
                .materialReturn,

              status:
                InventoryMaterialReturnStatus
                  .POSTED,
            },
          });

        repository
          .findMaterialIssueById
          .mockResolvedValue(
            originalIssue(),
          );

        repository
          .postMovement
          .mockResolvedValue({
            idempotentReplay:
              false,
          });

        repository
          .updateMaterialReturnStatus
          .mockImplementation(
            async (
              id: string,
              input: any,
            ) => ({
              ...details
                .materialReturn,

              id,

              ...input,
            }),
          );

        const result =
          await service
            .postMaterialReturn(
              materialReturnId,
              {
                postedByPersonId:
                  personId,
              },
            );

        expect(
          repository.postMovement,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            movementType:
              InventoryStockMovementType
                .RECEIPT,

            itemId,
            storeId,

            binLocationId:
              binId,

            quantityDelta:
              2,

            unitCost:
              25,

            sourceType:
              'inventory.material_return',

            sourceId:
              materialReturnId,

            sourceLineId:
              returnItemId,

            correlationId:
              materialIssueId,

            postedByPersonId:
              personId,
          }),
        );

        expect(
          repository
            .updateMaterialReturnStatus,
        ).toHaveBeenCalledWith(
          materialReturnId,
          expect.objectContaining({
            status:
              InventoryMaterialReturnStatus
                .POSTED,

            postedByPersonId:
              personId,
          }),
        );

        expect(
          result.materialReturn
            .status,
        ).toBe(
          InventoryMaterialReturnStatus
            .POSTED,
        );

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          'inventory.material_return.posted',
          'core.inventory',
          expect.objectContaining({
            entityType:
              'inventory.material_return',

            materialIssueId,
          }),
        );
      },
    );

    it(
      'uses deterministic idempotency for each return line',
      async () => {
        const details =
          draftDetails();

        repository
          .findMaterialReturnById
          .mockResolvedValueOnce(
            details,
          )
          .mockResolvedValueOnce({
            ...details,

            materialReturn: {
              ...details
                .materialReturn,

              status:
                InventoryMaterialReturnStatus
                  .POSTED,
            },
          });

        repository
          .findMaterialIssueById
          .mockResolvedValue(
            originalIssue(),
          );

        repository
          .postMovement
          .mockResolvedValue({
            idempotentReplay:
              false,
          });

        repository
          .updateMaterialReturnStatus
          .mockResolvedValue({
            ...details
              .materialReturn,

            status:
              InventoryMaterialReturnStatus
                .POSTED,
          });

        await service
          .postMaterialReturn(
            materialReturnId,
            {
              postedByPersonId:
                personId,
            },
          );

        expect(
          repository.postMovement,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            idempotencyKey:
              [
                'inventory-material-return',
                materialReturnId,
                returnItemId,
              ].join(':'),
          }),
        );
      },
    );

    it(
      'prevents posting a Material Return twice',
      async () => {
        const details =
          draftDetails();

        repository
          .findMaterialReturnById
          .mockResolvedValue({
            ...details,

            materialReturn: {
              ...details
                .materialReturn,

              status:
                InventoryMaterialReturnStatus
                  .POSTED,
            },
          });

        await expect(
          service
            .postMaterialReturn(
              materialReturnId,
              {
                postedByPersonId:
                  personId,
              },
            ),
        ).rejects.toThrow(
          'Only DRAFT Material Returns can be posted',
        );

        expect(
          repository.postMovement,
        ).not
          .toHaveBeenCalled();
      },
    );

    it(
      'cancels a DRAFT Material Return without posting stock',
      async () => {
        const details =
          draftDetails();

        repository
          .findMaterialReturnById
          .mockResolvedValueOnce(
            details,
          )
          .mockResolvedValueOnce({
            ...details,

            materialReturn: {
              ...details
                .materialReturn,

              status:
                InventoryMaterialReturnStatus
                  .CANCELLED,

              cancellationReason:
                'Return withdrawn',
            },
          });

        repository
          .updateMaterialReturnStatus
          .mockImplementation(
            async (
              id: string,
              input: any,
            ) => ({
              ...details
                .materialReturn,

              id,

              ...input,
            }),
          );

        const result =
          await service
            .cancelMaterialReturn(
              materialReturnId,
              {
                cancelledByPersonId:
                  personId,

                cancellationReason:
                  'Return withdrawn',
              },
            );

        expect(
          repository.postMovement,
        ).not
          .toHaveBeenCalled();

        expect(
          repository
            .updateMaterialReturnStatus,
        ).toHaveBeenCalledWith(
          materialReturnId,
          expect.objectContaining({
            status:
              InventoryMaterialReturnStatus
                .CANCELLED,

            cancelledByPersonId:
              personId,

            cancellationReason:
              'Return withdrawn',
          }),
        );

        expect(
          result.materialReturn
            .status,
        ).toBe(
          InventoryMaterialReturnStatus
            .CANCELLED,
        );
      },
    );

    it(
      'prevents cancellation after posting',
      async () => {
        const details =
          draftDetails();

        repository
          .findMaterialReturnById
          .mockResolvedValue({
            ...details,

            materialReturn: {
              ...details
                .materialReturn,

              status:
                InventoryMaterialReturnStatus
                  .POSTED,
            },
          });

        await expect(
          service
            .cancelMaterialReturn(
              materialReturnId,
              {
                cancelledByPersonId:
                  personId,

                cancellationReason:
                  'Invalid',
              },
            ),
        ).rejects.toThrow(
          'Only DRAFT Material Returns can be cancelled',
        );
      },
    );

    it(
      'lists Material Returns using normalized filters',
      async () => {
        repository
          .listMaterialReturns
          .mockResolvedValue([]);

        await service
          .listMaterialReturns({
            propertyId,
            storeId,
            materialIssueId,

            status:
              'draft',

            dateFrom:
              '2026-07-01',

            dateTo:
              '2026-07-31',
          });

        expect(
          repository
            .listMaterialReturns,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            propertyId,
            storeId,
            materialIssueId,

            status:
              InventoryMaterialReturnStatus
                .DRAFT,

            dateFrom:
              expect.any(Date),

            dateTo:
              expect.any(Date),
          }),
        );
      },
    );
  },
);
