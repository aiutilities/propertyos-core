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
  InventoryItemCategory,
} from '../types/inventory.types';

import {
  InventoryService,
} from './inventory.service';

describe(
  'InventoryService Category FAT contract',
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
        createCategory:
          jest.fn(),
        listCategories:
          jest.fn(),
        findCategoryById:
          jest.fn(),
        updateCategory:
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
      'creates a normalized active root category and records evidence',
      async () => {
        repository
          .createCategory
          .mockImplementation(
            async (
              category:
                InventoryItemCategory,
            ) => category,
          );

        const result =
          await service
            .createCategory({
              code: '  electrical ',
              name:
                ' Electrical Supplies ',
              description:
                '  Electrical inventory  ',
              createdByPersonId:
                'founder-person-1',
            });

        expect(result).toEqual(
          expect.objectContaining({
            code: 'ELECTRICAL',
            name:
              'Electrical Supplies',
            description:
              'Electrical inventory',
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
          repository.createCategory,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'ELECTRICAL',
            name:
              'Electrical Supplies',
            description:
              'Electrical inventory',
            isActive: true,
          }),
        );

        const expectedPayload =
          expect.objectContaining({
            entityType:
              'inventory.category',
            entityId:
              result.id,
            categoryId:
              result.id,
            code: 'ELECTRICAL',
            actorPersonId:
              'founder-person-1',
          });

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.CATEGORY_CREATED,
          'core.inventory',
          expectedPayload,
        );

        expect(
          auditService.record,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.CATEGORY_CREATED,
          'core.inventory',
          expectedPayload,
        );
      },
    );

    it(
      'creates a child category only when its parent is active',
      async () => {
        const parent:
          InventoryItemCategory = {
            id: 'category-parent',
            code: 'ELECTRICAL',
            name:
              'Electrical Supplies',
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
          .findCategoryById
          .mockResolvedValue(parent);

        repository
          .createCategory
          .mockImplementation(
            async (
              category:
                InventoryItemCategory,
            ) => category,
          );

        const result =
          await service
            .createCategory({
              parentCategoryId:
                parent.id,
              code: 'switches',
              name: 'Switches',
              createdByPersonId:
                'founder-person-1',
            });

        expect(
          repository.findCategoryById,
        ).toHaveBeenCalledWith(
          parent.id,
        );

        expect(result).toEqual(
          expect.objectContaining({
            parentCategoryId:
              parent.id,
            code: 'SWITCHES',
            name: 'Switches',
            isActive: true,
          }),
        );

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.CATEGORY_CREATED,
          'core.inventory',
          expect.objectContaining({
            parentCategoryId:
              parent.id,
          }),
        );
      },
    );

    it(
      'lists active categories by default',
      async () => {
        repository
          .listCategories
          .mockResolvedValue([]);

        await expect(
          service.listCategories(),
        ).resolves.toEqual([]);

        expect(
          repository.listCategories,
        ).toHaveBeenCalledWith(true);
      },
    );

    it(
      'updates a category and records update evidence',
      async () => {
        const existing:
          InventoryItemCategory = {
            id: 'category-1',
            code: 'ELECTRICAL',
            name:
              'Electrical Supplies',
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
          .findCategoryById
          .mockResolvedValue(existing);

        repository
          .updateCategory
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
            .updateCategory(
              existing.id,
              {
                name:
                  ' Electrical Components ',
                description:
                  ' Updated category ',
                isActive: false,
                updatedByPersonId:
                  'founder-person-1',
                remarks:
                  'FAT category update',
              },
            );

        expect(result).toEqual(
          expect.objectContaining({
            id: existing.id,
            code: 'ELECTRICAL',
            name:
              'Electrical Components',
            description:
              'Updated category',
            isActive: false,
          }),
        );

        expect(
          repository.updateCategory,
        ).toHaveBeenCalledWith(
          existing.id,
          expect.objectContaining({
            name:
              'Electrical Components',
            description:
              'Updated category',
            isActive: false,
          }),
        );

        const expectedPayload =
          expect.objectContaining({
            entityType:
              'inventory.category',
            entityId:
              existing.id,
            categoryId:
              existing.id,
            code: 'ELECTRICAL',
            actorPersonId:
              'founder-person-1',
            remarks:
              'FAT category update',
          });

        expect(
          eventBus.publish,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.CATEGORY_UPDATED,
          'core.inventory',
          expectedPayload,
        );

        expect(
          auditService.record,
        ).toHaveBeenCalledWith(
          INVENTORY_EVENTS.CATEGORY_UPDATED,
          'core.inventory',
          expectedPayload,
        );
      },
    );

    it(
      'rejects an inactive parent category without persistence',
      async () => {
        repository
          .findCategoryById
          .mockResolvedValue({
            id: 'inactive-parent',
            code: 'OLD',
            name: 'Old',
            isActive: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

        await expect(
          service.createCategory({
            parentCategoryId:
              'inactive-parent',
            code: 'CHILD',
            name: 'Child',
            createdByPersonId:
              'founder-person-1',
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.createCategory,
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
      'rejects making a category its own parent',
      async () => {
        const existing:
          InventoryItemCategory = {
            id: 'category-self',
            code: 'SELF',
            name: 'Self',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

        repository
          .findCategoryById
          .mockResolvedValue(existing);

        await expect(
          service.updateCategory(
            existing.id,
            {
              parentCategoryId:
                existing.id,
              updatedByPersonId:
                'founder-person-1',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.updateCategory,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects an unknown category',
      async () => {
        repository
          .findCategoryById
          .mockResolvedValue(null);

        await expect(
          service.getCategory(
            'missing-category',
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );

    it(
      'maps duplicate category persistence to a conflict',
      async () => {
        repository
          .createCategory
          .mockRejectedValue({
            code: '23505',
          });

        await expect(
          service.createCategory({
            code: 'TOOLS',
            name: 'Tools',
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
