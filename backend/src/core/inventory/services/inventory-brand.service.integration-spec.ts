import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
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
} from '../types/inventory.types';

import {
  InventoryService,
} from './inventory.service';

describe(
  'InventoryService Brand FAT contract',
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
        createBrand:
          jest.fn(),
        listBrands:
          jest.fn(),
        findBrandById:
          jest.fn(),
        updateBrand:
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
      'creates a normalized active brand and records evidence',
      async () => {
        repository
          .createBrand
          .mockImplementation(
            async (
              brand:
                InventoryBrand,
            ) => brand,
          );

        const result =
          await service.createBrand({
            code: '  havells ',
            name: ' Havells ',
            description:
              ' Electrical manufacturer ',
            createdByPersonId:
              'founder-person-1',
          });

        expect(result).toEqual(
          expect.objectContaining({
            code: 'HAVELLS',
            name: 'Havells',
            description:
              'Electrical manufacturer',
            isActive: true,
          }),
        );

        expect(result.id).toEqual(
          expect.any(String),
        );

        expect(
          result.createdAt,
        ).toBeInstanceOf(Date);

        expect(
          result.updatedAt,
        ).toBeInstanceOf(Date);

        expect(
          repository.createBrand,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'HAVELLS',
            name: 'Havells',
            description:
              'Electrical manufacturer',
            isActive: true,
          }),
        );

        const expectedPayload =
          expect.objectContaining({
            entityType:
              'inventory.brand',
            entityId:
              result.id,
            brandId:
              result.id,
            code: 'HAVELLS',
            actorPersonId:
              'founder-person-1',
          });

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.BRAND_CREATED,
          'core.inventory',
          expectedPayload,
        );

        expect(
          auditService.record,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.BRAND_CREATED,
          'core.inventory',
          expectedPayload,
        );
      },
    );

    it(
      'lists active brands by default',
      async () => {
        repository
          .listBrands
          .mockResolvedValue([]);

        await expect(
          service.listBrands(),
        ).resolves.toEqual([]);

        expect(
          repository.listBrands,
        ).toHaveBeenCalledWith(true);
      },
    );

    it(
      'retrieves an existing brand',
      async () => {
        const existing:
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

        repository
          .findBrandById
          .mockResolvedValue(existing);

        await expect(
          service.getBrand(existing.id),
        ).resolves.toEqual(existing);

        expect(
          repository.findBrandById,
        ).toHaveBeenCalledWith(
          existing.id,
        );
      },
    );

    it(
      'updates a brand and records update evidence',
      async () => {
        const existing:
          InventoryBrand = {
            id: 'brand-1',
            code: 'HAVELLS',
            name: 'Havells',
            description:
              'Old description',
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

        repository
          .findBrandById
          .mockResolvedValue(existing);

        repository
          .updateBrand
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
          await service.updateBrand(
            existing.id,
            {
              name:
                ' Havells India ',
              description:
                ' Updated manufacturer ',
              isActive: false,
              updatedByPersonId:
                'founder-person-1',
              remarks:
                'FAT brand update',
            },
          );

        expect(result).toEqual(
          expect.objectContaining({
            id: existing.id,
            code: 'HAVELLS',
            name:
              'Havells India',
            description:
              'Updated manufacturer',
            isActive: false,
          }),
        );

        expect(
          repository.updateBrand,
        ).toHaveBeenCalledWith(
          existing.id,
          expect.objectContaining({
            name:
              'Havells India',
            description:
              'Updated manufacturer',
            isActive: false,
          }),
        );

        const expectedPayload =
          expect.objectContaining({
            entityType:
              'inventory.brand',
            entityId:
              existing.id,
            brandId:
              existing.id,
            code: 'HAVELLS',
            actorPersonId:
              'founder-person-1',
            remarks:
              'FAT brand update',
          });

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.BRAND_UPDATED,
          'core.inventory',
          expectedPayload,
        );

        expect(
          auditService.record,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.BRAND_UPDATED,
          'core.inventory',
          expectedPayload,
        );
      },
    );

    it(
      'rejects an unknown brand',
      async () => {
        repository
          .findBrandById
          .mockResolvedValue(null);

        await expect(
          service.getBrand(
            'missing-brand',
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );

    it(
      'maps duplicate brand creation to a conflict',
      async () => {
        repository
          .createBrand
          .mockRejectedValue({
            code: '23505',
          });

        await expect(
          service.createBrand({
            code: 'ANCHOR',
            name: 'Anchor',
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

    it(
      'maps duplicate brand update to a conflict',
      async () => {
        const existing:
          InventoryBrand = {
            id: 'brand-1',
            code: 'HAVELLS',
            name: 'Havells',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

        repository
          .findBrandById
          .mockResolvedValue(existing);

        repository
          .updateBrand
          .mockRejectedValue({
            code: '23505',
          });

        await expect(
          service.updateBrand(
            existing.id,
            {
              name: 'Duplicate',
              updatedByPersonId:
                'founder-person-1',
            },
          ),
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
