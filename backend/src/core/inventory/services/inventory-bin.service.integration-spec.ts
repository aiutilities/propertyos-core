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
  InventoryBinLocation,
  InventoryStore,
} from '../types/inventory.types';

import {
  InventoryService,
} from './inventory.service';

describe(
  'InventoryService Bin FAT contract',
  () => {
    let repository:
      jest.Mocked<InventoryRepository>;

    let eventBus:
      jest.Mocked<EventBusService>;

    let auditService:
      jest.Mocked<AuditService>;

    let service:
      InventoryService;

    const store:
      InventoryStore = {
        id: 'store-1',
        storeCode: 'MAIN',
        name: 'Main Store',
        propertyId:
          'property-1',
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
        createBinLocation:
          jest.fn(),
        findBinLocationById:
          jest.fn(),
        listBinLocations:
          jest.fn(),
        updateBinLocation:
          jest.fn(),
        findStoreById:
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
        .findStoreById
        .mockResolvedValue(store);

      service =
        new InventoryService(
          repository,
          eventBus,
          auditService,
        );
    });

    it(
      'creates a normalized active root bin and records evidence',
      async () => {
        repository
          .createBinLocation
          .mockImplementation(
            async (
              bin:
                InventoryBinLocation,
            ) => bin,
          );

        const result =
          await service
            .createBinLocation({
              storeId:
                store.id,
              binCode:
                '  recv-01 ',
              name:
                ' Receiving Bin ',
              description:
                '  Main receiving bay  ',
              barcode:
                ' BIN-RECV-01 ',
              isReceivingBin:
                true,
              isDispatchBin:
                false,
              isQuarantineBin:
                false,
              createdByPersonId:
                'founder-person-1',
            });

        expect(result).toEqual(
          expect.objectContaining({
            storeId:
              store.id,
            binCode:
              'RECV-01',
            name:
              'Receiving Bin',
            description:
              'Main receiving bay',
            barcode:
              'BIN-RECV-01',
            isReceivingBin:
              true,
            isDispatchBin:
              false,
            isQuarantineBin:
              false,
            isActive:
              true,
          }),
        );

        expect(result.id).toEqual(
          expect.any(String),
        );

        expect(
          repository.createBinLocation,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            storeId:
              store.id,
            binCode:
              'RECV-01',
            isReceivingBin:
              true,
            isActive:
              true,
          }),
        );

        const expectedPayload =
          expect.objectContaining({
            entityType:
              'inventory.bin_location',
            entityId:
              result.id,
            binLocationId:
              result.id,
            storeId:
              store.id,
            binCode:
              'RECV-01',
            actorPersonId:
              'founder-person-1',
          });

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.BIN_CREATED,
          'core.inventory',
          expectedPayload,
        );

        expect(
          auditService.record,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.BIN_CREATED,
          'core.inventory',
          expectedPayload,
        );
      },
    );

    it(
      'creates a child bin only under an active parent in the same store',
      async () => {
        const parent:
          InventoryBinLocation = {
            id: 'bin-parent',
            storeId:
              store.id,
            binCode:
              'RACK-A',
            name:
              'Rack A',
            isReceivingBin:
              false,
            isDispatchBin:
              false,
            isQuarantineBin:
              false,
            isActive:
              true,
            createdAt:
              new Date(),
            updatedAt:
              new Date(),
          };

        repository
          .findBinLocationById
          .mockResolvedValue(parent);

        repository
          .createBinLocation
          .mockImplementation(
            async (
              bin:
                InventoryBinLocation,
            ) => bin,
          );

        const result =
          await service
            .createBinLocation({
              storeId:
                store.id,
              parentBinId:
                parent.id,
              binCode:
                'shelf-01',
              name:
                'Shelf 01',
              isReceivingBin:
                false,
              isDispatchBin:
                false,
              isQuarantineBin:
                false,
              createdByPersonId:
                'founder-person-1',
            });

        expect(result).toEqual(
          expect.objectContaining({
            parentBinId:
              parent.id,
            storeId:
              store.id,
            binCode:
              'SHELF-01',
          }),
        );
      },
    );

    it(
      'lists bins only after validating the store',
      async () => {
        repository
          .listBinLocations
          .mockResolvedValue([]);

        await expect(
          service.listBinLocations(
            store.id,
          ),
        ).resolves.toEqual([]);

        expect(
          repository.findStoreById,
        ).toHaveBeenCalledWith(
          store.id,
        );

        expect(
          repository.listBinLocations,
        ).toHaveBeenCalledWith(
          store.id,
        );
      },
    );

    it(
      'retrieves an existing bin',
      async () => {
        const existing:
          InventoryBinLocation = {
            id: 'bin-1',
            storeId:
              store.id,
            binCode:
              'RECV-01',
            name:
              'Receiving Bin',
            isReceivingBin:
              true,
            isDispatchBin:
              false,
            isQuarantineBin:
              false,
            isActive:
              true,
            createdAt:
              new Date(),
            updatedAt:
              new Date(),
          };

        repository
          .findBinLocationById
          .mockResolvedValue(existing);

        await expect(
          service.getBinLocation(
            existing.id,
          ),
        ).resolves.toEqual(
          existing,
        );
      },
    );

    it(
      'updates a bin and records update evidence',
      async () => {
        const existing:
          InventoryBinLocation = {
            id: 'bin-1',
            storeId:
              store.id,
            binCode:
              'RECV-01',
            name:
              'Receiving Bin',
            description:
              'Old description',
            barcode:
              'OLD-CODE',
            isReceivingBin:
              true,
            isDispatchBin:
              false,
            isQuarantineBin:
              false,
            isActive:
              true,
            createdAt:
              new Date(),
            updatedAt:
              new Date(),
          };

        repository
          .findBinLocationById
          .mockResolvedValue(existing);

        repository
          .updateBinLocation
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
          await service
            .updateBinLocation(
              existing.id,
              {
                name:
                  ' Main Receiving Bin ',
                description:
                  ' Updated receiving area ',
                barcode:
                  ' BIN-MAIN-01 ',
                isReceivingBin:
                  false,
                isDispatchBin:
                  true,
                isQuarantineBin:
                  true,
                isActive:
                  false,
                updatedByPersonId:
                  'founder-person-2',
                remarks:
                  'FAT bin update',
              },
            );

        expect(result).toEqual(
          expect.objectContaining({
            id:
              existing.id,
            name:
              'Main Receiving Bin',
            description:
              'Updated receiving area',
            barcode:
              'BIN-MAIN-01',
            isReceivingBin:
              false,
            isDispatchBin:
              true,
            isQuarantineBin:
              true,
            isActive:
              false,
          }),
        );

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.BIN_UPDATED,
          'core.inventory',
          expect.objectContaining({
            binLocationId:
              existing.id,
            storeId:
              store.id,
            actorPersonId:
              'founder-person-2',
            remarks:
              'FAT bin update',
          }),
        );
      },
    );

    it(
      'rejects creating a bin in an inactive store',
      async () => {
        repository
          .findStoreById
          .mockResolvedValue({
            ...store,
            isActive:
              false,
          });

        await expect(
          service.createBinLocation({
            storeId:
              store.id,
            binCode:
              'BLOCKED',
            name:
              'Blocked Bin',
            isReceivingBin:
              false,
            isDispatchBin:
              false,
            isQuarantineBin:
              false,
            createdByPersonId:
              'founder-person-1',
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.createBinLocation,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects a parent bin from another store',
      async () => {
        repository
          .findBinLocationById
          .mockResolvedValue({
            id:
              'foreign-parent',
            storeId:
              'store-2',
            binCode:
              'FOREIGN',
            name:
              'Foreign',
            isReceivingBin:
              false,
            isDispatchBin:
              false,
            isQuarantineBin:
              false,
            isActive:
              true,
            createdAt:
              new Date(),
            updatedAt:
              new Date(),
          });

        await expect(
          service.createBinLocation({
            storeId:
              store.id,
            parentBinId:
              'foreign-parent',
            binCode:
              'CHILD',
            name:
              'Child',
            isReceivingBin:
              false,
            isDispatchBin:
              false,
            isQuarantineBin:
              false,
            createdByPersonId:
              'founder-person-1',
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );

    it(
      'rejects making a bin its own parent',
      async () => {
        const existing:
          InventoryBinLocation = {
            id:
              'bin-self',
            storeId:
              store.id,
            binCode:
              'SELF',
            name:
              'Self',
            isReceivingBin:
              false,
            isDispatchBin:
              false,
            isQuarantineBin:
              false,
            isActive:
              true,
            createdAt:
              new Date(),
            updatedAt:
              new Date(),
          };

        repository
          .findBinLocationById
          .mockResolvedValue(existing);

        await expect(
          service.updateBinLocation(
            existing.id,
            {
              parentBinId:
                existing.id,
              updatedByPersonId:
                'founder-person-1',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.updateBinLocation,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects an unknown bin',
      async () => {
        repository
          .findBinLocationById
          .mockResolvedValue(null);

        await expect(
          service.getBinLocation(
            'missing-bin',
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );

    it(
      'maps duplicate bin creation to a conflict',
      async () => {
        repository
          .createBinLocation
          .mockRejectedValue({
            code:
              '23505',
          });

        await expect(
          service.createBinLocation({
            storeId:
              store.id,
            binCode:
              'RECV-01',
            name:
              'Receiving Bin',
            isReceivingBin:
              true,
            isDispatchBin:
              false,
            isQuarantineBin:
              false,
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
