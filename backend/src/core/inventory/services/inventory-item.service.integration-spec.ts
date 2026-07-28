import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import {
  AuditService,
} from '../../audit/audit.service';

import {
  EventBusService,
} from '../../eventbus/services/eventbus.service';

import {
  INVENTORY_EVENTS,
} from '../inventory.constants';

import {
  InventoryRepository,
} from '../repositories/inventory.repository';

import {
  InventoryBrand,
  InventoryItem,
  InventoryItemCategory,
  InventoryItemType,
  InventoryUnitOfMeasure,
} from '../types/inventory.types';

import {
  InventoryService,
} from './inventory.service';

describe(
  'InventoryService Item FAT contract',
  () => {
    let repository:
      jest.Mocked<InventoryRepository>;

    let eventBus:
      jest.Mocked<EventBusService>;

    let auditService:
      jest.Mocked<AuditService>;

    let service:
      InventoryService;

    const category:
      InventoryItemCategory = {
        id: 'category-1',
        code: 'ELECTRICAL',
        name: 'Electrical',
        isActive: true,
        createdAt:
          new Date(
            '2026-07-27T00:00:00.000Z',
          ),
        updatedAt:
          new Date(
            '2026-07-27T00:00:00.000Z',
          ),
      };

    const unit:
      InventoryUnitOfMeasure = {
        id: 'unit-1',
        code: 'EA',
        name: 'Each',
        symbol: 'ea',
        decimalPlaces: 0,
        isActive: true,
        createdAt:
          new Date(
            '2026-07-27T00:00:00.000Z',
          ),
        updatedAt:
          new Date(
            '2026-07-27T00:00:00.000Z',
          ),
      };

    const brand:
      InventoryBrand = {
        id: 'brand-1',
        code: 'HAVELLS',
        name: 'Havells',
        isActive: true,
        createdAt:
          new Date(
            '2026-07-27T00:00:00.000Z',
          ),
        updatedAt:
          new Date(
            '2026-07-27T00:00:00.000Z',
          ),
      };

    beforeEach(() => {
      repository = {
        createItem:
          jest.fn(),
        findItemById:
          jest.fn(),
        findItemBySku:
          jest.fn(),
        listItems:
          jest.fn(),
        updateItem:
          jest.fn(),
        findCategoryById:
          jest.fn(),
        findUnitOfMeasureById:
          jest.fn(),
        findBrandById:
          jest.fn(),
      } as unknown as
        jest.Mocked<InventoryRepository>;

      eventBus = {
        publish:
          jest.fn(),
      } as unknown as
        jest.Mocked<EventBusService>;

      auditService = {
        record:
          jest.fn(),
      } as unknown as
        jest.Mocked<AuditService>;

      eventBus.publish
        .mockResolvedValue(undefined);

      auditService.record
        .mockResolvedValue(undefined);

      repository
        .findItemBySku
        .mockResolvedValue(null);

      repository
        .findCategoryById
        .mockResolvedValue(category);

      repository
        .findUnitOfMeasureById
        .mockResolvedValue(unit);

      repository
        .findBrandById
        .mockResolvedValue(brand);

      service =
        new InventoryService(
          repository,
          eventBus,
          auditService,
        );
    });

    it(
      'creates a normalized active item and records evidence',
      async () => {
        repository
          .createItem
          .mockImplementation(
            async (
              item:
                InventoryItem,
            ) => item,
          );

        const result =
          await service.createItem({
            sku: '  sw-001 ',
            name:
              ' Modular Switch ',
            description:
              '  Six amp switch  ',
            categoryId:
              category.id,
            unitOfMeasureId:
              unit.id,
            brandId:
              brand.id,
            itemType:
              InventoryItemType.GOODS,
            barcode:
              ' 890000000001 ',
            manufacturerPartNumber:
              ' MOD-6A ',
            minimumStockLevel: 10,
            reorderLevel: 20,
            reorderQuantity: 50,
            standardCost: 125.5,
            currency: ' inr ',
            isSerialized: false,
            isBatchTracked: true,
            createdByPersonId:
              'founder-person-1',
          });

        expect(result).toEqual(
          expect.objectContaining({
            sku: 'SW-001',
            name:
              'Modular Switch',
            description:
              'Six amp switch',
            categoryId:
              category.id,
            unitOfMeasureId:
              unit.id,
            brandId:
              brand.id,
            itemType:
              InventoryItemType.GOODS,
            barcode:
              '890000000001',
            manufacturerPartNumber:
              'MOD-6A',
            minimumStockLevel: 10,
            reorderLevel: 20,
            reorderQuantity: 50,
            standardCost: 125.5,
            currency: 'INR',
            isSerialized: false,
            isBatchTracked: true,
            isActive: true,
          }),
        );

        expect(result.id).toEqual(
          expect.any(String),
        );

        expect(
          repository.findItemBySku,
        ).toHaveBeenCalledWith(
          'sw-001',
        );

        expect(
          repository.findCategoryById,
        ).toHaveBeenCalledWith(
          category.id,
        );

        expect(
          repository.findUnitOfMeasureById,
        ).toHaveBeenCalledWith(
          unit.id,
        );

        expect(
          repository.findBrandById,
        ).toHaveBeenCalledWith(
          brand.id,
        );

        const expectedPayload =
          expect.objectContaining({
            entityType:
              'inventory.item',
            entityId:
              result.id,
            itemId:
              result.id,
            sku: 'SW-001',
            categoryId:
              category.id,
            unitOfMeasureId:
              unit.id,
            brandId:
              brand.id,
            itemType:
              InventoryItemType.GOODS,
            isActive: true,
            actorPersonId:
              'founder-person-1',
          });

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.ITEM_CREATED,
          'core.inventory',
          expectedPayload,
        );

        expect(
          auditService.record,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.ITEM_CREATED,
          'core.inventory',
          expectedPayload,
        );
      },
    );

    it(
      'lists items using supplied filters',
      async () => {
        repository
          .listItems
          .mockResolvedValue([]);

        const filters = {
          categoryId:
            category.id,
          isActive: true,
          search: 'switch',
        };

        await expect(
          service.listItems(filters),
        ).resolves.toEqual([]);

        expect(
          repository.listItems,
        ).toHaveBeenCalledWith(
          filters,
        );
      },
    );

    it(
      'searches only active items with a bounded limit',
      async () => {
        repository
          .listItems
          .mockResolvedValue([]);

        await expect(
          service.searchItems(
            ' switch ',
            200,
          ),
        ).resolves.toEqual([]);

        expect(
          repository.listItems,
        ).toHaveBeenCalledWith({
          search: 'switch',
          isActive: true,
        });
      },
    );

    it(
      'updates an item and records update evidence',
      async () => {
        const existing:
          InventoryItem = {
            id: 'item-1',
            sku: 'SW-001',
            name:
              'Modular Switch',
            categoryId:
              category.id,
            unitOfMeasureId:
              unit.id,
            brandId:
              brand.id,
            itemType:
              InventoryItemType.GOODS,
            minimumStockLevel: 10,
            reorderLevel: 20,
            reorderQuantity: 50,
            standardCost: 125.5,
            currency: 'INR',
            isSerialized: false,
            isBatchTracked: true,
            isActive: true,
            createdByPersonId:
              'founder-person-1',
            createdAt:
              new Date(
                '2026-07-27T00:00:00.000Z',
              ),
            updatedAt:
              new Date(
                '2026-07-27T00:00:00.000Z',
              ),
          };

        repository
          .findItemById
          .mockResolvedValue(existing);

        repository
          .updateItem
          .mockImplementation(
            async (
              id,
              input,
            ) => ({
              ...existing,
              ...input,
              id,
              updatedAt:
                new Date(),
            }),
          );

        const result =
          await service.updateItem(
            existing.id,
            {
              name:
                ' Premium Modular Switch ',
              standardCost: 140,
              reorderLevel: 25,
              currency: ' inr ',
              updatedByPersonId:
                'founder-person-2',
              remarks:
                'FAT item update',
            },
          );

        expect(result).toEqual(
          expect.objectContaining({
            id: existing.id,
            sku: 'SW-001',
            name:
              'Premium Modular Switch',
            standardCost: 140,
            reorderLevel: 25,
            currency: 'INR',
            updatedByPersonId:
              'founder-person-2',
          }),
        );

        expect(
          repository.updateItem,
        ).toHaveBeenCalledWith(
          existing.id,
          expect.objectContaining({
            name:
              'Premium Modular Switch',
            standardCost: 140,
            reorderLevel: 25,
            currency: 'INR',
            updatedByPersonId:
              'founder-person-2',
          }),
        );

        const expectedPayload =
          expect.objectContaining({
            entityType:
              'inventory.item',
            entityId:
              existing.id,
            itemId:
              existing.id,
            sku: 'SW-001',
            actorPersonId:
              'founder-person-2',
            remarks:
              'FAT item update',
          });

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.ITEM_UPDATED,
          'core.inventory',
          expectedPayload,
        );

        expect(
          auditService.record,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.ITEM_UPDATED,
          'core.inventory',
          expectedPayload,
        );
      },
    );

    it(
      'deactivates and reactivates an item with transition evidence',
      async () => {
        const active:
          InventoryItem = {
            id: 'item-1',
            sku: 'SW-001',
            name:
              'Modular Switch',
            categoryId:
              category.id,
            unitOfMeasureId:
              unit.id,
            itemType:
              InventoryItemType.GOODS,
            minimumStockLevel: 10,
            reorderLevel: 20,
            reorderQuantity: 50,
            standardCost: 125.5,
            currency: 'INR',
            isSerialized: false,
            isBatchTracked: false,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

        const inactive = {
          ...active,
          isActive: false,
          updatedByPersonId:
            'founder-person-1',
        };

        repository
          .findItemById
          .mockResolvedValueOnce(active)
          .mockResolvedValueOnce(inactive);

        repository
          .updateItem
          .mockResolvedValueOnce(
            inactive,
          )
          .mockResolvedValueOnce({
            ...inactive,
            isActive: true,
            updatedByPersonId:
              'founder-person-2',
          });

        await expect(
          service.deactivateItem(
            active.id,
            {
              changedByPersonId:
                'founder-person-1',
              remarks:
                'Temporary suspension',
            },
          ),
        ).resolves.toEqual(
          expect.objectContaining({
            isActive: false,
          }),
        );

        await expect(
          service.activateItem(
            active.id,
            {
              changedByPersonId:
                'founder-person-2',
              remarks:
                'Restored',
            },
          ),
        ).resolves.toEqual(
          expect.objectContaining({
            isActive: true,
          }),
        );

        expect(
          eventBus.publish,
        ).toHaveBeenNthCalledWith(
          1,
          INVENTORY_EVENTS.ITEM_DEACTIVATED,
          'core.inventory',
          expect.objectContaining({
            itemId: active.id,
            isActive: false,
            actorPersonId:
              'founder-person-1',
          }),
        );

        expect(
          eventBus.publish,
        ).toHaveBeenNthCalledWith(
          2,
          INVENTORY_EVENTS.ITEM_ACTIVATED,
          'core.inventory',
          expect.objectContaining({
            itemId: active.id,
            isActive: true,
            actorPersonId:
              'founder-person-2',
          }),
        );
      },
    );

    it(
      'rejects a duplicate SKU before persistence',
      async () => {
        repository
          .findItemBySku
          .mockResolvedValue({
            id: 'existing-item',
          } as InventoryItem);

        await expect(
          service.createItem({
            sku: 'SW-001',
            name:
              'Duplicate Switch',
            categoryId:
              category.id,
            unitOfMeasureId:
              unit.id,
            itemType:
              InventoryItemType.GOODS,
            minimumStockLevel: 0,
            reorderLevel: 0,
            reorderQuantity: 0,
            standardCost: 0,
            currency: 'INR',
            isSerialized: false,
            isBatchTracked: false,
            createdByPersonId:
              'founder-person-1',
          }),
        ).rejects.toBeInstanceOf(
          ConflictException,
        );

        expect(
          repository.createItem,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects an inactive category without persistence',
      async () => {
        repository
          .findCategoryById
          .mockResolvedValue({
            ...category,
            isActive: false,
          });

        await expect(
          service.createItem({
            sku: 'SW-002',
            name:
              'Inactive category item',
            categoryId:
              category.id,
            unitOfMeasureId:
              unit.id,
            itemType:
              InventoryItemType.GOODS,
            minimumStockLevel: 0,
            reorderLevel: 0,
            reorderQuantity: 0,
            standardCost: 0,
            currency: 'INR',
            isSerialized: false,
            isBatchTracked: false,
            createdByPersonId:
              'founder-person-1',
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.createItem,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects negative stock and cost values',
      async () => {
        await expect(
          service.createItem({
            sku: 'SW-003',
            name:
              'Invalid item',
            categoryId:
              category.id,
            unitOfMeasureId:
              unit.id,
            itemType:
              InventoryItemType.GOODS,
            minimumStockLevel: -1,
            reorderLevel: 0,
            reorderQuantity: 0,
            standardCost: 0,
            currency: 'INR',
            isSerialized: false,
            isBatchTracked: false,
            createdByPersonId:
              'founder-person-1',
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.createItem,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects an unknown item',
      async () => {
        repository
          .findItemById
          .mockResolvedValue(null);

        await expect(
          service.getItem(
            'missing-item',
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );

    it(
      'maps duplicate barcode persistence to a conflict',
      async () => {
        repository
          .createItem
          .mockRejectedValue({
            code: '23505',
          });

        await expect(
          service.createItem({
            sku: 'SW-004',
            name:
              'Barcode conflict',
            categoryId:
              category.id,
            unitOfMeasureId:
              unit.id,
            itemType:
              InventoryItemType.GOODS,
            minimumStockLevel: 0,
            reorderLevel: 0,
            reorderQuantity: 0,
            standardCost: 0,
            currency: 'INR',
            isSerialized: false,
            isBatchTracked: false,
            createdByPersonId:
              'founder-person-1',
          }),
        ).rejects.toBeInstanceOf(
          ConflictException,
        );

        expect(
          eventBus.publish,
        ).not.toHaveBeenCalled();

        expect(
          auditService.record,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
