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
  ProcurementRfqDetails,
  ProcurementRfqRepository,
} from '../repositories/procurement-rfq.repository';
import {
  ProcurementPriority,
  PurchaseRequestStatus,
  RfqStatus,
} from '../types/procurement.types';
import {
  ProcurementRfqService,
} from './procurement-rfq.service';
import {
  PurchaseRequestService,
} from './purchase-request.service';

describe(
  'ProcurementRfqService integration contract',
  () => {
    let repository:
      jest.Mocked<ProcurementRfqRepository>;

    let purchaseRequestService:
      jest.Mocked<
        Pick<
          PurchaseRequestService,
          'get' | 'markConvertedToRfq'
        >
      >;

    let service:
      ProcurementRfqService;

    const createRfq = (
      status:
        RfqStatus =
          RfqStatus.DRAFT,
    ): ProcurementRfqDetails => {
      const now =
        new Date(
          '2026-07-27T00:00:00.000Z',
        );

      return {
        id: 'rfq-1',
        rfqNumber: 'RFQ-20260727-001',
        purchaseRequestId:
          'purchase-request-1',
        propertyId: 'property-1',
        title: 'Room furniture RFQ',
        description:
          'Furniture procurement',
        status,
        quotationDeadline:
          new Date(
            '2026-08-15T00:00:00.000Z',
          ),
        deliveryRequiredBy:
          new Date(
            '2026-09-01T00:00:00.000Z',
          ),
        currency: 'INR',
        createdByPersonId:
          'person-1',
        createdAt: now,
        updatedAt: now,
        items: [],
        vendors: [],
        history: [],
      } as ProcurementRfqDetails;
    };

    beforeEach(() => {
      repository = {
        create: jest.fn(),
        findById: jest.fn(),
        findByPurchaseRequestId:
          jest.fn(),
        findActiveVendorIds:
          jest.fn(),
        list: jest.fn(),
        update: jest.fn(),
        addHistory: jest.fn(),
        markVendorViewed:
          jest.fn(),
        markVendorResponded:
          jest.fn(),
        markVendorDeclined:
          jest.fn(),
      };

      purchaseRequestService = {
        get: jest.fn<
          PurchaseRequestService['get']
        >(),
        markConvertedToRfq: jest.fn<
          PurchaseRequestService[
            'markConvertedToRfq'
          ]
        >(),
      };

      service =
        new ProcurementRfqService(
          repository,
          purchaseRequestService as unknown as
            PurchaseRequestService,
          {} as AuditService,
          {} as EventBusService,
        );
    });

    it(
      'delegates filtered RFQ listing',
      async () => {
        const rfq =
          createRfq();

        repository.list.mockResolvedValue([
          rfq,
        ]);

        const filters = {
          purchaseRequestId:
            'purchase-request-1',
          propertyId:
            'property-1',
          status:
            RfqStatus.DRAFT,
          search:
            'furniture',
        };

        await expect(
          service.list(filters),
        ).resolves.toEqual([
          rfq,
        ]);

        expect(
          repository.list,
        ).toHaveBeenCalledWith(
          filters,
        );
      },
    );

    it(
      'returns an existing RFQ',
      async () => {
        const rfq =
          createRfq();

        repository.findById
          .mockResolvedValue(rfq);

        await expect(
          service.get(rfq.id),
        ).resolves.toEqual(
          rfq,
        );

        expect(
          repository.findById,
        ).toHaveBeenCalledWith(
          rfq.id,
        );
      },
    );

    it(
      'rejects lookup of a missing RFQ',
      async () => {
        repository.findById
          .mockResolvedValue(null);

        await expect(
          service.get('missing-rfq'),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );

    it(
      'blocks RFQ creation from a non-approved purchase request',
      async () => {
        purchaseRequestService.get
          .mockResolvedValue({
            id:
              'purchase-request-1',
            requestNumber:
              'PR-20260727-001',
            propertyId:
              'property-1',
            categoryId:
              'category-1',
            requestedByPersonId:
              'person-1',
            title:
              'Room furniture purchase',
            priority:
              ProcurementPriority.HIGH,
            status:
              PurchaseRequestStatus
                .SUBMITTED,
            estimatedAmount:
              50000,
            currency:
              'INR',
            metadata:
              {},
            createdAt:
              new Date(
                '2026-07-27T00:00:00.000Z',
              ),
            updatedAt:
              new Date(
                '2026-07-27T00:00:00.000Z',
              ),
            items:
              [],
            history:
              [],
          });

        const dto = {
          purchaseRequestId:
            'purchase-request-1',
          title:
            'Room furniture RFQ',
          quotationDeadline:
            '2027-08-15T00:00:00.000Z',
          vendorIds: [
            'vendor-1',
          ],
          createdByPersonId:
            'person-1',
        } as Parameters<
          ProcurementRfqService['create']
        >[0];

        await expect(
          service.create(dto),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.create,
        ).not.toHaveBeenCalled();

        expect(
          repository
            .findByPurchaseRequestId,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'blocks editing a non-draft RFQ',
      async () => {
        const rfq =
          createRfq(
            RfqStatus.ISSUED,
          );

        repository.findById
          .mockResolvedValue(rfq);

        const dto = {
          title:
            'Updated furniture RFQ',
          updatedByPersonId:
            'person-2',
        } as Parameters<
          ProcurementRfqService['update']
        >[1];

        await expect(
          service.update(
            rfq.id,
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
