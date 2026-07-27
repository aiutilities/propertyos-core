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
  GoodsReceiptDetails,
  GoodsReceiptRepository,
} from '../repositories/procurement-goods-receipt.repository';
import {
  ProcurementInvoiceMatchDetails,
  ProcurementInvoiceMatchRepository,
} from '../repositories/procurement-invoice-match.repository';
import {
  PurchaseOrderDetails,
  PurchaseOrderRepository,
} from '../repositories/procurement-purchase-order.repository';
import {
  GoodsReceiptItemStatus,
  GoodsReceiptStatus,
  InvoiceMatchStatus,
  ProcurementItemType,
  PurchaseOrderStatus,
} from '../types/procurement.types';
import {
  ProcurementInvoiceMatchService,
} from './procurement-invoice-match.service';
import {
  ProcurementTransitionMetricsService,
} from './procurement-transition-metrics.service';

describe(
  'ProcurementInvoiceMatchService foundation contract',
  () => {
    let repository:
      jest.Mocked<ProcurementInvoiceMatchRepository>;

    let purchaseOrderRepository:
      jest.Mocked<PurchaseOrderRepository>;

    let goodsReceiptRepository:
      jest.Mocked<GoodsReceiptRepository>;

    let service:
      ProcurementInvoiceMatchService;

    const createPurchaseOrder = (
      status:
        PurchaseOrderStatus =
          PurchaseOrderStatus.RECEIVED,
    ): PurchaseOrderDetails => {
      const now =
        new Date(
          '2026-07-27T00:00:00.000Z',
        );

      return {
        id:
          'purchase-order-1',
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
        status,
        orderDate:
          now,
        subtotal:
          50000,
        discountAmount:
          0,
        taxAmount:
          9000,
        freightAmount:
          0,
        totalAmount:
          59000,
        currency:
          'INR',
        createdByPersonId:
          'person-1',
        createdAt:
          now,
        updatedAt:
          now,
        items: [
          {
            id:
              'purchase-order-item-1',
            purchaseOrderId:
              'purchase-order-1',
            lineNumber:
              1,
            itemType:
              ProcurementItemType.GOODS,
            description:
              'Studio room cot',
            orderedQuantity:
              10,
            receivedQuantity:
              10,
            unit:
              'EA',
            unitPrice:
              5000,
            discountAmount:
              0,
            taxRate:
              18,
            taxAmount:
              9000,
            lineTotal:
              59000,
            createdAt:
              now,
            updatedAt:
              now,
          },
        ],
        history:
          [],
      } as PurchaseOrderDetails;
    };

    const createGoodsReceipt = (
      status:
        GoodsReceiptStatus =
          GoodsReceiptStatus.POSTED,
    ): GoodsReceiptDetails => {
      const now =
        new Date(
          '2026-07-27T00:00:00.000Z',
        );

      return {
        id:
          'goods-receipt-1',
        goodsReceiptNumber:
          'GRN-20260727-001',
        purchaseOrderId:
          'purchase-order-1',
        propertyId:
          'property-1',
        vendorId:
          'vendor-1',
        status,
        receiptDate:
          now,
        receivedByPersonId:
          'person-2',
        postedByPersonId:
          status ===
          GoodsReceiptStatus.POSTED
            ? 'person-3'
            : undefined,
        postedAt:
          status ===
          GoodsReceiptStatus.POSTED
            ? now
            : undefined,
        createdAt:
          now,
        updatedAt:
          now,
        items: [
          {
            id:
              'goods-receipt-item-1',
            goodsReceiptId:
              'goods-receipt-1',
            purchaseOrderItemId:
              'purchase-order-item-1',
            orderedQuantity:
              10,
            previouslyReceivedQuantity:
              0,
            receivedQuantity:
              10,
            acceptedQuantity:
              10,
            rejectedQuantity:
              0,
            status:
              GoodsReceiptItemStatus.ACCEPTED,
            createdAt:
              now,
            updatedAt:
              now,
          },
        ],
        history:
          [],
      } as GoodsReceiptDetails;
    };

    const createInvoiceMatch = (
      status:
        InvoiceMatchStatus =
          InvoiceMatchStatus.PENDING,
    ): ProcurementInvoiceMatchDetails => {
      const now =
        new Date(
          '2026-07-27T00:00:00.000Z',
        );

      return {
        id:
          'invoice-match-1',
        invoiceMatchNumber:
          'IM-20260727-001',
        purchaseOrderId:
          'purchase-order-1',
        goodsReceiptId:
          'goods-receipt-1',
        invoiceId:
          'invoice-1',
        vendorId:
          'vendor-1',
        propertyId:
          'property-1',
        externalInvoiceNumber:
          'INV-001',
        invoiceDate:
          now,
        invoiceAmount:
          59000,
        purchaseOrderAmount:
          59000,
        goodsReceiptAmount:
          50000,
        amountVariance:
          0,
        quantityVariance:
          0,
        status,
        matchedByPersonId:
          'person-4',
        createdAt:
          now,
        updatedAt:
          now,
        items: [
          {
            id:
              'invoice-match-item-1',
            invoiceMatchId:
              'invoice-match-1',
            purchaseOrderItemId:
              'purchase-order-item-1',
            goodsReceiptItemId:
              'goods-receipt-item-1',
            invoicedQuantity:
              10,
            orderedQuantity:
              10,
            receivedQuantity:
              10,
            unitPrice:
              5000,
            invoiceLineAmount:
              50000,
            purchaseOrderLineAmount:
              50000,
            amountVariance:
              0,
            quantityVariance:
              0,
            isMatched:
              true,
            createdAt:
              now,
          },
        ],
        history:
          [],
      } as ProcurementInvoiceMatchDetails;
    };

    beforeEach(() => {
      repository = {
        create:
          jest.fn(),
        findById:
          jest.fn(),
        list:
          jest.fn(),
        update:
          jest.fn(),
        transition:
          jest.fn(),
        addHistory:
          jest.fn(),
        listItems:
          jest.fn(),
        listHistory:
          jest.fn(),
      };

      purchaseOrderRepository = {
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

      goodsReceiptRepository = {
        create:
          jest.fn(),
        findById:
          jest.fn(),
        list:
          jest.fn(),
        update:
          jest.fn(),
        addHistory:
          jest.fn(),
        listItems:
          jest.fn(),
        listHistory:
          jest.fn(),
        aggregatePostedQuantities:
          jest.fn(),
        post:
          jest.fn(),
        reverse:
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

      const eventBus = {
        publish:
          async () => undefined,
      } as unknown as EventBusService;

      const transitionMetrics = {
        observe:
          async (
            _transition: string,
            operation:
              () => Promise<unknown>,
          ) => operation(),
      } as unknown as
        ProcurementTransitionMetricsService;

      service =
        new ProcurementInvoiceMatchService(
          repository,
          purchaseOrderRepository,
          goodsReceiptRepository,
          auditService,
          eventBus,
          transitionMetrics,
        );
    });

    it(
      'delegates filtered Invoice Match listing',
      async () => {
        const invoiceMatch =
          createInvoiceMatch();

        repository.list.mockResolvedValue([
          invoiceMatch,
        ]);

        const filters = {
          purchaseOrderId:
            'purchase-order-1',
          goodsReceiptId:
            'goods-receipt-1',
          vendorId:
            'vendor-1',
          propertyId:
            'property-1',
          status:
            InvoiceMatchStatus.PENDING,
          search:
            'INV-001',
        };

        await expect(
          service.list(filters),
        ).resolves.toEqual([
          invoiceMatch,
        ]);

        expect(
          repository.list,
        ).toHaveBeenCalledWith(
          filters,
        );
      },
    );

    it(
      'returns an existing Invoice Match',
      async () => {
        const invoiceMatch =
          createInvoiceMatch();

        repository.findById
          .mockResolvedValue(
            invoiceMatch,
          );

        await expect(
          service.get(
            invoiceMatch.id,
          ),
        ).resolves.toEqual(
          invoiceMatch,
        );
      },
    );

    it(
      'rejects lookup of a missing Invoice Match',
      async () => {
        repository.findById
          .mockResolvedValue(
            null,
          );

        await expect(
          service.get(
            'missing-invoice-match',
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );

    it(
      'blocks creation for an ineligible Purchase Order status',
      async () => {
        purchaseOrderRepository.findById
          .mockResolvedValue(
            createPurchaseOrder(
              PurchaseOrderStatus.DRAFT,
            ),
          );

        const dto = {
          purchaseOrderId:
            'purchase-order-1',
          invoiceAmount:
            59000,
          matchedByPersonId:
            'person-4',
          items: [
            {
              purchaseOrderItemId:
                'purchase-order-item-1',
              invoicedQuantity:
                10,
              unitPrice:
                5000,
            },
          ],
        } as Parameters<
          ProcurementInvoiceMatchService[
            'create'
          ]
        >[0];

        await expect(
          service.create(dto),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          goodsReceiptRepository
            .findById,
        ).not.toHaveBeenCalled();

        expect(
          repository.create,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'blocks matching a Goods Receipt that is not posted',
      async () => {
        purchaseOrderRepository.findById
          .mockResolvedValue(
            createPurchaseOrder(),
          );

        goodsReceiptRepository.findById
          .mockResolvedValue(
            createGoodsReceipt(
              GoodsReceiptStatus.DRAFT,
            ),
          );

        const dto = {
          purchaseOrderId:
            'purchase-order-1',
          goodsReceiptId:
            'goods-receipt-1',
          invoiceAmount:
            59000,
          matchedByPersonId:
            'person-4',
          items: [
            {
              purchaseOrderItemId:
                'purchase-order-item-1',
              goodsReceiptItemId:
                'goods-receipt-item-1',
              invoicedQuantity:
                10,
              unitPrice:
                5000,
            },
          ],
        } as Parameters<
          ProcurementInvoiceMatchService[
            'create'
          ]
        >[0];

        await expect(
          service.create(dto),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.create,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'blocks editing a non-pending Invoice Match',
      async () => {
        const invoiceMatch =
          createInvoiceMatch(
            InvoiceMatchStatus.MATCHED,
          );

        repository.findById
          .mockResolvedValue(
            invoiceMatch,
          );

        const dto = {
          invoiceAmount:
            60000,
          updatedByPersonId:
            'person-5',
        } as Parameters<
          ProcurementInvoiceMatchService[
            'update'
          ]
        >[1];

        await expect(
          service.update(
            invoiceMatch.id,
            dto,
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          purchaseOrderRepository
            .findById,
        ).not.toHaveBeenCalled();

        expect(
          repository.update,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
