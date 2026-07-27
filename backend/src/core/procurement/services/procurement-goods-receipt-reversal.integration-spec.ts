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
  GoodsReceiptDetails,
  GoodsReceiptRepository,
} from '../repositories/procurement-goods-receipt.repository';
import {
  PurchaseOrderDetails,
  PurchaseOrderRepository,
} from '../repositories/procurement-purchase-order.repository';
import {
  GoodsReceiptItemStatus,
  GoodsReceiptStatus,
  ProcurementItemType,
  PurchaseOrderStatus,
} from '../types/procurement.types';
import {
  ProcurementGoodsReceiptService,
} from './procurement-goods-receipt.service';
import {
  ProcurementInventoryPostingService,
} from './procurement-inventory-posting.service';
import {
  ProcurementTransitionMetricsService,
} from './procurement-transition-metrics.service';

describe(
  'ProcurementGoodsReceiptService reversal contract',
  () => {
    let repository:
      jest.Mocked<GoodsReceiptRepository>;

    let purchaseOrderRepository:
      jest.Mocked<PurchaseOrderRepository>;

    let service:
      ProcurementGoodsReceiptService;

    const createPurchaseOrder = (
      status:
        PurchaseOrderStatus =
          PurchaseOrderStatus
            .PARTIALLY_RECEIVED,
      receivedQuantity = 5,
      acknowledged = true,
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
        acknowledgedAt:
          acknowledged
            ? now
            : undefined,
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
            receivedQuantity,
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
      receivedQuantity = 5,
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
          'person-3',
        postedAt:
          now,
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
            receivedQuantity,
            acceptedQuantity:
              receivedQuantity,
            rejectedQuantity:
              0,
            status:
              GoodsReceiptItemStatus
                .ACCEPTED,
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

      const inventoryPostingService = {
        postGoodsReceipt:
          async () => [],
      } as unknown as
        ProcurementInventoryPostingService;

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
        new ProcurementGoodsReceiptService(
          repository,
          purchaseOrderRepository,
          auditService,
          eventBus,
          inventoryPostingService,
          transitionMetrics,
        );
    });

    it(
      'blocks reversal of a non-posted Goods Receipt',
      async () => {
        const receipt =
          createGoodsReceipt(
            GoodsReceiptStatus.DRAFT,
          );

        repository.findById
          .mockResolvedValue(
            receipt,
          );

        await expect(
          service.reverse(
            receipt.id,
            {
              reversedByPersonId:
                'person-4',
              reversalReason:
                'Incorrect receipt',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          purchaseOrderRepository
            .findById,
        ).not.toHaveBeenCalled();

        expect(
          repository.reverse,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'requires a non-empty reversal reason',
      async () => {
        const receipt =
          createGoodsReceipt();

        repository.findById
          .mockResolvedValue(
            receipt,
          );

        await expect(
          service.reverse(
            receipt.id,
            {
              reversedByPersonId:
                'person-4',
              reversalReason:
                '   ',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          purchaseOrderRepository
            .findById,
        ).not.toHaveBeenCalled();

        expect(
          repository.reverse,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'blocks a reversal that would make received quantity negative',
      async () => {
        const receipt =
          createGoodsReceipt(
            GoodsReceiptStatus.POSTED,
            5,
          );

        repository.findById
          .mockResolvedValue(
            receipt,
          );

        purchaseOrderRepository.findById
          .mockResolvedValue(
            createPurchaseOrder(
              PurchaseOrderStatus
                .PARTIALLY_RECEIVED,
              3,
            ),
          );

        await expect(
          service.reverse(
            receipt.id,
            {
              reversedByPersonId:
                'person-4',
              reversalReason:
                'Incorrect receipt',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.reverse,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'reverses a posted receipt and restores an acknowledged Purchase Order',
      async () => {
        const receipt =
          createGoodsReceipt(
            GoodsReceiptStatus.POSTED,
            5,
          );

        const purchaseOrder =
          createPurchaseOrder(
            PurchaseOrderStatus
              .PARTIALLY_RECEIVED,
            5,
            true,
          );

        repository.findById
          .mockResolvedValue(
            receipt,
          );

        purchaseOrderRepository.findById
          .mockResolvedValue(
            purchaseOrder,
          );

        const reversedReceipt = {
          ...receipt,
          status:
            GoodsReceiptStatus.REVERSED,
          reversedByPersonId:
            'person-4',
          reversedAt:
            new Date(),
          reversalReason:
            'Incorrect receipt',
          updatedAt:
            new Date(),
        };

        repository.reverse
          .mockResolvedValue({
            goodsReceipt:
              reversedReceipt,
            purchaseOrderStatus:
              PurchaseOrderStatus
                .ACKNOWLEDGED,
          });

        await expect(
          service.reverse(
            receipt.id,
            {
              reversedByPersonId:
                'person-4',
              reversalReason:
                '  Incorrect receipt  ',
              remarks:
                'Receipt entered twice',
            },
          ),
        ).resolves.toEqual(
          expect.objectContaining({
            id:
              receipt.id,
            status:
              GoodsReceiptStatus
                .REVERSED,
            reversedByPersonId:
              'person-4',
            reversalReason:
              'Incorrect receipt',
          }),
        );

        expect(
          repository.reverse,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            id:
              receipt.id,
            status:
              GoodsReceiptStatus
                .REVERSED,
            reversalReason:
              'Incorrect receipt',
          }),
          [
            expect.objectContaining({
              goodsReceiptItemId:
                'goods-receipt-item-1',
              purchaseOrderItemId:
                'purchase-order-item-1',
              receivedQuantity:
                5,
              restoredCumulativeReceivedQuantity:
                0,
            }),
          ],
          PurchaseOrderStatus
            .ACKNOWLEDGED,
          expect.objectContaining({
            entityId:
              receipt.id,
            fromStatus:
              GoodsReceiptStatus.POSTED,
            toStatus:
              GoodsReceiptStatus.REVERSED,
          }),
          expect.objectContaining({
            entityId:
              purchaseOrder.id,
            fromStatus:
              PurchaseOrderStatus
                .PARTIALLY_RECEIVED,
            toStatus:
              PurchaseOrderStatus
                .ACKNOWLEDGED,
          }),
        );
      },
    );
  },
);
