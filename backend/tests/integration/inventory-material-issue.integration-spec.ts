import {
  BadRequestException,
} from '@nestjs/common';

import {
  InventoryMaterialIssueService,
} from '../../src/core/inventory/services/inventory-material-issue.service';

import {
  InventoryMaterialIssueStatus,
  InventoryStockMovementType,
} from '../../src/core/inventory/types/inventory.types';

describe(
  'Inventory Material Issue workflow',
  () => {
    let service:
      InventoryMaterialIssueService;

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

    beforeEach(
      () => {
        repository = {
          createMaterialIssue:
            jest.fn(),

          findMaterialIssueById:
            jest.fn(),

          listMaterialIssues:
            jest.fn(),

          updateMaterialIssueStatus:
            jest.fn(),

          postMovement:
            jest.fn(),
        };

        repository.withTransaction =
          jest.fn(
            async (
              work:
                (transaction: any) =>
                  Promise<any>,
            ) =>
              work({
                acquireLock:
                  jest.fn()
                    .mockResolvedValue(
                      undefined,
                    ),

                lockMaterialIssueById:
                  repository
                    .findMaterialIssueById,

                lockMaterialReturnById:
                  repository
                    .findMaterialReturnById,

                getPostedMaterialReturnQuantity:
                  repository
                    .getPostedMaterialReturnQuantity,

                postMovement:
                  repository
                    .postMovement,

                updateMaterialIssueStatus:
                  repository
                    .updateMaterialIssueStatus,

                updateMaterialReturnStatus:
                  repository
                    .updateMaterialReturnStatus,
              }),
          );

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
          new InventoryMaterialIssueService(
            repository,
            inventoryService,
            eventBus,
            auditService,
          );
      },
    );

    function createDto() {
      return {
        propertyId,
        storeId,

        issueDate:
          '2026-07-15',

        reasonCode:
          'maintenance',

        requestedByPersonId:
          personId,

        createdByPersonId:
          personId,

        remarks:
          'Maintenance consumption',

        items: [
          {
            itemId,
            binLocationId:
              binId,

            quantity:
              3,

            unitCost:
              25,

            remarks:
              'Electrical repair',
          },
        ],
      };
    }

    function draftDetails() {
      return {
        materialIssue: {
          id:
            '66666666-6666-4666-8666-666666666666',

          issueNumber:
            'MI-20260715-6666666666',

          propertyId,
          storeId,

          status:
            InventoryMaterialIssueStatus
              .DRAFT,

          issueDate:
            new Date(
              '2026-07-15',
            ),

          reasonCode:
            'MAINTENANCE',

          requestedByPersonId:
            personId,

          createdByPersonId:
            personId,

          remarks:
            'Maintenance consumption',

          metadata: {},

          createdAt:
            new Date(),

          updatedAt:
            new Date(),
        },

        items: [
          {
            id:
              '77777777-7777-4777-8777-777777777777',

            materialIssueId:
              '66666666-6666-4666-8666-666666666666',

            itemId,

            binLocationId:
              binId,

            quantity:
              3,

            unitCost:
              25,

            remarks:
              'Electrical repair',

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
      'creates a DRAFT Material Issue',
      async () => {
        repository
          .createMaterialIssue
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
          );

        const result =
          await service
            .createMaterialIssue(
              createDto(),
            );

        expect(
          result.materialIssue
            .status,
        ).toBe(
          InventoryMaterialIssueStatus
            .DRAFT,
        );

        expect(
          result.materialIssue
            .reasonCode,
        ).toBe(
          'MAINTENANCE',
        );

        expect(
          result.items,
        ).toHaveLength(1);

        expect(
          repository
            .createMaterialIssue,
        ).toHaveBeenCalledTimes(1);

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          'inventory.material_issue.created',
          'core.inventory',
          expect.objectContaining({
            entityType:
              'inventory.material_issue',

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
      'rejects a store from another property',
      async () => {
        inventoryService
          .getStore
          .mockResolvedValue({
            id:
              storeId,

            propertyId:
              '99999999-9999-4999-8999-999999999999',

            isActive:
              true,
          });

        await expect(
          service
            .createMaterialIssue(
              createDto(),
            ),
        ).rejects.toThrow(
          BadRequestException,
        );

        expect(
          repository
            .createMaterialIssue,
        ).not
          .toHaveBeenCalled();
      },
    );

    it(
      'rejects duplicate item and bin combinations',
      async () => {
        const dto =
          createDto();

        dto.items.push({
          ...dto.items[0],
        });

        await expect(
          service
            .createMaterialIssue(
              dto,
            ),
        ).rejects.toThrow(
          'Duplicate Material Issue item and bin combination',
        );
      },
    );

    it(
      'rejects a bin from another store',
      async () => {
        inventoryService
          .getBinLocation
          .mockResolvedValue({
            id:
              binId,

            storeId:
              '99999999-9999-4999-8999-999999999999',

            isActive:
              true,
          });

        await expect(
          service
            .createMaterialIssue(
              createDto(),
            ),
        ).rejects.toThrow(
          'Inventory bin does not belong to the selected store',
        );
      },
    );

    it(
      'posts Material Issue lines through ISSUE movements',
      async () => {
        const details =
          draftDetails();

        repository
          .findMaterialIssueById
          .mockResolvedValueOnce(
            details,
          )
          .mockResolvedValueOnce({
            ...details,

            materialIssue: {
              ...details
                .materialIssue,

              status:
                InventoryMaterialIssueStatus
                  .POSTED,
            },
          });

        repository
          .postMovement
          .mockResolvedValue({
            idempotentReplay:
              false,
          });

        repository
          .updateMaterialIssueStatus
          .mockImplementation(
            async (
              id: string,
              input: any,
            ) => ({
              ...details
                .materialIssue,

              id,

              ...input,
            }),
          );

        const result =
          await service
            .postMaterialIssue(
              details.materialIssue
                .id,
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
                .ISSUE,

            itemId,

            storeId,

            binLocationId:
              binId,

            quantityDelta:
              -3,

            unitCost:
              25,

            sourceType:
              'inventory.material_issue',

            sourceId:
              details.materialIssue
                .id,

            sourceLineId:
              details.items[0]
                .id,

            postedByPersonId:
              personId,
          }),
        );

        expect(
          repository
            .updateMaterialIssueStatus,
        ).toHaveBeenCalledWith(
          details.materialIssue
            .id,
          expect.objectContaining({
            status:
              InventoryMaterialIssueStatus
                .POSTED,

            postedByPersonId:
              personId,
          }),
        );

        expect(
          result.materialIssue
            .status,
        ).toBe(
          InventoryMaterialIssueStatus
            .POSTED,
        );
      },
    );

    it(
      'uses a deterministic idempotency key for each line',
      async () => {
        const details =
          draftDetails();

        repository
          .findMaterialIssueById
          .mockResolvedValueOnce(
            details,
          )
          .mockResolvedValueOnce({
            ...details,

            materialIssue: {
              ...details
                .materialIssue,

              status:
                InventoryMaterialIssueStatus
                  .POSTED,
            },
          });

        repository
          .postMovement
          .mockResolvedValue({
            idempotentReplay:
              false,
          });

        repository
          .updateMaterialIssueStatus
          .mockResolvedValue({
            ...details
              .materialIssue,

            status:
              InventoryMaterialIssueStatus
                .POSTED,
          });

        await service
          .postMaterialIssue(
            details.materialIssue.id,
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
                'inventory-material-issue',
                details.materialIssue
                  .id,
                details.items[0].id,
              ].join(':'),
          }),
        );
      },
    );

    it(
      'does not mark the document POSTED when ledger posting fails',
      async () => {
        const details =
          draftDetails();

        repository
          .findMaterialIssueById
          .mockResolvedValue(
            details,
          );

        repository
          .postMovement
          .mockRejectedValue(
            new BadRequestException(
              'Insufficient available stock',
            ),
          );

        await expect(
          service
            .postMaterialIssue(
              details.materialIssue
                .id,
              {
                postedByPersonId:
                  personId,
              },
            ),
        ).rejects.toThrow(
          'Insufficient available stock',
        );

        expect(
          repository
            .updateMaterialIssueStatus,
        ).not
          .toHaveBeenCalled();
      },
    );

    it(
      'prevents posting a Material Issue twice',
      async () => {
        const details =
          draftDetails();

        repository
          .findMaterialIssueById
          .mockResolvedValue({
            ...details,

            materialIssue: {
              ...details
                .materialIssue,

              status:
                InventoryMaterialIssueStatus
                  .POSTED,
            },
          });

        await expect(
          service
            .postMaterialIssue(
              details.materialIssue
                .id,
              {
                postedByPersonId:
                  personId,
              },
            ),
        ).rejects.toThrow(
          'Only DRAFT Material Issues can be posted',
        );

        expect(
          repository.postMovement,
        ).not
          .toHaveBeenCalled();
      },
    );

    it(
      'cancels a DRAFT Material Issue without posting stock',
      async () => {
        const details =
          draftDetails();

        repository
          .findMaterialIssueById
          .mockResolvedValueOnce(
            details,
          )
          .mockResolvedValueOnce({
            ...details,

            materialIssue: {
              ...details
                .materialIssue,

              status:
                InventoryMaterialIssueStatus
                  .CANCELLED,

              cancellationReason:
                'No longer required',
            },
          });

        repository
          .updateMaterialIssueStatus
          .mockImplementation(
            async (
              id: string,
              input: any,
            ) => ({
              ...details
                .materialIssue,

              id,

              ...input,
            }),
          );

        const result =
          await service
            .cancelMaterialIssue(
              details.materialIssue
                .id,
              {
                cancelledByPersonId:
                  personId,

                cancellationReason:
                  'No longer required',
              },
            );

        expect(
          repository.postMovement,
        ).not
          .toHaveBeenCalled();

        expect(
          repository
            .updateMaterialIssueStatus,
        ).toHaveBeenCalledWith(
          details.materialIssue
            .id,
          expect.objectContaining({
            status:
              InventoryMaterialIssueStatus
                .CANCELLED,

            cancelledByPersonId:
              personId,

            cancellationReason:
              'No longer required',
          }),
        );

        expect(
          result.materialIssue
            .status,
        ).toBe(
          InventoryMaterialIssueStatus
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
          .findMaterialIssueById
          .mockResolvedValue({
            ...details,

            materialIssue: {
              ...details
                .materialIssue,

              status:
                InventoryMaterialIssueStatus
                  .POSTED,
            },
          });

        await expect(
          service
            .cancelMaterialIssue(
              details.materialIssue
                .id,
              {
                cancelledByPersonId:
                  personId,

                cancellationReason:
                  'Invalid',
              },
            ),
        ).rejects.toThrow(
          'Only DRAFT Material Issues can be cancelled',
        );
      },
    );

    it(
      'lists Material Issues using normalized filters',
      async () => {
        repository
          .listMaterialIssues
          .mockResolvedValue([]);

        await service
          .listMaterialIssues({
            propertyId,
            storeId,

            status:
              'draft',

            dateFrom:
              '2026-07-01',

            dateTo:
              '2026-07-31',
          });

        expect(
          repository
            .listMaterialIssues,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            propertyId,
            storeId,

            status:
              InventoryMaterialIssueStatus
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
