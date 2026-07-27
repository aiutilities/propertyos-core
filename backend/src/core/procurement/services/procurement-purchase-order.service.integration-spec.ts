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
  PurchaseOrderDetails,
  PurchaseOrderRepository,
} from '../repositories/procurement-purchase-order.repository';
import {
  ProcurementQuotationDetails,
  ProcurementQuotationRepository,
} from '../repositories/procurement-quotation.repository';
import {
  ProcurementRfqDetails,
} from '../repositories/procurement-rfq.repository';
import {
  PurchaseOrderStatus,
  QuotationStatus,
  RfqStatus,
} from '../types/procurement.types';
import {
  ProcurementPurchaseOrderService,
} from './procurement-purchase-order.service';
import {
  ProcurementRfqService,
} from './procurement-rfq.service';
import {
  ProcurementTransitionMetricsService,
} from './procurement-transition-metrics.service';

describe(
  'ProcurementPurchaseOrderService integration contract',
  () => {
    let repository:
      jest.Mocked<PurchaseOrderRepository>;

    let quotationRepository:
      jest.Mocked<ProcurementQuotationRepository>;

    let rfqService:
      jest.Mocked<
        Pick<
          ProcurementRfqService,
          'get'
        >
      >;

    let transitionMetrics: {
      observe: jest.Mock;
    };

    let service:
      ProcurementPurchaseOrderService;

    const createPurchaseOrder = (
      status:
        PurchaseOrderStatus =
          PurchaseOrderStatus.DRAFT,
    ): PurchaseOrderDetails => {
      const now =
        new Date(
          '2026-07-27T00:00:00.000Z',
        );

      return {
        id: 'purchase-order-1',
        purchaseOrderNumber:
          'PO-20260727-001',
        propertyId:
          'property-1',
        vendorId:
          'vendor-1',
        purchaseRequestId:
          'purchase-request-1',
        rfqId:
          'rfq-1',
        quotationId:
          'quotation-1',
        title:
          'Room furniture order',
        description:
          'Furniture for studio rooms',
        status,
        orderDate:
          now,
        expectedDeliveryDate:
          new Date(
            '2026-08-15T00:00:00.000Z',
          ),
        subtotal:
          50000,
        discountAmount:
          1000,
        taxAmount:
          8820,
        freightAmount:
          500,
        totalAmount:
          58320,
        currency:
          'INR',
        paymentTerms:
          '30 days',
        deliveryTerms:
          'Delivered at site',
        shippingAddress:
          'Advaith Nest, Chennai',
        billingAddress:
          'Advaith Nest, Chennai',
        createdByPersonId:
          'person-1',
        createdAt:
          now,
        updatedAt:
          now,
        items:
          [],
        history:
          [],
      } as PurchaseOrderDetails;
    };

    const createQuotation = (
      status:
        QuotationStatus =
          QuotationStatus.SELECTED,
    ): ProcurementQuotationDetails => {
      const now =
        new Date(
          '2026-07-27T00:00:00.000Z',
        );

      return {
        id:
          'quotation-1',
        quotationNumber:
          'QUO-20260727-001',
        rfqId:
          'rfq-1',
        vendorId:
          'vendor-1',
        status,
        quotationDate:
          now,
        validUntil:
          new Date(
            '2026-08-31T00:00:00.000Z',
          ),
        deliveryDays:
          14,
        subtotal:
          50000,
        discountAmount:
          1000,
        taxAmount:
          8820,
        freightAmount:
          500,
        totalAmount:
          58320,
        currency:
          'INR',
        paymentTerms:
          '30 days',
        deliveryTerms:
          'Delivered at site',
        notes:
          'Furniture quotation',
        createdAt:
          now,
        updatedAt:
          now,
        items:
          [],
        history:
          [],
      } as ProcurementQuotationDetails;
    };

    const createRfq =
      (): ProcurementRfqDetails => {
        const now =
          new Date(
            '2026-07-27T00:00:00.000Z',
          );

        return {
          id:
            'rfq-1',
          rfqNumber:
            'RFQ-20260727-001',
          purchaseRequestId:
            'purchase-request-1',
          propertyId:
            'property-1',
          title:
            'Room furniture RFQ',
          status:
            RfqStatus.OPEN,
          quotationDeadline:
            new Date(
              '2026-08-10T00:00:00.000Z',
            ),
          currency:
            'INR',
          createdByPersonId:
            'person-1',
          createdAt:
            now,
          updatedAt:
            now,
          items:
            [],
          vendors:
            [],
          history:
            [],
        } as ProcurementRfqDetails;
      };

    beforeEach(() => {
      repository = {
        create:
          jest.fn(),
        findById:
          jest.fn(),
        findByQuotationId:
          jest.fn(),
        list:
          jest.fn(),
        update:
          jest.fn(),
        addHistory:
          jest.fn(),
      };

      quotationRepository = {
        create:
          jest.fn(),
        findById:
          jest.fn(),
        findByRfqAndVendor:
          jest.fn(),
        list:
          jest.fn(),
        update:
          jest.fn(),
        addHistory:
          jest.fn(),
        listRfqItemIds:
          jest.fn(),
        isVendorInvited:
          jest.fn(),
      };

      rfqService = {
        get: jest.fn<
          ProcurementRfqService['get']
        >(),
      };

      transitionMetrics = {
        observe:
          jest.fn(),
      };

      const auditService =
        new Proxy(
          {},
          {
            get: () =>
              async () => undefined,
          },
        ) as unknown as AuditService;

      const eventBus =
        {
          publish:
            async () => undefined,
        } as unknown as EventBusService;

      service =
        new ProcurementPurchaseOrderService(
          repository,
          quotationRepository,
          rfqService as unknown as
            ProcurementRfqService,
          auditService,
          eventBus,
          transitionMetrics as unknown as
            ProcurementTransitionMetricsService,
        );
    });

    it(
      'delegates filtered Purchase Order listing',
      async () => {
        const purchaseOrder =
          createPurchaseOrder();

        repository.list.mockResolvedValue([
          purchaseOrder,
        ]);

        const filters = {
          quotationId:
            'quotation-1',
          rfqId:
            'rfq-1',
          purchaseRequestId:
            'purchase-request-1',
          propertyId:
            'property-1',
          vendorId:
            'vendor-1',
          status:
            PurchaseOrderStatus.DRAFT,
          search:
            'furniture',
        };

        await expect(
          service.list(filters),
        ).resolves.toEqual([
          purchaseOrder,
        ]);

        expect(
          repository.list,
        ).toHaveBeenCalledWith(
          filters,
        );
      },
    );

    it(
      'returns an existing Purchase Order',
      async () => {
        const purchaseOrder =
          createPurchaseOrder();

        repository.findById
          .mockResolvedValue(
            purchaseOrder,
          );

        await expect(
          service.get(
            purchaseOrder.id,
          ),
        ).resolves.toEqual(
          purchaseOrder,
        );

        expect(
          repository.findById,
        ).toHaveBeenCalledWith(
          purchaseOrder.id,
        );
      },
    );

    it(
      'rejects lookup of a missing Purchase Order',
      async () => {
        repository.findById
          .mockResolvedValue(
            null,
          );

        await expect(
          service.get(
            'missing-purchase-order',
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );

    it(
      'blocks creation from a quotation that is not selected',
      async () => {
        quotationRepository.findById
          .mockResolvedValue(
            createQuotation(
              QuotationStatus.SUBMITTED,
            ),
          );

        const dto = {
          quotationId:
            'quotation-1',
          title:
            'Room furniture order',
          createdByPersonId:
            'person-1',
        } as Parameters<
          ProcurementPurchaseOrderService[
            'create'
          ]
        >[0];

        await expect(
          service.create(dto),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository
            .findByQuotationId,
        ).not.toHaveBeenCalled();

        expect(
          repository.create,
        ).not.toHaveBeenCalled();

        expect(
          rfqService.get,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'blocks duplicate Purchase Orders for one quotation',
      async () => {
        const quotation =
          createQuotation();

        const existing =
          createPurchaseOrder();

        quotationRepository.findById
          .mockResolvedValue(
            quotation,
          );

        repository.findByQuotationId
          .mockResolvedValue(
            existing,
          );

        const dto = {
          quotationId:
            quotation.id,
          title:
            'Room furniture order',
          createdByPersonId:
            'person-1',
        } as Parameters<
          ProcurementPurchaseOrderService[
            'create'
          ]
        >[0];

        await expect(
          service.create(dto),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository
            .findByQuotationId,
        ).toHaveBeenCalledWith(
          quotation.id,
        );

        expect(
          rfqService.get,
        ).not.toHaveBeenCalled();

        expect(
          repository.create,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'blocks editing a non-draft Purchase Order',
      async () => {
        const purchaseOrder =
          createPurchaseOrder(
            PurchaseOrderStatus.APPROVED,
          );

        repository.findById
          .mockResolvedValue(
            purchaseOrder,
          );

        const dto = {
          title:
            'Updated Purchase Order',
          updatedByPersonId:
            'person-2',
        } as Parameters<
          ProcurementPurchaseOrderService[
            'update'
          ]
        >[1];

        await expect(
          service.update(
            purchaseOrder.id,
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

    it(
      'loads the RFQ only after quotation and duplicate guards pass',
      async () => {
        const quotation =
          createQuotation();

        quotationRepository.findById
          .mockResolvedValue(
            quotation,
          );

        repository.findByQuotationId
          .mockResolvedValue(
            null,
          );

        rfqService.get
          .mockResolvedValue(
            createRfq(),
          );

        let createdPurchaseOrder:
          PurchaseOrderDetails | null =
            null;

        repository.create
          .mockImplementation(
            async (
              purchaseOrder,
              items,
            ) => {
              createdPurchaseOrder = {
                ...purchaseOrder,
                items,
                history:
                  [],
              };

              return createdPurchaseOrder;
            },
          );

        repository.addHistory
          .mockImplementation(
            async (
              history,
            ) => history,
          );

        repository.findById
          .mockImplementation(
            async (
              id,
            ) => {
              if (
                !createdPurchaseOrder ||
                id !==
                  createdPurchaseOrder.id
              ) {
                return null;
              }

              return createdPurchaseOrder;
            },
          );

        const dto = {
          quotationId:
            quotation.id,
          title:
            'Room furniture order',
          createdByPersonId:
            'person-1',
        } as Parameters<
          ProcurementPurchaseOrderService[
            'create'
          ]
        >[0];

        await expect(
          service.create(dto),
        ).resolves.toEqual(
          expect.objectContaining({
            quotationId:
              quotation.id,
            rfqId:
              'rfq-1',
            purchaseRequestId:
              'purchase-request-1',
            propertyId:
              'property-1',
            vendorId:
              'vendor-1',
          }),
        );

        expect(
          rfqService.get,
        ).toHaveBeenCalledWith(
          quotation.rfqId,
        );

        expect(
          repository.create,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );
  },
);
