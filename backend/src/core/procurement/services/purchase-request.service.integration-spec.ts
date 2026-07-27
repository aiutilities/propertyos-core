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
  PurchaseRequestDetails,
  PurchaseRequestRepository,
} from '../repositories/purchase-request.repository';
import {
  ProcurementMetrics,
  PurchaseRequestStatus,
} from '../types/procurement.types';
import {
  PurchaseRequestService,
} from './purchase-request.service';

describe(
  'PurchaseRequestService integration contract',
  () => {
    let repository:
      jest.Mocked<PurchaseRequestRepository>;

    let service:
      PurchaseRequestService;

    const createRequest = (
      status:
        PurchaseRequestStatus =
          PurchaseRequestStatus.DRAFT,
    ): PurchaseRequestDetails => {
      const now =
        new Date(
          '2026-07-27T00:00:00.000Z',
        );

      return {
        id: 'purchase-request-1',
        requestNumber: 'PR-20260727-001',
        propertyId: 'property-1',
        categoryId: 'category-1',
        requestedByPersonId: 'person-1',
        title: 'Purchase room furniture',
        description: 'Furniture for studio rooms',
        businessJustification:
          'Required for tenant occupancy',
        priority: 'HIGH',
        status,
        estimatedAmount: 50000,
        currency: 'INR',
        metadata: {},
        createdAt: now,
        updatedAt: now,
        items: [],
        history: [],
      } as PurchaseRequestDetails;
    };

    beforeEach(() => {
      repository = {
        create: jest.fn(),
        findById: jest.fn(),
        list: jest.fn(),
        update: jest.fn(),
        addHistory: jest.fn(),
        listCategories: jest.fn(),
        getMetrics: jest.fn(),
      };

      service =
        new PurchaseRequestService(
          repository,
          {} as AuditService,
          {} as EventBusService,
        );
    });

    it(
      'delegates filtered purchase-request listing',
      async () => {
        const request =
          createRequest();

        repository.list.mockResolvedValue([
          request,
        ]);

        const filters = {
          propertyId: 'property-1',
          status:
            PurchaseRequestStatus.DRAFT,
          search: 'furniture',
        };

        await expect(
          service.list(filters),
        ).resolves.toEqual([
          request,
        ]);

        expect(
          repository.list,
        ).toHaveBeenCalledWith(
          filters,
        );
      },
    );

    it(
      'returns an existing purchase request',
      async () => {
        const request =
          createRequest();

        repository.findById.mockResolvedValue(
          request,
        );

        await expect(
          service.get(request.id),
        ).resolves.toEqual(
          request,
        );

        expect(
          repository.findById,
        ).toHaveBeenCalledWith(
          request.id,
        );
      },
    );

    it(
      'rejects lookup of a missing purchase request',
      async () => {
        repository.findById.mockResolvedValue(
          null,
        );

        await expect(
          service.get('missing-request'),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );

    it(
      'delegates category and metrics retrieval',
      async () => {
        const categories = [
          {
            id: 'category-1',
            name: 'Furniture',
            code: 'FURNITURE',
            isActive: true,
          },
        ];

        const metrics = {
          totalRequests: 10,
          draftRequests: 2,
          submittedRequests: 3,
          approvedRequests: 4,
          rejectedRequests: 1,
          estimatedAmount: 250000,
        } as unknown as
          ProcurementMetrics;

        repository.listCategories
          .mockResolvedValue(
            categories as never,
          );

        repository.getMetrics
          .mockResolvedValue(metrics);

        await expect(
          service.categories(),
        ).resolves.toEqual(
          categories,
        );

        await expect(
          service.metrics(),
        ).resolves.toEqual(
          metrics,
        );

        expect(
          repository.listCategories,
        ).toHaveBeenCalledTimes(1);

        expect(
          repository.getMetrics,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'blocks editing a non-draft request',
      async () => {
        const request =
          createRequest(
            PurchaseRequestStatus.SUBMITTED,
          );

        repository.findById.mockResolvedValue(
          request,
        );

        const dto = {
          title: 'Updated title',
          updatedByPersonId: 'person-2',
        } as Parameters<
          PurchaseRequestService['update']
        >[1];

        await expect(
          service.update(
            request.id,
            dto,
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.update,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
