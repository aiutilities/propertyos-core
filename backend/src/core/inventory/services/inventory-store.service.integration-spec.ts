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
  InventoryStore,
} from '../types/inventory.types';

import {
  InventoryService,
} from './inventory.service';

describe(
  'InventoryService Store FAT contract',
  () => {
    let repository:
      jest.Mocked<InventoryRepository>;

    let eventBus:
      jest.Mocked<EventBusService>;

    let auditService:
      jest.Mocked<AuditService>;

    let service:
      InventoryService;

    beforeEach(() => {
      repository = {
        createStore:
          jest.fn(),
        findStoreById:
          jest.fn(),
        listStores:
          jest.fn(),
        updateStore:
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

      service =
        new InventoryService(
          repository,
          eventBus,
          auditService,
        );
    });

    it(
      'creates a normalized active store and records evidence',
      async () => {
        repository
          .createStore
          .mockImplementation(
            async (
              store:
                InventoryStore,
            ) => store,
          );

        const result =
          await service.createStore({
            storeCode: '  main ',
            name: ' Main Store ',
            description:
              ' Primary inventory store ',
            propertyId:
              'property-1',
            zoneId:
              'zone-1',
            spaceId:
              'space-1',
            managerPersonId:
              'manager-1',
            createdByPersonId:
              'founder-person-1',
          });

        expect(result).toEqual(
          expect.objectContaining({
            storeCode: 'MAIN',
            name: 'Main Store',
            description:
              'Primary inventory store',
            propertyId:
              'property-1',
            zoneId:
              'zone-1',
            spaceId:
              'space-1',
            managerPersonId:
              'manager-1',
            isActive: true,
          }),
        );

        expect(result.id).toEqual(
          expect.any(String),
        );

        const expectedPayload =
          expect.objectContaining({
            entityType:
              'inventory.store',
            entityId:
              result.id,
            storeId:
              result.id,
            storeCode: 'MAIN',
            propertyId:
              'property-1',
            isActive: true,
            actorPersonId:
              'founder-person-1',
          });

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.STORE_CREATED,
          'core.inventory',
          expectedPayload,
        );

        expect(
          auditService.record,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.STORE_CREATED,
          'core.inventory',
          expectedPayload,
        );
      },
    );

    it(
      'lists stores using supplied filters',
      async () => {
        repository
          .listStores
          .mockResolvedValue([]);

        const filters = {
          propertyId:
            'property-1',
          isActive: true,
          search: 'main',
        };

        await expect(
          service.listStores(filters),
        ).resolves.toEqual([]);

        expect(
          repository.listStores,
        ).toHaveBeenCalledWith(
          filters,
        );
      },
    );

    it(
      'retrieves an existing store',
      async () => {
        const existing:
          InventoryStore = {
            id: 'store-1',
            storeCode: 'MAIN',
            name: 'Main Store',
            propertyId:
              'property-1',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

        repository
          .findStoreById
          .mockResolvedValue(existing);

        await expect(
          service.getStore(
            existing.id,
          ),
        ).resolves.toEqual(existing);
      },
    );

    it(
      'updates a store and records evidence',
      async () => {
        const existing:
          InventoryStore = {
            id: 'store-1',
            storeCode: 'MAIN',
            name: 'Main Store',
            description:
              'Old description',
            propertyId:
              'property-1',
            zoneId:
              'zone-1',
            spaceId:
              'space-1',
            managerPersonId:
              'manager-1',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

        repository
          .findStoreById
          .mockResolvedValue(existing);

        repository
          .updateStore
          .mockImplementation(
            async (
              id,
              input,
            ) => ({
              ...existing,
              ...input,
              id,
            }),
          );

        const result =
          await service.updateStore(
            existing.id,
            {
              name:
                ' Central Store ',
              description:
                ' Updated store ',
              zoneId:
                'zone-2',
              spaceId:
                'space-2',
              managerPersonId:
                'manager-2',
              updatedByPersonId:
                'founder-person-2',
              remarks:
                'FAT store update',
            },
          );

        expect(result).toEqual(
          expect.objectContaining({
            id: existing.id,
            storeCode: 'MAIN',
            name:
              'Central Store',
            description:
              'Updated store',
            zoneId:
              'zone-2',
            spaceId:
              'space-2',
            managerPersonId:
              'manager-2',
          }),
        );

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.STORE_UPDATED,
          'core.inventory',
          expect.objectContaining({
            storeId:
              existing.id,
            actorPersonId:
              'founder-person-2',
            remarks:
              'FAT store update',
          }),
        );
      },
    );

    it(
      'deactivates and reactivates a store',
      async () => {
        const active:
          InventoryStore = {
            id: 'store-1',
            storeCode: 'MAIN',
            name: 'Main Store',
            propertyId:
              'property-1',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

        const inactive = {
          ...active,
          isActive: false,
        };

        repository
          .findStoreById
          .mockResolvedValueOnce(active)
          .mockResolvedValueOnce(inactive);

        repository
          .updateStore
          .mockResolvedValueOnce(
            inactive,
          )
          .mockResolvedValueOnce({
            ...inactive,
            isActive: true,
          });

        await expect(
          service.deactivateStore(
            active.id,
            {
              changedByPersonId:
                'founder-person-1',
              remarks:
                'Temporary closure',
            },
          ),
        ).resolves.toEqual(
          expect.objectContaining({
            isActive: false,
          }),
        );

        await expect(
          service.activateStore(
            active.id,
            {
              changedByPersonId:
                'founder-person-2',
              remarks:
                'Reopened',
            },
          ),
        ).resolves.toEqual(
          expect.objectContaining({
            isActive: true,
          }),
        );
      },
    );

    it(
      'rejects a repeated store transition',
      async () => {
        repository
          .findStoreById
          .mockResolvedValue({
            id: 'store-1',
            storeCode: 'MAIN',
            name: 'Main Store',
            propertyId:
              'property-1',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

        await expect(
          service.activateStore(
            'store-1',
            {
              changedByPersonId:
                'founder-person-1',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.updateStore,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects an unknown store',
      async () => {
        repository
          .findStoreById
          .mockResolvedValue(null);

        await expect(
          service.getStore(
            'missing-store',
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );

    it(
      'maps duplicate store creation to a conflict',
      async () => {
        repository
          .createStore
          .mockRejectedValue({
            code: '23505',
          });

        await expect(
          service.createStore({
            storeCode: 'MAIN',
            name: 'Main Store',
            propertyId:
              'property-1',
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
