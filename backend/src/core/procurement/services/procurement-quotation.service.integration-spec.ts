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
  ProcurementQuotationDetails,
  ProcurementQuotationRepository,
} from '../repositories/procurement-quotation.repository';
import {
  ProcurementRfqDetails,
} from '../repositories/procurement-rfq.repository';
import {
  QuotationStatus,
  RfqStatus,
} from '../types/procurement.types';
import {
  ProcurementQuotationService,
} from './procurement-quotation.service';
import {
  ProcurementRfqService,
} from './procurement-rfq.service';

describe(
  'ProcurementQuotationService integration contract',
  () => {
    let repository:
      jest.Mocked<ProcurementQuotationRepository>;

    let rfqService:
      jest.Mocked<
        Pick<
          ProcurementRfqService,
          'get' | 'markVendorResponded'
        >
      >;

    let service:
      ProcurementQuotationService;

    const createQuotation = (
      status:
        QuotationStatus =
          QuotationStatus.DRAFT,
    ): ProcurementQuotationDetails => {
      const now =
        new Date(
          '2026-07-27T00:00:00.000Z',
        );

      return {
        id: 'quotation-1',
        quotationNumber:
          'QUO-20260727-001',
        rfqId: 'rfq-1',
        vendorId: 'vendor-1',
        status,
        quotationDate: now,
        validUntil:
          new Date(
            '2027-08-31T00:00:00.000Z',
          ),
        deliveryDays: 14,
        subtotal: 50000,
        discountAmount: 1000,
        taxAmount: 8820,
        freightAmount: 500,
        totalAmount: 58320,
        currency: 'INR',
        paymentTerms:
          '30 days from invoice',
        deliveryTerms:
          'Delivered at site',
        createdAt: now,
        updatedAt: now,
        items: [],
        history: [],
      } as ProcurementQuotationDetails;
    };

    const createRfq = (
      status:
        RfqStatus =
          RfqStatus.OPEN,
    ): ProcurementRfqDetails => {
      const now =
        new Date(
          '2026-07-27T00:00:00.000Z',
        );

      return {
        id: 'rfq-1',
        rfqNumber:
          'RFQ-20260727-001',
        purchaseRequestId:
          'purchase-request-1',
        propertyId:
          'property-1',
        title:
          'Room furniture RFQ',
        status,
        quotationDeadline:
          new Date(
            '2027-08-15T00:00:00.000Z',
          ),
        deliveryRequiredBy:
          new Date(
            '2027-09-01T00:00:00.000Z',
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
        findByRfqAndVendor:
          jest.fn(),
        list: jest.fn(),
        update: jest.fn(),
        addHistory: jest.fn(),
        listRfqItemIds:
          jest.fn(),
        isVendorInvited:
          jest.fn(),
      };

      rfqService = {
        get: jest.fn<
          ProcurementRfqService['get']
        >(),
        markVendorResponded:
          jest.fn<
            ProcurementRfqService[
              'markVendorResponded'
            ]
          >(),
      };

      service =
        new ProcurementQuotationService(
          repository,
          rfqService as unknown as
            ProcurementRfqService,
          {} as AuditService,
          {} as EventBusService,
        );
    });

    it(
      'delegates filtered quotation listing',
      async () => {
        const quotation =
          createQuotation();

        repository.list.mockResolvedValue([
          quotation,
        ]);

        const filters = {
          rfqId: 'rfq-1',
          vendorId: 'vendor-1',
          propertyId: 'property-1',
          status:
            QuotationStatus.DRAFT,
          search: 'furniture',
        };

        await expect(
          service.list(filters),
        ).resolves.toEqual([
          quotation,
        ]);

        expect(
          repository.list,
        ).toHaveBeenCalledWith(
          filters,
        );
      },
    );

    it(
      'returns an existing quotation',
      async () => {
        const quotation =
          createQuotation();

        repository.findById
          .mockResolvedValue(
            quotation,
          );

        await expect(
          service.get(quotation.id),
        ).resolves.toEqual(
          quotation,
        );

        expect(
          repository.findById,
        ).toHaveBeenCalledWith(
          quotation.id,
        );
      },
    );

    it(
      'rejects lookup of a missing quotation',
      async () => {
        repository.findById
          .mockResolvedValue(null);

        await expect(
          service.get(
            'missing-quotation',
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );

    it(
      'blocks quotation creation for a non-open RFQ',
      async () => {
        rfqService.get
          .mockResolvedValue(
            createRfq(
              RfqStatus.CLOSED,
            ),
          );

        const dto = {
          rfqId: 'rfq-1',
          vendorId: 'vendor-1',
          validUntil:
            '2027-08-31T00:00:00.000Z',
          submittedByPersonId:
            'person-2',
          items: [],
        } as Parameters<
          ProcurementQuotationService[
            'create'
          ]
        >[0];

        await expect(
          service.create(dto),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.isVendorInvited,
        ).not.toHaveBeenCalled();

        expect(
          repository.create,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'blocks editing a non-draft quotation',
      async () => {
        const quotation =
          createQuotation(
            QuotationStatus.SUBMITTED,
          );

        repository.findById
          .mockResolvedValue(
            quotation,
          );

        const dto = {
          notes:
            'Updated quotation notes',
          updatedByPersonId:
            'person-2',
        } as Parameters<
          ProcurementQuotationService[
            'update'
          ]
        >[1];

        await expect(
          service.update(
            quotation.id,
            dto,
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.listRfqItemIds,
        ).not.toHaveBeenCalled();

        expect(
          repository.update,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
