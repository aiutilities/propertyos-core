import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  BadRequestException,
} from '@nestjs/common';

import {
  AuditService,
} from '../../audit/audit.service';
import {
  EventBusService,
} from '../../eventbus/services/eventbus.service';
import {
  GoodsReceiptRepository,
} from '../repositories/procurement-goods-receipt.repository';
import {
  ProcurementInvoiceMatchDetails,
  ProcurementInvoiceMatchRepository,
} from '../repositories/procurement-invoice-match.repository';
import {
  PurchaseOrderRepository,
} from '../repositories/procurement-purchase-order.repository';
import {
  InvoiceMatchStatus,
} from '../types/procurement.types';
import {
  ProcurementInvoiceMatchService,
} from './procurement-invoice-match.service';
import {
  ProcurementTransitionMetricsService,
} from './procurement-transition-metrics.service';

describe(
  'ProcurementInvoiceMatchService transition contract',
  () => {
    let repository:
      jest.Mocked<ProcurementInvoiceMatchRepository>;

    let purchaseOrderRepository:
      jest.Mocked<PurchaseOrderRepository>;

    let goodsReceiptRepository:
      jest.Mocked<GoodsReceiptRepository>;

    let service:
      ProcurementInvoiceMatchService;

    const createInvoiceMatch = (
      status:
        InvoiceMatchStatus =
          InvoiceMatchStatus.PENDING,
      matchedFlags = [true],
      amountVariance = 0,
      quantityVariance = 0,
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
        amountVariance,
        quantityVariance,
        status,
        matchedByPersonId:
          'person-4',
        createdAt:
          now,
        updatedAt:
          now,
        items:
          matchedFlags.map(
            (
              isMatched,
              index,
            ) => ({
              id:
                `invoice-match-item-${index + 1}`,
              invoiceMatchId:
                'invoice-match-1',
              purchaseOrderItemId:
                `purchase-order-item-${index + 1}`,
              goodsReceiptItemId:
                `goods-receipt-item-${index + 1}`,
              invoicedQuantity:
                5,
              orderedQuantity:
                5,
              receivedQuantity:
                isMatched
                  ? 5
                  : 4,
              unitPrice:
                5000,
              invoiceLineAmount:
                25000,
              purchaseOrderLineAmount:
                25000,
              amountVariance:
                0,
              quantityVariance:
                isMatched
                  ? 0
                  : 1,
              isMatched,
              createdAt:
                now,
            }),
          ),
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
      'completes a fully matched Invoice Match as MATCHED',
      async () => {
        const current =
          createInvoiceMatch(
            InvoiceMatchStatus.PENDING,
            [true, true],
            0,
            0,
          );

        repository.findById
          .mockResolvedValue(
            current,
          );

        repository.transition
          .mockImplementation(
            async (
              invoiceMatch,
            ) => ({
              ...current,
              ...invoiceMatch,
            }),
          );

        await expect(
          service.complete(
            current.id,
            {
              matchedByPersonId:
                'person-5',
              remarks:
                'Three-way match complete',
            },
          ),
        ).resolves.toEqual(
          expect.objectContaining({
            status:
              InvoiceMatchStatus.MATCHED,
            matchedByPersonId:
              'person-5',
          }),
        );

        expect(
          repository.transition,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            id:
              current.id,
            status:
              InvoiceMatchStatus.MATCHED,
          }),
          expect.objectContaining({
            entityId:
              current.id,
            fromStatus:
              InvoiceMatchStatus.PENDING,
            toStatus:
              InvoiceMatchStatus.MATCHED,
          }),
        );
      },
    );

    it(
      'completes a partly matched Invoice Match as PARTIAL_MATCH',
      async () => {
        const current =
          createInvoiceMatch(
            InvoiceMatchStatus.PENDING,
            [true, false],
            0,
            1,
          );

        repository.findById
          .mockResolvedValue(
            current,
          );

        repository.transition
          .mockImplementation(
            async (
              invoiceMatch,
            ) => ({
              ...current,
              ...invoiceMatch,
            }),
          );

        await expect(
          service.complete(
            current.id,
            {
              matchedByPersonId:
                'person-5',
            },
          ),
        ).resolves.toEqual(
          expect.objectContaining({
            status:
              InvoiceMatchStatus
                .PARTIAL_MATCH,
          }),
        );
      },
    );

    it(
      'completes an unmatched Invoice Match as MISMATCH',
      async () => {
        const current =
          createInvoiceMatch(
            InvoiceMatchStatus.PENDING,
            [false, false],
            1000,
            2,
          );

        repository.findById
          .mockResolvedValue(
            current,
          );

        repository.transition
          .mockImplementation(
            async (
              invoiceMatch,
            ) => ({
              ...current,
              ...invoiceMatch,
            }),
          );

        await expect(
          service.complete(
            current.id,
            {
              matchedByPersonId:
                'person-5',
            },
          ),
        ).resolves.toEqual(
          expect.objectContaining({
            status:
              InvoiceMatchStatus.MISMATCH,
          }),
        );
      },
    );

    it(
      'blocks completion from a non-pending state',
      async () => {
        const current =
          createInvoiceMatch(
            InvoiceMatchStatus.MATCHED,
          );

        repository.findById
          .mockResolvedValue(
            current,
          );

        await expect(
          service.complete(
            current.id,
            {
              matchedByPersonId:
                'person-5',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.transition,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'approves a matched Invoice Match',
      async () => {
        const current =
          createInvoiceMatch(
            InvoiceMatchStatus.MATCHED,
          );

        repository.findById
          .mockResolvedValue(
            current,
          );

        repository.transition
          .mockImplementation(
            async (
              invoiceMatch,
            ) => ({
              ...current,
              ...invoiceMatch,
            }),
          );

        await expect(
          service.approve(
            current.id,
            {
              approvedByPersonId:
                'person-6',
              remarks:
                'Approved for payment',
            },
          ),
        ).resolves.toEqual(
          expect.objectContaining({
            status:
              InvoiceMatchStatus.APPROVED,
            approvedByPersonId:
              'person-6',
          }),
        );

        expect(
          repository.transition,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            status:
              InvoiceMatchStatus.APPROVED,
          }),
          expect.objectContaining({
            fromStatus:
              InvoiceMatchStatus.MATCHED,
            toStatus:
              InvoiceMatchStatus.APPROVED,
          }),
        );
      },
    );

    it(
      'blocks approval from an invalid state',
      async () => {
        const current =
          createInvoiceMatch(
            InvoiceMatchStatus.MISMATCH,
          );

        repository.findById
          .mockResolvedValue(
            current,
          );

        await expect(
          service.approve(
            current.id,
            {
              approvedByPersonId:
                'person-6',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.transition,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'requires a non-empty rejection reason',
      async () => {
        const current =
          createInvoiceMatch(
            InvoiceMatchStatus.MISMATCH,
          );

        repository.findById
          .mockResolvedValue(
            current,
          );

        await expect(
          service.reject(
            current.id,
            {
              rejectedByPersonId:
                'person-7',
              rejectionReason:
                '   ',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.transition,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects a mismatched Invoice Match',
      async () => {
        const current =
          createInvoiceMatch(
            InvoiceMatchStatus.MISMATCH,
          );

        repository.findById
          .mockResolvedValue(
            current,
          );

        repository.transition
          .mockImplementation(
            async (
              invoiceMatch,
            ) => ({
              ...current,
              ...invoiceMatch,
            }),
          );

        await expect(
          service.reject(
            current.id,
            {
              rejectedByPersonId:
                'person-7',
              rejectionReason:
                '  Quantity mismatch  ',
              remarks:
                'Vendor correction required',
            },
          ),
        ).resolves.toEqual(
          expect.objectContaining({
            status:
              InvoiceMatchStatus.REJECTED,
            rejectedByPersonId:
              'person-7',
            rejectionReason:
              'Quantity mismatch',
          }),
        );

        expect(
          repository.transition,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            status:
              InvoiceMatchStatus.REJECTED,
            rejectionReason:
              'Quantity mismatch',
          }),
          expect.objectContaining({
            fromStatus:
              InvoiceMatchStatus.MISMATCH,
            toStatus:
              InvoiceMatchStatus.REJECTED,
          }),
        );
      },
    );
  },
);
