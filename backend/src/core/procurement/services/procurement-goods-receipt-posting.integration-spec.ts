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
  'ProcurementGoodsReceiptService posting contract',
  () => {
    let repository:
      jest.Mocked<GoodsReceiptRepository>;

    let purchaseOrderRepository:
      jest.Mocked<PurchaseOrderRepository>;

    let inventoryPostingService:
      jest.Mocked<
        Pick<
          ProcurementInventoryPostingService,
          'postGoodsReceipt'
        >
      >;

    let service:
      ProcurementGoodsReceiptService;

    const createPurchaseOrder = (
      status:
        PurchaseOrderStatus =
          PurchaseOrderStatus.ACKNOWLEDGED,
      orderedQuantity = 10,
      receivedQuantity = 0,
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
          now,
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
            orderedQuantity,
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
          GoodsReceiptStatus.DRAFT,
      receivedQuantity = 5,
      withItems = true,
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
        createdAt:
          now,
        updatedAt:
          now,
        items:
          withItems
            ? [
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
              ]
            : [],
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

      inventoryPostingService = {
        postGoodsReceipt: jest.fn<
          ProcurementInventoryPostingService[
            'postGoodsReceipt'
          ]
        >(),
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
        new ProcurementGoodsReceiptService(
          repository,
          purchaseOrderRepository,
          auditService,
          eventBus,
          inventoryPostingService as unknown as
            ProcurementInventoryPostingService,
          transitionMetrics,
        );
    });

    it(
      'blocks posting a non-draft Goods Receipt',
      async () => {
        const receipt =
          createGoodsReceipt(
            GoodsReceiptStatus.POSTED,
          );

        repository.findById
          .mockResolvedValue(
            receipt,
          );

        await expect(
          service.post(
            receipt.id,
            {
              postedByPersonId:
                'person-3',
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
          inventoryPostingService
            .postGoodsReceipt,
        ).not.toHaveBeenCalled();

        expect(
          repository.post,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'blocks posting a Goods Receipt without items',
      async () => {
        const receipt =
          createGoodsReceipt(
            GoodsReceiptStatus.DRAFT,
            0,
            false,
          );

        repository.findById
          .mockResolvedValue(
            receipt,
          );

        purchaseOrderRepository.findById
          .mockResolvedValue(
            createPurchaseOrder(),
          );

        await expect(
          service.post(
            receipt.id,
            {
              postedByPersonId:
                'person-3',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository
            .aggregatePostedQuantities,
        ).not.toHaveBeenCalled();

        expect(
          inventoryPostingService
            .postGoodsReceipt,
        ).not.toHaveBeenCalled();

        expect(
          repository.post,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects receipt quantities exceeding the remaining order quantity',
      async () => {
        const receipt =
          createGoodsReceipt(
            GoodsReceiptStatus.DRAFT,
            4,
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
              10,
              8,
            ),
          );

        repository.aggregatePostedQuantities
          .mockResolvedValue([
            {
              purchaseOrderItemId:
                'purchase-order-item-1',
              postedReceivedQuantity:
                8,
            },
          ]);

        await expect(
          service.post(
            receipt.id,
            {
              postedByPersonId:
                'person-3',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          inventoryPostingService
            .postGoodsReceipt,
        ).not.toHaveBeenCalled();

        expect(
          repository.post,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'posts a partial receipt and transitions the Purchase Order',
      async () => {
        const receipt =
          createGoodsReceipt(
            GoodsReceiptStatus.DRAFT,
            5,
          );

        const purchaseOrder =
          createPurchaseOrder(
            PurchaseOrderStatus
              .ACKNOWLEDGED,
            10,
            0,
          );

        repository.findById
          .mockResolvedValue(
            receipt,
          );

        purchaseOrderRepository.findById
          .mockResolvedValue(
            purchaseOrder,
          );

        repository.aggregatePostedQuantities
          .mockResolvedValue([]);

        inventoryPostingService
          .postGoodsReceipt
          .mockResolvedValue([]);

        const postedReceipt = {
          ...receipt,
          status:
            GoodsReceiptStatus.POSTED,
          postedByPersonId:
            'person-3',
          postedAt:
            new Date(),
          updatedAt:
            new Date(),
        };

        repository.post
          .mockResolvedValue({
            goodsReceipt:
              postedReceipt,
            purchaseOrderStatus:
              PurchaseOrderStatus
                .PARTIALLY_RECEIVED,
          });

        await expect(
          service.post(
            receipt.id,
            {
              postedByPersonId:
                'person-3',
              remarks:
                'Partial receipt posted',
            },
          ),
        ).resolves.toEqual(
          expect.objectContaining({
            id:
              receipt.id,
            status:
              GoodsReceiptStatus.POSTED,
            postedByPersonId:
              'person-3',
          }),
        );

        expect(
          inventoryPostingService
            .postGoodsReceipt,
        ).toHaveBeenCalledWith(
          receipt,
          purchaseOrder,
          'person-3',
        );

        expect(
          repository.post,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            id:
              receipt.id,
            status:
              GoodsReceiptStatus.POSTED,
          }),
          [
            expect.objectContaining({
              goodsReceiptItemId:
                'goods-receipt-item-1',
              purchaseOrderItemId:
                'purchase-order-item-1',
              receivedQuantity:
                5,
              newCumulativeReceivedQuantity:
                5,
            }),
          ],
          PurchaseOrderStatus
            .PARTIALLY_RECEIVED,
          expect.objectContaining({
            entityId:
              receipt.id,
            toStatus:
              GoodsReceiptStatus.POSTED,
          }),
          expect.objectContaining({
            entityId:
              purchaseOrder.id,
            toStatus:
              PurchaseOrderStatus
                .PARTIALLY_RECEIVED,
          }),
        );
      },
    );
  },
);
