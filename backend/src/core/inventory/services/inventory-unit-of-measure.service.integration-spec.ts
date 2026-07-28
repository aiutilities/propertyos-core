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
  InventoryUnitOfMeasure,
} from '../types/inventory.types';

import {
  InventoryService,
} from './inventory.service';

describe(
  'InventoryService Unit of Measure FAT contract',
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
        createUnitOfMeasure:
          jest.fn(),
        listUnitsOfMeasure:
          jest.fn(),
        findUnitOfMeasureById:
          jest.fn(),
        updateUnitOfMeasure:
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
      'creates a normalized active Unit of Measure and records evidence',
      async () => {
        repository
          .createUnitOfMeasure
          .mockImplementation(
            async (
              unit:
                InventoryUnitOfMeasure,
            ) => unit,
          );

        const result =
          await service
            .createUnitOfMeasure({
              code: '  kg  ',
              name: ' Kilogram ',
              symbol: ' kg ',
              decimalPlaces: 3,
              createdByPersonId:
                'founder-person-1',
            });

        expect(result).toEqual(
          expect.objectContaining({
            code: 'KG',
            name: 'Kilogram',
            symbol: 'kg',
            decimalPlaces: 3,
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
          repository
            .createUnitOfMeasure,
        ).toHaveBeenCalledTimes(1);

        expect(
          repository
            .createUnitOfMeasure,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'KG',
            name: 'Kilogram',
            symbol: 'kg',
            decimalPlaces: 3,
            isActive: true,
          }),
        );

        const expectedPayload =
          expect.objectContaining({
            entityType:
              'inventory.unit_of_measure',
            entityId:
              result.id,
            unitId:
              result.id,
            code: 'KG',
            name: 'Kilogram',
            actorPersonId:
              'founder-person-1',
          });

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.UNIT_CREATED,
          'core.inventory',
          expectedPayload,
        );

        expect(
          auditService.record,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.UNIT_CREATED,
          'core.inventory',
          expectedPayload,
        );
      },
    );

    it(
      'lists active Units of Measure by default',
      async () => {
        repository
          .listUnitsOfMeasure
          .mockResolvedValue([]);

        await expect(
          service.listUnitsOfMeasure(),
        ).resolves.toEqual([]);

        expect(
          repository
            .listUnitsOfMeasure,
        ).toHaveBeenCalledWith(true);
      },
    );

    it(
      'updates a Unit of Measure and records update evidence',
      async () => {
        const existing:
          InventoryUnitOfMeasure = {
            id: 'unit-1',
            code: 'KG',
            name: 'Kilogram',
            symbol: 'kg',
            decimalPlaces: 3,
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
          .findUnitOfMeasureById
          .mockResolvedValue(existing);

        repository
          .updateUnitOfMeasure
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
            .updateUnitOfMeasure(
              existing.id,
              {
                name:
                  ' Kilogram Metric ',
                symbol: ' KG ',
                decimalPlaces: 4,
                isActive: false,
                updatedByPersonId:
                  'founder-person-1',
                remarks:
                  'FAT lifecycle update',
              },
            );

        expect(result).toEqual(
          expect.objectContaining({
            id: 'unit-1',
            code: 'KG',
            name:
              'Kilogram Metric',
            symbol: 'KG',
            decimalPlaces: 4,
            isActive: false,
          }),
        );

        expect(
          repository
            .updateUnitOfMeasure,
        ).toHaveBeenCalledWith(
          existing.id,
          expect.objectContaining({
            name:
              'Kilogram Metric',
            symbol: 'KG',
            decimalPlaces: 4,
            isActive: false,
          }),
        );

        const expectedPayload =
          expect.objectContaining({
            entityType:
              'inventory.unit_of_measure',
            entityId: existing.id,
            unitId: existing.id,
            code: 'KG',
            actorPersonId:
              'founder-person-1',
            remarks:
              'FAT lifecycle update',
          });

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.UNIT_UPDATED,
          'core.inventory',
          expectedPayload,
        );

        expect(
          auditService.record,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.UNIT_UPDATED,
          'core.inventory',
          expectedPayload,
        );
      },
    );

    it(
      'rejects invalid decimal precision without persistence',
      async () => {
        await expect(
          service.createUnitOfMeasure({
            code: 'LTR',
            name: 'Litre',
            symbol: 'L',
            decimalPlaces: 7,
            createdByPersonId:
              'founder-person-1',
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository
            .createUnitOfMeasure,
        ).not.toHaveBeenCalled();

        expect(
          eventBus.publish,
        ).not.toHaveBeenCalled();

        expect(
          auditService.record,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects an unknown Unit of Measure',
      async () => {
        repository
          .findUnitOfMeasureById
          .mockResolvedValue(null);

        await expect(
          service.getUnitOfMeasure(
            'missing-unit',
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );

    it(
      'maps duplicate Unit of Measure persistence to a conflict',
      async () => {
        repository
          .createUnitOfMeasure
          .mockRejectedValue({
            code: '23505',
          });

        await expect(
          service.createUnitOfMeasure({
            code: 'EA',
            name: 'Each',
            symbol: 'ea',
            decimalPlaces: 0,
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
