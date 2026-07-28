import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import {
  AuditService,
} from '../../audit/audit.service';

import {
  EventBusService,
} from '../../eventbus/services/eventbus.service';

import {
  InventoryRepository,
} from '../repositories/inventory.repository';

import {
  InventoryBinLocation,
  InventoryItem,
  InventoryItemType,
  InventoryStockBalance,
  InventoryStore,
} from '../types/inventory.types';

import {
  InventoryService,
} from './inventory.service';

describe(
  'InventoryService Stock Balance FAT contract',
  () => {
    let repository:
      jest.Mocked<InventoryRepository>;

    let service:
      InventoryService;

    const item:
      InventoryItem = {
        id: 'item-1',
        sku: 'SW-001',
        name: 'Modular Switch',
        categoryId: 'category-1',
        unitOfMeasureId: 'unit-1',
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

    const store:
      InventoryStore = {
        id: 'store-1',
        storeCode: 'MAIN',
        name: 'Main Store',
        propertyId: 'property-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

    const bin:
      InventoryBinLocation = {
        id: 'bin-1',
        storeId: store.id,
        binCode: 'RACK-01',
        name: 'Rack 01',
        isReceivingBin: false,
        isDispatchBin: false,
        isQuarantineBin: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

    beforeEach(() => {
      repository = {
        findItemById:
          jest.fn(),
        findStoreById:
          jest.fn(),
        findBinLocationById:
          jest.fn(),
        findStockBalance:
          jest.fn(),
        listStockBalances:
          jest.fn(),
      } as unknown as
        jest.Mocked<InventoryRepository>;

      const eventBus = {
        publish:
          jest.fn(),
      } as unknown as
        jest.Mocked<EventBusService>;

      const auditService = {
        record:
          jest.fn(),
      } as unknown as
        jest.Mocked<AuditService>;

      repository
        .findItemById
        .mockResolvedValue(item);

      repository
        .findStoreById
        .mockResolvedValue(store);

      repository
        .findBinLocationById
        .mockResolvedValue(bin);

      service =
        new InventoryService(
          repository,
          eventBus,
          auditService,
        );
    });

    it(
      'lists stock balances using supplied filters',
      async () => {
        repository
          .listStockBalances
          .mockResolvedValue([]);

        const filters = {
          itemId:
            item.id,
          storeId:
            store.id,
          propertyId:
            store.propertyId,
          belowReorderLevel:
            true,
        };

        await expect(
          service.listStockBalances(
            filters,
          ),
        ).resolves.toEqual([]);

        expect(
          repository.listStockBalances,
        ).toHaveBeenCalledWith(
          filters,
        );
      },
    );

    it(
      'returns an item and store stock balance',
      async () => {
        const balance:
          InventoryStockBalance = {
            id: 'balance-1',
            itemId: item.id,
            storeId: store.id,
            quantityOnHand: 100,
            reservedQuantity: 20,
            availableQuantity: 80,
            averageUnitCost: 125.5,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

        repository
          .findStockBalance
          .mockResolvedValue(balance);

        await expect(
          service.getStockBalance(
            item.id,
            store.id,
          ),
        ).resolves.toEqual(
          balance,
        );

        expect(
          repository.findItemById,
        ).toHaveBeenCalledWith(
          item.id,
        );

        expect(
          repository.findStoreById,
        ).toHaveBeenCalledWith(
          store.id,
        );

        expect(
          repository.findStockBalance,
        ).toHaveBeenCalledWith(
          item.id,
          store.id,
          undefined,
        );
      },
    );

    it(
      'returns a bin-level stock balance after validating ownership',
      async () => {
        const balance:
          InventoryStockBalance = {
            id: 'balance-1',
            itemId: item.id,
            storeId: store.id,
            binLocationId: bin.id,
            quantityOnHand: 40,
            reservedQuantity: 5,
            availableQuantity: 35,
            averageUnitCost: 125.5,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

        repository
          .findStockBalance
          .mockResolvedValue(balance);

        await expect(
          service.getStockBalance(
            item.id,
            store.id,
            bin.id,
          ),
        ).resolves.toEqual(
          balance,
        );

        expect(
          repository
            .findBinLocationById,
        ).toHaveBeenCalledWith(
          bin.id,
        );

        expect(
          repository.findStockBalance,
        ).toHaveBeenCalledWith(
          item.id,
          store.id,
          bin.id,
        );
      },
    );

    it(
      'returns null when no balance exists',
      async () => {
        repository
          .findStockBalance
          .mockResolvedValue(null);

        await expect(
          service.getStockBalance(
            item.id,
            store.id,
          ),
        ).resolves.toBeNull();
      },
    );

    it(
      'rejects a bin belonging to another store',
      async () => {
        repository
          .findBinLocationById
          .mockResolvedValue({
            ...bin,
            storeId: 'store-2',
          });

        await expect(
          service.getStockBalance(
            item.id,
            store.id,
            bin.id,
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.findStockBalance,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects an unknown item before balance lookup',
      async () => {
        repository
          .findItemById
          .mockResolvedValue(null);

        await expect(
          service.getStockBalance(
            'missing-item',
            store.id,
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );

        expect(
          repository.findStockBalance,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects an unknown store before balance lookup',
      async () => {
        repository
          .findStoreById
          .mockResolvedValue(null);

        await expect(
          service.getStockBalance(
            item.id,
            'missing-store',
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );

        expect(
          repository.findStockBalance,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects an unknown bin before balance lookup',
      async () => {
        repository
          .findBinLocationById
          .mockResolvedValue(null);

        await expect(
          service.getStockBalance(
            item.id,
            store.id,
            'missing-bin',
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );

        expect(
          repository.findStockBalance,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
